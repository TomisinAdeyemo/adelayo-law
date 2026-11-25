// Custom language preference control. No third-party translation toolbar is loaded.
// Localized page content should be published as reviewed language-specific pages.
(() => {
  const section = document.querySelector('.stripe-reveal');
  const sticky = section?.querySelector('.reveal-sticky');
  const curtain = document.querySelector('.stripe-curtain');
  const stripes = [...document.querySelectorAll('.curtain-stripe')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame = 0;
  let targetProgress = 0;
  let renderedProgress = 0;
  let sectionStart = 0;
  let scrollDistance = 1;

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

  function measureReveal() {
    if (!section || !sticky) return;
    sectionStart = section.getBoundingClientRect().top + window.scrollY;
    // Measure the actual sticky panel rather than the viewport. This avoids
    // progress jumps when mobile browser chrome changes the visual viewport.
    scrollDistance = Math.max(1, section.offsetHeight - sticky.offsetHeight);
    updateTarget();
  }

  function updateTarget() {
    if (!section || !curtain) return;
    targetProgress = reducedMotion
      ? 1
      : clamp((window.scrollY - sectionStart) / scrollDistance, 0, 1);
    if (!frame) frame = window.requestAnimationFrame(animateReveal);
  }

  function animateReveal() {
    // Ease toward scroll progress so tiny scroll reversals do not make the
    // three-panel reveal visibly chatter around a threshold.
    renderedProgress += (targetProgress - renderedProgress) * 0.18;
    if (Math.abs(targetProgress - renderedProgress) < 0.001) {
      renderedProgress = targetProgress;
    }

    const expand = clamp(renderedProgress / 0.48, 0, 1);
    const lift = clamp((renderedProgress - 0.48) / 0.52, 0, 1);
    curtain.style.transform = `translate3d(0, ${-lift * 112}%, 0) scaleX(${Math.max(0.012, expand)})`;
    curtain.style.transformOrigin = 'center center';
    stripes.forEach((stripe) => {
      stripe.style.opacity = lift >= 0.999 ? '0' : '1';
    });

    if (renderedProgress !== targetProgress) {
      frame = window.requestAnimationFrame(animateReveal);
    } else {
      frame = 0;
    }
  }

  if (section && curtain) {
    window.addEventListener('scroll', updateTarget, { passive: true });
    window.addEventListener('resize', measureReveal, { passive: true });
    measureReveal();
    renderedProgress = targetProgress;
    updateTarget();
  }

  // Reveal content once when it first enters view. Keeping it visible avoids
  // repeated opacity/transform reversals when a visitor hovers near the edge.
  const revealItems = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
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
  // Navbar logo: cycle through the three exact brand colours while hovered or keyboard-focused.
  const navMark = document.querySelector('.site-header .brand-logo');
  const navMarkColors = [
    'assets/adelayo-mark-green.svg',
    'assets/adelayo-mark-red.svg',
    'assets/adelayo-mark-gold.svg'
  ];
  if (navMark) {
    let navMarkIndex = 0;
    let navMarkTimer = null;
    const startNavMarkCycle = () => {
      if (navMarkTimer || reducedMotion) return;
      navMarkIndex = 0;
      navMark.src = navMarkColors[navMarkIndex];
      navMarkTimer = window.setInterval(() => {
        navMarkIndex = (navMarkIndex + 1) % navMarkColors.length;
        navMark.src = navMarkColors[navMarkIndex];
      }, 700);
    };
    const stopNavMarkCycle = () => {
      if (navMarkTimer) window.clearInterval(navMarkTimer);
      navMarkTimer = null;
      navMark.src = 'assets/adelayo-mark.svg';
    };
    const navLogoLink = navMark.closest('.wordmark');
    if (navLogoLink) {
      navLogoLink.addEventListener('pointerenter', startNavMarkCycle);
      navLogoLink.addEventListener('pointerleave', stopNavMarkCycle);
      navLogoLink.addEventListener('focus', startNavMarkCycle);
      navLogoLink.addEventListener('blur', stopNavMarkCycle);
    }
  }

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
