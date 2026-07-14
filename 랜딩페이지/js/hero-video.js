(function () {
  var SEGMENTS = [
    { video: 0, start: 3, end: 5, rate: 1 },
    { video: 1, start: 0, end: 1, rate: 0.7 },
    { video: 2, start: 3, end: 5, rate: 1 }
  ];

  function segmentDurationMs(segment) {
    return ((segment.end - segment.start) / segment.rate) * 1000;
  }

  function whenVideoReady(video, onReady, onError) {
    if (video.readyState >= 2) {
      onReady();
      return;
    }

    var settled = false;
    function done(fn) {
      if (settled) return;
      settled = true;
      fn();
    }

    video.addEventListener('loadeddata', function () { done(onReady); }, { once: true });
    video.addEventListener('canplay', function () { done(onReady); }, { once: true });
    video.addEventListener('error', function () { done(onError); }, { once: true });

    if (video.readyState === 0) {
      video.load();
    }
  }

  function init() {
    var root = document.querySelector('[data-hero-video-root]');
    if (!root) return;

    var videos = root.querySelectorAll('.hero__video');
    var poster = root.querySelector('.hero__poster');
    if (!videos.length) return;

    if (window.LandingMotion && LandingMotion.prefersReduced()) {
      if (poster) poster.classList.remove('is-hidden');
      return;
    }

    document.documentElement.dataset.heroVideo = 'on';

    var segmentIndex = 0;
    var segmentTimer = null;
    var rafId = null;
    var running = false;

    function clearSegmentTimers() {
      if (segmentTimer) {
        clearTimeout(segmentTimer);
        segmentTimer = null;
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function showPosterFallback() {
      if (poster) poster.classList.remove('is-hidden');
      videos.forEach(function (video) {
        video.classList.remove('is-active');
      });
    }

    function setActive(index) {
      videos.forEach(function (video, i) {
        video.classList.toggle('is-active', i === index);
      });
    }

    function hidePoster() {
      if (poster) poster.classList.add('is-hidden');
    }

    function pauseAll() {
      videos.forEach(function (video) {
        video.pause();
      });
    }

    function preloadNext(nextSegmentIndex) {
      var next = SEGMENTS[nextSegmentIndex];
      if (!next) return;
      var video = videos[next.video];
      if (!video || video.readyState >= 2) return;
      video.preload = 'auto';
      if (video.readyState === 0) video.load();
    }

    function advanceSegment() {
      clearSegmentTimers();
      segmentIndex += 1;
      if (segmentIndex >= SEGMENTS.length) {
        segmentIndex = 0;
      }
      startSegment(segmentIndex);
    }

    function watchSegmentEnd(video, segment, onEnd) {
      function tick() {
        if (!running) return;
        if (video.currentTime >= segment.end - 0.04) {
          onEnd();
          return;
        }
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    }

    function startSegment(index) {
      clearSegmentTimers();
      var segment = SEGMENTS[index];
      var video = videos[segment.video];
      if (!video) return;

      pauseAll();
      setActive(segment.video);
      preloadNext((index + 1) % SEGMENTS.length);

      whenVideoReady(
        video,
        function playSegment() {
          video.currentTime = segment.start;
          video.playbackRate = segment.rate;

          var playPromise = video.play();
          var durationMs = segmentDurationMs(segment);

          function onSegmentDone() {
            video.pause();
            advanceSegment();
          }

          if (!playPromise || !playPromise.then) {
            hidePoster();
            watchSegmentEnd(video, segment, onSegmentDone);
            segmentTimer = setTimeout(onSegmentDone, durationMs + 80);
            return;
          }

          playPromise
            .then(function () {
              hidePoster();
              watchSegmentEnd(video, segment, onSegmentDone);
              segmentTimer = setTimeout(onSegmentDone, durationMs + 80);
            })
            .catch(function () {
              showPosterFallback();
            });
        },
        showPosterFallback
      );
    }

    running = true;
    videos.forEach(function (video, i) {
      if (i === 0 || i === 1 || i === 2) {
        video.preload = 'auto';
        if (video.readyState === 0) video.load();
      }
    });
    startSegment(0);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        pauseAll();
        clearSegmentTimers();
      } else if (running) {
        startSegment(segmentIndex);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
