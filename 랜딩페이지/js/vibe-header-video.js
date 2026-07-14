(function () {
  function initOne(root, videoSelector, posterSelector) {
    if (!root || !window.VideoInView) return;
    var video = root.querySelector(videoSelector);
    if (!video) return;
    VideoInView.init({
      root: root,
      video: video,
      poster: posterSelector ? root.querySelector(posterSelector) : null,
      observeTarget: root.closest('figure') || root,
      threshold: 0.25
    });
  }

  function initPromiseVideo() {
    var root = document.querySelector('[data-promise-video-root]');
    if (!root) return;

    var figure = root.closest('figure');
    var tablist = figure && figure.querySelector('[role="tablist"]');
    var tabs = tablist ? Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]')) : [];
    var panels = root.querySelectorAll('[role="tabpanel"]');
    var videos = root.querySelectorAll('[data-promise-video]');

    if (!videos.length) return;

    function markReady() {
      root.classList.add('is-video-ready');
    }

    var firstVideo = videos[0];
    if (firstVideo.readyState >= 2) {
      markReady();
    } else {
      firstVideo.addEventListener('loadeddata', markReady, { once: true });
    }

    if (!tabs.length) {
      if (!window.VideoInView) return;
      VideoInView.init({
        root: root,
        video: firstVideo,
        poster: null,
        observeTarget: figure || root,
        threshold: 0.25
      });
      return;
    }

    function getActiveVideo() {
      var panel = root.querySelector('[role="tabpanel"]:not([hidden])');
      return panel ? panel.querySelector('[data-promise-video]') : null;
    }

    function pauseAll() {
      videos.forEach(function (video) {
        video.pause();
      });
    }

    function playActiveIfVisible() {
      var LM = window.LandingMotion;
      if (LM && (!LM.isOn() || LM.prefersReduced())) return;

      var video = getActiveVideo();
      if (!video) return;

      var observeTarget = figure || root;
      var rect = observeTarget.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        var playPromise = video.play();
        if (playPromise && playPromise.catch) playPromise.catch(function () {});
      }
    }

    function activateTab(tab) {
      if (!tab) return;

      var panelId = tab.getAttribute('aria-controls');
      var panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) return;

      tabs.forEach(function (item) {
        var selected = item === tab;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-selected', selected ? 'true' : 'false');
        item.tabIndex = selected ? 0 : -1;
      });

      Array.prototype.forEach.call(panels, function (item) {
        var isActive = item === panel;
        item.hidden = !isActive;
        item.classList.toggle('is-active', isActive);
      });

      pauseAll();
      playActiveIfVisible();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        activateTab(tab);
      });

      tab.addEventListener('keydown', function (event) {
        var nextIndex = null;

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          nextIndex = (index + 1) % tabs.length;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          nextIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === 'Home') {
          nextIndex = 0;
        } else if (event.key === 'End') {
          nextIndex = tabs.length - 1;
        }

        if (nextIndex == null) return;

        event.preventDefault();
        tabs[nextIndex].focus();
        activateTab(tabs[nextIndex]);
      });
    });

    videos.forEach(function (video) {
      video.classList.add('is-active');
    });

    var LM = window.LandingMotion;
    if (LM && LM.isOn() && !LM.prefersReduced()) {
      var observeTarget = figure || root;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) playActiveIfVisible();
          else pauseAll();
        });
      }, { threshold: 0.25 });

      io.observe(observeTarget);
    }

    activateTab(tabs[0]);
  }

  function init() {
    initOne(
      document.querySelector('[data-vibe-video-root]'),
      '.vibe-header-illust__video',
      '.vibe-header-illust__poster'
    );
    initPromiseVideo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
