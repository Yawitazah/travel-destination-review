const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const PORT = process.env.PORT || process.argv[2] || 4273;
const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const CONTENT_FILE = path.join(DATA_DIR, "site-content.json");
const CHOICE_FILE = path.join(DATA_DIR, "customer-choices.json");
const OWNER_EMAIL = "Dejahwhitetravel@gmail.com";
const OWNER_PASSWORD = "DWtravel2026";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json; charset=utf-8"
};

function ensureData() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CONTENT_FILE)) fs.writeFileSync(CONTENT_FILE, JSON.stringify({ content: {}, styles: {}, tripData: null }, null, 2));
  if (!fs.existsSync(CHOICE_FILE)) fs.writeFileSync(CHOICE_FILE, JSON.stringify([], null, 2));
}

function readContentStore() {
  const raw = JSON.parse(fs.readFileSync(CONTENT_FILE, "utf8"));
  if (raw.opportunities) return raw;
  const id = raw.tripData?.opportunity?.id || "rowan-summer-trip-may-2026";
  return {
    opportunities: {
      [id]: {
        content: raw.content || {},
        styles: raw.styles || {},
        tripData: raw.tripData || null,
        updatedAt: raw.updatedAt || new Date().toISOString()
      }
    }
  };
}

function writeContentStore(store) {
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(store, null, 2));
}

function readChoices() {
  return JSON.parse(fs.readFileSync(CHOICE_FILE, "utf8"));
}

function writeChoices(choices) {
  fs.writeFileSync(CHOICE_FILE, JSON.stringify(choices, null, 2));
}

function requestedOpportunity(reqUrl) {
  const url = new URL(reqUrl, "http://localhost");
  return url.searchParams.get("opportunityId") || "rowan-summer-trip-may-2026";
}

function listOpportunities() {
  const store = readContentStore();
  return Object.entries(store.opportunities || {}).map(([id, record]) => {
    const opportunity = record.tripData?.opportunity || {};
    return {
      id,
      projectName: opportunity.projectName || "",
      clientName: opportunity.clientName || "",
      clientEmail: opportunity.clientEmail || "",
      clientPhone: opportunity.clientPhone || "",
      updatedAt: record.updatedAt || ""
    };
  }).sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
}

function latestChoice(opportunityId) {
  const choices = readChoices().filter((choice) => !opportunityId || choice.opportunityId === opportunityId);
  return choices.at(-1) || null;
}

function deleteOpportunity(opportunityId) {
  const store = readContentStore();
  const existed = Boolean(store.opportunities?.[opportunityId]);
  if (store.opportunities) delete store.opportunities[opportunityId];
  writeContentStore(store);
  const choices = readChoices().filter((choice) => choice.opportunityId !== opportunityId);
  writeChoices(choices);
  return existed;
}

function purgeData() {
  writeContentStore({ opportunities: {} });
  writeChoices([]);
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  if (Buffer.isBuffer(body) || typeof body === "string") {
    res.end(body);
    return;
  }
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 12_000_000) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function xmlDecode(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function zipEntries(buffer) {
  const entries = {};
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Invalid XLSX archive");
  const total = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  for (let i = 0; i < total; i += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.slice(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.slice(dataStart, dataStart + compressedSize);
    entries[name] = method === 8 ? zlib.inflateRawSync(compressed).toString("utf8") : compressed.toString("utf8");
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return entries;
}

function parseSharedStrings(xml) {
  const values = [];
  const siMatches = xml.match(/<si[\s\S]*?<\/si>/g) || [];
  for (const si of siMatches) {
    const text = [...si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) => xmlDecode(match[1])).join("");
    values.push(text);
  }
  return values;
}

function parseRelationships(xml) {
  const rels = {};
  for (const match of xml.matchAll(/<Relationship\b([^>]+)>/g)) {
    const attrs = Object.fromEntries([...match[1].matchAll(/(\w+)="([^"]*)"/g)].map((item) => [item[1], xmlDecode(item[2])]));
    if (attrs.Id && attrs.Target) rels[attrs.Id] = attrs.Target;
  }
  return rels;
}

function parseSheet(xml, sharedStrings, rels) {
  const rows = [];
  const hyperlinks = {};
  for (const match of xml.matchAll(/<hyperlink\b([^>]+)\/>/g)) {
    const attrs = Object.fromEntries([...match[1].matchAll(/(?:\w+:)?(\w+)="([^"]*)"/g)].map((item) => [item[1], xmlDecode(item[2])]));
    if (attrs.ref && attrs.id && rels[attrs.id]) hyperlinks[attrs.ref] = rels[attrs.id];
  }
  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = Object.fromEntries([...cellMatch[1].matchAll(/(\w+)="([^"]*)"/g)].map((item) => [item[1], item[2]]));
      const ref = attrs.r || "";
      const columnLetters = ref.replace(/\d+/g, "");
      const columnIndex = columnLetters.split("").reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
      const valueMatch = cellMatch[2].match(/<v>([\s\S]*?)<\/v>/);
      const inlineMatch = cellMatch[2].match(/<t[^>]*>([\s\S]*?)<\/t>/);
      let value = "";
      if (valueMatch) value = attrs.t === "s" ? sharedStrings[Number(valueMatch[1])] || "" : xmlDecode(valueMatch[1]);
      else if (inlineMatch) value = xmlDecode(inlineMatch[1]);
      cells[columnIndex] = { value, hyperlink: hyperlinks[ref] || "" };
    }
    rows.push(cells.map((cell) => cell || { value: "", hyperlink: "" }));
  }
  return rows;
}

function normalizeHeader(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function cellValue(record, names) {
  const wanted = names.map(normalizeHeader);
  const key = Object.keys(record).find((candidate) => wanted.includes(normalizeHeader(candidate)));
  return key ? String(record[key]?.value || "").trim() : "";
}

function cellLink(record, names) {
  const wanted = names.map(normalizeHeader);
  const key = Object.keys(record).find((candidate) => wanted.includes(normalizeHeader(candidate)));
  return key ? String(record[key]?.hyperlink || "").trim() : "";
}

function truthy(value) {
  return ["true", "yes", "1"].includes(String(value || "").trim().toLowerCase());
}

function money(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.includes("$")) return raw;
  const number = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(number)) return raw;
  return number.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function makeSlug(value, fallback) {
  const cleaned = String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return cleaned || fallback;
}

function parseTripRows(rows) {
  const parsed = { dates: "May 28, 2026 - June 1, 2026", guests: "2 people", offers: [], flights: [] };
  const datesRow = rows.find((row) => String(row[0]?.value || "").toLowerCase().startsWith("dates:"));
  if (datesRow) parsed.dates = String(datesRow[0].value).replace(/^Dates:\s*/i, "").trim();
  const propertyIndex = rows.findIndex((row) => normalizeHeader(row[0]?.value) === "property");
  const flightIndex = rows.findIndex((row) => String(row[0]?.value || "").toLowerCase().includes("flight options"));

  if (propertyIndex >= 0) {
    const headers = rows[propertyIndex].map((cell) => cell.value);
    rows.slice(propertyIndex + 1, flightIndex > propertyIndex ? flightIndex : rows.length)
      .filter((row) => {
        const property = String(row[0]?.value || "").trim();
        return property && property !== "0" && String(row[1]?.value || "").trim();
      })
      .forEach((row, index) => {
        const record = Object.fromEntries(headers.map((header, cellIndex) => [header, row[cellIndex] || { value: "", hyperlink: "" }]));
        const property = cellValue(record, ["Property"]);
        parsed.offers.push({
          id: makeSlug(property, `offer-${index + 1}`),
          badge: index === 1 ? "Best Value" : `${parsed.guests} package`,
          property,
          propertyLink: cellLink(record, ["Property"]),
          roomType: cellValue(record, ["Room Type"]),
          roomTypeLink: cellLink(record, ["Room Type"]),
          location: cellValue(record, ["Location"]),
          cost: money(cellValue(record, ["Cost (total 4 night)", "Cost", "Total Cost"])),
          transfer: money(cellValue(record, ["Private Airport Transfer *optional*", "Private Airport Transfer", "Transfer"])),
          vip: money(cellValue(record, ["VIP Arrival/Departure Service", "VIP Service"])),
          insurance: money(cellValue(record, ["Travel Insurance", "Insurance"])),
          inclusions: cellValue(record, ["Inclusions", "Inclusions "]),
          pool: truthy(cellValue(record, ["Pool"])),
          restaurant: truthy(cellValue(record, ["Restaurant"])),
          spa: truthy(cellValue(record, ["Spa"])),
          image: cellValue(record, ["Image", "Image URL", "Photo", "Photo URL"]) || "assets/bahamas-hero.png",
          detailLink: cellLink(record, ["Property"]) || cellLink(record, ["Room Type"]) || cellValue(record, ["Details Link", "Detail Link", "Location Link", "URL"])
        });
      });
  }

  if (flightIndex >= 0) {
    const headers = (rows[flightIndex + 1] || []).map((cell) => cell.value);
    rows.slice(flightIndex + 2)
      .filter((row) => String(row[0]?.value || "").trim())
      .forEach((row) => {
        const record = Object.fromEntries(headers.map((header, cellIndex) => [header, row[cellIndex] || { value: "", hyperlink: "" }]));
        parsed.flights.push({
          airline: cellValue(record, ["Airline"]),
          outbound: cellValue(record, ["Outbound"]),
          return: cellValue(record, ["Return"]),
          cost: cellValue(record, ["Cost"])
        });
      });
  }
  return parsed;
}

function parseXlsx(buffer) {
  const entries = zipEntries(buffer);
  const shared = parseSharedStrings(entries["xl/sharedStrings.xml"] || "");
  const rels = parseRelationships(entries["xl/worksheets/_rels/sheet1.xml.rels"] || "");
  const rows = parseSheet(entries["xl/worksheets/sheet1.xml"] || "", shared, rels);
  return parseTripRows(rows);
}

function safeStaticPath(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);
  const filePath = path.join(ROOT, cleanPath === "/" ? "index.html" : cleanPath);
  return filePath.startsWith(ROOT) ? filePath : null;
}

ensureData();

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || "/", "http://localhost");

    if (requestUrl.pathname === "/api/content" && req.method === "GET") {
      const opportunityId = requestedOpportunity(req.url || "/");
      const store = readContentStore();
      const record = store.opportunities?.[opportunityId] || { content: {}, styles: {}, tripData: null };
      return send(res, 200, { ...record, latestChoice: latestChoice(opportunityId) });
    }

    if (requestUrl.pathname === "/api/content" && req.method === "POST") {
      const body = await readJson(req);
      if (body.email !== OWNER_EMAIL || body.password !== OWNER_PASSWORD) {
        return send(res, 401, { error: "Unauthorized" });
      }
      const opportunityId = body.tripData?.opportunity?.id || body.opportunityId || "rowan-summer-trip-may-2026";
      const store = readContentStore();
      store.opportunities = store.opportunities || {};
      const previousOpportunity = store.opportunities[opportunityId]?.tripData?.opportunity || {};
      if (body.tripData) {
        body.tripData.opportunity = {
          id: opportunityId,
          projectName: body.tripData.opportunity?.projectName || previousOpportunity.projectName || "",
          clientName: body.tripData.opportunity?.clientName || previousOpportunity.clientName || "",
          clientEmail: body.tripData.opportunity?.clientEmail || previousOpportunity.clientEmail || "",
          clientPhone: body.tripData.opportunity?.clientPhone || previousOpportunity.clientPhone || ""
        };
      }
      store.opportunities[opportunityId] = {
        content: body.content || {},
        styles: body.styles || {},
        tripData: body.tripData || null,
        updatedAt: new Date().toISOString()
      };
      writeContentStore(store);
      return send(res, 200, { ok: true, opportunityId });
    }

    if (requestUrl.pathname === "/api/opportunities" && req.method === "GET") {
      return send(res, 200, { opportunities: listOpportunities() });
    }

    if (requestUrl.pathname === "/api/admin/purge" && req.method === "POST") {
      const body = await readJson(req);
      if (body.email !== OWNER_EMAIL || body.password !== OWNER_PASSWORD) {
        return send(res, 401, { error: "Unauthorized" });
      }
      purgeData();
      return send(res, 200, { ok: true });
    }

    if (requestUrl.pathname.startsWith("/api/opportunities/") && req.method === "DELETE") {
      const body = await readJson(req);
      if (body.email !== OWNER_EMAIL || body.password !== OWNER_PASSWORD) {
        return send(res, 401, { error: "Unauthorized" });
      }
      const opportunityId = decodeURIComponent(requestUrl.pathname.replace("/api/opportunities/", ""));
      return send(res, 200, { ok: true, deleted: deleteOpportunity(opportunityId), opportunityId });
    }

    if (requestUrl.pathname === "/api/choices" && req.method === "GET") {
      return send(res, 200, latestChoice(requestedOpportunity(req.url || "/")));
    }

    if (requestUrl.pathname === "/api/choices" && req.method === "POST") {
      const body = await readJson(req);
      const choices = readChoices();
      choices.push({ ...body, receivedAt: new Date().toISOString() });
      writeChoices(choices);
      return send(res, 200, { ok: true });
    }

    if (requestUrl.pathname === "/api/parse-spreadsheet" && req.method === "POST") {
      const body = await readJson(req);
      const parsed = parseXlsx(Buffer.from(body.data || "", "base64"));
      return send(res, 200, parsed);
    }

    const filePath = safeStaticPath(req.url || "/");
    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      return send(res, 404, "Not found", "text/plain; charset=utf-8");
    }
    send(res, 200, fs.readFileSync(filePath), mimeTypes[path.extname(filePath)] || "application/octet-stream");
  } catch (error) {
    send(res, 500, { error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Vacation offer page running at http://localhost:${PORT}`);
});
