# DHIS2 Google Apps Script Tools

A small shared library of Google Apps Script functions for talking to a [DHIS2](https://dhis2.org/) instance's Web API — plain CRUD helpers plus two higher-level utilities for keeping DHIS2 dashboard visualizations (charts and maps) in sync with changing periods, org units, or dimensions. It underpins several of the country-specific surveillance/reporting Apps Script projects published alongside this one (e.g. `dma-weekly-surveillance`, `grd-bulletin-data`).

## What's in this repo

| File | Purpose |
|---|---|
| `DHIS2Lib.js` | Core HTTP helpers: `dhis2Get`, `dhis2Post`, `dhis2Put`, `dhis2Patch`, `dhis2Delete`. Each wraps `UrlFetchApp.fetch` with the DHIS2 `ApiToken` auth header, JSON (de)serialization, and consistent error throwing on non-2xx responses. |
| `updateDHIS2Chart.js` | `updateDHIS2Chart(baseUrl, chartId, apitokenGET, apitokenPUT, newPeriod, newOuItems, additionalDims)` — fetches an existing chart/table (`/api/visualizations/{id}`), rebuilds its `columns`/`rows`/`filters` dimension arrays while preserving the existing layout, optionally overrides the period and/or org units, and PUTs the updated definition back. Falls back to the chart's own `USER_ORGUNIT[_CHILDREN/_GRANDCHILDREN]` setting when no org unit override is given. |
| `updateDHIS2Map.js` | Same idea as above but for `/api/maps/{id}` — operates on the map's first `mapViews[0]` entry. |
| `appsscript.json` | Apps Script project manifest (timezone `America/Barbados`, V8 runtime). |

## Why this exists

Several country teams build recurring bulletins/dashboards on top of DHIS2 pivot tables, charts, and maps that need their period (and sometimes org unit) rolled forward automatically — e.g. a weekly epi bulletin chart that should always show "last 8 weeks" without a human re-editing it in the DHIS2 UI every week. Rather than duplicating raw `UrlFetchApp` calls and dimension-rebuilding logic in every country's Apps Script project, that logic lives here once and is imported as an Apps Script library (or copy-pasted, depending on the consuming project) by the country projects.

## Requirements

- A Google account with access to Apps Script (script.google.com), or the [`clasp`](https://github.com/google/clasp) CLI for local development/deployment.
- A DHIS2 **personal access token** (DHIS2 ≥ 2.38 style `ApiToken` bearer token, created under your DHIS2 profile → Personal Access Tokens) with the privileges the call needs:
  - `dhis2Get` / the `GET` half of chart/map updates → at least read access to the object.
  - `dhis2Post` / `dhis2Put` / `dhis2Patch` / `dhis2Delete` / the `PUT` half of chart/map updates → write access to the object type being modified.

## Usage

### Raw API calls

```javascript
var data = dhis2Get("https://play.dhis2.org/dev/api/me", "YOUR_TOKEN");

dhis2Post("https://play.dhis2.org/dev/api/dataElements", "YOUR_TOKEN", { name: "Test" });

dhis2Put("https://play.dhis2.org/dev/api/dataElements/uid123", "YOUR_TOKEN", updatedObj);

dhis2Patch("https://play.dhis2.org/dev/api/dataElements/uid123", "YOUR_TOKEN", { shortName: "Test" });

dhis2Delete("https://play.dhis2.org/dev/api/dataElements/uid123", "YOUR_TOKEN");
```

### Rolling a chart forward to a new period / org unit

```javascript
updateDHIS2Chart(
  "https://play.dhis2.org/dev",       // baseUrl
  "CHART_12345",                      // chartId
  "YOUR_GET_TOKEN",                   // apitokenGET (read-only token is fine)
  "YOUR_PUT_TOKEN",                   // apitokenPUT (needs write access; omit to reuse the GET token)
  "2025SunW14",                       // newPeriod — overrides the "pe" dimension
  [ { id: "ImspTQPwCqd" } ],          // newOuItems — overrides the "ou" dimension (optional)
  { columns: [ /* extra dimension objects */ ] }  // additionalDims (optional)
);
```

`updateDHIS2Map` takes the same argument shape for `/api/maps/{id}`.

### Notes on tokens

None of the files in this repo contain a real DHIS2 token — the JSDoc examples above use literal placeholder strings (`YOUR_TOKEN`, `YOUR_GET_TOKEN`, etc.) on purpose. When wiring this library into a consuming Apps Script project, store the real token in that project's **Script Properties** (`PropertiesService.getScriptProperties()`), not in source code — that's the pattern the sibling country projects (`dma-weekly-surveillance`, `grd-bulletin-data`, `lca-*`, `vct-dhis2-lab-upload`) follow.

## License

Licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/) — see [`LICENSE`](./LICENSE). You're free to use, adapt, and redistribute this code, including commercially, as long as you credit the original author.

## Status

Internal PAHO Eastern Caribbean Country Office (ECC) tooling, published here as a private backup/reference repository.
