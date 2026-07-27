(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const style = document.createElement('style');

  style.textContent = `
    html.koyuje-page-transition body > :not(.nav) {
      opacity: 0;
      transform: translateY(7px);
    }
    html.koyuje-page-transition.koyuje-page-ready body > :not(.nav) {
      opacity: 1;
      transform: translateY(0);
      transition:
        opacity 280ms cubic-bezier(.22,.61,.36,1),
        transform 280ms cubic-bezier(.22,.61,.36,1);
    }
    html.koyuje-page-transition.koyuje-page-leaving body > :not(.nav) {
      opacity: 0;
      transform: translateY(-3px);
      transition-duration: 140ms;
    }
    @media (prefers-reduced-motion: reduce) {
      html.koyuje-page-transition body > :not(.nav) {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
      }
    }
  `;
  document.head.appendChild(style);

  if (reducedMotion) return;

  root.classList.add('koyuje-page-transition');

  const revealPage = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.add('koyuje-page-ready'));
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', revealPage, { once: true });
  } else {
    revealPage();
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.hasAttribute('download') ||
      (link.target && link.target !== '_self')
    ) return;

    const target = new URL(link.href, window.location.href);
    if (target.origin !== window.location.origin) return;
    if (
      target.pathname === window.location.pathname &&
      target.search === window.location.search &&
      target.hash
    ) return;

    event.preventDefault();
    root.classList.add('koyuje-page-leaving');
    window.setTimeout(() => {
      window.location.href = target.href;
    }, 140);
  });

  window.addEventListener('pageshow', () => {
    root.classList.remove('koyuje-page-leaving');
    revealPage();
  });
})();
