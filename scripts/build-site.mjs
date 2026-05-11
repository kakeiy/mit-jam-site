import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const contentDir = join(rootDir, "content");
const today = new Date().toISOString().slice(0, 10);

const readJson = async (name) =>
  JSON.parse(await readFile(join(contentDir, name), "utf8"));

const readOptionalJson = async (name, fallback) => {
  try {
    return await readJson(name);
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const stripHtml = (value = "") => String(value).replace(/<[^>]*>/g, "");

const rich = (value) => {
  if (value && typeof value === "object" && "html" in value) return value.html;
  if (value && typeof value === "object" && "text" in value) return escapeHtml(value.text);
  return escapeHtml(value ?? "");
};

const rootPath = (prefix, value = "") => {
  if (!value) return "";
  if (/^(https?:|mailto:|#)/.test(value)) return value;
  if (value.startsWith("../") || value.startsWith("/")) return value;
  return `${prefix}${value}`;
};

const absoluteUrl = (site, value = "") => {
  if (/^https?:/.test(value)) return value;
  return `${site.baseUrl}${value}`;
};

const paragraphList = (paragraphs = []) =>
  paragraphs.map((paragraph) => `<p>${rich(paragraph)}</p>`).join("\n");

const mergeBySlug = (items, overrides) => {
  const overrideMap = new Map(overrides.map((item) => [item.slug, item]));
  return items.map((item) => ({
    ...item,
    ...(overrideMap.get(item.slug) || {}),
    homeCard: {
      ...(item.homeCard || {}),
      ...(overrideMap.get(item.slug)?.homeCard || {})
    }
  }));
};

const mergeByName = (items, overrides) => {
  const overrideMap = new Map(overrides.map((item) => [item.name, item]));
  return items.map((item) => ({
    ...item,
    ...(overrideMap.get(item.name) || {})
  }));
};

const actionLinks = (actions = [], prefix = "") => {
  if (!actions.length) return "";
  return `<p class="inline-actions">
${actions
  .map(
    (action) =>
      `<a class="${escapeHtml(action.className || "text-button")}" href="${escapeHtml(
        rootPath(prefix, action.href)
      )}">${escapeHtml(action.label)}</a>`
  )
  .join("\n")}
          </p>`;
};

const metaTags = ({ site, page, canonicalPath, ogType = "website" }) => {
  const title = page.pageTitle || page.title;
  const description = page.metaDescription || page.description;
  const ogDescription = page.ogDescription || description;
  const ogImage = page.ogImage || page.image;
  const sitemapTag =
    canonicalPath === ""
      ? `\n    <link rel="sitemap" type="application/xml" href="${escapeHtml(absoluteUrl(site, "sitemap.xml"))}">`
      : "";

  return `<meta name="description" content="${escapeHtml(description)}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="${escapeHtml(absoluteUrl(site, canonicalPath))}">${sitemapTag}
    <meta property="og:type" content="${escapeHtml(ogType)}">
    <meta property="og:site_name" content="${escapeHtml(site.siteName)}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(ogDescription)}">
    <meta property="og:url" content="${escapeHtml(absoluteUrl(site, canonicalPath))}">
    <meta property="og:image" content="${escapeHtml(absoluteUrl(site, ogImage))}">
    <meta property="og:image:alt" content="${escapeHtml(page.ogImageAlt || title)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
    <meta name="twitter:image" content="${escapeHtml(absoluteUrl(site, ogImage))}">
    <title>${escapeHtml(title)}</title>`;
};

const jsonLd = (site) => `<script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "${escapeHtml(site.organizationName)}",
        "alternateName": ["JAM", "MIT JAM"],
        "url": "${escapeHtml(site.baseUrl)}",
        "email": "${escapeHtml(site.contactEmail)}",
        "description": "${escapeHtml(site.home.ogDescription)}",
        "parentOrganization": {
          "@type": "CollegeOrUniversity",
          "name": "Massachusetts Institute of Technology",
          "url": "https://www.mit.edu/"
        },
        "sameAs": [
          "https://github.com/kakeiy/mit-jam-site"
        ]
      }
    </script>`;

const renderHeader = (site, prefix = "", { activeEvents = false, languageSwitch = null } = {}) => {
  const homeHref = prefix ? `${prefix}index.html#top` : "#top";
  const navHome = (hash) => (prefix ? `${prefix}index.html${hash}` : hash);
  const aria = {
    home: "Japanese Association of MIT home",
    quickActions: "Quick actions",
    primaryNavigation: "Primary navigation",
    ...(site.ariaLabels || {})
  };
  const nav = {
    about: "About",
    events: "Exhibitions and events",
    officers: "Officers",
    activities: "Activities",
    support: "Support",
    archive: "Archive",
    searchLabel: "Search JAM site",
    ...(site.nav || {})
  };
  const actions = {
    contact: "Contact",
    join: "Join us",
    updates: "Get updates",
    ...(site.actions || {})
  };
  return `<header class="jam-header">
      <div class="jam-header-top">
        <a class="jam-logo" href="${homeHref}" aria-label="${escapeHtml(aria.home)}">
          <img src="${rootPath(prefix, "assets/logos/jam-logo-main-trim.png")}" alt="JAM">
        </a>
        <div class="jam-actions" aria-label="${escapeHtml(aria.quickActions)}">
          <a href="mailto:${escapeHtml(site.contactEmail)}">${escapeHtml(actions.contact)}</a>
          <a class="action-muted" href="${escapeHtml(site.officerInterestUrl)}">${escapeHtml(actions.join)}</a>
          <a class="action-blue" href="${escapeHtml(site.updatesUrl)}">${escapeHtml(actions.updates)}</a>${languageSwitch ? `
          <div class="language-switch" aria-label="${escapeHtml(languageSwitch.label || "Language")}">
            ${languageSwitch.current === "en" ? `<span aria-current="true">EN</span>` : `<a href="${escapeHtml(rootPath(prefix, languageSwitch.enHref || "index.html"))}">EN</a>`}
            ${languageSwitch.current === "ja" ? `<span aria-current="true">JP</span>` : `<a href="${escapeHtml(rootPath(prefix, languageSwitch.jaHref || "index-ja.html"))}">JP</a>`}
          </div>` : ""}
        </div>
      </div>
      <nav class="jam-nav" aria-label="${escapeHtml(aria.primaryNavigation)}">
        <a href="${navHome("#about")}">${escapeHtml(nav.about)}</a>
        <a href="${navHome("#events")}"${activeEvents ? ' aria-current="true"' : ""}>${escapeHtml(nav.events)}</a>
        <a href="${navHome("#people")}">${escapeHtml(nav.officers)}</a>
        <a href="${navHome("#activities")}">${escapeHtml(nav.activities)}</a>
        <a href="${navHome("#support")}">${escapeHtml(nav.support)}</a>
        <a href="${prefix ? "index.html" : "events/"}">${escapeHtml(nav.archive)}</a>
        <button class="nav-search" type="button" aria-label="${escapeHtml(nav.searchLabel)}" data-search-open>⌕</button>
      </nav>
    </header>`;
};

const renderFooter = (site, prefix = "", { includeAllEvents = false, homeFooter = false } = {}) => {
  const footerClass = homeFooter ? "jam-footer" : "site-footer";
  const labels = {
    allEvents: "All events",
    privacy: "Privacy Policy",
    constitution: "Constitution",
    contact: "Contact",
    footerNavigation: "Footer navigation",
    footerBrandAlt: "Japanese Association of MIT",
    mitLabel: "Massachusetts Institute of Technology",
    affiliationHtml:
      `JAM is an <a href="${escapeHtml(site.footer.asaUrl)}">Association of Student Activities (ASA)-recognized organization</a> with its student governance home in the <a href="${escapeHtml(site.footer.gscUrl)}">Graduate Student Council (GSC)</a> of MIT.`,
    ...(site.footerLabels || {})
  };
  const links = [
    ...(includeAllEvents ? [{ label: labels.allEvents, href: "index.html" }] : []),
    { label: labels.privacy, href: rootPath(prefix, site.footer.privacyHref) },
    { label: labels.constitution, href: rootPath(prefix, site.footer.constitutionHref) },
    { label: labels.contact, href: `mailto:${site.contactEmail}` }
  ];

  return `<footer class="${footerClass}">
      <div class="footer-brand">
        <img src="${rootPath(prefix, "assets/logos/jam-logo-main-trim.png")}" alt="${escapeHtml(labels.footerBrandAlt)}">
      </div>
      <nav class="footer-links" aria-label="${escapeHtml(labels.footerNavigation)}">
${links.map((link) => `        <a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join("\n")}
      </nav>
      <div class="mit-affiliation">
        <a class="mit-lockup" href="${escapeHtml(site.footer.mitUrl)}" aria-label="${escapeHtml(labels.mitLabel)}">
          <img src="${rootPath(prefix, "assets/logos/mit_logo_black.png")}" alt="MIT">
          <span>${escapeHtml(labels.mitLabel)}</span>
        </a>
        <p>${labels.affiliationHtml}</p>
      </div>
    </footer>`;
};

const pageShell = ({ site, prefix = "", page, canonicalPath, ogType, body, extraHead = "", lang = "en" }) => `<!doctype html>
<!-- Generated by npm run build. Edit content/*.json instead of this file. -->
<html lang="${escapeHtml(lang)}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${metaTags({ site, page, canonicalPath, ogType })}
${extraHead ? `    ${extraHead}\n` : ""}    <link rel="stylesheet" href="${rootPath(prefix, "styles.css")}">
  </head>
  <body>
${body}
    <script src="${rootPath(prefix, "search-data.js")}"></script>
    <script src="${rootPath(prefix, "script.js")}"></script>
  </body>
</html>
`;

const renderProgramGrid = (items = []) => {
  if (!items.length) return "";
  return `<div class="program-grid">
${items
  .map(
    (item) => `          <article>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${rich(item.body)}</p>
          </article>`
  )
  .join("\n")}
        </div>`;
};

const renderArchiveGrid = (items = [], prefix = "") => `<div class="archive-grid">
${items
  .map(
    (item) => `          <a href="${escapeHtml(rootPath(prefix, item.href))}">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.year)}</strong>
            <em>${escapeHtml(item.description)}</em>
          </a>`
  )
  .join("\n")}
        </div>`;

const renderHome = ({ site, events, officers, activities, supporters, lang = "en", canonicalPath = "", languageSwitch = null }) => {
  const homeCards = events
    .filter((event) => event.homeCard?.enabled)
    .sort((a, b) => (a.homeCard.order ?? 0) - (b.homeCard.order ?? 0));

  const sectionLabels = {
    exhibitions: "Exhibitions",
    previousExhibition: "Previous exhibition",
    nextExhibition: "Next exhibition",
    exhibitionControls: "Exhibition carousel controls",
    heroHighlights: "JAM visual highlights",
    supportersLabel: "Current and recent supporters",
    ...(site.sectionLabels || {})
  };

  const body = `    ${renderHeader(site, "", { languageSwitch })}

    <main id="top">
      <section class="jam-hero jam-hero-art" aria-label="${escapeHtml(sectionLabels.heroHighlights)}" data-hero-slideshow>
${site.heroSlides
  .map(
    (slide) => `        <figure class="hero-slide ${escapeHtml(slide.className || "")}${slide.active ? " is-active" : ""}" data-hero-slide>
          <img src="${escapeHtml(slide.image)}" alt="${escapeHtml(slide.alt)}">
        </figure>`
  )
  .join("\n")}
      </section>

      <section class="welcome-panel" id="about" aria-labelledby="welcome-title">
        <div>
          <h1 id="welcome-title">${escapeHtml(site.welcome.heading)}</h1>
          <p class="welcome-lead">${escapeHtml(site.welcome.lead)}</p>
        </div>
        <div class="welcome-side">
          <p>${escapeHtml(site.welcome.body)}</p>
          <a class="black-button" href="${escapeHtml(site.welcome.buttonHref)}">${escapeHtml(site.welcome.buttonLabel)}</a>
        </div>
      </section>

      <section class="jam-section exhibitions-section" id="events" aria-labelledby="events-title">
        <div class="section-title-row">
          <h2 id="events-title">${escapeHtml(sectionLabels.exhibitions)}</h2>
          <div class="section-arrows" aria-label="${escapeHtml(sectionLabels.exhibitionControls)}">
            <button type="button" data-rail-prev aria-label="${escapeHtml(sectionLabels.previousExhibition)}">←</button>
            <button type="button" data-rail-next aria-label="${escapeHtml(sectionLabels.nextExhibition)}">→</button>
          </div>
        </div>
        <div class="exhibition-rail">
${homeCards
  .map((event) => {
    const card = event.homeCard;
    const href = card.href || `events/${event.file}`;
    return `          <article class="exhibition-card">
            <a href="${escapeHtml(href)}">
              <img src="${escapeHtml(card.image)}" alt="${escapeHtml(card.alt)}" loading="lazy">
              <h3>${escapeHtml(card.title)}</h3>
              <p>${escapeHtml(card.subtitle)}</p>
            </a>
          </article>`;
  })
  .join("\n")}
        </div>
      </section>

      <section class="green-band history-band" aria-labelledby="history-title">
        <h2 id="history-title">${escapeHtml(site.historyBand.heading)}</h2>
        <div>
          ${paragraphList(site.historyBand.paragraphs)}
          <a href="${escapeHtml(site.historyBand.linkHref)}">${escapeHtml(site.historyBand.linkLabel)}</a>
        </div>
      </section>

      <section class="jam-section mission-section" id="mission" aria-labelledby="mission-title">
        <div class="section-header-split">
          <div>
            <p class="kicker">${escapeHtml(site.mission.kicker)}</p>
            <h2 id="mission-title">${escapeHtml(site.mission.heading)}</h2>
          </div>
          <p class="section-note">${escapeHtml(site.mission.note)}</p>
        </div>
        ${renderProgramGrid(site.mission.items)}
      </section>

      <section class="jam-section collection-section" id="people" aria-labelledby="people-title">
        <div class="collection-intro">
          <h2 id="people-title">${escapeHtml(site.officersIntro.heading)}</h2>
          <p>${escapeHtml(site.officersIntro.body)}</p>
          <a href="${escapeHtml(site.officersIntro.linkHref)}">${escapeHtml(site.officersIntro.linkLabel)}</a>
        </div>
        <div class="member-grid">
${officers
  .map(
    (officer) => `          <article class="member-card${officer.featured ? " member-feature" : ""}">
            <img src="${escapeHtml(officer.image)}" alt="${escapeHtml(officer.name)}" loading="lazy">
            <h3>${escapeHtml(officer.name)}</h3>${officer.role ? `\n            <p>${escapeHtml(officer.role)}</p>` : ""}
          </article>`
  )
  .join("\n")}
        </div>
      </section>

      <section class="green-band ecosystem-band" id="recognition" aria-labelledby="ecosystem-title">
        <h2 id="ecosystem-title">${escapeHtml(site.recognitionBand.heading)}</h2>
        <div>
          ${paragraphList(site.recognitionBand.paragraphs)}
          <a href="${escapeHtml(site.recognitionBand.linkHref)}">${escapeHtml(site.recognitionBand.linkLabel)}</a>
        </div>
      </section>

      <section class="jam-section events-for-everyone" id="activities" aria-labelledby="activities-title">
        <div class="collection-intro">
          <h2 id="activities-title">${escapeHtml(site.activitiesIntro.heading)}</h2>
          <p>${escapeHtml(site.activitiesIntro.body)}</p>
        </div>
        <div class="activity-feature-grid">
${activities
  .map(
    (activity) => `          <article>
            <img src="${escapeHtml(activity.image)}" alt="${escapeHtml(activity.alt)}" loading="lazy">
            <h3>${escapeHtml(activity.title)}</h3>
            <p>${escapeHtml(activity.body)}</p>
          </article>`
  )
  .join("\n")}
        </div>
      </section>

      <section class="newsletter-strip" id="join" aria-labelledby="join-title">
        <div class="newsletter-copy">
          <h2 id="join-title">${escapeHtml(site.newsletter.heading)}</h2>
          <p>${escapeHtml(site.newsletter.body)}</p>
        </div>
        <div>
          <a class="black-button" href="${escapeHtml(site.newsletter.primaryHref)}">${escapeHtml(site.newsletter.primaryLabel)}</a>
          <a class="text-button" href="${escapeHtml(site.newsletter.secondaryHref)}">${escapeHtml(site.newsletter.secondaryLabel)}</a>
        </div>
      </section>

      <section class="support-strip" id="support" aria-labelledby="support-title">
        <div>
          <p class="kicker">${escapeHtml(site.support.kicker)}</p>
          <h2 id="support-title">${escapeHtml(site.support.heading)}</h2>
        </div>
        <div>
          ${paragraphList(site.support.paragraphs)}
          <ul class="support-list" aria-label="${escapeHtml(sectionLabels.supportersLabel)}">
${supporters.map((supporter) => `            <li>${escapeHtml(supporter)}</li>`).join("\n")}
          </ul>
          <a class="black-button" href="${escapeHtml(site.support.buttonHref)}">${escapeHtml(site.support.buttonLabel)}</a>
        </div>
      </section>
    </main>

${renderFooter(site, "", { homeFooter: true })}`;

  return pageShell({
    site,
    page: site.home,
    canonicalPath,
    body,
    extraHead: `<link rel="preload" href="assets/logos/jam-logo-main-trim.png" as="image">
    <link rel="alternate" hreflang="en" href="${escapeHtml(site.baseUrl)}">
    <link rel="alternate" hreflang="ja" href="${escapeHtml(`${site.baseUrl}index-ja.html`)}">
    <link rel="preload" href="assets/hanami/hanami-hall.jpg" as="image">
    ${jsonLd(site)}`,
    lang
  });
};

const renderEventsIndex = ({ site, events }) => {
  const rows = events
    .filter((event) => event.archiveRow?.enabled && event.file)
    .sort((a, b) => (a.archiveRow.order ?? 0) - (b.archiveRow.order ?? 0));
  const archiveItems = rows.flatMap((event) => event.page?.archive?.items || []);
  const page = {
    pageTitle: "Events | MIT JAM",
    metaDescription: "Events and annual archives from MIT JAM, the Japanese Association of MIT.",
    ogDescription: "Events and annual archives from MIT JAM, the Japanese Association of MIT.",
    ogImage: "assets/hanami/hanami-hall.jpg",
    ogImageAlt: "JAM events and community gatherings at MIT"
  };

  const body = `    ${renderHeader(site, "../", { activeEvents: true })}

    <main>
      <section class="page-hero page-hero-events">
        <div class="page-hero-copy">
          <p class="kicker">Events archive</p>
          <h1>What JAM gathers around.</h1>
          <p class="hero-deck">Seasonal festivals, lectures, student welcomes, and recurring programs. Each page is built to keep the current event clear while preserving the yearly record.</p>
        </div>
        <figure class="page-hero-media">
          <img src="../assets/great-wave.jpg" alt="Katsushika Hokusai, The Great Wave off Kanagawa">
        </figure>
      </section>

      <section class="section section-events" aria-labelledby="current-title">
        <div class="section-header">
          <p class="kicker">Current pages</p>
          <h2 id="current-title">Event pages.</h2>
        </div>
        <div class="event-board">
${rows
  .map((event) => {
    const row = event.archiveRow;
    return `          <article class="event-row">
            <div class="event-date">
              <span>${escapeHtml(row.date)}</span>
              <strong>${escapeHtml(row.status)}</strong>
            </div>
            <div class="event-copy">
              <h3><a class="event-title-link" href="${escapeHtml(event.file)}">${escapeHtml(event.title)}</a></h3>
              <p>${escapeHtml(row.summary)}</p>
            </div>
            <figure class="event-media">
              <img src="${rootPath("../", row.image)}" alt="${escapeHtml(row.alt)}" loading="lazy">
            </figure>
          </article>`;
  })
  .join("\n")}
        </div>
      </section>

      <section class="section archive-section" aria-labelledby="archive-title">
        <div class="section-header">
          <p class="kicker">Annual archive</p>
          <h2 id="archive-title">A record we can keep extending.</h2>
        </div>
        ${renderArchiveGrid(archiveItems)}
      </section>
    </main>

${renderFooter(site, "../")}`;

  return pageShell({
    site,
    prefix: "../",
    page,
    canonicalPath: "events/",
    body
  });
};

const renderEventPage = ({ site, event }) => {
  const page = event.page;
  const heroClass = ["event-hero", page.hero.className].filter(Boolean).join(" ");
  const archive = page.archive;
  const heroActions = actionLinks(page.hero.actions || [], "../").replace('class="inline-actions"', 'class="hero-actions"');
  const overviewActions = actionLinks(page.overview.actions || [], "../");
  const body = `    ${renderHeader(site, "../", { activeEvents: true })}

    <main>
      <section class="${escapeHtml(heroClass)}">
        <div class="event-hero-copy">
          <p class="kicker">${escapeHtml(page.hero.kicker)}</p>
          <h1>${escapeHtml(page.hero.heading)}</h1>
          <p class="hero-deck">${escapeHtml(page.hero.deck)}</p>
${heroActions ? `          ${heroActions}` : ""}
        </div>
        <figure class="event-hero-media">
          <img src="${rootPath("../", page.hero.image)}" alt="${escapeHtml(page.hero.alt)}">
        </figure>
      </section>

      <section class="event-facts" aria-label="${escapeHtml(page.factsLabel || `${event.title} facts`)}">
${(page.facts || [])
  .map(
    (fact) => `        <div><span>${escapeHtml(fact.label)}</span><strong>${escapeHtml(fact.value)}</strong></div>`
  )
  .join("\n")}
      </section>

${page.report ? `      <section class="section event-story event-report" aria-labelledby="${escapeHtml(event.slug)}-report">
        <div class="section-header section-header-split">
          <div>
            <p class="kicker">${escapeHtml(page.report.kicker)}</p>
            <h2 id="${escapeHtml(event.slug)}-report">${escapeHtml(page.report.heading)}</h2>
          </div>
          <p class="section-note">${escapeHtml(page.report.note)}</p>
        </div>
      </section>

` : ""}      <section class="section event-story" aria-labelledby="${escapeHtml(event.slug)}-overview">
        <div class="section-header section-header-split">
          <div>
            <p class="kicker">${escapeHtml(page.overview.kicker)}</p>
            <h2 id="${escapeHtml(event.slug)}-overview">${escapeHtml(page.overview.heading)}</h2>
          </div>
          <p class="section-note">${escapeHtml(page.overview.note)}</p>
${overviewActions ? `          ${overviewActions}` : ""}
        </div>
        ${renderProgramGrid(page.overview.programs)}
      </section>

${page.mealBand ? `      <section class="green-band meal-band" aria-labelledby="${escapeHtml(event.slug)}-meal-title">
        <div class="meal-band-copy">
          <p class="kicker">${escapeHtml(page.mealBand.kicker)}</p>
          <h2 id="${escapeHtml(event.slug)}-meal-title">${escapeHtml(page.mealBand.heading)}</h2>
          ${paragraphList(page.mealBand.paragraphs)}
        </div>
        <figure class="meal-band-image">
          <img src="${rootPath("../", page.mealBand.image)}" alt="${escapeHtml(page.mealBand.alt)}" loading="lazy">
        </figure>
      </section>

` : ""}${page.gallery?.length ? `      <section class="hanami-gallery" aria-label="${escapeHtml(page.galleryLabel || `${event.title} photo gallery`)}">
${page.gallery
  .map(
    (item) => `        <figure class="gallery-cell${item.className ? ` ${escapeHtml(item.className)}` : ""}">
          <img src="${rootPath("../", item.image)}" alt="${escapeHtml(item.alt)}" loading="lazy">
        </figure>`
  )
  .join("\n")}
      </section>

` : ""}${page.speakers ? `      <section class="section speakers-section" aria-labelledby="${escapeHtml(event.slug)}-speakers-title">
        <div class="section-header">
          <p class="kicker">${escapeHtml(page.speakers.kicker)}</p>
          <h2 id="${escapeHtml(event.slug)}-speakers-title">${escapeHtml(page.speakers.heading)}</h2>
        </div>
        <div class="speaker-grid">
${page.speakers.items
  .map(
    (speaker) => `          <article${speaker.className ? ` class="${escapeHtml(speaker.className)}"` : ""}>
            ${speaker.image ? `<img class="speaker-portrait" src="${rootPath("../", speaker.image)}" alt="${escapeHtml(speaker.imageAlt || speaker.name)}" loading="lazy">\n            ` : ""}<span>${escapeHtml(speaker.label)}</span>
            <h3>${escapeHtml(speaker.name)}</h3>${speaker.japaneseName ? `\n            <p class="speaker-name-jp">${escapeHtml(speaker.japaneseName)}</p>` : ""}
            <p>${escapeHtml(speaker.body)}</p>${speaker.bio ? `\n            <p class="speaker-bio">${escapeHtml(speaker.bio)}</p>` : ""}
          </article>`
  )
  .join("\n")}
        </div>
      </section>

` : ""}${page.supportNote ? `      <section class="section support-note" aria-labelledby="${escapeHtml(event.slug)}-support-title">
        <div class="section-header-split">
          <div>
            <p class="kicker">${escapeHtml(page.supportNote.kicker)}</p>
            <h2 id="${escapeHtml(event.slug)}-support-title">${escapeHtml(page.supportNote.heading)}</h2>
          </div>
          <p class="section-note">${escapeHtml(page.supportNote.note)}</p>
        </div>
      </section>

` : ""}      <section class="section archive-section" aria-labelledby="${escapeHtml(event.slug)}-archive">
        <div class="section-header">
          <p class="kicker">${escapeHtml(archive.kicker)}</p>
          <h2 id="${escapeHtml(event.slug)}-archive">${escapeHtml(archive.heading)}</h2>
        </div>
        ${renderArchiveGrid(archive.items)}
      </section>
    </main>

${renderFooter(site, "../", { includeAllEvents: true })}`;

  return pageShell({
    site,
    prefix: "../",
    page: event,
    canonicalPath: `events/${event.file}`,
    ogType: "article",
    body
  });
};

const renderSearchData = ({ site, events, eventsJa = [] }) => {
  const eventItems = events
    .filter((event) => event.file)
    .map((event) => ({
      title: event.title,
      url: `events/${event.file}`,
      description: event.metaDescription,
      keywords: event.keywords || ""
    }));

  const index = [
    {
      title: "About JAM",
      url: "index.html#about",
      description: "Japanese Association of MIT, a long-running Japanese association connecting Japan and MIT.",
      keywords: "about history 1900s japanese association mit jam culture community exchange asa gsc recognized"
    },
    {
      title: "Exhibitions and Events",
      url: "index.html#events",
      description: "Current JAM event pages, including Hanami Festival, Beneath the Great Wave, orientation, and activities.",
      keywords: "events exhibitions hanami great wave orientation basketball archive"
    },
    ...eventItems,
    {
      title: "MIT Recognition",
      url: "index.html#recognition",
      description: "JAM is an ASA-recognized organization with its student governance home in the Graduate Student Council.",
      keywords: "mit asa association student activities recognized organization gsc graduate student council"
    },
    {
      title: "JAM Officers",
      url: "index.html#people",
      description: "Current JAM officers and officer eligibility for MIT graduate students, postdocs, researchers, and related families.",
      keywords: "officers members president team join us graduate postdoc researcher"
    },
    {
      title: "Activities",
      url: "index.html#activities",
      description: "JAM programs, basketball club, cultural programming, campus tours, and community activities.",
      keywords: "activities basketball club campus tours cultural programming"
    },
    {
      title: "Support and Sponsorship",
      url: "index.html#support",
      description: "Partner with JAM through event sponsorship and community programming support.",
      keywords: "support sponsor sponsorship sgfc taktopia gpi consulate company organization"
    },
    {
      title: "JAM Constitution",
      url: site.footer.constitutionHref,
      description: "The JAM Constitution document.",
      keywords: "constitution bylaws rules mission"
    },
    {
      title: "Privacy Policy",
      url: "privacy.html",
      description: "Privacy notes for the static JAM website and external forms.",
      keywords: "privacy policy data google forms email"
    }
  ];

  const eventItemsJa = eventsJa
    .filter((event) => event.file)
    .map((event) => ({
      title: event.title,
      url: `events/${event.file}`,
      description: event.metaDescription,
      keywords: event.keywords || ""
    }));

  const indexJa = [
    {
      title: "JAMについて",
      url: "index-ja.html#about",
      description: "MITの日本人会JAMについて。日本とMITを文化、コミュニティ、イベント、スポーツ、学術交流でつなぎます。",
      keywords: "JAM 日本人会 MIT 歴史 文化 コミュニティ 交流 ASA GSC"
    },
    {
      title: "展示・イベント",
      url: "index-ja.html#events",
      description: "花見フェスティバル、Beneath the Great Wave、オリエンテーション、活動紹介など。",
      keywords: "イベント 展示 花見 great wave オリエンテーション バスケットボール アーカイブ"
    },
    ...eventItemsJa,
    {
      title: "MIT公認団体としてのJAM",
      url: "index-ja.html#recognition",
      description: "JAMはMITのASA公認団体で、GSCを母体とする大学院生中心の学生団体です。",
      keywords: "MIT ASA GSC 公認団体 大学院生"
    },
    {
      title: "JAM運営メンバー",
      url: "index-ja.html#people",
      description: "現在のJAM officer一覧と運営参加について。",
      keywords: "officer 運営メンバー 会長 副会長 会計 参加"
    },
    {
      title: "活動",
      url: "index-ja.html#activities",
      description: "JAMの文化イベント、バスケットボールクラブ、キャンパスツアー支援など。",
      keywords: "活動 バスケットボール 文化イベント キャンパスツアー"
    },
    {
      title: "支援・スポンサー",
      url: "index-ja.html#support",
      description: "JAMのイベント支援、スポンサー、協力団体について。",
      keywords: "支援 sponsor スポンサー SGFC Taktopia GPI 領事館"
    },
    {
      title: "JAM Constitution",
      url: site.footer.constitutionHref,
      description: "JAM Constitution document.",
      keywords: "constitution 規約"
    },
    {
      title: "プライバシーポリシー",
      url: "privacy.html",
      description: "JAMウェブサイトのプライバシーポリシー。",
      keywords: "privacy policy プライバシー"
    }
  ];

  return `window.JAM_SEARCH_INDEX = ${JSON.stringify(index, null, 2)};\nwindow.JAM_SEARCH_INDEX_JA = ${JSON.stringify(indexJa, null, 2)};\n`;
};

const renderSitemap = ({ site, events }) => {
  const urls = [
    { loc: site.baseUrl, changefreq: "weekly", priority: "1.0" },
    { loc: `${site.baseUrl}index-ja.html`, changefreq: "weekly", priority: "0.9" },
    { loc: `${site.baseUrl}events/`, changefreq: "weekly", priority: "0.8" },
    ...events
      .filter((event) => event.file)
      .map((event) => ({
        loc: `${site.baseUrl}events/${event.file}`,
        changefreq: event.slug === "beneath-great-wave" ? "weekly" : "monthly",
        priority: event.slug === "beneath-great-wave" ? "0.8" : event.slug === "hanami" ? "0.7" : "0.6"
      })),
    { loc: `${site.baseUrl}privacy.html`, changefreq: "yearly", priority: "0.3" }
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeHtml(url.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
};

const main = async () => {
  const [site, siteJa, events, eventOverridesJa, officers, officerOverridesJa, activities, activitiesJa, supporters] = await Promise.all([
    readJson("site.json"),
    readJson("site-ja.json"),
    readJson("events.json"),
    readOptionalJson("events-ja.json", []),
    readJson("officers.json"),
    readOptionalJson("officers-ja.json", []),
    readJson("activities.json"),
    readOptionalJson("activities-ja.json", []),
    readJson("supporters.json")
  ]);

  const eventsJa = mergeBySlug(events, eventOverridesJa);
  const officersJa = mergeByName(officers, officerOverridesJa);

  await mkdir(join(rootDir, "events"), { recursive: true });

  await writeFile(
    join(rootDir, "index.html"),
    renderHome({
      site,
      events,
      officers,
      activities,
      supporters,
      languageSwitch: { current: "en", jaHref: "index-ja.html", label: "Language" }
    })
  );
  await writeFile(
    join(rootDir, "index-ja.html"),
    renderHome({
      site: siteJa,
      events: eventsJa,
      officers: officersJa,
      activities: activitiesJa,
      supporters,
      lang: "ja",
      canonicalPath: "index-ja.html",
      languageSwitch: { current: "ja", enHref: "index.html", label: "言語" }
    })
  );
  await writeFile(join(rootDir, "events", "index.html"), renderEventsIndex({ site, events }));

  for (const event of events) {
    if (!event.file || !event.page) continue;
    await writeFile(join(rootDir, "events", event.file), renderEventPage({ site, event }));
  }

  await writeFile(join(rootDir, "search-data.js"), renderSearchData({ site, events, eventsJa }));
  await writeFile(join(rootDir, "sitemap.xml"), renderSitemap({ site, events }));

  console.log("Built site from content/*.json");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
