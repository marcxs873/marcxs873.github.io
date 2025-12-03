/* Theme overlay animation, nav toggle, progress, reveal */
(function () {
  'use strict';

  // Helpers
  const qs = (s) => document.querySelector(s);
  const qsa = (s) => Array.from(document.querySelectorAll(s));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  // Small toast helper used across features
  function showToast(text) {
    try {
      const t = document.createElement('div');
      t.className = 'toast';
      t.textContent = text;
      document.body.appendChild(t);
      requestAnimationFrame(() => t.classList.add('show'));
      setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3200);
    } catch (e) { /* ignore */ }
  }

  /* ===== Theme button & page-overlay animation ===== */
  function initThemeSwitch() {
    // Cambio de modo desactivado temporalmente.
    // Si quieres reactivarlo, restaura la implementación anterior.
    return;
  }

  /* ===== Navigation toggle (mobile) ===== */
  function initNavToggle() {
    qsa('.nav-toggle').forEach((btn) => {
      on(btn, 'click', () => {
        const nav = btn.closest('.main-nav');
        if (!nav) return;
        const open = nav.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  /* ===== Progress bar ===== */
  function initProgress() {
    const progress = qs('.progress-bar');
    if (!progress) return;
    const update = () => {
      const doc = document.documentElement;
      const scrollTop = (window.pageYOffset || doc.scrollTop || document.body.scrollTop || 0);
      const height = Math.max(doc.scrollHeight - doc.clientHeight, 1);
      const pct = (scrollTop / height) * 100;
      progress.style.width = Math.max(0, Math.min(100, pct)) + '%';
    };
    on(window, 'scroll', update, { passive: true });
    on(window, 'resize', update);
    update();
  }

  /* ===== Reveal on scroll ===== */
  function initReveal() {
    const items = qsa('.reveal, [data-reveal]');
    if (!items.length) return;
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('visible');
            obs.unobserve(en.target);
          }
        });
      }, { threshold: 0.12 });
      items.forEach((it) => io.observe(it));
    } else {
      items.forEach((it) => it.classList.add('visible'));
    }
  }

  /* ===== Contact form (optional) ===== */
  function initContactForm() {
    const form = qs('#contactForm');
    if (!form) return;
    const sendBtn = qs('#sendBtn');
    const formMsg = qs('#formMsg');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form) return;
      const data = new FormData(form);
      const name = (data.get('name') || '').toString().trim();
      const email = (data.get('email') || '').toString().trim();
      const message = (data.get('message') || '').toString().trim();

      if (!name || !email || !message) {
        if (formMsg) formMsg.textContent = 'Por favor completa todos los campos.';
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (formMsg) formMsg.textContent = 'Introduce un correo válido.';
        return;
      }

      if (sendBtn) {
        sendBtn.classList.add('sending');
        sendBtn.disabled = true;
      }
      if (formMsg) formMsg.textContent = 'Enviando...';

      setTimeout(() => {
        if (sendBtn) { sendBtn.classList.remove('sending'); sendBtn.disabled = false; }
        form.reset();
        if (formMsg) formMsg.textContent = '';
        showToast('Mensaje enviado. Gracias, te contactaré pronto.');
      }, 1100);
    });
  }

  /* ===== Cookie banner (centered with dimmer & focus trap) ===== */
  function initCookies() {
    const banner = qs('#cookieBanner');
    if (!banner) return;

    const accepted = (function () {
      try { return localStorage.getItem('cookiesAccepted') === '1'; } catch (e) { return false; }
    }());
    if (accepted) { banner.hidden = true; return; }

    // create dimmer if needed
    let dimmer = qs('#cookieDimmer');
    if (!dimmer) {
      dimmer = document.createElement('div');
      dimmer.id = 'cookieDimmer';
      dimmer.className = 'cookie-dimmer';
      dimmer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(dimmer);
    }

    const acceptBtn = qs('#acceptCookiesButton');
    const moreBtn = qs('#cookieMoreButton');
    const closeBtn = qs('#cookieClose');

    // save previous focus
    const previouslyFocused = document.activeElement;

    // show
    banner.hidden = false;
    requestAnimationFrame(() => {
      dimmer.classList.add('show');
      banner.classList.add('show');
      document.body.style.overflow = 'hidden';
      if (acceptBtn) acceptBtn.focus();
    });

    // focus trap
    const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    let focusable = Array.from(banner.querySelectorAll(focusableSelector)).filter((el) => el.offsetParent !== null);

    function trapFocus(e) {
      if (e.key !== 'Tab') return;
      if (focusable.length === 0) { e.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    function hide(persist) {
      banner.classList.remove('show');
      dimmer.classList.remove('show');
      setTimeout(() => {
        banner.hidden = true;
        if (dimmer && dimmer.parentNode) dimmer.parentNode.removeChild(dimmer);
        document.body.style.overflow = '';
        if (persist) {
          try { localStorage.setItem('cookiesAccepted', '1'); } catch (e) {}
        }
        try { if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus(); } catch (e) {}
        document.removeEventListener('keydown', trapFocus);
      }, 380);
    }

    on(acceptBtn, 'click', () => { hide(true); showToast('Gracias. Cookies aceptadas.'); });
    on(closeBtn, 'click', () => hide(false));
    on(moreBtn, 'click', (ev) => { ev.preventDefault(); window.open('politica-de-cookies.html', '_blank'); });

    if (dimmer) on(dimmer, 'click', () => hide(false));
    document.addEventListener('keydown', trapFocus);
  }

  /* ===== Init on DOM ready ===== */
  function initAll() {
    initThemeSwitch();
    initNavToggle();
    initProgress();
    initReveal();
    // contact form may not exist on index
    initContactForm();
    initCookies();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
