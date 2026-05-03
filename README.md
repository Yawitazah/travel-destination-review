# Bahamas Vacation Offer Selection

Editable customer-facing vacation offer page for Dejah White Travel.

## Run Locally

```bash
npm start
```

Then open `http://localhost:4273`.

## Features

- Resort offer cards for two travelers.
- Admin edit mode with image uploads, sizing controls, text/link edits, save, undo, and done.
- CSV and XLSX upload support.
- XLSX hyperlink extraction for linked resort/property details.
- Customer selection capture with optional trip extras and notes.
- Railway/Node backend for saved trips, page edits, and customer selections.

## Railway Backend

This app uses `server.js` as the live database layer. Admin saves are written to JSON files in the `data` folder on the running server:

- `data/site-content.json` stores all vacation opportunities, page edits, styles, and uploaded trip data.
- `data/customer-choices.json` stores customer selections and notes.

For production on Railway, add a Railway Volume mounted to the app if you want saved trips to survive service rebuilds/redeploys. Set `DATA_DIR` to the mounted volume path, for example `/data`. Without a persistent volume or external database, the data can be reset when Railway rebuilds the container.

## Multiple Vacation Opportunities

Each vacation opportunity has:

- Project name
- Client name
- Client email
- Client phone
- Uploaded spreadsheet trip data

Log in as admin, open the `Data` tab, fill out the opportunity fields, upload the offer spreadsheet, and click `Save`.

The app creates a unique opportunity ID and a `Live Opportunity URL` like:

```text
https://your-site.com/?opportunity=rowan-summer-trip-client-name
```

Use that URL for the customer. Each opportunity saves separately on the Railway server so multiple live trips do not interfere with each other.

The `Download Template` button in the Data tab downloads a starter CSV with all required opportunity, resort, and flight columns.

The `Trips` tab lists saved opportunities from Railway. Click a trip to open its unique live URL and edit or review it.

The browser also keeps a local opportunity index so a newly saved trip appears immediately in `Trips` while the Railway server response refreshes.

When Save is clicked, the admin dashboard switches to the `Trips` tab and shows the saved opportunity immediately. The `Refresh` button then merges in anything currently saved on Railway.

## Deploy

This app uses `server.js`, so Railway is the right deployment target for the full admin and spreadsheet-upload features.

GitHub Pages can host only the static front-end and will not run `server.js`.
