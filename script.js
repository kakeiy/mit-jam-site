const header = document.querySelector(".museum-header, .site-header");
const heroSlides = Array.from(document.querySelectorAll("[data-hero-slide]"));
const exhibitionRails = Array.from(document.querySelectorAll(".exhibition-rail"));
const railControls = Array.from(document.querySelectorAll("[data-rail-prev], [data-rail-next]"));
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

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

  railControls.forEach((button) => {
    button.addEventListener("click", () => {
      const rail = button.closest(".exhibitions-section")?.querySelector(".exhibition-rail");
      if (!rail) return;
      scrollRailByCard(rail, button.matches("[data-rail-prev]") ? -1 : 1);
    });
  });
}
