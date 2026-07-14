(function () {
  var INITIAL_HOLD_MS = 1200;
  var WORD_HOLD_MS = 1800;
  var FINAL_HOLD_MS = 3600;
  var START_DELAY_MS = 1100;
  var TRANSITION_MS = 420;
  var RETURN_INDEX = 5;
  var LOOP_BRIDGE_INDEX = 6;
  var LOOP_RESUME_INDEX = 1;

  var timer = null;
  var index = 0;
  var isFirstCycle = true;

  function clearTimer() {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
  }

  function initHeroSubjectReel() {
    clearTimer();

    var reel = document.querySelector('.hero-subject-reel');
    if (!reel) return;

    var track = reel.querySelector('.hero-subject-reel__track');
    var allItems = track ? track.querySelectorAll('.hero-subject-reel__item') : [];
    if (!track || !allItems.length) return;

    index = 0;
    isFirstCycle = true;
    track.style.transition = '';
    track.style.transform = 'translateY(0)';
    reel.setAttribute('aria-label', allItems[0].textContent);

    if (!(window.LandingMotion && LandingMotion.isOn()) ||
        (window.LandingMotion && LandingMotion.prefersReduced())) return;

    function holdDuration(i) {
      if (i === 0 && isFirstCycle) return INITIAL_HOLD_MS;
      if (i === RETURN_INDEX) return FINAL_HOLD_MS;
      return WORD_HOLD_MS;
    }

    function goTo(nextIndex, animate) {
      index = nextIndex;
      if (!animate) {
        track.style.transition = 'none';
      }
      track.style.transform = 'translateY(calc(-1 * ' + index + ' * var(--hero-subject-slot, 1.2em)))';
      reel.setAttribute('aria-label', allItems[index].textContent);
      if (!animate) {
        void track.offsetHeight;
        track.style.transition = '';
      }
    }

    function waitTransition(cb) {
      var done = false;

      function finish() {
        if (done) return;
        done = true;
        track.removeEventListener('transitionend', onEnd);
        cb();
      }

      function onEnd(e) {
        if (e.target !== track || e.propertyName !== 'transform') return;
        finish();
      }

      track.addEventListener('transitionend', onEnd);
      window.setTimeout(finish, TRANSITION_MS + 40);
    }

    function scheduleNext() {
      timer = window.setTimeout(tick, holdDuration(index));
    }

    function tick() {
      if (index === RETURN_INDEX) {
        goTo(LOOP_BRIDGE_INDEX, true);
        waitTransition(function () {
          goTo(LOOP_RESUME_INDEX, false);
          isFirstCycle = false;
          scheduleNext();
        });
        return;
      }

      goTo(index + 1, true);
      scheduleNext();
    }

    timer = window.setTimeout(function () {
      scheduleNext();
    }, START_DELAY_MS);
  }

  if (window.StyleLab) StyleLab.onRefresh('heroSubjectReel', initHeroSubjectReel);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroSubjectReel);
  } else {
    initHeroSubjectReel();
  }
})();
