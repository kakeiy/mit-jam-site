# Japanese Association of MIT Website

Static website draft for the Japanese Association of MIT.

## Structure

- `index.html` - MoMA-inspired JAM homepage.
- `events/` - Dedicated event pages and yearly archive index.
- `assets/photos/` - Hanami 2026 photos from the approved event album.
- `assets/logos/` - JAM logo variants from the local `Logos` folder.
- `assets/derived/` - Smaller web-ready copies used in hero and listing layouts.

## Local Preview

Open `index.html` directly in a browser, or serve the folder locally:

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
