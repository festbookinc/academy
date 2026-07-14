(function () {
  var AUTO_MS = 5000;
  var TRANSITION_MS = 1000;
  var SIDE_SCALE = 0.8;
  var EXIT_SCALE = 0.8;
  var SIDE_FILTER = 'blur(2px)';
  var SIDE_OPACITY = 0.88;

  function isMobile() {
    return window.matchMedia('(max-width: 639px)').matches;
  }

  function cardSpacing() {
    return isMobile() ? 168 : 238;
  }

  function createCasesCarousel() {
    var root = document.getElementById('cases-3d');
    var scene = document.getElementById('cases-3d-scene');
    var dotsWrap = document.getElementById('cases-3d-dots');
    if (!root || !scene || !dotsWrap) return null;

    var cards = scene.querySelectorAll('.promise-card');
    var prevBtn = root.querySelector('.promise-3d__arrow--prev');
    var nextBtn = root.querySelector('.promise-3d__arrow--next');
    var active = 0;
    var direction = 0;
    var timer = null;
    var revealTimer = null;
    var animating = false;
    var prevOffsets = [];

    function buildDots() {
      dotsWrap.innerHTML = '';
      cards.forEach(function (_, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'promise-3d__dot';
        btn.setAttribute('aria-label', '사례 ' + (i + 1));
        btn.addEventListener('click', function () {
          goTo(i);
          startAuto();
        });
        dotsWrap.appendChild(btn);
      });
    }

    function circularOffset(index) {
      var count = cards.length;
      var offset = index - active;

      while (offset > count / 2) offset -= count;
      while (offset < -count / 2) offset += count;

      return offset;
    }

    function applyTransform(card, offset, scale) {
      if (scale === undefined) {
        scale = offset === 0 ? 1 : SIDE_SCALE;
      }
      card.style.transform =
        'translateX(calc(-50% + ' + (offset * cardSpacing()) + 'px)) scale(' + scale + ')';
    }

    function applyVisibleState(card, offset) {
      card.style.visibility = 'visible';
      card.style.opacity = offset === 0 ? '1' : String(SIDE_OPACITY);
      card.style.filter = offset === 0 ? 'none' : SIDE_FILTER;
      card.style.zIndex = offset === 0 ? '30' : '10';
      card.style.pointerEvents = 'auto';
      card.classList.toggle('is-active', offset === 0);
      card.classList.toggle('is-side', offset !== 0);
    }

    function hideCard(card, offset) {
      card.style.transition = 'none';
      applyTransform(card, offset);
      card.style.opacity = '0';
      card.style.filter = '';
      card.style.visibility = 'hidden';
      card.style.pointerEvents = 'none';
      card.classList.remove('is-active', 'is-side');
    }

    function isExitingCard(prev) {
      if (!animating || reducedMotion()) return false;
      if (direction === 1 && prev === -1) return true;
      if (direction === -1 && prev === 1) return true;
      return false;
    }

    function exitOffset() {
      return direction === 1 ? -2 : 2;
    }

    function layout() {
      var enteringCards = [];
      var exitingCards = [];

      cards.forEach(function (card, i) {
        var offset = circularOffset(i);
        var prev = prevOffsets[i];
        var abs = Math.abs(offset);
        var entering = (offset === 1 && prev === 2) || (offset === -1 && prev === -2);
        var exiting = isExitingCard(prev);

        if (exiting) {
          card.style.transition = 'none';
          applyTransform(card, prev);
          card.style.opacity = String(SIDE_OPACITY);
          card.style.filter = SIDE_FILTER;
          card.style.visibility = 'visible';
          card.style.zIndex = '5';
          card.style.pointerEvents = 'none';
          card.classList.remove('is-active', 'is-side');
          exitingCards.push(card);
          prevOffsets[i] = offset;
          return;
        }

        var visible = abs <= 1 || entering;

        if (!visible) {
          hideCard(card, offset);
          prevOffsets[i] = offset;
          return;
        }

        if (entering && animating && !(window.LandingMotion && LandingMotion.prefersReduced())) {
          card.style.transition = 'none';
          applyTransform(card, prev);
          card.style.visibility = 'visible';
          card.style.opacity = String(SIDE_OPACITY);
          card.style.filter = SIDE_FILTER;
          card.style.zIndex = '10';
          card.style.pointerEvents = 'none';
          card.classList.remove('is-active');
          card.classList.toggle('is-side', true);
          enteringCards.push(card);
        } else {
          card.style.transition = '';
          applyTransform(card, offset);
          applyVisibleState(card, offset);
        }

        prevOffsets[i] = offset;
      });

      if (exitingCards.length) {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            exitingCards.forEach(function (card) {
              card.style.transition = '';
              applyTransform(card, exitOffset(), EXIT_SCALE);
              card.style.opacity = '0';
              card.style.filter = SIDE_FILTER;
            });
          });
        });
      }

      if (enteringCards.length) {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            enteringCards.forEach(function (card) {
              var idx = Array.prototype.indexOf.call(cards, card);
              card.style.transition = '';
              applyTransform(card, circularOffset(idx));
              applyVisibleState(card, circularOffset(idx));
            });
          });
        });
      }

      dotsWrap.querySelectorAll('.promise-3d__dot').forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === active);
      });
    }

    function scheduleReveal() {
      if (revealTimer) {
        clearTimeout(revealTimer);
        revealTimer = null;
      }
      if (window.LandingMotion && LandingMotion.prefersReduced()) {
        animating = false;
        direction = 0;
        return;
      }
      revealTimer = window.setTimeout(function () {
        animating = false;
        direction = 0;
        revealTimer = null;
        layout();
      }, TRANSITION_MS);
    }

    function goTo(index) {
      var count = cards.length;
      var newActive = (index + count) % count;
      var diff = newActive - active;

      if (diff > count / 2) diff -= count;
      if (diff < -count / 2) diff += count;

      direction = diff > 0 ? 1 : diff < 0 ? -1 : 0;
      active = newActive;

      if (!reducedMotion() && direction !== 0) {
        animating = true;
      }

      layout();
      scheduleReveal();
    }

    function next() {
      goTo(active + 1);
    }

    function prev() {
      goTo(active - 1);
    }

    function stopAuto() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function startAuto() {
      stopAuto();
      if ((window.LandingMotion && LandingMotion.prefersReduced()) || cards.length < 2) return;
      timer = window.setInterval(next, AUTO_MS);
    }

    buildDots();
    layout();
    startAuto();

    cards.forEach(function (card, i) {
      card.addEventListener('click', function (e) {
        if (animating) return;
        var offset = circularOffset(i);
        if (Math.abs(offset) !== 1) return;
        e.stopPropagation();
        goTo(i);
        startAuto();
      });
    });

    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); startAuto(); });

    root.addEventListener('mouseenter', stopAuto);
    root.addEventListener('mouseleave', startAuto);
    root.addEventListener('focusin', stopAuto);
    root.addEventListener('focusout', startAuto);

    window.addEventListener('resize', layout);

    return { layout: layout };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createCasesCarousel);
  } else {
    createCasesCarousel();
  }
})();
