const OWNER_EMAIL = "Dejahwhitetravel@gmail.com";
const OWNER_PASSWORD = "DWtravel2026";
const CONTENT_KEY = "dwTravelOfferContent";
const STYLE_KEY = "dwTravelOfferStyles";
const CHOICE_KEY = "dwTravelCustomerChoice";
const TRIP_DATA_KEY = "dwTravelTripData";
const GOOGLE_SCRIPT_URL_KEY = "dwTravelGoogleScriptUrl";
const DEFAULT_GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz_WyJI_xE1FujmqVKSLXX8lpdHbAPHkPH83kvGQUX02k7coSwjA8XP-u4dUsk28Ug/exec";

const defaultTripData = {
  dates: "May 28, 2026 - June 1, 2026",
  guests: "2 people",
  offers: [
    {
      id: "sandals",
      badge: "Butler Suite",
      property: "Sandals Royal Bahamian Spa Resort & Offshore Island",
      roomType: "West Bay Honeymoon Oceanview One-Bedroom Butler Suite",
      location: "Nassau, Bahamas",
      cost: "$8,460.86",
      transfer: "$330.00",
      vip: "$480.00",
      insurance: "$788.00",
      inclusions: "Adult-only all inclusive, airport transfers",
      pool: true,
      restaurant: true,
      spa: true,
      image: "assets/bahamas-hero.png",
      detailLink: "https://www.sandals.com/royal-bahamian",
      propertyLink: "https://www.sandals.com/royal-bahamian",
      roomTypeLink: "https://www.sandals.com/royal-bahamian/rooms-suites/?categoryCode=WS&rstCode=SRB"
    },
    {
      id: "warwick",
      badge: "Best Value",
      property: "Warwick Paradise Island Bahamas",
      roomType: "Water View King Bed",
      location: "Nassau, Bahamas",
      cost: "$3,915.46",
      transfer: "$428.00",
      vip: "$480.00",
      insurance: "$560.00",
      inclusions: "Adult-only all inclusive, airport transfers; $250 resort credit",
      pool: true,
      restaurant: true,
      spa: true,
      image: "assets/bahamas-hero.png",
      detailLink: "https://www.warwickhotels.com/warwick-paradise-island-bahamas",
      propertyLink: "https://www.warwickhotels.com/warwick-paradise-island-bahamas",
      roomTypeLink: ""
    },
    {
      id: "hyatt",
      badge: "Residence Style",
      property: "Grand Hyatt Bahama Mar",
      roomType: "One Bedroom Ocean View Residence with King Bed East Tower",
      location: "Nassau, Bahamas",
      cost: "$5,905.41",
      transfer: "$330.00",
      vip: "$480.00",
      insurance: "$660.00",
      inclusions: "Airport transfers; $100 F/Bev Credit; $200 Cabana Credit",
      pool: true,
      restaurant: true,
      spa: true,
      image: "assets/bahamas-hero.png",
      detailLink: "https://www.hyatt.com/grand-hyatt/en-US/nasgh-grand-hyatt-baha-ma",
      propertyLink: "https://www.hyatt.com/grand-hyatt/en-US/nasgh-grand-hyatt-baha-ma",
      roomTypeLink: ""
    }
  ],
  flights: [
    {
      airline: "Delta Airlines",
      outbound: "HSV to ATL - departs 10:11 AM arrives 12:12 PM; ATL to NAS - departs 2:32 PM arrives 4:35 PM",
      return: "NAS to ATL - departs 6:00 PM arrives 8:27 PM; ATL to HSV - departs 11:14 PM arrives 11:13 PM",
      cost: "Included in cost of resort"
    }
  ]
};

const loginDialog = document.querySelector("#loginDialog");
const loginForm = document.querySelector("#loginForm");
const dialogClose = document.querySelector(".dialog-close");
const googleScriptUrl = document.querySelector("#googleScriptUrl");
const editLauncher = document.querySelector("#editLauncher");
const editPanel = document.querySelector("#editPanel");
const editValue = document.querySelector("#editValue");
const editHref = document.querySelector("#editHref");
const editColor = document.querySelector("#editColor");
const editSize = document.querySelector("#editSize");
const editImageUpload = document.querySelector("#editImageUpload");
const editCsvUpload = document.querySelector("#editCsvUpload");
const imageUploadLabel = document.querySelector("#imageUploadLabel");
const imageSizeControls = document.querySelector("#imageSizeControls");
const editImageWidth = document.querySelector("#editImageWidth");
const editImageHeight = document.querySelector("#editImageHeight");
const editImageWidthRange = document.querySelector("#editImageWidthRange");
const editImageHeightRange = document.querySelector("#editImageHeightRange");
const ownerChoice = document.querySelector("#ownerChoice");
const selectedName = document.querySelector("#selectedName");
const selectedSummary = document.querySelector("#selectedSummary");
const choiceForm = document.querySelector("#choiceForm");
const toast = document.querySelector("#toast");
const offersRoot = document.querySelector("#offers");
const flightCards = document.querySelector("#flightCards");
const tabButtons = [...document.querySelectorAll(".edit-tab")];
const tabPanels = [...document.querySelectorAll(".tab-panel")];

let tripData = structuredClone(defaultTripData);
let editableItems = [];
let currentEditable = null;
let lastSnapshot = null;
let selectedOfferId = null;
let ownerSession = null;

const knownLinks = {
  "Sandals Royal Bahamian Spa Resort & Offshore Island": {
    propertyLink: "https://www.sandals.com/royal-bahamian",
    roomTypeLink: "https://www.sandals.com/royal-bahamian/rooms-suites/?categoryCode=WS&rstCode=SRB"
  },
  "Warwick Paradise Island Bahamas": {
    propertyLink: "https://www.warwickhotels.com/warwick-paradise-island-bahamas"
  },
  "Grand Hyatt Bahama Mar": {
    propertyLink: "https://www.hyatt.com/grand-hyatt/en-US/nasgh-grand-hyatt-baha-ma"
  }
};

function stored(key, fallback = {}) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function setStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function configuredGoogleUrl() {
  return (googleScriptUrl?.value || localStorage.getItem(GOOGLE_SCRIPT_URL_KEY) || DEFAULT_GOOGLE_SCRIPT_URL || "").trim();
}

async function googleApi(action, payload = null) {
  const endpoint = configuredGoogleUrl();
  if (!endpoint) throw new Error("Google Apps Script URL is not configured");
  if (payload) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...payload })
    });
    if (!response.ok) throw new Error(`Google request failed: ${response.status}`);
    return response.json();
  }
  const url = new URL(endpoint);
  url.searchParams.set("action", action);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Google request failed: ${response.status}`);
  return response.json();
}

async function dataApi(path, options = {}) {
  const googleUrl = configuredGoogleUrl();
  if (googleUrl && path === "/api/content" && !options.method) {
    return googleApi("content");
  }
  if (googleUrl && path === "/api/choices") {
    return googleApi("choice", { choice: JSON.parse(options.body || "{}") });
  }
  if (googleUrl && path === "/api/content" && options.method === "POST") {
    return googleApi("content", JSON.parse(options.body || "{}"));
  }
  return api(path, options);
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

function slug(value, fallback) {
  const cleaned = String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return cleaned || fallback;
}

function boolValue(value) {
  return String(value).trim().toLowerCase() === "true" || String(value).trim().toLowerCase() === "yes";
}

function fieldKey(id, field) {
  return `${id}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
}

function textOf(key) {
  const item = document.querySelector(`[data-edit-key="${key}"]`);
  return item ? item.textContent.trim() : "";
}

function offerById(id) {
  return tripData.offers.find((offer) => offer.id === id);
}

function hydrateKnownLinks(data) {
  data.offers = (data.offers || []).map((offer) => {
    const links = knownLinks[offer.property] || {};
    const propertyLink = offer.propertyLink || links.propertyLink || "";
    const roomTypeLink = offer.roomTypeLink || links.roomTypeLink || "";
    return {
      ...offer,
      propertyLink,
      roomTypeLink,
      detailLink: offer.detailLink || propertyLink || roomTypeLink || ""
    };
  });
  return data;
}

function getImageValue(el) {
  if (el.tagName === "IMG") return el.getAttribute("src") || "";
  const image = el.style.backgroundImage || getComputedStyle(el).backgroundImage;
  const match = image.match(/url\(["']?(.+?)["']?\)/);
  return match ? match[1] : "";
}

function setImageValue(el, value) {
  if (!value) return;
  if (el.tagName === "IMG") {
    el.src = value;
  } else {
    el.style.backgroundImage = `linear-gradient(135deg, rgba(20,184,196,0.18), rgba(236,111,102,0.18)), url("${value}")`;
  }
}

function isImageEditable(el) {
  return el?.classList.contains("editable-image");
}

function numericStyleValue(value) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : "";
}

function setImageSize(el, width, height) {
  if (!isImageEditable(el)) return;
  el.style.width = width ? `${width}px` : "";
  el.style.height = height ? `${height}px` : "";
  if (height && el.tagName !== "IMG") el.style.minHeight = `${height}px`;
  if (!height && el.tagName !== "IMG") el.style.minHeight = "";
}

function syncImageSizeInputs(el) {
  const isImage = isImageEditable(el);
  imageUploadLabel.hidden = !isImage;
  imageSizeControls.hidden = !isImage;
  if (!isImage) return;
  const computed = getComputedStyle(el);
  const width = numericStyleValue(el.style.width) || Math.round(el.getBoundingClientRect().width) || numericStyleValue(computed.width);
  const height = numericStyleValue(el.style.height) || Math.round(el.getBoundingClientRect().height) || numericStyleValue(computed.height);
  editImageWidth.value = width || "";
  editImageHeight.value = height || "";
  editImageWidthRange.value = Math.min(Math.max(width || 150, Number(editImageWidthRange.min)), Number(editImageWidthRange.max));
  editImageHeightRange.value = Math.min(Math.max(height || 150, Number(editImageHeightRange.min)), Number(editImageHeightRange.max));
}

function showEditTab(name) {
  tabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.tab === name));
  tabPanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === name));
}

function renderOffers() {
  offersRoot.innerHTML = tripData.offers.map((offer, index) => {
    const id = offer.id;
    const amenities = [
      offer.pool && "Pool",
      offer.restaurant && "Restaurant",
      offer.spa && "Spa"
    ].filter(Boolean);
    const propertyMarkup = offer.propertyLink
      ? `<a class="editable details-link details-link--title" data-edit-key="${fieldKey(id, "property")}" href="${escapeHtml(offer.propertyLink)}" data-edit-href="${escapeHtml(offer.propertyLink)}" target="_blank" rel="noopener">${escapeHtml(offer.property)}</a>`
      : `<span class="editable" data-edit-key="${fieldKey(id, "property")}">${escapeHtml(offer.property)}</span>`;
    const roomMarkup = offer.roomTypeLink
      ? `<a class="editable details-link" data-edit-key="${fieldKey(id, "roomType")}" href="${escapeHtml(offer.roomTypeLink)}" data-edit-href="${escapeHtml(offer.roomTypeLink)}" target="_blank" rel="noopener">${escapeHtml(offer.roomType)}</a>`
      : `<span class="editable" data-edit-key="${fieldKey(id, "roomType")}">${escapeHtml(offer.roomType)}</span>`;
    return `
      <article class="offer ${index === 1 ? "offer--featured" : ""}" data-offer-id="${escapeHtml(id)}">
        <div class="offer__media editable-image" data-edit-key="${fieldKey(id, "image")}" role="img" aria-label="${escapeHtml(offer.property)}" style="background-image: linear-gradient(135deg, rgba(20,184,196,0.18), rgba(236,111,102,0.18)), url('${escapeHtml(offer.image || "assets/bahamas-hero.png")}')"></div>
        <div class="offer__body">
          <div class="offer__topline">
            <span class="badge editable" data-edit-key="${fieldKey(id, "badge")}">${escapeHtml(offer.badge || `${tripData.guests} package`)}</span>
            <span class="price editable" data-edit-key="${fieldKey(id, "cost")}">${escapeHtml(offer.cost)}</span>
          </div>
          <h3>${propertyMarkup}</h3>
          <p class="detail-line"><strong>Room Type:</strong> ${roomMarkup}</p>
          <p class="detail-line"><strong>Location:</strong> <span class="editable" data-edit-key="${fieldKey(id, "location")}">${escapeHtml(offer.location)}</span></p>
          <p class="detail-line"><strong>Inclusion:</strong> <span class="editable" data-edit-key="${fieldKey(id, "inclusions")}">${escapeHtml(offer.inclusions)}</span></p>
          <p class="detail-line"><strong>Guests:</strong> <span class="editable" data-edit-key="${fieldKey(id, "guests")}">${escapeHtml(tripData.guests)}</span></p>
          ${offer.detailLink ? `<a class="details-link editable" data-edit-key="${fieldKey(id, "detailLinkText")}" href="${escapeHtml(offer.detailLink)}" data-edit-href="${escapeHtml(offer.detailLink)}" target="_blank" rel="noopener">View location details</a>` : ""}
          <dl class="details">
            <div><dt>Private Transfer</dt><dd class="editable" data-edit-key="${fieldKey(id, "transfer")}">${escapeHtml(offer.transfer)}</dd></div>
            <div><dt>VIP Service</dt><dd class="editable" data-edit-key="${fieldKey(id, "vip")}">${escapeHtml(offer.vip)}</dd></div>
            <div><dt>Travel Insurance</dt><dd class="editable" data-edit-key="${fieldKey(id, "insurance")}">${escapeHtml(offer.insurance)}</dd></div>
          </dl>
          <div class="amenities" aria-label="Amenities">${amenities.map((amenity) => `<span>${amenity}</span>`).join("")}</div>
          <button class="select-offer" type="button">Choose ${escapeHtml(offer.property.split(" ")[0])}</button>
        </div>
      </article>
    `;
  }).join("");
  refreshEditableItems();
}

function splitFlightLegs(value) {
  return String(value || "").replace(/\n/g, " ").split(";").map((leg) => leg.trim()).filter(Boolean);
}

function formatLeg(leg) {
  const route = leg.match(/([A-Z]{3})\s+to\s+([A-Z]{3})/i);
  const depart = leg.match(/departs?\s+([0-9:]+\s*[AP]M)/i);
  const arrive = leg.match(/arrives?\s+([0-9:]+\s*[AP]M)/i);
  return {
    route: route ? `${route[1].toUpperCase()} to ${route[2].toUpperCase()}` : leg,
    time: [depart && `Departs ${depart[1]}`, arrive && `Arrives ${arrive[1]}`].filter(Boolean).join(" | ")
  };
}

function renderFlightCards() {
  flightCards.innerHTML = tripData.flights.map((flight, index) => {
    const outbound = splitFlightLegs(flight.outbound).map(formatLeg);
    const returnLegs = splitFlightLegs(flight.return).map(formatLeg);
    const renderLegs = (legs) => legs.map((leg) => `
      <div class="flight-leg">
        <strong>${escapeHtml(leg.route)}</strong>
        <span>${escapeHtml(leg.time)}</span>
      </div>
    `).join("");
    return `
      <article class="flight-card">
        <div class="flight-card__head">
          <div>
            <span>Airline</span>
            <strong class="editable" data-edit-key="flight${index}Airline">${escapeHtml(flight.airline)}</strong>
          </div>
          <div class="flight-cost editable" data-edit-key="flight${index}Cost">${escapeHtml(flight.cost)}</div>
        </div>
        <div class="route-columns">
          <div class="route-block">
            <h3>Outbound</h3>
            ${renderLegs(outbound)}
          </div>
          <div class="route-block">
            <h3>Return</h3>
            ${renderLegs(returnLegs)}
          </div>
        </div>
      </article>
    `;
  }).join("");
  refreshEditableItems();
}

function renderTrip() {
  document.querySelector('[data-edit-key="dateRange"]').textContent = tripData.dates;
  renderOffers();
  renderFlightCards();
}

function refreshEditableItems() {
  editableItems = [...document.querySelectorAll("[data-edit-key]")];
}

function captureContent() {
  refreshEditableItems();
  const content = {};
  const styles = {};
  editableItems.forEach((el) => {
    const key = el.dataset.editKey;
    content[key] = isImageEditable(el) ? getImageValue(el) : el.textContent;
    content[`${key}:href`] = el.matches("a") ? el.getAttribute("href") || "" : el.dataset.editHref || "";
    styles[key] = {
      color: el.style.color || "",
      fontSize: el.style.fontSize || "",
      width: el.style.width || "",
      height: el.style.height || "",
      minHeight: el.style.minHeight || ""
    };
  });
  return { content, styles };
}

function applySavedContent(savedContent = stored(CONTENT_KEY), savedStyles = stored(STYLE_KEY)) {
  refreshEditableItems();
  const content = savedContent || {};
  const styles = savedStyles || {};
  editableItems.forEach((el) => {
    const key = el.dataset.editKey;
    if (content[key]) {
      if (isImageEditable(el)) setImageValue(el, content[key]);
      else el.textContent = content[key];
    }
    if (content[`${key}:href`]) {
      if (el.matches("a")) el.href = content[`${key}:href`];
      el.dataset.editHref = content[`${key}:href`];
    }
    if (styles[key]) {
      el.style.color = styles[key].color || "";
      el.style.fontSize = styles[key].fontSize || "";
      el.style.width = styles[key].width || "";
      el.style.height = styles[key].height || "";
      el.style.minHeight = styles[key].minHeight || "";
    }
  });
}

function selectOffer(id) {
  const offer = offerById(id);
  if (!offer) return;
  selectedOfferId = id;
  document.querySelectorAll(".offer").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.offerId === id);
  });
  selectedName.textContent = offer.property;
  selectedSummary.textContent = `${offer.roomType} | ${offer.cost} | ${tripData.guests}`;
}

function readChoice(choice = stored(CHOICE_KEY, null)) {
  if (!choice) return;
  if (choice.offerId) selectOffer(choice.offerId);
  choiceForm.privateTransfer.checked = Boolean(choice.privateTransfer);
  choiceForm.vipService.checked = Boolean(choice.vipService);
  choiceForm.travelInsurance.checked = Boolean(choice.travelInsurance);
  choiceForm.notes.value = choice.notes || "";
  updateOwnerChoice();
}

function updateOwnerChoice() {
  const choice = stored(CHOICE_KEY, null);
  if (!choice) {
    ownerChoice.textContent = "No customer selection saved yet.";
    return;
  }
  const extras = [
    choice.privateTransfer && "Private transfer",
    choice.vipService && "VIP service",
    choice.travelInsurance && "Travel insurance"
  ].filter(Boolean).join(", ") || "No optional extras";
  ownerChoice.textContent = `${choice.resortName} | ${choice.room} | ${choice.price}. Guests: ${choice.guests || tripData.guests}. Extras: ${extras}. Notes: ${choice.notes || "None"}`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === "\"" && quoted && next === "\"") {
      value += "\"";
      i += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some((cell) => String(cell).trim())) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  row.push(value);
  if (row.some((cell) => String(cell).trim())) rows.push(row);
  return rows;
}

function normalizeHeader(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function valueFrom(record, names) {
  const wanted = names.map(normalizeHeader);
  const key = Object.keys(record).find((candidate) => wanted.includes(normalizeHeader(candidate)));
  return key ? String(record[key] || "").trim() : "";
}

function parseTripCsv(text) {
  const rows = parseCsv(text);
  const datesRow = rows.find((row) => String(row[0] || "").toLowerCase().startsWith("dates:"));
  const propertyIndex = rows.findIndex((row) => normalizeHeader(row[0]) === "property");
  const flightIndex = rows.findIndex((row) => String(row[0] || "").toLowerCase().includes("flight options"));
  const parsed = structuredClone(defaultTripData);
  if (datesRow) parsed.dates = String(datesRow[0]).replace(/^Dates:\s*/i, "").trim();

  if (propertyIndex >= 0) {
    const headers = rows[propertyIndex];
    const offerRows = rows.slice(propertyIndex + 1, flightIndex > propertyIndex ? flightIndex : rows.length)
      .filter((row) => String(row[0] || "").trim());
    parsed.offers = offerRows.map((row, index) => {
      const record = Object.fromEntries(headers.map((header, cellIndex) => [header, row[cellIndex] || ""]));
      const property = valueFrom(record, ["Property"]);
      const roomType = valueFrom(record, ["Room Type"]);
      const detailLink = valueFrom(record, ["Details Link", "Detail Link", "Location Details", "Location Link", "Link", "URL", "View Details"]);
      return {
        id: slug(property, `offer-${index + 1}`),
        badge: index === 1 ? "Best Value" : `${parsed.guests} package`,
        property,
        roomType,
        location: valueFrom(record, ["Location"]),
        cost: valueFrom(record, ["Cost (total 4 night)", "Cost", "Total Cost"]),
        transfer: valueFrom(record, ["Private Airport Transfer *optional*", "Private Airport Transfer", "Transfer"]),
        vip: valueFrom(record, ["VIP Arrival/Departure Service", "VIP Service"]),
        insurance: valueFrom(record, ["Travel Insurance", "Insurance"]),
        inclusions: valueFrom(record, ["Inclusions", "Inclusions "]),
        pool: boolValue(valueFrom(record, ["Pool"])),
        restaurant: boolValue(valueFrom(record, ["Restaurant"])),
        spa: boolValue(valueFrom(record, ["Spa"])),
        image: valueFrom(record, ["Image", "Image URL", "Photo", "Photo URL"]) || "assets/bahamas-hero.png",
        detailLink
      };
    });
  }

  if (flightIndex >= 0) {
    const headers = rows[flightIndex + 1] || [];
    const flightRows = rows.slice(flightIndex + 2).filter((row) => String(row[0] || "").trim());
    parsed.flights = flightRows.map((row) => {
      const record = Object.fromEntries(headers.map((header, cellIndex) => [header, row[cellIndex] || ""]));
      return {
        airline: valueFrom(record, ["Airline"]),
        outbound: valueFrom(record, ["Outbound"]),
        return: valueFrom(record, ["Return"]),
        cost: valueFrom(record, ["Cost"])
      };
    });
  }
  return parsed;
}

function chooseEditable(el, event) {
  if (!document.body.classList.contains("editing")) {
  const href = el.matches("a") ? el.getAttribute("href") : el.dataset.editHref;
    if (href && href !== "#" && !el.closest("a")) {
      event.preventDefault();
      window.location.href = href;
    }
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  currentEditable?.classList.remove("is-selected-edit");
  currentEditable = el;
  currentEditable.classList.add("is-selected-edit");
  lastSnapshot = captureContent();
  editValue.value = isImageEditable(el) ? getImageValue(el) : el.textContent.trim();
  editHref.value = el.matches("a") ? el.getAttribute("href") || "" : el.dataset.editHref || "";
  editColor.value = rgbToHex(getComputedStyle(el).color);
  editSize.value = parseInt(getComputedStyle(el).fontSize, 10) || "";
  editImageUpload.value = "";
  syncImageSizeInputs(el);
  showEditTab(isImageEditable(el) ? "media" : "content");
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => showEditTab(button.dataset.tab));
});

offersRoot.addEventListener("click", (event) => {
  const button = event.target.closest(".select-offer");
  if (button) {
    selectOffer(button.closest(".offer").dataset.offerId);
    notify("Resort selected. Add extras below when ready.");
  }
});

document.addEventListener("click", (event) => {
  const editable = event.target.closest("[data-edit-key]");
  if (editable) chooseEditable(editable, event);
});

choiceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const offer = offerById(selectedOfferId);
  if (!offer) {
    notify("Please choose a resort first.");
    return;
  }
  const choice = {
    offerId: selectedOfferId,
    resortName: offer.property,
    room: offer.roomType,
    price: offer.cost,
    guests: tripData.guests,
    privateTransfer: choiceForm.privateTransfer.checked,
    vipService: choiceForm.vipService.checked,
    travelInsurance: choiceForm.travelInsurance.checked,
    notes: choiceForm.notes.value.trim(),
    submittedAt: new Date().toISOString()
  };
  setStored(CHOICE_KEY, choice);
  try {
    await dataApi("/api/choices", { method: "POST", body: JSON.stringify(choice) });
  } catch {
    notify("Choice saved in this browser. Check the Google URL or server if advisor review is needed.");
    updateOwnerChoice();
    return;
  }
  updateOwnerChoice();
  notify("Choice saved for Dejah to review.");
});

editLauncher.addEventListener("click", () => {
  if (document.body.classList.contains("editing")) editPanel.hidden = false;
  else loginDialog.showModal();
});

dialogClose.addEventListener("click", () => {
  loginDialog.close();
  document.querySelector("#loginError").textContent = "";
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (email === OWNER_EMAIL.toLowerCase() && password === OWNER_PASSWORD) {
    ownerSession = { email: OWNER_EMAIL, password };
    loginDialog.close();
    document.body.classList.add("editing");
    editPanel.hidden = false;
    notify("Editing unlocked.");
  } else {
    document.querySelector("#loginError").textContent = "Email or password did not match.";
  }
});

editImageUpload.addEventListener("change", () => {
  if (!currentEditable || !isImageEditable(currentEditable) || !editImageUpload.files.length) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    editValue.value = reader.result;
    setImageValue(currentEditable, reader.result);
    notify("Image uploaded. Click Save to keep it.");
  });
  reader.readAsDataURL(editImageUpload.files[0]);
});

editCsvUpload.addEventListener("change", () => {
  if (!editCsvUpload.files.length) return;
  const file = editCsvUpload.files[0];
  const reader = new FileReader();
  reader.addEventListener("load", async () => {
    try {
      if (file.name.toLowerCase().endsWith(".xlsx")) {
        const dataUrl = String(reader.result);
        tripData = hydrateKnownLinks(await api("/api/parse-spreadsheet", {
          method: "POST",
          body: JSON.stringify({ filename: file.name, data: dataUrl.split(",")[1] || "" })
        }));
      } else {
        tripData = hydrateKnownLinks(parseTripCsv(reader.result));
      }
      setStored(TRIP_DATA_KEY, tripData);
      renderTrip();
      applySavedContent();
      notify("Spreadsheet loaded. Review, then click Save to keep it.");
    } catch {
      notify("Could not read that spreadsheet.");
    }
  });
  if (file.name.toLowerCase().endsWith(".xlsx")) reader.readAsDataURL(file);
  else reader.readAsText(file);
});

function applyImageSizingFromInputs() {
  if (!currentEditable || !isImageEditable(currentEditable)) return;
  setImageSize(currentEditable, numericStyleValue(editImageWidth.value), numericStyleValue(editImageHeight.value));
  syncImageSizeInputs(currentEditable);
}

[editImageWidth, editImageHeight].forEach((input) => input.addEventListener("input", applyImageSizingFromInputs));
editImageWidthRange.addEventListener("input", () => {
  editImageWidth.value = editImageWidthRange.value;
  applyImageSizingFromInputs();
});
editImageHeightRange.addEventListener("input", () => {
  editImageHeight.value = editImageHeightRange.value;
  applyImageSizingFromInputs();
});
document.querySelector("#resetImageSize").addEventListener("click", () => {
  if (!currentEditable || !isImageEditable(currentEditable)) return;
  setImageSize(currentEditable, "", "");
  syncImageSizeInputs(currentEditable);
});
document.querySelector("#wideImageSize").addEventListener("click", () => {
  if (!currentEditable || !isImageEditable(currentEditable)) return;
  setImageSize(currentEditable, 1200, 520);
  syncImageSizeInputs(currentEditable);
});
document.querySelector("#logoImageSize").addEventListener("click", () => {
  if (!currentEditable || !isImageEditable(currentEditable)) return;
  setImageSize(currentEditable, 180, "");
  syncImageSizeInputs(currentEditable);
});

document.querySelector("#applyEdit").addEventListener("click", () => {
  if (!currentEditable) {
    notify("Click something editable first.");
    return;
  }
  if (isImageEditable(currentEditable)) {
    setImageValue(currentEditable, editValue.value.trim());
    applyImageSizingFromInputs();
  } else {
    currentEditable.textContent = editValue.value;
  }
  const href = editHref.value.trim();
  if (currentEditable.matches("a")) currentEditable.href = href || "#";
  currentEditable.dataset.editHref = href;
  currentEditable.style.color = editColor.value;
  currentEditable.style.fontSize = editSize.value ? `${editSize.value}px` : "";
  notify("Applied on page.");
});

document.querySelector("#saveEdit").addEventListener("click", async () => {
  const snapshot = captureContent();
  setStored(CONTENT_KEY, snapshot.content);
  setStored(STYLE_KEY, snapshot.styles);
  setStored(TRIP_DATA_KEY, tripData);
  localStorage.setItem(GOOGLE_SCRIPT_URL_KEY, configuredGoogleUrl());
  if (ownerSession) {
    try {
      await dataApi("/api/content", {
        method: "POST",
        body: JSON.stringify({ ...ownerSession, content: snapshot.content, styles: snapshot.styles, tripData })
      });
    } catch {
      notify("Saved in this browser. Start the server for shared saves.");
      return;
    }
  }
  updateOwnerChoice();
  notify("Saved permanently.");
});

document.querySelector("#undoEdit").addEventListener("click", () => {
  if (!lastSnapshot) {
    notify("Nothing to undo yet.");
    return;
  }
  setStored(CONTENT_KEY, lastSnapshot.content);
  setStored(STYLE_KEY, lastSnapshot.styles);
  applySavedContent();
  notify("Undone to the last selected state.");
});

document.querySelector("#doneEdit").addEventListener("click", () => {
  document.body.classList.remove("editing");
  currentEditable?.classList.remove("is-selected-edit");
  currentEditable = null;
  editPanel.hidden = true;
  notify("Editing hidden.");
});

function rgbToHex(rgb) {
  const values = rgb.match(/\d+/g);
  if (!values) return "#12313a";
  return `#${values.slice(0, 3).map((value) => {
    const hex = Number(value).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  }).join("")}`;
}

async function boot() {
  if (googleScriptUrl) googleScriptUrl.value = localStorage.getItem(GOOGLE_SCRIPT_URL_KEY) || DEFAULT_GOOGLE_SCRIPT_URL;
  try {
    const remoteContent = await dataApi("/api/content");
    tripData = hydrateKnownLinks(remoteContent.tripData || stored(TRIP_DATA_KEY, defaultTripData));
    setStored(TRIP_DATA_KEY, tripData);
    setStored(CONTENT_KEY, remoteContent.content || {});
    setStored(STYLE_KEY, remoteContent.styles || {});
    renderTrip();
    applySavedContent(remoteContent.content, remoteContent.styles);
    if (remoteContent.latestChoice) setStored(CHOICE_KEY, remoteContent.latestChoice);
  } catch {
    tripData = hydrateKnownLinks(stored(TRIP_DATA_KEY, defaultTripData));
    renderTrip();
    applySavedContent();
  }

  try {
    const remoteChoice = configuredGoogleUrl() ? stored(CHOICE_KEY, null) : await api("/api/choices");
    if (remoteChoice) setStored(CHOICE_KEY, remoteChoice);
    readChoice(remoteChoice);
  } catch {
    readChoice();
  }
}

boot();
