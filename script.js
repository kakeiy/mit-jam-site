const header = document.querySelector(".museum-header, .site-header");

window.addEventListener("scroll", () => {
  if (!header) return;
  header.toggleAttribute("data-scrolled", window.scrollY > 8);
});
