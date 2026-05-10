const header = document.querySelector(".museum-header, .site-header");
const heroSlides = Array.from(document.querySelectorAll("[data-hero-slide]"));

window.addEventListener("scroll", () => {
  if (!header) return;
  header.toggleAttribute("data-scrolled", window.scrollY > 8);
});

if (
  heroSlides.length > 1 &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches
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
