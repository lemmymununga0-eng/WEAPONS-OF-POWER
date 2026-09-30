# Build plan — Weapons of Power full site

Working from the full build spec. The "events manager update" (EventsManager.jsx,
EventSpotlight.jsx, lib/dates.js, CHANGES-events.md) does not exist in this repo or
its git history — per the spec's own instruction, that part is skipped. Plain event
add/edit is built as part of Phase 2 instead.

Phases are built and checked in on one at a time, not unattended end-to-end.

## Phases

1. **Routing, layout, `vercel.json`** — multi-page app shell. Home (`/`) stays a
   single-page overview with anchor-id sections (Hero, About Church, About Founder,
   Ministries, Events & Service Times, sermons-strip placeholder, branches-teaser
   placeholder, Give, Contact), matching the spec's "keep the homepage as the
   overview" instruction. New top-level routes added as stubs for now: `/events`
   (full list), `/sermons`, `/sermons/:id`, `/live`, `/locations`, `/locations/:slug`,
   plus `/admin/*` shell and a 404 page. Accessible nav (sticky desktop bar, mobile
   drawer: keyboard-operable, closes on route change/Esc, traps focus).
2. Missing edit endpoints: ministries `PUT`, sermons `PUT` (+ category/scripture/
   published fields), service times CRUD + reorder, messages read/unread + delete.
3. Branches + Clusters backend (models, Zambia phone/province logic, Africa/Lusaka
   timezone handling, API routes) + pytest coverage.
4. Branches public page (`/locations`, `/locations/:slug`) with Leaflet map, and
   admin Branches section with map picker.
5. Livestream: `LivestreamSettings` table, `/api/live-status`, `/live` page, admin
   Livestream section, nav "Live now" / "Next service" button.
6. Sermons: `/sermons` list + filters + persistent mini player, `/sermons/:id`.
7. Admin layout rebuild (sidebar/drawer, one route per section) + remaining
   sections (Overview, Church info + service times, Account/password warning).
8. Mobile pass (360/390/768/1024/1440, tap targets, low-data loading) +
   accessibility pass (focus rings, alt text, aria-live, reduced-motion, contrast).
9. Test suites: pytest, Vitest, Playwright (desktop + Pixel 7 + iPhone 13, axe,
   screenshots at 390/1280 into `docs/screenshots/`).

## Data model additions (Phase 3 detail)

- `Branch`: name, slug, country, province, town, cluster_id, address,
  directions_note, latitude, longitude, is_headquarters, service_times (text),
  branch_photo, pastor_name, pastor_title, pastor_photo, pastor_phone,
  pastor_whatsapp, pastor_email, show_pastor_contacts, active, sort_order,
  created_at, updated_at.
- `Cluster`: name, province, overseer_name, overseer_photo, overseer_phone,
  description.
- `LivestreamSettings` (single row): youtube_url, facebook_url, auto_live,
  manual_live, manual_title.
- `ChurchInfo` additions: Airtel/MTN/Zamtel mobile-money fields, bank fields.
- `ContactMessage` addition: `read` boolean.
- `Sermon` additions: category, scripture, published boolean.

All new columns on *existing* tables get scalar defaults (sync_schema can add
columns but not constraints). New constraints (unique slug, etc.) only on the
new tables.

## Files touched per phase (updated as work proceeds)

- Phase 1: `frontend/src/App.jsx`, `frontend/src/layout/PublicLayout.jsx`,
  `frontend/src/pages/*`, `frontend/src/components/Nav.jsx`, `frontend/src/pages/NotFound.jsx`,
  `frontend/vercel.json`, `frontend/src/styles/main.css`.
