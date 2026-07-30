(function () {
  "use strict";

  const toggle = document.getElementById("contentNavToggle");
  const menu = document.getElementById("contentMobileMenu");
  const close = document.getElementById("contentMobileClose");

  if (!toggle || !menu || !close) return;

  function setMenu(open) {
    menu.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
  }

  toggle.addEventListener("click", function () {
    setMenu(true);
  });
  close.addEventListener("click", function () {
    setMenu(false);
  });
  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      setMenu(false);
    });
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMenu(false);
  });
})();
