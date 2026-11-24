// Custom language preference control. No third-party translation toolbar is loaded.
// Localized page content should be published as reviewed language-specific pages.
(() => {
  const section = document.querySelector('.stripe-reveal');
  const curtain = document.querySelector('.stripe-curtain');
  const stripes = [...document.querySelectorAll('.curtain-stripe')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticking = false;

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
  function updateReveal() {
    if (!section || !curtain) return;
    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, section.offsetHeight - window.innerHeight);
    const progress = reducedMotion ? 1 : clamp(-rect.top / travel, 0, 1);
    // First half: the three narrow colour bars grow into full-width panels.
    // Second half: the panels lift away in sequence to reveal the editorial section.
    const expand = clamp(progress / 0.48, 0, 1);
    const lift = clamp((progress - 0.48) / 0.52, 0, 1);
    curtain.style.transform = `scaleX(${Math.max(.012, expand)}) translateY(${-lift * 112}%)`;
    curtain.style.transformOrigin = 'center center';
    stripes.forEach((stripe, index) => {
      stripe.style.transform = 'none';
      stripe.style.opacity = lift >= 1 ? '0' : '1';
      stripe.style.transitionDelay = `${index * 55}ms`;
    });
    ticking = false;
  }
  function requestUpdate() {
    if (!ticking) { window.requestAnimationFrame(updateReveal); ticking = true; }
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  updateReveal();


  // Reveal major content as it enters the viewport.
  const revealItems = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // Toggle in both directions so elements re-enter as visitors scroll back up.
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // The testimonials marquee runs automatically via CSS. It pauses on hover/focus
  // and becomes static for visitors who request reduced motion.
  const testimonialTrack = document.querySelector('.testimonial-track');
  if (testimonialTrack && document.hidden) testimonialTrack.style.animationPlayState = 'paused';
  document.addEventListener('visibilitychange', () => {
    if (!testimonialTrack) return;
    testimonialTrack.style.animationPlayState = document.hidden ? 'paused' : '';
  });

  const menu = document.querySelector('.site-menu');
  const openButton = document.querySelector('.menu-toggle');
  const closeButton = document.querySelector('.menu-close');
  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menu.inert = !open;
    openButton.setAttribute('aria-expanded', String(open));
    openButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    document.body.classList.toggle('menu-open', open);
    if (open) closeButton.focus();
    else openButton.focus();
  }
  openButton.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  closeButton.addEventListener('click', () => setMenu(false));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  // Footer logo: swap between three pre-rendered SVGs so only the exact brand colours appear.
  const footerMark = document.querySelector('.footer-logo-mark');
  const footerMarkColors = [
    'assets/adelayo-mark-green.svg',
    'assets/adelayo-mark-red.svg',
    'assets/adelayo-mark-gold.svg'
  ];
  if (footerMark && !reducedMotion) {
    let footerMarkIndex = 0;
    window.setInterval(() => {
      footerMarkIndex = (footerMarkIndex + 1) % footerMarkColors.length;
      footerMark.src = footerMarkColors[footerMarkIndex];
    }, 3000);
  }

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // The hero video is decorative. Respect visitors who prefer reduced motion.
  const heroVideo = document.querySelector('.hero-video');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  function syncHeroMotion() {
    if (!heroVideo) return;
    if (motionPreference.matches) {
      heroVideo.pause();
    } else {
      heroVideo.play().catch(() => {});
    }
  }
  syncHeroMotion();
  motionPreference.addEventListener?.('change', syncHeroMotion);

  // Keep keyboard focus within the open navigation and return it to the trigger.
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) {
      setMenu(false);
      return;
    }
    if (event.key !== 'Tab' || !menu.classList.contains('is-open')) return;
    const focusable = [...menu.querySelectorAll('a[href], button:not([disabled])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

})();
