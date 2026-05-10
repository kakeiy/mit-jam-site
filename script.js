const header = document.querySelector(".museum-header, .site-header");
const heroSlides = Array.from(document.querySelectorAll("[data-hero-slide]"));
const exhibitionRails = Array.from(document.querySelectorAll(".exhibition-rail"));
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

window.addEventListener("scroll", () => {
  if (!header) return;
  header.toggleAttribute("data-scrolled", window.scrollY > 8);
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

if (exhibitionRails.length && !prefersReducedMotion) {
  const getCardStep = (rail) => {
    const cards = Array.from(rail.children);
    if (cards.length > 1) {
      return cards[1].offsetLeft - cards[0].offsetLeft;
    }
    return cards[0]?.getBoundingClientRect().width ?? 0;
  };

  const scrollToNextCard = (rail) => {
    if (rail.dataset.paused === "true") return;

    const maxScroll = rail.scrollWidth - rail.clientWidth;
    if (maxScroll <= 4) return;

    const step = getCardStep(rail);
    const nextLeft = rail.scrollLeft + step;

    rail.scrollTo({
      left: nextLeft >= maxScroll - 4 ? 0 : Math.min(nextLeft, maxScroll),
      behavior: "smooth",
    });
  };

  exhibitionRails.forEach((rail) => {
    const setPaused = (paused) => {
      rail.dataset.paused = paused ? "true" : "false";
    };

    setPaused(false);
    rail.addEventListener("pointerenter", () => setPaused(true));
    rail.addEventListener("pointerleave", () => setPaused(false));
    rail.addEventListener("focusin", () => setPaused(true));
    rail.addEventListener("focusout", () => setPaused(false));

    window.setInterval(() => scrollToNextCard(rail), 4400);
  });
}
