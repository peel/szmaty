# Agent guide

## Project and development

- This is a public waste-container map for Pomorskie, Poland. The interface is in Polish; agent documentation is in English.
- Repository: https://github.com/peel/szmaty. Production: https://szmaty.peelosophy.com/.
- `index.html` is a self-contained application with inline CSS, JavaScript, and embedded JSON. It uses a custom Web Mercator map and OpenStreetMap tiles. There is no build step or application framework.
- Container coordinates are resolved offline and embedded in the HTML. Do not restore startup geocoding or download the location lists on each visit.
- Keep embedded data and the corresponding JSON files consistent when updating datasets. Saving the map as HTML must preserve both fractions, coordinates, and photo associations.
- Use `python3 -m http.server 8000` from the repository root for a local preview. Geolocation needs localhost or HTTPS.
- GitHub Pages publishes the repository root from `main`; `CNAME` contains the custom domain. Pushing to `main` deploys automatically. Check for unrelated unpublished commits before pushing.
- Keep operational documentation here; do not recreate a README.

## Progressive web app

- `manifest.webmanifest` defines the stable app ID, root scope/start URL, Polish name, standalone display, and install icons. Keep the ID stable across updates.
- `icons/icon.svg` is the editable source: an ivory bin inside a map pin on green. Rebuild PNG sizes (32, 180, 192, 512 and maskable 512) with `node scripts/build-icons.cjs`, using `sharp`. Keep the symbol inside the maskable safe area.
- The footer installation button uses the browser's deferred install prompt when available. Otherwise it shows platform-specific instructions, including iPhone/iPad Share → Add to Home Screen and Safari on Mac Add to Dock. Hide it in standalone mode or after `appinstalled`; do not prompt automatically.
- `sw.js` caches only the same-origin app shell, manifest, and icons. Navigation is network-first with a four-second fallback to the last successful cached HTML. Do not prefetch/cache OSM tiles, photos, routing requests, arbitrary pages, or private coordinates in the service worker.
- Embedded points remain searchable offline. Map tiles, photos, and new routes need connectivity; show this limit in the offline notice and installation help.
- The app checks for worker updates on startup. Worker activation cleans only caches with the `gdzie-wyrzucic-app-` prefix and never reloads an active map automatically. Bump the cache version when changing the shell asset set. HTML-only updates are fetched on the next online navigation even if the worker is unchanged.
- Keep installed layouts within device safe-area insets. Downloaded standalone HTML removes PWA asset links/install controls and never registers a service worker under `file://`.
- `node tests/pwa.cjs` uses a local HTTP server and Chrome to check manifest/installability, native prompt handling, manual installation help, standalone behavior, offline search, fresh online navigation, and cache boundaries. `MAP_URL` checks deployed assets and installability; offline/update simulation is local only. `SCREENSHOT` optionally saves the mobile layout.

## Product behavior to preserve

- The heading is “GDZIE WYRZUCIĆ”. Independent “Szmaty” and “Elektronikę” buttons allow one, both, or neither fraction. Do not introduce a separate option for each combination.
- Search filters the complete dataset, including alternate addresses and internal source descriptions. Do not restore separate geographic or accuracy filters, a fraction-selector caption, source-count blocks, or data-export controls.
- Keep “Źródła i dokładność” in the footer. Keep the complete-map HTML save action.
- Point details describe the address, locality, placement clues, and accuracy. Do not display PDF references, PDF links, source row numbers, or electronics source-entry lists. Preserve provenance internally.
- Request location once at startup. On success, center on the user at zoom 15. Switching fractions reuses that position without requesting location again. Failure, denial, missing support, or a 15-second timeout falls back to the whole selected dataset. The location button allows retrying.
- Opening a point remembers the previous center and zoom. Closing it with the close button or Escape restores that view. Switching between points preserves the original return view; switching fractions resets it.
- A single-fraction list is ordered by straight-line distance from the user, or the map center if location is unavailable. Unknown coordinates sort last. Opening details must not change the distance origin.
- Render single-fraction lists in batches of 50, with scroll loading and an accessible load-more button. Search and fraction/origin changes reset the list; opening and closing details preserves loaded rows and scroll position. Pagination does not limit map markers.
- Both-fraction marker clicks open the pair overview. Keep the current pair when one of its selected markers is clicked; otherwise choose the highest-ranked pair containing that point. Explicit detail buttons may open an individual point and offer a return to the pair.
- Selected stops use numbers 1–2: a circle for textiles and a purple square for electronics. Fit the view around the details panel, including on mobile. Separate overlapping selected markers visually.
- Unknown coordinates and arbitrary midpoints representing entire streets must not become trip destinations. Approximate addresses are not confirmed container positions.

## Car routing

The pair planner uses car routes. On 2026-10-02 the user approved publication of this version after being informed that starting positions and candidate coordinates are sent to OSRM/FOSSGIS at `routing.openstreetmap.de` to calculate routes.

Preserve these constraints:

- Use the OSRM/FOSSGIS car graph at `https://routing.openstreetmap.de/routed-car/`. The table API supplies directed road distances; compare both visit orders and sort by start → first stop → second stop distance, excluding the return trip.
- OSRM distances describe fast car routes, not mathematically shortest roads. Do not claim live traffic, parking availability, or a global optimum across the province.
- Select up to 12 nearby matching points per fraction and two nearby opposite-fraction partners per anchor: at most 72 candidates plus the origin. Compare all matching pairs within that set. Straight-line distances only choose candidates; displayed trip distances come from roads. Remote-address searches must include partners near that address.
- Reject road snaps farther than 100 m from a destination or 150 m from the origin. Explain that the last metres may require walking from the accessible road.
- Fetch full route geometry when opening a pair. Show “Oba podczas jednego przejazdu” and a driving-directions link. Fit the entire route around the panel. Never substitute a straight line for a loading, failed, or unreachable route.
- Debounce searches by 400 ms, serialize requests with at least 1.1 seconds between starts, and time out requests after 15 seconds. Cache up to 12 valid responses locally with a one-day reuse limit. Do not cache malformed successful responses.
- Cancel stale work when the origin, search, fraction, or selection changes. Late responses must not reopen closed details. Provide retry actions for matrix and geometry failures.
- Explain third-party coordinate transmission in the sources/accuracy dialog. Retain OpenStreetMap attribution, OSRM/FOSSGIS attribution, and a “fix the map” link.
- The public routing service has no availability guarantee. Check its usage policy before expanding traffic: https://routing.openstreetmap.de/about.html. API reference: https://project-osrm.org/docs/v5.24.0/api/.

## Data and provenance

### Textiles

- `pomorskie_lokalizacje.json` contains 1,090 deduplicated descriptions from 1,217 source rows. `pomorskie_punkty.json` contains coordinate snapshots; the same data is embedded in `index.html`.
- Baseline coverage: 548 matched addresses, 308 approximate positions, and 234 unresolved descriptions. These are not verified counts of physical containers.
- Coordinates were matched once against OSM data by county on 2026-10-01; the oldest batch timestamp is `2026-10-01T17:37:51Z`. Preserve existing Gdańsk matches. `gdansk_punkty.json` is an archival subset; `pomorskie_pojemniki.csv` is an archival export.
- The source is the Trójmiasto.pl “pojemniki-pomorskie” PDF: rows 1–1217 on pages 1–18, with the continuation of row 709 on page 29. Rows 958–961 have no address and remain separate. Preserve original spellings and explicit correction notes; never replace ambiguity with a town center.
- Geographic data attribution: OpenStreetMap contributors, ODbL, https://www.openstreetmap.org/copyright.

### Electronics

- `elektroodpady_punkty.json` retains original `operator` and `city` records, merged `points`, and `metadata`.
- Baseline: 227 source records collected on 2026-10-02 (137 operator records and 90 city records), merged into 143 locations. Preserve source provenance and searchable address variants even though the UI hides source entries.
- Sources: https://elektrycznesmieci.pl/mapa-pojemnikow/ and https://czystemiasto.gdansk.pl/dla-mieszkancow/mapa-pojemnikow-na-elektroodpady/.
- Deduplicate using locality, normalized address, and distance. Matching addresses may merge within 50 m; different house numbers on the same street may merge within 5 m with both descriptions and a conflict note. No automatic merged group may span more than 50 m. Proximity alone across different streets is insufficient.
- Keep normalization of street prefixes, whitespace, punctuation, Polish diacritics, and recognized Kaczyńskiego / Lecha Kaczyńskiego and Jagielońska / Jagiellońska variants.
- Preserve the four reviewed decisions in `metadata.reviewed`: two cemeteries, Kartuska 459 / 459C, and Karpacka 2. Jeleniogórska / Flisykowskiego and Fabryczna / Kartuska remain separate despite identical or nearby coordinates.
- Retain an original source coordinate; do not average conflicting positions.
- Rebuild using `node scripts/build-electronics.cjs`, then verify with `node tests/electronics.cjs`.

### Nearby photographs

- `panoramax_punkty.json` and the embedded JSON contain precomputed photo associations and explicit missing matches. The baseline checks 999 mapped locations (988 distinct positions): 20 matches within 100 m, covering 14 textile and 6 electronics locations, using 18 distinct photographs.
- These are ordinary nearby photographs, not a 360° viewer or evidence that a container exists.
- Load only the selected image after “Zobacz okolicę” is clicked. Use a native image with in-page enlargement; no startup photo search, third-party viewer scripts, or scripted iframe.
- Display date, distance, author, and license. Keep a coordinate-based Google Street View fallback. Failed images offer retry. Closing details or switching fractions cleans up the preview. Saving HTML keeps associations without an open image.
- Refresh metadata with `python3 scripts/build-panoramax.py --cache /path/outside/repository`. The script must distinguish failed requests from genuinely missing coverage. Keep raw responses outside the repository.
- Source: https://api.panoramax.xyz/.

## Verification

Run checks appropriate to the changed behavior. Documentation-only edits need a diff and reference check, not a full browser suite. Do not treat a running test as a passing test.

Node-only checks:

- `node tests/electronics.cjs`: deduplication, provenance, and conflicts.
- `node tests/popup.cjs`: all point descriptions, links, and coordinate safeguards.
- `node tests/geolocation.cjs`: location API handling and errors.

Browser checks require Node.js, Playwright, and Chrome (`channel: 'chrome'`):

- `node tests/fractions.cjs`: fraction selection, search, saved HTML, and responsive layout.
- `node tests/startup-location.cjs`: startup location and fraction-switch behavior.
- `node tests/point-view.cjs`: closing details, restoring views, and switching selections.
- `node tests/nearby-list.cjs`: distance ordering, batches, stable scroll, unresolved points, and map-center fallback.
- `node tests/combined.cjs`: pair selection, marker clicks, search, mobile layout, and detail navigation.
- `node tests/panoramax.cjs`: local associations, lazy images, credits, enlargement, cleanup, and retries. Set `PANORAMAX_LIVE=1` only when checking a real image is relevant.

Car-routing checks:

- `node tests/road-routing.cjs`: barriers, directed distances, unreachable roads, snapping limits, candidate selection, caching, cancellation, and rate limiting.
- `node tests/driving.cjs`: browser interactions with deterministic mocked routing responses.
- `node tests/driving-live.cjs`: a few real requests using public container coordinates only, with Cedrowa 40 as the origin, never the user's position. Cedrowa 41 → Warszawska 55 measured 471.6 m straight-line versus 1,080.2 m driving on 2026-10-02. Do not hard-code that changing road distance into production logic.

Browser tests support `MAP_URL` for checking a deployed or locally served version. Mocked routing tests verify UI behavior; use the bounded public-coordinate live test when actual routing or CORS needs verification. After an authorized deployment, verify the GitHub Pages run and the relevant production behavior.
