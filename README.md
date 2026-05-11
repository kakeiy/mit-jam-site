# Japanese Association of MIT Website

Static website draft for the Japanese Association of MIT.

## Structure

- `content/` - Editable site data. Update these JSON files first.
- `scripts/build-site.mjs` - Generates the homepage, event pages, search data, and sitemap from `content/`.
- `index.html` - Generated JAM homepage.
- `events/` - Generated event pages and yearly archive index.
- `assets/hanami/` - Web-ready Hanami photos selected from the local source folder.
- `assets/logos/` - JAM logo variants from the local `Logos` folder.
- `assets/derived/` - Smaller web-ready copies used in hero and listing layouts.

The original selected source photos in `Photos-3-001/` are intentionally ignored so the site only tracks web-ready copies.

## Editing Content

Most updates should not require touching HTML or CSS.

- Add or edit event cards and event pages in `content/events.json`.
- Update Japanese homepage event labels in `content/events-ja.json`.
- Update officers in `content/officers.json`.
- Update Japanese officer role labels in `content/officers-ja.json`.
- Update homepage activity cards in `content/activities.json`.
- Update Japanese homepage activity cards in `content/activities-ja.json`.
- Update sponsor/supporter names in `content/supporters.json`.
- Update global copy, navigation actions, hero slides, mission text, and footer URLs in `content/site.json`.
- Update Japanese homepage copy in `content/site-ja.json`.

After editing JSON, run:

```sh
npm run build
```

This regenerates:

- `index.html`
- `index-ja.html`
- `events/index.html`
- `events/*.html`
- `search-data.js`
- `sitemap.xml`

Generated files include a short comment at the top. Treat that as a reminder to edit `content/*.json` first.

## Local Preview

Open `index.html` directly in a browser, or serve the folder locally:

```sh
npm run dev
```

Then visit `http://localhost:5173`.

You can also use Python directly:

```sh
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Deploy Target

When ready, archive the existing AFS site and copy these files into:

```text
/afs/athena.mit.edu/activity/j/jam/www
```
