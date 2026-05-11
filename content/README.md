# Content Editing Guide

Edit these files first, then run `npm run build`.

## Add A New Event Page

1. Put event assets in a stable folder, ideally:

   ```text
   assets/events/my-event-slug/
   ```

   Suggested names:

   - `hero.jpg` or `poster.png`
   - `flyer.pdf`
   - `gallery-01.jpg`, `gallery-02.jpg`

2. Add a new object to `events.json`.

   Minimal structure:

   ```json
   {
     "slug": "my-event-slug",
     "file": "my-event-slug.html",
     "title": "My Event",
     "pageTitle": "My Event | MIT JAM",
     "metaDescription": "Short Google description.",
     "ogDescription": "Short social preview description.",
     "ogImage": "assets/events/my-event-slug/hero.jpg",
     "ogImageAlt": "Alt text for the social thumbnail",
     "keywords": "search words people may type",
     "homeCard": {
       "enabled": true,
       "order": 50,
       "title": "My Event",
       "subtitle": "Date or status",
       "image": "assets/events/my-event-slug/hero.jpg",
       "alt": "Alt text"
     },
     "archiveRow": {
       "enabled": true,
       "order": 50,
       "date": "Month day, year",
       "status": "Lecture + reception",
       "summary": "One-sentence archive summary.",
       "image": "assets/events/my-event-slug/hero.jpg",
       "alt": "Alt text"
     },
     "page": {
       "hero": {
         "kicker": "Event type",
         "heading": "My Event.",
         "deck": "Short event framing.",
         "image": "assets/events/my-event-slug/hero.jpg",
         "alt": "Alt text"
       },
       "facts": [
         { "label": "Date", "value": "Month day, year" },
         { "label": "Venue", "value": "MIT room" }
       ],
       "overview": {
         "kicker": "Overview",
         "heading": "Main event message.",
         "note": "One paragraph overview.",
         "programs": [
           { "title": "Part one", "body": "Short description." },
           { "title": "Part two", "body": "Short description." }
         ]
       },
       "archive": {
         "kicker": "Archive",
         "heading": "My Event by year.",
         "items": [
           {
             "href": "my-event-slug.html",
             "label": "My Event",
             "year": "2026",
             "description": "Short archive line"
           }
         ]
       }
     }
   }
   ```

3. Run:

   ```sh
   npm run build
   ```

4. Preview with:

   ```sh
   npm run dev
   ```

## Optional Event Sections

The event template supports these optional keys inside `page`:

- `report` for a closed-event report section.
- `mealBand` for a green food/drink highlight band.
- `speakers` for a speaker grid.
- `supportNote` for event sponsor/support text.
- `gallery` for a photo gallery.

Hanami and Beneath the Great Wave are useful examples.

## Homepage Sections

- `site.json`: global copy, hero slides, mission, recognition, newsletter, support copy.
- `officers.json`: officer grid.
- `activities.json`: activity cards.
- `supporters.json`: sponsor/supporter list.
