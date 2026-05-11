import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const contentDir = join(rootDir, "content");
const today = new Date().toISOString().slice(0, 10);

const readJson = async (name) =>
  JSON.parse(await readFile(join(contentDir, name), "utf8"));

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

const renderHeader = (site, prefix = "", { activeEvents = false } = {}) => {
  const homeHref = prefix ? `${prefix}index.html#top` : "#top";
  const navHome = (hash) => (prefix ? `${prefix}index.html${hash}` : hash);
  return `<header class="jam-header">
      <div class="jam-header-top">
        <a class="jam-logo" href="${homeHref}" aria-label="Japanese Association of MIT home">
          <img src="${rootPath(prefix, "assets/logos/jam-logo-main-trim.png")}" alt="JAM">
        </a>
        <div class="jam-actions" aria-label="Quick actions">
          <a href="mailto:${escapeHtml(site.contactEmail)}">Contact</a>
          <a class="action-muted" href="${escapeHtml(site.officerInterestUrl)}">Join us</a>
          <a class="action-blue" href="${escapeHtml(site.updatesUrl)}">Get updates</a>
        </div>
      </div>
      <nav class="jam-nav" aria-label="Primary navigation">
        <a href="${navHome("#about")}">About</a>
        <a href="${navHome("#events")}"${activeEvents ? ' aria-current="true"' : ""}>Exhibitions and events</a>
        <a href="${navHome("#people")}">Officers</a>
        <a href="${navHome("#activities")}">Activities</a>
        <a href="${navHome("#support")}">Support</a>
        <a href="${prefix ? "index.html" : "events/"}">Archive</a>
        <button class="nav-search" type="button" aria-label="Search JAM site" data-search-open>⌕</button>
      </nav>
    </header>`;
};

const renderFooter = (site, prefix = "", { includeAllEvents = false, homeFooter = false } = {}) => {
  const footerClass = homeFooter ? "jam-footer" : "site-footer";
  const links = [
    ...(includeAllEvents ? [{ label: "All events", href: "index.html" }] : []),
    { label: "Privacy Policy", href: rootPath(prefix, site.footer.privacyHref) },
    { label: "Constitution", href: rootPath(prefix, site.footer.constitutionHref) },
    { label: "Contact", href: `mailto:${site.contactEmail}` }
  ];

  return `<footer class="${footerClass}">
      <div class="footer-brand">
        <img src="${rootPath(prefix, "assets/logos/jam-logo-main-trim.png")}" alt="Japanese Association of MIT">
      </div>
      <nav class="footer-links" aria-label="Footer navigation">
${links.map((link) => `        <a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join("\n")}
      </nav>
      <div class="mit-affiliation">
        <a class="mit-lockup" href="${escapeHtml(site.footer.mitUrl)}" aria-label="Massachusetts Institute of Technology">
          <img src="${rootPath(prefix, "assets/logos/mit_logo_black.png")}" alt="MIT">
          <span>Massachusetts Institute of Technology</span>
        </a>
        <p>JAM is an <a href="${escapeHtml(site.footer.asaUrl)}">Association of Student Activities (ASA)-recognized organization</a> with its student governance home in the <a href="${escapeHtml(site.footer.gscUrl)}">Graduate Student Council (GSC)</a> of MIT.</p>
      </div>
    </footer>`;
};

const pageShell = ({ site, prefix = "", page, canonicalPath, ogType, body, extraHead = "" }) => `<!doctype html>
<!-- Generated by npm run build. Edit content/*.json instead of this file. -->
<html lang="en">
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

const renderHome = ({ site, events, officers, activities, supporters }) => {
  const homeCards = events
    .filter((event) => event.homeCard?.enabled)
    .sort((a, b) => (a.homeCard.order ?? 0) - (b.homeCard.order ?? 0));

  const body = `    ${renderHeader(site)}

    <main id="top">
      <section class="jam-hero jam-hero-art" aria-label="JAM visual highlights" data-hero-slideshow>
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
          <h2 id="events-title">Exhibitions</h2>
          <div class="section-arrows" aria-label="Exhibition carousel controls">
            <button type="button" data-rail-prev aria-label="Previous exhibition">←</button>
            <button type="button" data-rail-next aria-label="Next exhibition">→</button>
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
          <ul class="support-list" aria-label="Current and recent supporters">
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
    canonicalPath: "",
    body,
    extraHead: `<link rel="preload" href="assets/logos/jam-logo-main-trim.png" as="image">
    <link rel="preload" href="assets/hanami/hanami-hall.jpg" as="image">
    ${jsonLd(site)}`
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
    (speaker) => `          <article>
            <span>${escapeHtml(speaker.label)}</span>
            <h3>${escapeHtml(speaker.name)}</h3>
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

const renderSearchData = ({ site, events }) => {
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

  return `window.JAM_SEARCH_INDEX = ${JSON.stringify(index, null, 2)};\n`;
};

const renderSitemap = ({ site, events }) => {
  const urls = [
    { loc: site.baseUrl, changefreq: "weekly", priority: "1.0" },
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
  const [site, events, officers, activities, supporters] = await Promise.all([
    readJson("site.json"),
    readJson("events.json"),
    readJson("officers.json"),
    readJson("activities.json"),
    readJson("supporters.json")
  ]);

  await mkdir(join(rootDir, "events"), { recursive: true });

  await writeFile(join(rootDir, "index.html"), renderHome({ site, events, officers, activities, supporters }));
  await writeFile(join(rootDir, "events", "index.html"), renderEventsIndex({ site, events }));

  for (const event of events) {
    if (!event.file || !event.page) continue;
    await writeFile(join(rootDir, "events", event.file), renderEventPage({ site, event }));
  }

  await writeFile(join(rootDir, "search-data.js"), renderSearchData({ site, events }));
  await writeFile(join(rootDir, "sitemap.xml"), renderSitemap({ site, events }));

  console.log("Built site from content/*.json");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
