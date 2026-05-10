# Japanese Association of MIT Website

Static website draft for the Japanese Association of MIT.

## Structure

- `index.html` - MoMA-inspired JAM homepage.
- `events/` - Dedicated event pages and yearly archive index.
- `assets/hanami/` - Web-ready Hanami photos selected from the local source folder.
- `assets/logos/` - JAM logo variants from the local `Logos` folder.
- `assets/derived/` - Smaller web-ready copies used in hero and listing layouts.

The original selected source photos in `Photos-3-001/` are intentionally ignored so the site only tracks web-ready copies.

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

This project has no build step.
