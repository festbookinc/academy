(function () {
  function initNavScroll() {
    var navWrap = document.getElementById('nav-wrap');
    if (!navWrap) return;

    function updateNavOnScroll() {
      navWrap.classList.toggle('is-scrolled', window.scrollY > 60);
    }

    window.addEventListener('scroll', updateNavOnScroll, { passive: true });
    updateNavOnScroll();
  }

  function setCountFinal(el) {
    var target = Number(el.dataset.target);
    if (!isNaN(target)) {
      el.textContent = target.toLocaleString();
    }
  }

  function animateCount(el) {
    var target = Number(el.dataset.target);
    if (isNaN(target)) return;

    var duration = 1800;
    var start = performance.now();

    function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var value = Math.floor(eased * target).toLocaleString();
      el.textContent = value;
      document.querySelectorAll('.stats-row--clone .count[data-target]').forEach(function (cloneCount) {
        if (Number(cloneCount.dataset.target) === target) {
          cloneCount.textContent = value;
        }
      });
      if (p < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  var counterObserver = null;

  function prefersReducedMotion() {
    return window.LandingMotion && LandingMotion.prefersReduced();
  }

  function motionEnabled() {
    return window.LandingMotion && LandingMotion.isOn();
  }

  var statsMarqueeApi = null;

  function createStatsMarquee() {
    var viewport = document.querySelector('.stats-band__viewport');
    var track = document.getElementById('stats-track');
    var row = document.getElementById('stats-row');
    if (!viewport || !track || !row) return null;

    var mq = window.matchMedia('(max-width: 719px)');
    var LOOP_MS = 18000;
    var state = {
      offset: 0,
      loopW: 0,
      dragging: false,
      startX: 0,
      startOff: 0,
      raf: null,
      last: 0,
      layout: false,
      auto: false
    };

    function syncCloneCount(clone) {
      var sources = row.querySelectorAll('.count[data-target]');
      var targets = clone.querySelectorAll('.count[data-target]');
      sources.forEach(function (source, i) {
        if (targets[i]) targets[i].textContent = source.textContent;
      });
    }

    function measure() {
      state.loopW = row.getBoundingClientRect().width;
      if (state.loopW <= 0 && track.scrollWidth > 0) {
        state.loopW = track.scrollWidth / 2;
      }
    }

    function wrapOffsetLocal() {
      if (window.MarqueeLoop) {
        state.offset = MarqueeLoop.wrapOffset(state.offset, state.loopW);
        return;
      }
      if (state.loopW <= 0) return;
      while (state.offset > 0) state.offset -= state.loopW;
      while (state.offset <= -state.loopW) state.offset += state.loopW;
    }

    function render() {
      track.style.transform = 'translate3d(' + state.offset + 'px,0,0)';
    }

    function frame(now) {
      if (!state.layout) return;
      if (!state.last) state.last = now;
      if (state.auto && !state.dragging && state.loopW > 0) {
        var dt = now - state.last;
        state.offset -= (state.loopW / LOOP_MS) * dt;
        wrapOffsetLocal();
        render();
      }
      state.last = now;
      state.raf = requestAnimationFrame(frame);
    }

    function startLoop() {
      if (state.raf) return;
      state.last = 0;
      state.raf = requestAnimationFrame(frame);
    }

    function stopLoop() {
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = null;
      state.last = 0;
    }

    function teardownMarquee() {
      state.layout = false;
      state.auto = false;
      state.dragging = false;
      stopLoop();
      state.offset = 0;
      track.style.transform = '';
      track.classList.remove('is-marquee');
      viewport.classList.remove('is-marquee-active', 'is-dragging');
      var clone = track.querySelector('.stats-row--clone');
      if (clone) clone.remove();
    }

    function moveDrag(clientX) {
      state.offset = state.startOff + (clientX - state.startX);
      wrapOffsetLocal();
      render();
    }

    function endDrag() {
      if (!state.dragging) return;
      state.dragging = false;
      viewport.classList.remove('is-dragging');
      state.last = performance.now();
    }

    function unbindDocDrag() {
      document.removeEventListener('pointermove', onDocPointerMove);
      document.removeEventListener('pointerup', onDocPointerUp);
      document.removeEventListener('pointercancel', onDocPointerUp);
      document.removeEventListener('mousemove', onDocMouseMove);
      document.removeEventListener('mouseup', onDocMouseUp);
    }

    function onDocPointerMove(e) {
      if (!state.dragging) return;
      moveDrag(e.clientX);
    }

    function onDocPointerUp() {
      endDrag();
      unbindDocDrag();
    }

    function onDocMouseMove(e) {
      if (!state.dragging) return;
      e.preventDefault();
      moveDrag(e.clientX);
    }

    function onDocMouseUp() {
      endDrag();
      unbindDocDrag();
    }

    function beginDrag(clientX) {
      if (state.dragging) return;
      state.dragging = true;
      state.startX = clientX;
      state.startOff = state.offset;
      viewport.classList.add('is-dragging');
      unbindDocDrag();
      document.addEventListener('pointermove', onDocPointerMove);
      document.addEventListener('pointerup', onDocPointerUp);
      document.addEventListener('pointercancel', onDocPointerUp);
      document.addEventListener('mousemove', onDocMouseMove);
      document.addEventListener('mouseup', onDocMouseUp);
    }

    function onPointerDown(e) {
      if (!state.layout) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault();
      beginDrag(e.clientX);
    }

    function onMouseDown(e) {
      if (window.PointerEvent) return;
      if (!state.layout || e.button !== 0) return;
      e.preventDefault();
      beginDrag(e.clientX);
    }

    viewport.addEventListener('pointerdown', onPointerDown, { passive: false });
    viewport.addEventListener('mousedown', onMouseDown);

    window.addEventListener('resize', function () {
      if (state.layout) measure();
    });

    mq.addEventListener('change', apply);

    function apply() {
      if (mq.matches) {
        var clone = track.querySelector('.stats-row--clone');
        if (!clone) {
          clone = row.cloneNode(true);
          clone.classList.add('stats-row--clone');
          clone.setAttribute('aria-hidden', 'true');
          clone.removeAttribute('id');
          clone.querySelectorAll('[data-a]').forEach(function (el) {
            el.removeAttribute('data-a');
            el.removeAttribute('data-d');
            el.classList.add('is-visible');
          });
          track.appendChild(clone);
        }
        syncCloneCount(clone);
        state.layout = true;
        state.auto = motionEnabled() && !prefersReducedMotion();
        track.classList.add('is-marquee');
        viewport.classList.add('is-marquee-active');
        requestAnimationFrame(function () {
          measure();
          render();
          startLoop();
        });
      } else {
        teardownMarquee();
      }
    }

    return { apply: apply, measure: measure };
  }

  function initStatsMarquee() {
    if (!statsMarqueeApi) {
      statsMarqueeApi = createStatsMarquee();
    }
    if (statsMarqueeApi) {
      statsMarqueeApi.apply();
    }
  }

  function initStatsCounter() {
    var row = document.getElementById('stats-row');
    var counts = row
      ? row.querySelectorAll('.count[data-target]')
      : document.querySelectorAll('.count[data-target]');
    if (!counts.length) return;

    if (counterObserver) {
      counterObserver.disconnect();
      counterObserver = null;
    }

    if (!(window.LandingMotion && LandingMotion.isOn())) {
      counts.forEach(function (el) {
        setCountFinal(el);
        document.querySelectorAll('.stats-row--clone .count[data-target]').forEach(function (cloneCount) {
          if (Number(cloneCount.dataset.target) === Number(el.dataset.target)) {
            setCountFinal(cloneCount);
          }
        });
      });
      return;
    }

    function startCount(el) {
      if (el.dataset.countAnimated === '1') return;
      el.dataset.countAnimated = '1';
      animateCount(el);
    }

    counts.forEach(function (el) {
      el.textContent = '0';
      delete el.dataset.countAnimated;
    });

    if (window.matchMedia('(max-width: 719px)').matches) {
      var band = document.querySelector('.stats-band');
      if (!band) return;

      counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          counts.forEach(startCount);
          counterObserver.unobserve(entry.target);
        });
      }, { threshold: 0.4, rootMargin: '0px 0px -8% 0px' });

      counterObserver.observe(band);
      return;
    }

    counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        startCount(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counts.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  function initNavCta() {
    var btn = document.querySelector('.nav-cta');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var target = document.getElementById('i-promo') || document.getElementById('cta');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  }

  function refresh() {
    initStatsMarquee();
    initStatsCounter();
  }

  if (window.StyleLab) StyleLab.onRefresh('stats', refresh);

  function init() {
    initNavScroll();
    initNavCta();
    initStatsMarquee();
    initStatsCounter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
