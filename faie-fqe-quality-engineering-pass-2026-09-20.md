# FAIE/FQE quality-engineering pass

## Goal
Raise measurable accessibility, performance, responsive-design, and problem-alignment quality without redesigning the exhibition, changing its datasets, routes, story structure, or frontend-only architecture.

## Targeted changes

### 1. Accessibility hardening
- Preserve the existing single shared `header`, labelled primary `nav`, `main`, `footer`, skip link, visible focus styles, reduced-motion support, and dialog focus management.
- Add missing accessible labels and pressed states to Explore search, “After midnight,” “Everything,” and receipt-type filters.
- Mark decorative category glyphs/icons as hidden while keeping visible text labels as the accessible meaning.
- Audit remaining icon-only controls, chapter navigation, fragment selectors, timeline controls, and dialogs for names, keyboard operation, and 44px touch targets.

### 2. Client-side performance
- Keep all organizer data loading, normalization, search, filtering, relationships, and rendering in the browser.
- Extend the existing receipt indexes with type and chapter/year lookup structures, plus a reusable lowercase search text index.
- Refine `searchReceipts()` to start from the smallest applicable indexed candidate set before applying the remaining filters, while preserving result order and exact behavior.
- Preserve the indexed `findConnections()` implementation, Explore’s 40-item “Show more” batches, and Archive’s typed-array/lazy/virtualized rendering.
- Keep large derived collections outside React render paths and memoize only expensive calculations tied to changing inputs.

### 3. Responsive hardening
- Test all requested widths: 320, 375, 390, 414, 768, 1024, 1280, and 1440px.
- Fix only observed overflow, clipping, wrapping, narrow-card, filter-stack, long-title, metadata, navigation, sticky-panel, or timeline issues.
- Keep horizontal scrolling contained inside the timeline visualization so it never becomes page-level overflow.
- Preserve the existing editorial typography, surfaces, spacing rhythm, and interaction design.

### 4. Problem alignment
- Refine the existing compact transformation sequence rather than adding a new visual section:
  `161,738 source records → 5,531 curated fragments → cross-source connections → chapters + patterns`.
- Add concise, factual definitions for source records, curated fragments, inferred fragments, discovered connections, and derived patterns within that existing narrative area.
- State that the three organizer datasets are normalized in-browser into moments, chapters, threads, and patterns, using only current verified totals and claims.

### 5. Verification
- Check Home, Explore, Archive, Patterns, and chapter pages; search; every filter; “Show more”; fragment selection; thread connections; chapter navigation; primary navigation; keyboard focus and Escape behavior.
- Run TypeScript validation and browser checks with normal and reduced motion at every requested width.
- Confirm one `main`, no body-level horizontal overflow, no obvious console/runtime errors, unchanged dataset totals, and no backend/database/API/auth/external-service additions.
