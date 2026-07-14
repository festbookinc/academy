(function (global) {
  function playWithFallback(video, poster) {
    var playPromise = video.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () {
        video.classList.remove('is-active');
        if (poster) poster.classList.remove('is-hidden');
      });
    }
  }

  global.VideoInView = {
    init: function (opts) {
      var LM = global.LandingMotion;
      if (!LM || !LM.isOn() || LM.prefersReduced()) return;

      var root = opts.root;
      var video = opts.video;
      var poster = opts.poster;
      if (!root || !video) return;

      if (poster) poster.classList.add('is-hidden');
      video.classList.add('is-active');

      function play() {
        playWithFallback(video, poster);
      }

      var observeTarget = opts.observeTarget || root;
      var threshold = opts.threshold != null ? opts.threshold : 0.2;

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) play();
          else video.pause();
        });
      }, { threshold: threshold });

      io.observe(observeTarget);

      var rect = observeTarget.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) play();
    }
  };
})(window);
