(function () {
  'use strict';

  var DEFAULT_SRC = 'assets/images/mouse pointer icon.png';
  var HOVER_SRC = 'assets/images/mouse hover icon.png';

  var HOTSPOT_DEFAULT = { x: 2, y: 2 };
  var HOTSPOT_HOVER = { x: 4, y: 30 };

  var LAB_SELECTOR = [
    '.lab-bar-shell',
    '.lab-ui-fab',
    '.color-panel'
  ].join(', ');

  var CLICKABLE_SELECTOR = [
    'a[href]',
    'area[href]',
    'button:not(:disabled)',
    'summary',
    'label[for]',
    'label:has(input[type="checkbox"])',
    'label:has(input[type="radio"])',
    '[role="button"]',
    '[role="link"]',
    '[role="tab"]',
    '[role="switch"]',
    '[role="menuitem"]',
    '[role="option"]',
    '[tabindex]:not([tabindex="-1"])',
    'input[type="checkbox"]',
    'input[type="radio"]',
    'input[type="submit"]',
    'input[type="button"]',
    'input[type="reset"]',
    'input[type="file"]',
    'select',
    '.cta',
    '.nav-logo',
    '.nav-btn',
    '.nav-cta',
    '.stats-band__viewport',
    '.i-bookstore-carousel__viewport',
    'button[class*="__arrow"]',
    'button[class*="__dot"]',
    'a[class*="__arrow"]',
    '[class*="carousel__dot"]'
  ].join(', ');

  var TEXT_SELECTOR = [
    'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="file"])',
    'textarea',
    '[contenteditable="true"]'
  ].join(', ');

  function init() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var root = document.createElement('div');
    root.id = 'custom-cursor';
    root.className = 'custom-cursor custom-cursor--default';
    root.setAttribute('aria-hidden', 'true');

    var inner = document.createElement('div');
    inner.className = 'custom-cursor__inner';

    var imgDefault = document.createElement('img');
    imgDefault.className = 'custom-cursor__img custom-cursor__img--default';
    imgDefault.src = DEFAULT_SRC;
    imgDefault.alt = '';
    imgDefault.draggable = false;
    imgDefault.width = 32;
    imgDefault.height = 32;

    var imgHover = document.createElement('img');
    imgHover.className = 'custom-cursor__img custom-cursor__img--hover';
    imgHover.src = HOVER_SRC;
    imgHover.alt = '';
    imgHover.draggable = false;
    imgHover.width = 32;
    imgHover.height = 32;

    inner.appendChild(imgDefault);
    inner.appendChild(imgHover);
    root.appendChild(inner);
    document.body.appendChild(root);

    document.documentElement.classList.add('is-custom-cursor');

    var lastX = 0;
    var lastY = 0;
    var isHover = false;
    var isText = false;
    var isLab = false;

    function isLabTarget(el) {
      if (!el) return false;
      try {
        return !!el.closest(LAB_SELECTOR);
      } catch (e) {
        return false;
      }
    }

    function isDisabledTarget(el) {
      return !!(el && el.closest('button:disabled, [disabled], [aria-disabled="true"]'));
    }

    function isClickableTarget(el) {
      if (!el || isDisabledTarget(el)) return false;
      try {
        return !!el.closest(CLICKABLE_SELECTOR);
      } catch (e) {
        return false;
      }
    }

    function isTextTarget(el) {
      if (!el) return false;
      try {
        return !!el.closest(TEXT_SELECTOR);
      } catch (e) {
        return false;
      }
    }

    function setMode(hover, text, lab) {
      isHover = hover;
      isText = text;
      isLab = lab;
      root.classList.toggle('custom-cursor--hover', hover && !text && !lab);
      root.classList.toggle('custom-cursor--default', !hover && !text && !lab);
      document.documentElement.classList.toggle('is-custom-cursor--text', text && !lab);
      document.documentElement.classList.toggle('is-custom-cursor--lab', lab);
      root.classList.toggle('is-hidden', text || lab);
    }

    function move(clientX, clientY) {
      lastX = clientX;
      lastY = clientY;
      if (isText || isLab) return;

      var hotspot = isHover ? HOTSPOT_HOVER : HOTSPOT_DEFAULT;
      root.style.transform = 'translate3d(' + (clientX - hotspot.x) + 'px,' + (clientY - hotspot.y) + 'px, 0)';
    }

    function refreshState(target) {
      if (isLabTarget(target)) {
        setMode(false, false, true);
        return;
      }
      var text = isTextTarget(target);
      var hover = !text && isClickableTarget(target);
      setMode(hover, text, false);
      move(lastX, lastY);
    }

    document.addEventListener('mousemove', function (e) {
      refreshState(e.target);
      if (!isLab) {
        root.classList.add('is-visible');
        move(e.clientX, e.clientY);
      } else {
        root.classList.remove('is-visible');
      }
    }, { passive: true });

    document.addEventListener('mouseover', function (e) {
      refreshState(e.target);
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      root.classList.remove('is-visible');
    });

    window.addEventListener('blur', function () {
      root.classList.remove('is-visible');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
