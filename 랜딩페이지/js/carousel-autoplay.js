(function (global) {
  function buildDots(container, count, options) {
    options = options || {};
    container.innerHTML = '';
    var dots = [];
    var dotClass = options.dotClass || 'carousel-dot';
    var labelPrefix = options.labelPrefix || '슬라이드';

    for (var i = 0; i < count; i++) {
      (function (index) {
        var btn = global.document.createElement('button');
        btn.type = 'button';
        btn.className = dotClass;
        btn.setAttribute('aria-label', labelPrefix + ' ' + (index + 1));
        btn.addEventListener('click', function () {
          if (typeof options.onSelect === 'function') options.onSelect(index);
        });
        container.appendChild(btn);
        dots.push(btn);
      })(i);
    }

    return {
      setActive: function (index) {
        dots.forEach(function (dot, i) {
          dot.classList.toggle('is-active', i === index);
          dot.setAttribute('aria-current', i === index ? 'true' : 'false');
        });
      }
    };
  }

  function createAutoplay(tick, intervalMs) {
    var timer = null;
    return {
      start: function () {
        this.stop();
        if ((global.LandingMotion && LandingMotion.prefersReduced()) ||
            !(global.LandingMotion && LandingMotion.isOn())) {
          return;
        }
        timer = global.setInterval(tick, intervalMs);
      },
      stop: function () {
        if (timer) {
          global.clearInterval(timer);
          timer = null;
        }
      }
    };
  }

  function bindHoverPause(root, stopAuto, startAuto) {
    if (!root) return;
    root.addEventListener('mouseenter', stopAuto);
    root.addEventListener('mouseleave', startAuto);
    root.addEventListener('focusin', stopAuto);
    root.addEventListener('focusout', startAuto);
  }

  global.CarouselAutoplay = {
    buildDots: buildDots,
    createAutoplay: createAutoplay,
    bindHoverPause: bindHoverPause
  };
})(window);
