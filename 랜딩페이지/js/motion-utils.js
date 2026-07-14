(function (global) {
  global.LandingMotion = {
    isOn: function () {
      return document.documentElement.dataset.motion === 'on';
    },
    prefersReduced: function () {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  };
})(window);
