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

## Deploy

This app uses `server.js`, so deploy it to a Node-capable host such as Render or Railway for the full admin and spreadsheet-upload features.

GitHub Pages can host only the static front-end and will not run `server.js`.
