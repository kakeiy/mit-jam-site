const header = document.querySelector(".jam-header, .site-header");
const heroSlides = Array.from(document.querySelectorAll("[data-hero-slide]"));
const exhibitionRails = Array.from(document.querySelectorAll(".exhibition-rail"));
const railControls = Array.from(document.querySelectorAll("[data-rail-prev], [data-rail-next]"));
const searchButtons = Array.from(document.querySelectorAll("[data-search-open]"));
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
const sitePrefix = document.currentScript?.getAttribute("src")?.startsWith("../")
  ? "../"
  : "";

const searchIndex = window.JAM_SEARCH_INDEX || [];

const scrollToHashTarget = (hash) => {
  const target = document.querySelector(hash);
  if (!target) return false;

  const headerOffset = header?.getBoundingClientRect().height ?? 0;
  const targetTop = target.getBoundingClientRect().top + window.scrollY;

  window.scrollTo({
    top: Math.max(0, targetTop - headerOffset - 18),
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });

  return true;
};

const resolveSiteUrl = (url) => {
  if (/^(https?:|mailto:)/.test(url)) return url;
  return `${sitePrefix}${url}`;
};

const createSearchPanel = () => {
  const panel = document.createElement("div");
  panel.className = "search-panel";
  panel.hidden = true;
  panel.setAttribute("data-search-panel", "");
  panel.innerHTML = `
    <div class="search-dialog" role="dialog" aria-modal="true" aria-labelledby="site-search-title">
      <div class="search-top">
        <div>
          <label class="search-title" id="site-search-title" for="site-search-input">Search JAM</label>
          <input class="search-input" id="site-search-input" data-search-input type="search" autocomplete="off" placeholder="Hanami, officers, RSVP...">
        </div>
        <button class="search-close" type="button" aria-label="Close search" data-search-close>×</button>
      </div>
      <div class="search-results" data-search-results></div>
    </div>
  `;
  document.body.append(panel);
  return panel;
};

const initializeSearch = () => {
  if (!searchButtons.length) return;

  const panel = createSearchPanel();
  const input = panel.querySelector("[data-search-input]");
  const results = panel.querySelector("[data-search-results]");
  const closeButton = panel.querySelector("[data-search-close]");
  let lastTrigger = null;

  const renderResults = (query) => {
    const tokens = query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    const matches = searchIndex.filter((item) => {
      if (!tokens.length) return true;
      const haystack = `${item.title} ${item.description} ${item.keywords}`.toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });

    const shown = matches.slice(0, tokens.length ? 9 : 5);

    if (!shown.length) {
      results.innerHTML = `<p class="search-empty">No results. Try “Hanami”, “RSVP”, “officers”, or “constitution”.</p>`;
      return;
    }

    results.innerHTML = shown
      .map(
        (item) => `
          <a class="search-result" href="${resolveSiteUrl(item.url)}">
            <span><strong>${item.title}</strong>${item.description}</span>
            <em>Open</em>
          </a>
        `
      )
      .join("");
  };

  const openSearch = (trigger) => {
    lastTrigger = trigger;
    panel.hidden = false;
    document.body.classList.add("search-is-open");
    input.value = "";
    renderResults("");
    window.setTimeout(() => input.focus(), 0);
  };

  const closeSearch = () => {
    panel.hidden = true;
    document.body.classList.remove("search-is-open");
    lastTrigger?.focus();
  };

  searchButtons.forEach((button) => {
    button.addEventListener("click", () => openSearch(button));
  });

  input.addEventListener("input", () => renderResults(input.value));
  closeButton.addEventListener("click", closeSearch);

  panel.addEventListener("click", (event) => {
    if (event.target === panel) closeSearch();
  });

  panel.addEventListener("click", (event) => {
    if (event.target.closest(".search-result")) closeSearch();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      closeSearch();
      return;
    }

    if (
      event.key === "/" &&
      panel.hidden &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
    ) {
      event.preventDefault();
      openSearch(searchButtons[0]);
    }
  });
};

window.addEventListener("scroll", () => {
  if (!header) return;
  header.toggleAttribute("data-scrolled", window.scrollY > 8);
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;
    if (!scrollToHashTarget(hash)) return;

    event.preventDefault();
    history.pushState(null, "", hash);
  });
});

window.addEventListener("load", () => {
  if (!location.hash) return;
  window.setTimeout(() => scrollToHashTarget(location.hash), 0);
});

window.addEventListener("hashchange", () => {
  if (!location.hash) return;
  scrollToHashTarget(location.hash);
});

initializeSearch();

if (
  heroSlides.length > 1 &&
  !prefersReducedMotion
) {
  let activeIndex = heroSlides.findIndex((slide) =>
    slide.classList.contains("is-active")
  );

  if (activeIndex < 0) activeIndex = 0;

  window.setInterval(() => {
    heroSlides[activeIndex].classList.remove("is-active");
    activeIndex = (activeIndex + 1) % heroSlides.length;
    heroSlides[activeIndex].classList.add("is-active");
  }, 5400);
}

if (exhibitionRails.length) {
  const getCardStep = (rail) => {
    const cards = Array.from(rail.children);
    if (cards.length > 1) {
      return cards[1].offsetLeft - cards[0].offsetLeft;
    }
    return cards[0]?.getBoundingClientRect().width ?? 0;
  };

  const scrollRailByCard = (rail, direction) => {
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    if (maxScroll <= 4) return;

    const nextLeft = Math.max(
      0,
      Math.min(rail.scrollLeft + getCardStep(rail) * direction, maxScroll)
    );

    rail.scrollTo({
      left: nextLeft,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  const scrollToNextCard = (rail) => {
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    if (maxScroll <= 4 || rail.dataset.paused === "true") return;

    const step = getCardStep(rail);
    const nextLeft = rail.scrollLeft + step;

    rail.scrollTo({
      left: nextLeft >= maxScroll - 4 ? 0 : Math.min(nextLeft, maxScroll),
      behavior: "smooth",
    });
  };

  railControls.forEach((button) => {
    button.addEventListener("click", () => {
      const rail = button.closest(".exhibitions-section")?.querySelector(".exhibition-rail");
      if (!rail) return;
      scrollRailByCard(rail, button.matches("[data-rail-prev]") ? -1 : 1);
    });
  });

  if (!prefersReducedMotion) {
    exhibitionRails.forEach((rail) => {
      const setPaused = (paused) => {
        rail.dataset.paused = paused ? "true" : "false";
      };

      setPaused(false);
      rail.addEventListener("pointerenter", () => setPaused(true));
      rail.addEventListener("pointerleave", () => setPaused(false));
      rail.addEventListener("focusin", () => setPaused(true));
      rail.addEventListener("focusout", () => setPaused(false));

      window.setInterval(() => scrollToNextCard(rail), 3000);
    });
  }
}
