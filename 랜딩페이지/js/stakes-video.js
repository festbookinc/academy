(function () {
  function init() {
    var root = document.querySelector('[data-stakes-video-root]');
    if (!root || !window.VideoInView) return;

    var bg = root.closest('.hero__bg');
    VideoInView.init({
      root: root,
      video: root.querySelector('.hero__video'),
      poster: bg ? bg.querySelector('.hero__poster') : null,
      observeTarget: root.closest('.section--i-stakes') || root,
      threshold: 0.2
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
