const header = document.querySelector(".site-header");

window.addEventListener("scroll", () => {
  header.toggleAttribute("data-scrolled", window.scrollY > 8);
});
