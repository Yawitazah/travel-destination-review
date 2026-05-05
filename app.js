const OWNER_EMAIL = "Dejahwhitetravel@gmail.com";
const OWNER_PASSWORD = "DWtravel2026";
const CONTENT_KEY = "dwTravelOfferContent";
const STYLE_KEY = "dwTravelOfferStyles";
const CHOICE_KEY = "dwTravelCustomerChoice";
const TRIP_DATA_KEY = "dwTravelTripData";
const OPPORTUNITY_KEY = "dwTravelOpportunity";
const OPPORTUNITY_LIST_KEY = "dwTravelOpportunities";
const OWNER_SESSION_KEY = "dwTravelOwnerSession";

const defaultTripData = {
  opportunity: {
    id: "rowan-summer-trip-may-2026",
    projectName: "Rowan Summer Trip - May 2026",
    clientName: "",
    clientEmail: "",
    clientPhone: ""
  },
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
const projectName = document.querySelector("#projectName");
const clientName = document.querySelector("#clientName");
const clientEmail = document.querySelector("#clientEmail");
const clientPhone = document.querySelector("#clientPhone");
const opportunityUrl = document.querySelector("#opportunityUrl");
const downloadTemplate = document.querySelector("#downloadTemplate");
const newOpportunity = document.querySelector("#newOpportunity");
const purgeDataButton = document.querySelector("#purgeData");
const editLauncher = document.querySelector("#editLauncher");
const editPanel = document.querySelector("#editPanel");
const editSheetHandle = document.querySelector("#editSheetHandle");
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
const customerWelcome = document.querySelector("#customerWelcome");
const successDialog = document.querySelector("#successDialog");
const successClose = document.querySelector("#successClose");
const activityFilters = [...document.querySelectorAll(".activity-filter")];
const selectionCount = document.querySelector("#selectionCount");
const visitCount = document.querySelector("#visitCount");
const resetActivity = document.querySelector("#resetActivity");
const selectedName = document.querySelector("#selectedName");
const selectedSummary = document.querySelector("#selectedSummary");
const choiceForm = document.querySelector("#choiceForm");
const toast = document.querySelector("#toast");
const offersRoot = document.querySelector("#offers");
const flightCards = document.querySelector("#flightCards");
const opportunityList = document.querySelector("#opportunityList");
const opportunityStatus = document.querySelector("#opportunityStatus");
const refreshOpportunities = document.querySelector("#refreshOpportunities");
const tabButtons = [...document.querySelectorAll(".edit-tab")];
const tabPanels = [...document.querySelectorAll(".tab-panel")];

let tripData = structuredClone(defaultTripData);
let editableItems = [];
let currentEditable = null;
let lastSnapshot = null;
let selectedOfferId = null;
let ownerSession = null;
let sheetDragState = null;
let activityTimer = null;
let visitTracked = false;
let currentActivityFilter = "choice";
let currentActivity = [];

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
  const response = await fetch(apiPath(path, options), {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function apiPath(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  if (method !== "GET" || !["/api/content", "/api/choices"].includes(path)) return path;
  const url = new URL(path, window.location.origin);
  url.searchParams.set("opportunityId", requestedOpportunityId());
  return `${url.pathname}${url.search}`;
}

function dataApi(path, options = {}) {
  return api(path, options);
}

function rememberedOwnerSession() {
  const session = stored(OWNER_SESSION_KEY, null);
  if (session?.email?.toLowerCase() === OWNER_EMAIL.toLowerCase() && session?.password === OWNER_PASSWORD) return session;
  localStorage.removeItem(OWNER_SESSION_KEY);
  return null;
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

function opportunityFromInputs() {
  const existing = tripData.opportunity || stored(OPPORTUNITY_KEY, defaultTripData.opportunity);
  const remembered = localOpportunities().find((item) => item.id === existing.id || item.id === requestedOpportunityId()) || {};
  const requestedId = requestedOpportunityId();
  const fallback = {
    id: requestedId || existing.id || remembered.id,
    projectName: existing.projectName || remembered.projectName || "",
    clientName: existing.clientName || remembered.clientName || "",
    clientEmail: existing.clientEmail || remembered.clientEmail || "",
    clientPhone: existing.clientPhone || remembered.clientPhone || ""
  };
  const generatedFromFields = slug(`${projectName?.value.trim() || ""}-${clientName?.value.trim() || ""}`, "");
  const next = {
    id: fallback.id || generatedFromFields,
    projectName: projectName?.value.trim() || fallback.projectName || "",
    clientName: clientName?.value.trim() || fallback.clientName || "",
    clientEmail: clientEmail?.value.trim() || fallback.clientEmail || "",
    clientPhone: clientPhone?.value.trim() || fallback.clientPhone || ""
  };
  next.id = slug(next.id || `${next.projectName}-${next.clientName}`, "vacation-opportunity");
  return next;
}

function requestedOpportunityId() {
  return new URLSearchParams(window.location.search).get("opportunity") || stored(OPPORTUNITY_KEY, defaultTripData.opportunity).id;
}

function freshOpportunityId() {
  return `new-vacation-${Date.now().toString(36)}`;
}

function syncOpportunityFields() {
  const opportunity = tripData.opportunity || stored(OPPORTUNITY_KEY, defaultTripData.opportunity);
  if (projectName) projectName.value = opportunity.projectName || "";
  if (clientName) clientName.value = opportunity.clientName || "";
  if (clientEmail) clientEmail.value = opportunity.clientEmail || "";
  if (clientPhone) clientPhone.value = opportunity.clientPhone || "";
  if (opportunityUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set("opportunity", opportunity.id || "vacation-opportunity");
    opportunityUrl.value = url.toString();
  }
  renderCustomerWelcome();
}

function renderCustomerWelcome() {
  if (!customerWelcome) return;
  const name = (tripData.opportunity?.clientName || "").trim();
  customerWelcome.hidden = !name;
  customerWelcome.textContent = name ? `Welcome, ${name}` : "Welcome";
}

function updateOpportunityFromInputs() {
  tripData.opportunity = opportunityFromInputs();
  setStored(OPPORTUNITY_KEY, tripData.opportunity);
  syncOpportunityFields();
  return tripData.opportunity;
}

function localOpportunities() {
  return stored(OPPORTUNITY_LIST_KEY, []);
}

function rememberOpportunity(opportunity = tripData.opportunity) {
  if (!opportunity?.id) return [];
  const next = {
    id: opportunity.id,
    projectName: opportunity.projectName || "",
    clientName: opportunity.clientName || "",
    clientEmail: opportunity.clientEmail || "",
    clientPhone: opportunity.clientPhone || "",
    updatedAt: new Date().toISOString()
  };
  const existing = localOpportunities().filter((item) => item.id !== next.id);
  const list = [next, ...existing];
  setStored(OPPORTUNITY_LIST_KEY, list);
  return list;
}

function forgetOpportunity(id) {
  const list = localOpportunities().filter((item) => item.id !== id);
  setStored(OPPORTUNITY_LIST_KEY, list);
  return list;
}

function syncLocalOpportunities(opportunities = []) {
  setStored(OPPORTUNITY_LIST_KEY, opportunities);
  return opportunities;
}

function mergeOpportunities(remote = []) {
  const byId = new Map();
  [...localOpportunities(), ...remote].forEach((item) => {
    if (!item?.id) return;
    const current = byId.get(item.id) || {};
    byId.set(item.id, {
      ...current,
      ...item,
      projectName: item.projectName || current.projectName || "",
      clientName: item.clientName || current.clientName || "",
      clientEmail: item.clientEmail || current.clientEmail || "",
      clientPhone: item.clientPhone || current.clientPhone || "",
      updatedAt: item.updatedAt || current.updatedAt || ""
    });
  });
  return [...byId.values()].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
}

function renderOpportunityList(opportunities = []) {
  if (!opportunityList) return;
  if (!opportunities.length) {
    opportunityList.innerHTML = '<p class="panel-note">No saved opportunities yet. Create one in the Data tab, upload the spreadsheet, then Save.</p>';
    return;
  }
  const currentId = tripData.opportunity?.id || requestedOpportunityId();
  opportunityList.innerHTML = opportunities.map((item) => `
    <div class="opportunity-item ${item.id === currentId ? "is-active" : ""}">
      <button class="opportunity-open" type="button" data-opportunity-id="${escapeHtml(item.id)}">
        <strong>${escapeHtml(item.projectName || item.id)}</strong>
        <span>${escapeHtml(item.clientName || "No client name")} ${item.clientEmail ? `| ${escapeHtml(item.clientEmail)}` : ""}</span>
        <span>${escapeHtml(item.clientPhone || "")}</span>
      </button>
      <button class="opportunity-delete" type="button" data-delete-opportunity-id="${escapeHtml(item.id)}" aria-label="Delete ${escapeHtml(item.projectName || item.id)}">Delete</button>
    </div>
  `).join("");
}

function setOpportunityStatus(message = "", type = "") {
  if (!opportunityStatus) return;
  opportunityStatus.textContent = message;
  opportunityStatus.className = `opportunity-status ${type ? `is-${type}` : ""}`.trim();
  opportunityStatus.hidden = !message;
}

function assertOpportunityResponse(response) {
  if (!Array.isArray(response?.opportunities)) {
    throw new Error("The server did not return the Trips list.");
  }
  return response.opportunities;
}

async function verifySharedOpportunity(opportunityId) {
  const response = await dataApi("/api/opportunities");
  return assertOpportunityResponse(response).some((item) => item.id === opportunityId);
}

async function loadOpportunityList() {
  const local = localOpportunities();
  renderOpportunityList(local);
  setOpportunityStatus("Checking Railway for shared trips.");
  try {
    const response = await dataApi("/api/opportunities");
    const remote = assertOpportunityResponse(response);
    syncLocalOpportunities(remote);
    renderOpportunityList(remote);
    setOpportunityStatus(
      remote.length ? "Connected to Railway. These trips are shared across devices." : "Connected to Railway. No saved trips yet.",
      "good"
    );
  } catch (error) {
    renderOpportunityList(local);
    setOpportunityStatus(
      "The Railway server is not returning the shared Trips list yet. Check the deployment, then click Refresh.",
      "warning"
    );
  }
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
  data.opportunity = data.opportunity || stored(OPPORTUNITY_KEY, defaultTripData.opportunity);
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

function mobileSheetHeight(expanded) {
  const viewport = window.innerHeight || document.documentElement.clientHeight || 800;
  return Math.round(viewport * (expanded ? 0.78 : 0.34));
}

function setEditSheetHeight(height) {
  editPanel.style.setProperty("--mobile-sheet-height", `${height}px`);
  document.body.style.setProperty("--mobile-editor-padding", `${Math.max(120, height + 18)}px`);
}

function setEditSheetExpanded(expanded, customHeight = null) {
  const height = customHeight || mobileSheetHeight(expanded);
  editPanel.classList.toggle("is-expanded", expanded);
  setEditSheetHeight(height);
  editSheetHandle?.setAttribute("aria-expanded", String(expanded));
  editSheetHandle?.setAttribute("aria-label", expanded ? "Collapse edit dashboard" : "Expand edit dashboard");
}

function beginEditSheetDrag(event) {
  if (!editSheetHandle || !editPanel) return;
  sheetDragState = {
    startY: event.clientY,
    startHeight: editPanel.getBoundingClientRect().height,
    moved: false
  };
  editPanel.classList.add("is-dragging");
  editSheetHandle.setPointerCapture?.(event.pointerId);
}

function moveEditSheetDrag(event) {
  if (!sheetDragState) return;
  const viewport = window.innerHeight || document.documentElement.clientHeight || 800;
  const minHeight = viewport * 0.28;
  const maxHeight = viewport * 0.86;
  const delta = sheetDragState.startY - event.clientY;
  const height = Math.min(maxHeight, Math.max(minHeight, sheetDragState.startHeight + delta));
  sheetDragState.moved = sheetDragState.moved || Math.abs(delta) > 8;
  setEditSheetHeight(height);
}

function endEditSheetDrag(event) {
  if (!sheetDragState) return false;
  const viewport = window.innerHeight || document.documentElement.clientHeight || 800;
  const height = editPanel.getBoundingClientRect().height;
  const moved = sheetDragState.moved;
  editPanel.classList.remove("is-dragging");
  editSheetHandle?.releasePointerCapture?.(event.pointerId);
  sheetDragState = null;
  setEditSheetExpanded(height > viewport * 0.52, height > viewport * 0.52 ? mobileSheetHeight(true) : mobileSheetHeight(false));
  return moved;
}

function unlockOwnerEditing(message = "Editing unlocked.") {
  document.body.classList.add("editing");
  editPanel.hidden = false;
  setEditSheetExpanded(false);
  notify(message);
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
  renderCustomerWelcome();
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
    ownerChoice.innerHTML = '<p class="panel-note">No selections yet.</p>';
    return;
  }
  const extras = [
    choice.privateTransfer && "Private transfer",
    choice.vipService && "VIP service",
    choice.travelInsurance && "Travel insurance"
  ].filter(Boolean).join(", ") || "No optional extras";
  ownerChoice.innerHTML = activityChoiceMarkup({ choice, receivedAt: choice.receivedAt || choice.submittedAt, type: "choice" }, extras);
}

function activityChoiceMarkup(item, extras = null) {
  const choice = item.choice || item;
  const selectedExtras = extras || [
    choice.privateTransfer && "Private transfer",
    choice.vipService && "VIP service",
    choice.travelInsurance && "Travel insurance"
  ].filter(Boolean).join(", ") || "No optional extras";
  return `
    <article class="activity-card activity-card--choice">
      <div class="activity-card__top">
        <span>Selection submitted</span>
        <time>${escapeHtml(formatDateTime(item.receivedAt || choice.submittedAt))}</time>
      </div>
      <strong>${escapeHtml(choice.resortName || "Resort selected")}</strong>
      <dl>
        <div><dt>Client</dt><dd>${escapeHtml(choice.clientName || tripData.opportunity?.clientName || "Customer")}</dd></div>
        <div><dt>Room</dt><dd>${escapeHtml(choice.room || "Not provided")}</dd></div>
        <div><dt>Price</dt><dd>${escapeHtml(choice.price || "Not provided")}</dd></div>
        <div><dt>Guests</dt><dd>${escapeHtml(choice.guests || tripData.guests || "Not provided")}</dd></div>
        <div><dt>Extras</dt><dd>${escapeHtml(selectedExtras)}</dd></div>
        <div><dt>Notes</dt><dd>${escapeHtml(choice.notes || "None")}</dd></div>
      </dl>
    </article>
  `;
}

function activityVisitMarkup(item) {
  return `
    <article class="activity-card">
      <div class="activity-card__top">
        <span>Page visited</span>
        <time>${escapeHtml(formatDateTime(item.receivedAt))}</time>
      </div>
      <strong>${escapeHtml(tripData.opportunity?.clientName || "Customer")} opened this trip page.</strong>
      <p>${escapeHtml(item.visit?.page || window.location.pathname)}</p>
    </article>
  `;
}

function formatDateTime(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function renderActivity(activity = []) {
  if (!ownerChoice) return;
  currentActivity = activity;
  const selections = activity.filter((item) => item.type === "choice");
  const visits = activity.filter((item) => item.type === "visit");
  if (selectionCount) selectionCount.textContent = String(selections.length);
  if (visitCount) visitCount.textContent = String(visits.length);
  const filtered = currentActivityFilter === "visit" ? visits : selections;
  if (!filtered.length) {
    ownerChoice.innerHTML = `<p class="panel-note">No ${currentActivityFilter === "visit" ? "visits" : "selections"} yet.</p>`;
    return;
  }
  ownerChoice.innerHTML = filtered.map((item) => item.type === "choice" ? activityChoiceMarkup(item) : activityVisitMarkup(item)).join("");
}

function showActivityFilter(filter) {
  currentActivityFilter = filter;
  activityFilters.forEach((button) => button.classList.toggle("is-active", button.dataset.activityFilter === filter));
  renderActivity(currentActivity);
}

async function loadActivity() {
  try {
    const response = await dataApi("/api/activity");
    renderActivity(response.activity || []);
  } catch {
    updateOwnerChoice();
  }
}

function startActivityPolling() {
  window.clearInterval(activityTimer);
  loadActivity();
  activityTimer = window.setInterval(loadActivity, 5000);
}

async function resetCurrentActivity() {
  if (!ownerSession) {
    notify("Log in before resetting activity.");
    loginDialog.showModal();
    return;
  }
  const confirmed = window.confirm("Reset visits and selections for this trip? This lets the customer start over.");
  if (!confirmed) return;
  try {
    await dataApi("/api/activity/reset", {
      method: "POST",
      body: JSON.stringify({ ...ownerSession, opportunityId: tripData.opportunity?.id || requestedOpportunityId() })
    });
    localStorage.removeItem(CHOICE_KEY);
    selectedOfferId = null;
    choiceForm.reset();
    selectedName.textContent = "None selected yet";
    selectedSummary.textContent = "Choose a resort above to build your trip preference.";
    document.querySelectorAll(".offer").forEach((card) => card.classList.remove("is-selected"));
    currentActivity = [];
    renderActivity([]);
    notify("Activity reset for this trip.");
  } catch {
    notify("Could not reset activity. Check Railway and try again.");
  }
}

async function trackVisit() {
  if (visitTracked) return;
  const opportunityId = tripData.opportunity?.id || requestedOpportunityId();
  if (opportunityId === defaultTripData.opportunity.id && !new URLSearchParams(window.location.search).get("opportunity")) return;
  visitTracked = true;
  try {
    await dataApi("/api/activity", {
      method: "POST",
      body: JSON.stringify({
        type: "visit",
        opportunityId,
        visit: { page: window.location.pathname + window.location.search }
      })
    });
  } catch {
  }
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
  const opportunityRows = rows.filter((row) => normalizeHeader(row[0]) === "opportunity");
  const opportunityValues = Object.fromEntries(opportunityRows.map((row) => [normalizeHeader(row[1]), row[2] || ""]));
  const existingOpportunity = tripData.opportunity || stored(OPPORTUNITY_KEY, defaultTripData.opportunity);
  parsed.opportunity = {
    id: requestedOpportunityId() || existingOpportunity.id || parsed.opportunity.id,
    projectName: opportunityValues.projectname || existingOpportunity.projectName || parsed.opportunity.projectName,
    clientName: opportunityValues.clientname || existingOpportunity.clientName || "",
    clientEmail: opportunityValues.clientemail || existingOpportunity.clientEmail || "",
    clientPhone: opportunityValues.clientphone || existingOpportunity.clientPhone || ""
  };
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
  button.addEventListener("click", () => {
    showEditTab(button.dataset.tab);
    if (button.dataset.tab === "opportunities") loadOpportunityList();
    if (button.dataset.tab === "activity") startActivityPolling();
    else window.clearInterval(activityTimer);
  });
});

refreshOpportunities?.addEventListener("click", loadOpportunityList);
purgeDataButton?.addEventListener("click", purgeSavedData);
resetActivity?.addEventListener("click", resetCurrentActivity);
activityFilters.forEach((button) => {
  button.addEventListener("click", () => showActivityFilter(button.dataset.activityFilter));
});

opportunityList?.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-opportunity-id]");
  if (deleteButton) {
    const id = deleteButton.dataset.deleteOpportunityId;
    const label = deleteButton.closest(".opportunity-item")?.querySelector("strong")?.textContent || id;
    const confirmed = window.confirm(`Delete "${label}"? This removes the trip and its saved customer selections from Railway.`);
    if (!confirmed) return;
    deleteOpportunity(id);
    return;
  }

  const item = event.target.closest("[data-opportunity-id]");
  if (!item) return;
  const id = item.dataset.opportunityId;
  const url = new URL(window.location.href);
  url.searchParams.set("opportunity", id);
  window.location.href = url.toString();
});

async function deleteOpportunity(id) {
  try {
    await dataApi(`/api/opportunities/${encodeURIComponent(id)}`, {
      method: "DELETE",
      body: JSON.stringify(ownerSession || {})
    });
    forgetOpportunity(id);
    if (id === (tripData.opportunity?.id || requestedOpportunityId())) {
      const url = new URL(window.location.href);
      url.searchParams.delete("opportunity");
      window.history.replaceState({}, "", url.toString());
      tripData = structuredClone(defaultTripData);
      setStored(TRIP_DATA_KEY, tripData);
      setStored(OPPORTUNITY_KEY, tripData.opportunity);
      setStored(CONTENT_KEY, {});
      setStored(STYLE_KEY, {});
      renderTrip();
      syncOpportunityFields();
      applySavedContent({}, {});
    }
    loadOpportunityList();
    notify("Trip deleted.");
  } catch {
    notify("Could not delete that trip. Make sure you are logged in and Railway is running.");
  }
}

async function purgeSavedData() {
  if (!ownerSession) {
    notify("Log in before resetting saved data.");
    loginDialog.showModal();
    return;
  }
  const confirmed = window.confirm("Reset all saved trips, page edits, uploads, and customer selections on Railway? This cannot be undone.");
  if (!confirmed) return;
  try {
    await dataApi("/api/admin/purge", {
      method: "POST",
      body: JSON.stringify(ownerSession)
    });
    localStorage.removeItem(OPPORTUNITY_LIST_KEY);
    localStorage.removeItem(TRIP_DATA_KEY);
    localStorage.removeItem(OPPORTUNITY_KEY);
    localStorage.removeItem(CONTENT_KEY);
    localStorage.removeItem(STYLE_KEY);
    localStorage.removeItem(CHOICE_KEY);
    tripData = structuredClone(defaultTripData);
    selectedOfferId = null;
    choiceForm.reset();
    const url = new URL(window.location.href);
    url.searchParams.delete("opportunity");
    window.history.replaceState({}, "", url.toString());
    renderTrip();
    syncOpportunityFields();
    applySavedContent({}, {});
    renderOpportunityList([]);
    setOpportunityStatus("All saved Railway data has been reset.", "good");
    notify("Saved data reset.");
  } catch {
    notify("Could not reset Railway data. Check the deployment and try again.");
  }
}

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
    opportunityId: tripData.opportunity?.id || requestedOpportunityId(),
    projectName: tripData.opportunity?.projectName || "",
    clientName: tripData.opportunity?.clientName || "",
    clientEmail: tripData.opportunity?.clientEmail || "",
    clientPhone: tripData.opportunity?.clientPhone || "",
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
    notify("Choice saved in this browser. Check the Railway server if advisor review is needed.");
    updateOwnerChoice();
    return;
  }
  updateOwnerChoice();
  loadActivity();
  showSuccessDialog();
});

function showSuccessDialog() {
  if (!successDialog) {
    notify("Beautiful choice. Dejah has been updated and will send next steps soon.");
    return;
  }
  successDialog.hidden = false;
  window.setTimeout(() => {
    successDialog.hidden = true;
  }, 9000);
}

successClose?.addEventListener("click", () => {
  successDialog.hidden = true;
});

editLauncher.addEventListener("click", () => {
  if (document.body.classList.contains("editing")) editPanel.hidden = false;
  else if (ownerSession) unlockOwnerEditing("Editing unlocked from this device.");
  else loginDialog.showModal();
});

editSheetHandle?.addEventListener("click", (event) => {
  if (editSheetHandle.dataset.justDragged === "true") {
    event.preventDefault();
    editSheetHandle.dataset.justDragged = "";
    return;
  }
  setEditSheetExpanded(!editPanel.classList.contains("is-expanded"));
});

editSheetHandle?.addEventListener("pointerdown", (event) => {
  beginEditSheetDrag(event);
});

editSheetHandle?.addEventListener("pointermove", (event) => {
  moveEditSheetDrag(event);
});

editSheetHandle?.addEventListener("pointerup", (event) => {
  if (endEditSheetDrag(event)) editSheetHandle.dataset.justDragged = "true";
});

editSheetHandle?.addEventListener("pointercancel", (event) => {
  if (endEditSheetDrag(event)) editSheetHandle.dataset.justDragged = "true";
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
  const rememberLogin = formData.get("rememberLogin") === "on";
  if (email === OWNER_EMAIL.toLowerCase() && password === OWNER_PASSWORD) {
    ownerSession = { email: OWNER_EMAIL, password };
    if (rememberLogin) setStored(OWNER_SESSION_KEY, ownerSession);
    else localStorage.removeItem(OWNER_SESSION_KEY);
    loginDialog.close();
    unlockOwnerEditing();
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
      tripData.opportunity = opportunityFromInputs();
      setStored(TRIP_DATA_KEY, tripData);
      setStored(OPPORTUNITY_KEY, tripData.opportunity);
      renderTrip();
      syncOpportunityFields();
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
  if (!ownerSession) {
    notify("Log in to save this trip to Railway.");
    loginDialog.showModal();
    return;
  }
  const opportunity = updateOpportunityFromInputs();
  renderOpportunityList([opportunity]);
  setOpportunityStatus("Saving this trip to Railway...");
  const snapshot = captureContent();
  setStored(CONTENT_KEY, snapshot.content);
  setStored(STYLE_KEY, snapshot.styles);
  setStored(TRIP_DATA_KEY, tripData);
  let serverSaved = false;
  try {
    await dataApi("/api/content", {
      method: "POST",
      body: JSON.stringify({ ...ownerSession, content: snapshot.content, styles: snapshot.styles, tripData })
    });
    serverSaved = await verifySharedOpportunity(opportunity.id);
    if (serverSaved) rememberOpportunity(opportunity);
    if (!serverSaved) {
      setOpportunityStatus(
        "The page content saved, but Railway did not register this trip in the shared Trips list. Click Save again after the latest server deploy finishes.",
        "warning"
      );
    }
  } catch (error) {
    notify("Railway did not accept the save; check the deployment and try Save again.");
  }
  updateOwnerChoice();
  loadOpportunityList();
  showEditTab("opportunities");
  notify(serverSaved ? "Saved to Railway and Trips." : "Railway save needs attention. Try again after deployment finishes.");
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
  setEditSheetExpanded(false);
  currentEditable?.classList.remove("is-selected-edit");
  currentEditable = null;
  editPanel.hidden = true;
  notify("Editing hidden.");
});

[projectName, clientName, clientEmail, clientPhone].forEach((input) => {
  input?.addEventListener("input", () => {
    tripData.opportunity = opportunityFromInputs();
    syncOpportunityFields();
    renderOpportunityList(mergeOpportunities([]));
  });
});

newOpportunity?.addEventListener("click", () => {
  const id = freshOpportunityId();
  tripData = structuredClone(defaultTripData);
  tripData.opportunity = {
    id,
    projectName: "",
    clientName: "",
    clientEmail: "",
    clientPhone: ""
  };
  setStored(TRIP_DATA_KEY, tripData);
  setStored(OPPORTUNITY_KEY, tripData.opportunity);
  setStored(CONTENT_KEY, {});
  setStored(STYLE_KEY, {});
  localStorage.removeItem(CHOICE_KEY);
  selectedOfferId = null;
  choiceForm.reset();
  selectedName.textContent = "None selected yet";
  selectedSummary.textContent = "Upload a spreadsheet or edit the starter offer details for this new opportunity.";
  renderTrip();
  syncOpportunityFields();
  applySavedContent({}, {});
  const url = new URL(window.location.href);
  url.searchParams.set("opportunity", id);
  window.history.replaceState({}, "", url.toString());
  showEditTab("data");
  notify("New vacation opportunity started. Add client details, upload a spreadsheet, then Save.");
  loadOpportunityList();
});

downloadTemplate?.addEventListener("click", () => {
  const line = (values) => values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",");
  const csv = [
    line(["Section", "Field", "Value", "Notes"]),
    line(["Opportunity", "Project Name", "Rowan Summer Trip - May 2026", "Required"]),
    line(["Opportunity", "Client Name", "Client Full Name", "Required"]),
    line(["Opportunity", "Client Email", "client@email.com", "Required"]),
    line(["Opportunity", "Client Phone", "(555) 555-5555", "Required"]),
    [],
    line(["Dates: May 28, 2026 - June 1, 2026"]),
    line(["Property", "Room Type", "Location", "Cost (total 4 night)", "Private Airport Transfer *optional*", "VIP Arrival/Departure Service", "Travel Insurance", "Inclusions", "Pool", "Restaurant", "Spa", "Details Link", "Image URL"]),
    line(["Example Resort", "Ocean View King", "Nassau, Bahamas", "$4,500.00", "$330.00", "$480.00", "$560.00", "Airport transfers; resort credit", "TRUE", "TRUE", "TRUE", "https://example.com", "https://example.com/photo.jpg"]),
    [],
    line(["Flight options"]),
    line(["Airline", "Outbound", "Return", "Cost"]),
    line(["Delta Airlines", "HSV to ATL - departs 10:11 AM arrives 12:12 PM; ATL to NAS - departs 2:32 PM arrives 4:35 PM", "NAS to ATL - departs 6:00 PM arrives 8:27 PM; ATL to HSV - departs 11:14 PM arrives 11:13 PM", "Included in cost of resort"])
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "vacation-opportunity-template.csv";
  link.click();
  URL.revokeObjectURL(link.href);
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
  ownerSession = rememberedOwnerSession();
  try {
    const remoteContent = await dataApi("/api/content");
    tripData = hydrateKnownLinks(remoteContent.tripData || stored(TRIP_DATA_KEY, defaultTripData));
    setStored(TRIP_DATA_KEY, tripData);
    setStored(CONTENT_KEY, remoteContent.content || {});
    setStored(STYLE_KEY, remoteContent.styles || {});
    renderTrip();
    syncOpportunityFields();
    applySavedContent(remoteContent.content, remoteContent.styles);
    if (remoteContent.latestChoice) setStored(CHOICE_KEY, remoteContent.latestChoice);
    loadOpportunityList();
    trackVisit();
  } catch {
    tripData = hydrateKnownLinks(stored(TRIP_DATA_KEY, defaultTripData));
    renderTrip();
    syncOpportunityFields();
    applySavedContent();
    loadOpportunityList();
    trackVisit();
  }

  try {
    const remoteChoice = await api("/api/choices");
    if (remoteChoice) setStored(CHOICE_KEY, remoteChoice);
    readChoice(remoteChoice);
  } catch {
    readChoice();
  }
}

boot();
