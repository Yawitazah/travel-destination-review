const SETTINGS_SHEET = 'Settings';
const CONTENT_SHEET = 'Site Content';
const CHOICES_SHEET = 'Customer Choices';
const OFFERS_SHEET = 'Offers';
const FLIGHTS_SHEET = 'Flights';

function doGet(e) {
  const action = (e.parameter.action || 'content').toLowerCase();
  if (action === 'content') {
    return jsonOutput({
      content: readJsonCell(CONTENT_SHEET, 'A2', {}),
      styles: readJsonCell(CONTENT_SHEET, 'B2', {}),
      tripData: readTripData(),
      latestChoice: latestChoice()
    });
  }
  return jsonOutput({ ok: true });
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents || '{}');
  const action = (body.action || '').toLowerCase();

  if (action === 'choice') {
    appendChoice(body.choice || {});
    return jsonOutput({ ok: true });
  }

  if (action === 'content') {
    ensureSheet(CONTENT_SHEET, ['Content JSON', 'Styles JSON', 'Trip Data JSON', 'Updated At']);
    const sheet = SpreadsheetApp.getActive().getSheetByName(CONTENT_SHEET);
    sheet.getRange('A2').setValue(JSON.stringify(body.content || {}));
    sheet.getRange('B2').setValue(JSON.stringify(body.styles || {}));
    sheet.getRange('C2').setValue(JSON.stringify(body.tripData || {}));
    sheet.getRange('D2').setValue(new Date());
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

function latestChoice() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CHOICES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return null;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = sheet.getRange(sheet.getLastRow(), 1, 1, sheet.getLastColumn()).getValues()[0];
  return Object.fromEntries(headers.map((header, index) => [header, row[index]]));
}

function appendChoice(choice) {
  const headers = [
    'receivedAt',
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
  sheet.appendRow(headers.map((header) => header === 'receivedAt' ? new Date() : choice[header] || ''));
}

function readTripData() {
  const savedTripData = readJsonCell(CONTENT_SHEET, 'C2', null);
  if (savedTripData && savedTripData.offers) return savedTripData;

  const offersSheet = SpreadsheetApp.getActive().getSheetByName(OFFERS_SHEET);
  const flightsSheet = SpreadsheetApp.getActive().getSheetByName(FLIGHTS_SHEET);
  if (offersSheet) return readNormalizedSheets(offersSheet, flightsSheet);

  return readRowanSheet();
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
