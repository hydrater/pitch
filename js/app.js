/**
 * Navigation, scroll behavior, section reveal animations.
 * Works across all pages.
 */
(function () {
  'use strict';

  var nav = document.getElementById('main-nav');
  var toggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');

  // ── Scrolled nav (only on index page with hero) ────────────────
  function onScroll() {
    if (!nav) return;
    // Pages with .page-hero or already .scrolled class keep it solid
    if (document.querySelector('.page-hero') || nav.classList.contains('scrolled')) return;
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  if (nav && !document.querySelector('.page-hero')) {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Mobile toggle ──────────────────────────────────────────────
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
      });
    });
  }

  // ── Reveal on scroll ──────────────────────────────────────────
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach(function (el) { observer.observe(el); });
  }
})();
