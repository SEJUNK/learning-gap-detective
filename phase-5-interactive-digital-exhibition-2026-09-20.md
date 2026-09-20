# Phase 5 — Interactive digital exhibition

## Goal
Turn the existing experience into seven connected scenes—Life, Fragments, Thread, Years, Chapters, Patterns, Explore—without changing the datasets, client-only architecture, privacy safeguards, routes, or high-volume rendering strategy.

## What will change

### 1. A connected homepage narrative
- Recompose the homepage into seven named scenes with deliberate dark, paper, indigo, accent, and light surfaces.
- Add a restrained visual “story spine” that changes form between scenes, so transitions feel continuous rather than like stacked page sections.
- Introduce the opening statement: **161,738 records. Only 5,531 became fragments worth following.** Show the progression from raw data to fragments, threads, and patterns with real counts.

### 2. Hero and source landscapes
- Strengthen the full-viewport hero hierarchy around `RECEIPTS / OF A LIFE`, the eleven-year statement, date span, and raw-record count.
- Refine the existing aggregate-driven field into three meaningful mark systems: listening waves, receipt ticks, and location rings converging on one timeline.
- Replace the current three-source text columns with three large, distinct visual zones using real monthly aggregates and source coverage dates.

### 3. Signature thread interaction
- Turn the discovered thread into a staged, responsive path: nodes reveal in sequence as the line draws; hover/focus emphasizes the active connection and dims unrelated nodes.
- Make “Follow the thread” open an immersive archive-reading panel rather than merely navigating away.
- Support recursive exploration inside that panel: current fragment → connected fragments → selected next thread, while retaining keyboard controls and a compact mobile presentation.

### 4. The shape of a life
- Redesign the month grid as a layered fingerprint using different mark forms for Listen, Spend, and Move; retain the existing source toggles.
- Add an anchored floating month readout with full per-source counts and chapter context.
- Make month selection persist within the homepage, visually focus that period, and connect it to the relevant chapter/navigation action.

### 5. Book-like chapters
- Preserve all six chapters and their real metrics, but sharpen their individual compositions and scene transitions.
- Expand “The Inside Years” into a distinct dusk-to-dawn listening field driven by the existing hourly distribution, with midnight as the visual center.
- Keep chapter pages and navigation intact while reducing conventional panels and repeated metadata.

### 6. Patterns as interactive exhibits
- Preserve the exhibition layout and improve each custom visualization with meaningful hover/focus details and accessible explanations.
- Use actual safe transaction values for the small-amount distribution, not decorative random sizes.
- Add explicit **Observed data** and **Interpretation** labels to the attention-shift exhibit.
- Make dense-day cells selectable and reveal their associated curated fragments.
- Add artist play share and place relative frequency interactions without tables or external maps.

### 7. Archive and Explore reading flow
- Keep the Archive’s virtualized desktop split view, sticky filters, privacy handling, and mobile bottom sheet; refine transitions and selected-artifact hierarchy.
- Rebuild Explore around date clusters: date, time span, fragment count, category count, then the chronological sequence.
- Keep search, chapter/category/night filters, progressive rendering, detail view, and thread traversal.
- Restyle category navigation as a restrained icon/name/count index rather than colorful buttons.

## Technical details
- Continue using React, TypeScript, Tailwind, existing UI primitives, aggregated summary data, and browser-loaded static datasets only.
- Add no backend, database, API route, server function, authentication, map service, or new data source.
- Keep large visualizations aggregate-based; never render the full Spotify dataset into the DOM or SVG.
- Reuse the current reveal hook and reduced-motion rules; add selection state only where it supports navigation and discovery.
- Expose a textual summary for every custom visualization and keep keyboard focus, ARIA state, and WCAG AA contrast.
- Preserve the distinction between **161,738 source records** and **5,531 curated fragments** everywhere.

## Validation
- Run the existing TypeScript checks.
- Verify homepage, thread exploration, timeline selection, chapters, patterns, Archive, and Explore at desktop and mobile sizes.
- Confirm no browser console errors, no layout overlap, usable keyboard focus, reduced-motion support, and unchanged client-only data loading.
