# Bahamas Vacation Offer Selection

Editable customer-facing vacation offer page for Dejah White Travel.

## Run Locally

```bash
npm start
```

Then open `http://localhost:4173`.

## Features

- Resort offer cards for two travelers.
- Admin edit mode with image uploads, sizing controls, text/link edits, save, undo, and done.
- CSV and XLSX upload support.
- XLSX hyperlink extraction for linked resort/property details.
- Customer selection capture with optional trip extras and notes.
- Optional Google Sheets backend through Google Apps Script.

## Google Sheets Backend

You can use a Google Sheet as the live information source.

1. Create or open a Google Sheet.
2. Go to `Extensions > Apps Script`.
3. Paste the contents of `google-apps-script.gs`.
4. Click `Deploy > New deployment`.
5. Choose `Web app`.
6. Set `Execute as` to `Me`.
7. Set `Who has access` to `Anyone`.
8. Copy the Web App URL ending in `/exec`.
9. Open the site, log in as admin, paste the URL into `Google Apps Script URL`, and click `Save`.

Current configured Apps Script URL:

```text
https://script.google.com/macros/s/AKfycbz_WyJI_xE1FujmqVKSLXX8lpdHbAPHkPH83kvGQUX02k7coSwjA8XP-u4dUsk28Ug/exec
```

The script can read the original Rowan-style sheet layout, including rich-text hyperlinks. It can also use normalized tabs named `Offers`, `Flights`, `Settings`, `Site Content`, and `Customer Choices`.

Customer choices are written to the `Customer Choices` tab. Admin saves are written to the `Site Content` tab.

## Deploy

This app uses `server.js`, so deploy it to a Node-capable host such as Render or Railway for the full admin and spreadsheet-upload features.

GitHub Pages can host only the static front-end and will not run `server.js`.

If you configure the Google Apps Script URL, GitHub Pages can host the front-end while Google Sheets stores the live data.
