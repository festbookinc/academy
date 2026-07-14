(function () {
  'use strict';

  var LOOP_MS = 14000;
  var DRAG_THRESHOLD = 8;

  function prefersReducedMotion() {
    return window.LandingMotion && LandingMotion.prefersReduced();
  }

  function init() {
    var root = document.getElementById('bookstore-carousel');
    var viewport = document.querySelector('.i-bookstore-carousel__viewport');
    var track = document.getElementById('bookstore-carousel-track');
    var set = document.getElementById('bookstore-carousel-set');
    if (!root || !viewport || !track || !set) return;

    var state = {
      offset: 0,
      loopW: 0,
      dragging: false,
      startX: 0,
      startOff: 0,
      raf: null,
      last: 0,
      auto: false,
      active: false,
      inView: true
    };

    var touchDrag = {
      pending: false,
      pointerId: null,
      startX: 0,
      startY: 0
    };

    function measure() {
      state.loopW = set.getBoundingClientRect().width;
      if (state.loopW <= 0) {
        state.loopW = set.offsetWidth;
      }
      if (state.loopW <= 0 && track.scrollWidth > 0) {
        var setCount = track.querySelectorAll('.i-bookstore-carousel__set').length || 1;
        state.loopW = track.scrollWidth / setCount;
      }
    }

    function wrapOffsetLocal() {
      if (window.MarqueeLoop) {
        state.offset = MarqueeLoop.wrapOffset(state.offset, state.loopW);
      } else {
        if (state.loopW <= 0) return;
        while (state.offset > 0) state.offset -= state.loopW;
        while (state.offset <= -state.loopW) state.offset += state.loopW;
      }
    }

    function render() {
      track.style.transform = 'translate3d(' + state.offset + 'px, 0, 0)';
    }

    function frame(now) {
      if (!state.active) return;
      if (!state.last) state.last = now;
      if (state.auto && !state.dragging && state.inView && state.loopW > 0) {
        var dt = now - state.last;
        state.offset -= (state.loopW / LOOP_MS) * dt;
        wrapOffsetLocal();
        render();
      }
      state.last = now;
      if (state.inView || state.dragging) {
        state.raf = requestAnimationFrame(frame);
      } else {
        state.raf = null;
        state.last = 0;
      }
    }

    function startLoop() {
      if (!state.raf) {
        state.last = 0;
        state.raf = requestAnimationFrame(frame);
      }
    }

    function stopLoop() {
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = null;
      state.last = 0;
    }

    function startAuto() {
      if (!state.active || prefersReducedMotion() || !(window.LandingMotion && LandingMotion.isOn())) return;
      state.auto = true;
      startLoop();
    }

    function stopAuto() {
      state.auto = false;
    }

    function removeClones() {
      track.querySelectorAll('.i-bookstore-carousel__set--clone').forEach(function (el) {
        el.remove();
      });
    }

    function buildClone() {
      var clone = set.cloneNode(true);
      clone.classList.add('i-bookstore-carousel__set--clone');
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(function (el) {
        el.removeAttribute('id');
      });
      clone.querySelectorAll('[data-a]').forEach(function (el) {
        el.removeAttribute('data-a');
        el.removeAttribute('data-d');
      });
      return clone;
    }

    function ensureTrackFill() {
      removeClones();
      track.appendChild(buildClone());
      measure();

      var minTrackWidth = viewport.clientWidth + state.loopW;
      while (track.scrollWidth < minTrackWidth && state.loopW > 0) {
        track.appendChild(buildClone());
      }
    }

    function teardownLoop() {
      state.active = false;
      state.auto = false;
      state.dragging = false;
      touchDrag.pending = false;
      touchDrag.pointerId = null;
      stopLoop();
      state.offset = 0;
      track.style.transform = '';
      viewport.classList.remove('is-loop-active', 'is-dragging');
      removeClones();
      root.classList.add('is-static');
    }

    function setupLoop() {
      teardownLoop();
      if (prefersReducedMotion() || !(window.LandingMotion && LandingMotion.isOn())) return;

      root.classList.remove('is-static');
      ensureTrackFill();
      wrapOffsetLocal();
      render();

      state.active = true;
      viewport.classList.add('is-loop-active');
      startAuto();
      startLoop();
    }

    function refreshLayout() {
      if (!state.active) {
        setupLoop();
        return;
      }
      var ratio = state.loopW > 0 ? state.offset / state.loopW : 0;
      ensureTrackFill();
      state.offset = ratio * state.loopW;
      wrapOffsetLocal();
      render();
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
      startAuto();
    }

    function unbindDocDrag() {
      document.removeEventListener('pointermove', onDocPointerMove);
      document.removeEventListener('pointerup', onDocPointerUp);
      document.removeEventListener('pointercancel', onDocPointerUp);
      document.removeEventListener('mousemove', onDocMouseMove);
      document.removeEventListener('mouseup', onDocMouseUp);
    }

    function unbindTouchIntent() {
      viewport.removeEventListener('pointermove', onTouchIntentMove);
      viewport.removeEventListener('pointerup', onTouchIntentEnd);
      viewport.removeEventListener('pointercancel', onTouchIntentEnd);
    }

    function onDocPointerMove(e) {
      if (!state.dragging) return;
      e.preventDefault();
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
      stopAuto();
      unbindDocDrag();
      document.addEventListener('pointermove', onDocPointerMove, { passive: false });
      document.addEventListener('pointerup', onDocPointerUp);
      document.addEventListener('pointercancel', onDocPointerUp);
      document.addEventListener('mousemove', onDocMouseMove);
      document.addEventListener('mouseup', onDocMouseUp);
    }

    function onTouchIntentMove(e) {
      if (!touchDrag.pending || e.pointerId !== touchDrag.pointerId) return;

      var dx = e.clientX - touchDrag.startX;
      var dy = e.clientY - touchDrag.startY;

      if (Math.abs(dx) > DRAG_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        touchDrag.pending = false;
        unbindTouchIntent();
        beginDrag(touchDrag.startX);
        moveDrag(e.clientX);
        e.preventDefault();
      } else if (Math.abs(dy) > DRAG_THRESHOLD && Math.abs(dy) >= Math.abs(dx)) {
        touchDrag.pending = false;
        unbindTouchIntent();
      }
    }

    function onTouchIntentEnd(e) {
      if (e.pointerId !== touchDrag.pointerId) return;
      touchDrag.pending = false;
      touchDrag.pointerId = null;
      unbindTouchIntent();
    }

    function onPointerDown(e) {
      if (!state.active) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      if (e.pointerType === 'mouse') {
        e.preventDefault();
        beginDrag(e.clientX);
        return;
      }

      touchDrag.pending = true;
      touchDrag.pointerId = e.pointerId;
      touchDrag.startX = e.clientX;
      touchDrag.startY = e.clientY;
      state.startOff = state.offset;
      unbindTouchIntent();
      viewport.addEventListener('pointermove', onTouchIntentMove, { passive: false });
      viewport.addEventListener('pointerup', onTouchIntentEnd);
      viewport.addEventListener('pointercancel', onTouchIntentEnd);
    }

    function onMouseDown(e) {
      if (window.PointerEvent) return;
      if (!state.active || e.button !== 0) return;
      e.preventDefault();
      beginDrag(e.clientX);
    }

    viewport.addEventListener('pointerdown', onPointerDown, { passive: false });
    viewport.addEventListener('mousedown', onMouseDown);
    viewport.addEventListener('mouseenter', stopAuto);
    viewport.addEventListener('mouseleave', startAuto);

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        state.inView = entries[0].isIntersecting;
        if (state.inView) {
          if (!state.active || state.loopW <= 0) {
            refreshLayout();
          }
          startAuto();
          startLoop();
        } else {
          stopAuto();
          if (!state.dragging) stopLoop();
        }
      }, { threshold: 0.08, rootMargin: '48px 0px' });
      observer.observe(root);
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(refreshLayout, 150);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopAuto();
      else if (state.inView) startAuto();
    });

    function boot() {
      function runSetup() {
        requestAnimationFrame(function () {
          requestAnimationFrame(setupLoop);
        });
      }

      runSetup();

      set.querySelectorAll('img').forEach(function (img) {
        if (img.complete) return;
        img.addEventListener('load', refreshLayout, { once: true });
        img.addEventListener('error', refreshLayout, { once: true });
      });

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(refreshLayout);
      }
    }

    function refreshBookstoreCarousel() {
      if (prefersReducedMotion() || !(window.LandingMotion && LandingMotion.isOn())) {
        teardownLoop();
      } else {
        refreshLayout();
      }
    }

    if (window.StyleLab) StyleLab.onRefresh('bookstoreCarousel', refreshBookstoreCarousel);

    boot();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
