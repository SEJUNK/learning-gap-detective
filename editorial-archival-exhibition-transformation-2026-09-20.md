# Editorial Archival Exhibition Transformation

## Direction
Use the selected **Editorial archival exhibition** direction: a tactile museum-folio composition with deep charcoal rooms, warm paper spreads, strong serif display type, restrained ink/accent marks, asymmetry, thin rules, and evidence-like details. Preserve every real dataset, route, filter, thread relationship, privacy safeguard, and virtualized archive behavior.

## Build

### 1. Unify the exhibition system
- Refine the semantic palette in `src/styles.css` around charcoal, warm paper, ink, and one primary interactive accent; retain secondary source colors only where they encode Listen, Spend, and Move.
- Add reusable grain, ruled-paper, editorial fade, exhibition button, focus, reveal, count-up, and artifact treatments without hardcoded component colors.
- Keep Fraunces for major narrative statements and Inter/JetBrains Mono for reading, controls, and evidence metadata.
- Standardize fast motion and make the reveal/count/thread effects resolve immediately when reduced motion is requested.

### 2. Recompose the opening story
- Make `161,738` the dominant hero figure beneath “RECEIPTS OF A LIFE,” with “dated records” and `2013 → 2024` clearly attached.
- Add a lightweight pointer-responsive field based only on existing monthly aggregates; no continuous expensive animation.
- Use the exact actions “ENTER THE STORY” and “EXPLORE FRAGMENTS,” plus a quiet “Begin ↓” cue to the next scene.
- Reframe the raw-to-curated transition as a clear visual sequence: `161,738 RAW SOURCE RECORDS → 5,531 CURATED / DISCOVERABLE FRAGMENTS → DISCOVERED THREADS → PATTERNS / INSIGHTS`.
- Turn Listen, Spend, and Move into full-width, visually distinct archival worlds using waveform, receipt marks, and route nodes with the existing values.

### 3. Strengthen the signature visual story
- Refine the discovered thread into a more luminous connected path with explicit type/date/time/title/supporting metadata, path brightening, unrelated-node dimming, and a compact hover/focus evidence preview.
- Preserve the existing `findConnections` logic and click-through reader; add robust dialog focus entry/return and Escape behavior.
- Recompose the years view into a wider fingerprint emphasizing yearly density and chapter navigation while preserving source layer toggles and real monthly detail.
- Keep year/chapter clicks intact and make keyboard focus communicate the same information as hover.

### 4. Turn chapters into book spreads
- Give all six chapter scenes distinct alternating compositions and lightweight motifs rather than one repeated template.
- Preserve chapter counts, years, headlines, narration, and links.
- Replace The Inside Years bar treatment with an accessible 24-hour clock/radial visualization using the real hourly histogram and accurate 30% after-midnight insight.
- Refine chapter detail pages into an evidence spread: remove duplicated-feeling fragment presentation, improve selected-fragment continuity, and preserve thread/chapter navigation.

### 5. Curate patterns as exhibits
- Make the homepage pattern room four dominant exhibits: 37%, 996, +96%, and 40, each with its own composition and real-data visual.
- Preserve the remaining working exhibits on the full Patterns page, correct the exhibit count/copy mismatch, and label observation versus interpretation consistently.
- Add lightweight links from pattern evidence back to relevant filtered records where existing filters support it; do not invent evidence or relationships.
- Simplify chart accessibility to one useful text alternative per visualization.

### 6. Recompose Explore and Archive
- Turn Explore into an archival evidence desk: one opened fragment with TYPE, DATE, TIME, TITLE, SOURCE, DETAILS; surrounding date clusters and related fragments remain connected through existing thread logic.
- Preserve search, category/chapter/night filters, pagination, and `5,531` curated-fragment framing; debounce search and keep mobile as a deliberate evidence sheet.
- Strengthen Archive’s `161,738 records` title wall and three-source editorial split while preserving search, source/night/year filters, privacy copy, lazy loading, fixed-row virtualization, and detail behavior.
- Improve focus movement/return for sheets and readers, expose privacy/source context on small screens, and avoid nested-card styling.

### 7. Copy, accessibility, and verification
- Rewrite awkward visible copy into natural editorial English without changing facts or claims; consistently distinguish raw records, curated fragments, threads, and patterns.
- Ensure every content route keeps unique title, description, Open Graph title/description, type, and Twitter card metadata.
- Verify semantic headings, landmarks, keyboard controls, focus visibility, contrast, text alternatives, touch targets, and reduced-motion behavior.
- Test 320, 375, 390, 414, 768, 1024, 1280, 1440, and 1920 widths for overflow, hierarchy, sticky controls, sheets, and typography.
- Run TypeScript validation plus desktop/mobile interaction checks with console monitoring; confirm no backend, API, server logic, or dataset changes were introduced.

## Technical constraints
- Frontend presentation code only; no backend or architecture rewrite.
- No new large dependency or animation library.
- Aggregate SVG/CSS visuals only; never render all 161,738 records.
- Preserve virtualization, memoization, lazy data materialization, privacy-safe public fields, and existing route behavior.
- Organizer datasets and derived factual values remain the sole source of truth.
