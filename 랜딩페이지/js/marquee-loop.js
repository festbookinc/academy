(function (global) {
  function wrapOffset(offset, loopW) {
    if (loopW <= 0) return offset;
    while (offset > 0) offset -= loopW;
    while (offset <= -loopW) offset += loopW;
    return offset;
  }

  function bindDocDrag(handlers) {
    function onPointerMove(e) {
      if (handlers.onMove) handlers.onMove(e.clientX, e);
    }
    function onPointerUp() {
      if (handlers.onEnd) handlers.onEnd();
      unbind();
    }
    function onMouseMove(e) {
      if (handlers.onMove) handlers.onMove(e.clientX, e);
    }
    function onMouseUp() {
      if (handlers.onEnd) handlers.onEnd();
      unbind();
    }
    function bind() {
      global.document.addEventListener('pointermove', onPointerMove, { passive: false });
      global.document.addEventListener('pointerup', onPointerUp);
      global.document.addEventListener('pointercancel', onPointerUp);
      global.document.addEventListener('mousemove', onMouseMove);
      global.document.addEventListener('mouseup', onMouseUp);
    }
    function unbind() {
      global.document.removeEventListener('pointermove', onPointerMove);
      global.document.removeEventListener('pointerup', onPointerUp);
      global.document.removeEventListener('pointercancel', onPointerUp);
      global.document.removeEventListener('mousemove', onMouseMove);
      global.document.removeEventListener('mouseup', onMouseUp);
    }
    return { bind: bind, unbind: unbind };
  }

  function createRafLoop(tick) {
    var raf = null;
    return {
      start: function () {
        if (raf) return;
        raf = global.requestAnimationFrame(function loop(now) {
          tick(now);
          raf = global.requestAnimationFrame(loop);
        });
      },
      stop: function () {
        if (raf) global.cancelAnimationFrame(raf);
        raf = null;
      },
      isRunning: function () {
        return raf != null;
      }
    };
  }

  global.MarqueeLoop = {
    wrapOffset: wrapOffset,
    bindDocDrag: bindDocDrag,
    createRafLoop: createRafLoop
  };
})(window);
