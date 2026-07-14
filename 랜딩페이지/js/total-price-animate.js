(function () {
  'use strict';

  var START = 490000;
  var END = 240000;
  var STEP = 1000;
  var DURATION_MS = 2000;
  var DELAY_MS = 1000;

  function prefersReducedMotion() {
    return window.LandingMotion && LandingMotion.prefersReduced();
  }

  function easeInOutQuint(t) {
    return t < 0.5
      ? 16 * t * t * t * t * t
      : 1 - Math.pow(-2 * t + 2, 5) / 2;
  }

  function formatPrice(value) {
    return '₩' + Math.round(value).toLocaleString('ko-KR');
  }

  function getAccentRgb() {
    var root = getComputedStyle(document.documentElement);
    var rgb = root.getPropertyValue('--accent-rgb').trim();
    if (!rgb) return [255, 51, 85];
    return rgb.split(',').map(function (part) {
      return parseInt(part.trim(), 10);
    });
  }

  function lerpColor(t, accentRgb) {
    var r = Math.round(255 + (accentRgb[0] - 255) * t);
    var g = Math.round(255 + (accentRgb[1] - 255) * t);
    var b = Math.round(255 + (accentRgb[2] - 255) * t);
    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
  }

  function steppedValue(progress) {
    var raw = START + (END - START) * progress;
    var value = Math.round(raw / STEP) * STEP;
    if (value > START) value = START;
    if (value < END) value = END;
    return value;
  }
  function finish(wrap, nowEl) {
    wrap.classList.add('is-price-done');
    nowEl.textContent = formatPrice(END);
    nowEl.style.color = '';
  }

  function runAnimation(wrap, nowEl) {
    var accentRgb = getAccentRgb();
    var startTime = null;
    var raf = null;

    function frame(now) {
      if (!startTime) startTime = now;
      var t = Math.min((now - startTime) / DURATION_MS, 1);
      var eased = easeInOutQuint(t);
      var value = steppedValue(eased);

      nowEl.textContent = formatPrice(value);
      nowEl.style.color = lerpColor(eased, accentRgb);

      if (t < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        finish(wrap, nowEl);
      }
    }

    raf = requestAnimationFrame(frame);
  }

  function init() {
    var wrap = document.getElementById('total-price-wrap');
    var nowEl = document.getElementById('total-price-now');
    var band = document.querySelector('.i-promise-total-band');
    if (!wrap || !nowEl || !band) return;

    if (prefersReducedMotion() || !(window.LandingMotion && LandingMotion.isOn())) {
      finish(wrap, nowEl);
      return;
    }

    var played = false;

    function start() {
      if (played) return;
      played = true;
      nowEl.textContent = formatPrice(START);
      nowEl.style.color = '#fff';
      window.setTimeout(function () {
        runAnimation(wrap, nowEl);
      }, DELAY_MS);
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          start();
          observer.disconnect();
        }
      }, { threshold: 0.35 });
      observer.observe(band);
    } else {
      start();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
