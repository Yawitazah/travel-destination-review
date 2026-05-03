const SETTINGS_SHEET = 'Settings';
const OPPORTUNITIES_SHEET = 'Opportunities';
const CONTENT_SHEET = 'Site Content';
const CHOICES_SHEET = 'Customer Choices';
const OFFERS_SHEET = 'Offers';
const FLIGHTS_SHEET = 'Flights';

function doGet(e) {
  const action = (e.parameter.action || 'content').toLowerCase();
  const opportunityId = e.parameter.opportunityId || 'rowan-summer-trip-may-2026';
  if (action === 'content') {
    const saved = readContentRecord(opportunityId);
    return jsonOutput({
      content: saved.content,
      styles: saved.styles,
      tripData: readTripData(opportunityId, saved.tripData),
      latestChoice: latestChoice(opportunityId)
    });
  }
  if (action === 'opportunities') {
    return jsonOutput({ opportunities: listOpportunities() });
  }
  return jsonOutput({ ok: true });
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents || '{}');
  const action = (body.action || '').toLowerCase();
  const opportunityId = body.opportunityId || (body.tripData && body.tripData.opportunity && body.tripData.opportunity.id) || 'rowan-summer-trip-may-2026';

  if (action === 'choice') {
    appendChoice(body.choice || {}, opportunityId);
    return jsonOutput({ ok: true });
  }

  if (action === 'content') {
    saveContentRecord(opportunityId, body);
    return jsonOutput({ ok: true });
  }

  return jsonOutput({ ok: false, error: 'Unknown action' });
}

function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureSheet(name, headers) {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0 || !sheet.getRange(1, 1).getValue()) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function readJsonCell(sheetName, cell, fallback) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) return fallback;
  const raw = sheet.getRange(cell).getValue();
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function readContentRecord(opportunityId) {
  const headers = ['Opportunity ID', 'Project Name', 'Client Name', 'Client Email', 'Client Phone', 'Content JSON', 'Styles JSON', 'Trip Data JSON', 'Updated At'];
  const sheet = ensureSheet(CONTENT_SHEET, headers);
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex((row, index) => index > 0 && row[0] === opportunityId);
  if (rowIndex < 0) return { content: {}, styles: {}, tripData: null };
  return {
    content: parseJson(values[rowIndex][5], {}),
    styles: parseJson(values[rowIndex][6], {}),
    tripData: parseJson(values[rowIndex][7], null)
  };
}

function saveContentRecord(opportunityId, body) {
  const headers = ['Opportunity ID', 'Project Name', 'Client Name', 'Client Email', 'Client Phone', 'Content JSON', 'Styles JSON', 'Trip Data JSON', 'Updated At'];
  const sheet = ensureSheet(CONTENT_SHEET, headers);
  const opportunity = (body.tripData && body.tripData.opportunity) || {};
  const row = [
    opportunityId,
    opportunity.projectName || '',
    opportunity.clientName || '',
    opportunity.clientEmail || '',
    opportunity.clientPhone || '',
    JSON.stringify(body.content || {}),
    JSON.stringify(body.styles || {}),
    JSON.stringify(body.tripData || {}),
    new Date()
  ];
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex((existing, index) => index > 0 && existing[0] === opportunityId);
  if (rowIndex >= 0) sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([row]);
  else sheet.appendRow(row);

  saveOpportunity(opportunityId, opportunity);
}

function saveOpportunity(opportunityId, opportunity) {
  const headers = ['Opportunity ID', 'Project Name', 'Client Name', 'Client Email', 'Client Phone', 'Updated At'];
  const sheet = ensureSheet(OPPORTUNITIES_SHEET, headers);
  const row = [
    opportunityId,
    opportunity.projectName || '',
    opportunity.clientName || '',
    opportunity.clientEmail || '',
    opportunity.clientPhone || '',
    new Date()
  ];
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex((existing, index) => index > 0 && existing[0] === opportunityId);
  if (rowIndex >= 0) sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([row]);
  else sheet.appendRow(row);
}

function listOpportunities() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(OPPORTUNITIES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return values.map((row) => {
    const record = Object.fromEntries(headers.map((header, index) => [header, row[index]]));
    return {
      id: record['Opportunity ID'] || '',
      projectName: record['Project Name'] || '',
      clientName: record['Client Name'] || '',
      clientEmail: record['Client Email'] || '',
      clientPhone: record['Client Phone'] || '',
      updatedAt: record['Updated At'] || ''
    };
  }).filter((item) => item.id);
}

function parseJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function latestChoice(opportunityId) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CHOICES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return null;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const idIndex = headers.indexOf('opportunityId');
  const rows = idIndex >= 0 ? values.filter((row) => row[idIndex] === opportunityId) : values;
  if (!rows.length) return null;
  const row = rows[rows.length - 1];
  return Object.fromEntries(headers.map((header, index) => [header, row[index]]));
}

function appendChoice(choice, opportunityId) {
  const headers = [
    'receivedAt',
    'opportunityId',
    'projectName',
    'clientName',
    'clientEmail',
    'clientPhone',
    'offerId',
    'resortName',
    'room',
    'price',
    'guests',
    'privateTransfer',
    'vipService',
    'travelInsurance',
    'notes',
    'submittedAt'
  ];
  const sheet = ensureSheet(CHOICES_SHEET, headers);
  sheet.appendRow(headers.map((header) => {
    if (header === 'receivedAt') return new Date();
    if (header === 'opportunityId') return choice.opportunityId || opportunityId;
    return choice[header] || '';
  }));
}

function readTripData(opportunityId, savedTripData) {
  if (savedTripData && savedTripData.offers) return withOpportunity(savedTripData, opportunityId);

  const offersSheet = SpreadsheetApp.getActive().getSheetByName(OFFERS_SHEET);
  const flightsSheet = SpreadsheetApp.getActive().getSheetByName(FLIGHTS_SHEET);
  if (offersSheet) return withOpportunity(readNormalizedSheets(offersSheet, flightsSheet), opportunityId);

  return withOpportunity(readRowanSheet(), opportunityId);
}

function withOpportunity(tripData, opportunityId) {
  tripData.opportunity = tripData.opportunity || opportunityFromSheet(opportunityId);
  tripData.opportunity.id = tripData.opportunity.id || opportunityId;
  return tripData;
}

function opportunityFromSheet(opportunityId) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(OPPORTUNITIES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) {
    return { id: opportunityId, projectName: '', clientName: '', clientEmail: '', clientPhone: '' };
  }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const idIndex = headers.indexOf('Opportunity ID');
  const row = values.find((candidate) => candidate[idIndex] === opportunityId);
  if (!row) return { id: opportunityId, projectName: '', clientName: '', clientEmail: '', clientPhone: '' };
  const record = Object.fromEntries(headers.map((header, index) => [header, row[index]]));
  return {
    id: opportunityId,
    projectName: record['Project Name'] || '',
    clientName: record['Client Name'] || '',
    clientEmail: record['Client Email'] || '',
    clientPhone: record['Client Phone'] || ''
  };
}

function readNormalizedSheets(offersSheet, flightsSheet) {
  const offers = recordsFromSheet(offersSheet).map((record, index) => ({
    id: slug(record.Property || `offer-${index + 1}`),
    badge: record.Badge || (index === 1 ? 'Best Value' : '2 people package'),
    property: record.Property || '',
    propertyLink: record.Property_link || record['Property Link'] || '',
    roomType: record['Room Type'] || '',
    roomTypeLink: record['Room Type_link'] || record['Room Type Link'] || '',
    location: record.Location || '',
    cost: money(record.Cost || record['Cost (total 4 night)']),
    transfer: money(record.Transfer || record['Private Airport Transfer']),
    vip: money(record.VIP || record['VIP Arrival/Departure Service']),
    insurance: money(record.Insurance || record['Travel Insurance']),
    inclusions: record.Inclusions || '',
    pool: truthy(record.Pool),
    restaurant: truthy(record.Restaurant),
    spa: truthy(record.Spa),
    image: record.Image || 'assets/bahamas-hero.png',
    detailLink: record.DetailLink || record['Detail Link'] || record.Property_link || ''
  }));

  const flights = flightsSheet ? recordsFromSheet(flightsSheet).map((record) => ({
    airline: record.Airline || '',
    outbound: record.Outbound || '',
    return: record.Return || '',
    cost: record.Cost || ''
  })) : [];

  return {
    dates: settingValue('Dates') || 'May 28, 2026 - June 1, 2026',
    guests: settingValue('Guests') || '2 people',
    offers,
    flights
  };
}

function readRowanSheet() {
  const sheet = SpreadsheetApp.getActive().getSheets()[0];
  const values = sheet.getDataRange().getDisplayValues();
  const rich = sheet.getDataRange().getRichTextValues();
  const datesRow = values.find((row) => String(row[0]).toLowerCase().startsWith('dates:'));
  const propertyIndex = values.findIndex((row) => normalize(row[0]) === 'property');
  const flightIndex = values.findIndex((row) => String(row[0]).toLowerCase().includes('flight options'));
  const tripData = {
    dates: datesRow ? datesRow[0].replace(/^Dates:\s*/i, '').trim() : 'May 28, 2026 - June 1, 2026',
    guests: '2 people',
    offers: [],
    flights: []
  };

  if (propertyIndex >= 0) {
    const headers = values[propertyIndex];
    for (let r = propertyIndex + 1; r < (flightIndex > propertyIndex ? flightIndex : values.length); r++) {
      if (!values[r][0] || values[r][0] === '0' || !values[r][1]) continue;
      const record = recordFromRow(headers, values[r], rich[r]);
      tripData.offers.push({
        id: slug(record.Property.value),
        badge: tripData.offers.length === 1 ? 'Best Value' : '2 people package',
        property: record.Property.value,
        propertyLink: record.Property.link,
        roomType: record['Room Type'].value,
        roomTypeLink: record['Room Type'].link,
        location: record.Location.value,
        cost: money(record['Cost (total 4 night)'].value),
        transfer: money(record['Private Airport Transfer *optional*'].value),
        vip: money(record['VIP Arrival/Departure Service'].value),
        insurance: money(record['Travel Insurance'].value),
        inclusions: (record['Inclusions '] || record.Inclusions || { value: '' }).value,
        pool: truthy(record.Pool.value),
        restaurant: truthy(record.Restaurant.value),
        spa: truthy(record.Spa.value),
        image: 'assets/bahamas-hero.png',
        detailLink: record.Property.link || record['Room Type'].link
      });
    }
  }

  if (flightIndex >= 0) {
    const headers = values[flightIndex + 1];
    for (let r = flightIndex + 2; r < values.length; r++) {
      if (!values[r][0]) continue;
      const record = recordFromRow(headers, values[r], rich[r]);
      tripData.flights.push({
        airline: record.Airline.value,
        outbound: record.Outbound.value,
        return: record.Return.value,
        cost: record.Cost.value
      });
    }
  }

  return tripData;
}

function recordsFromSheet(sheet) {
  const values = sheet.getDataRange().getDisplayValues();
  const rich = sheet.getDataRange().getRichTextValues();
  const headers = values[0] || [];
  return values.slice(1).filter((row) => row.some(Boolean)).map((row, index) => {
    const record = {};
    headers.forEach((header, column) => {
      record[header] = row[column];
      const link = rich[index + 1][column].getLinkUrl();
      if (link) record[`${header}_link`] = link;
    });
    return record;
  });
}

function recordFromRow(headers, row, richRow) {
  const record = {};
  headers.forEach((header, index) => {
    if (!header) return;
    record[header] = {
      value: row[index] || '',
      link: richRow[index] ? richRow[index].getLinkUrl() || '' : ''
    };
  });
  return record;
}

function settingValue(name) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SETTINGS_SHEET);
  if (!sheet) return '';
  const values = sheet.getDataRange().getDisplayValues();
  const match = values.find((row) => row[0] === name);
  return match ? match[1] : '';
}

function normalize(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function slug(value) {
  return String(value || 'offer').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'offer';
}

function truthy(value) {
  return ['true', 'yes', '1'].includes(String(value || '').trim().toLowerCase());
}

function money(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.includes('$')) return raw;
  const number = Number(raw.replace(/,/g, ''));
  if (!Number.isFinite(number)) return raw;
  return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}
