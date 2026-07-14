(function () {
  function playVideo(video) {
    if (!video) return;
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {});
    }
  }

  function initInlineVideo() {
    var player = document.getElementById('ot-video-inline');
    var preview = document.querySelector('[data-ot-video-inline]');
    var video = document.getElementById('ot-video-inline-video');
    if (!player || !preview || !video) return;

    preview.addEventListener('click', function () {
      player.classList.add('is-playing');
      playVideo(video);
    });
  }

  function initModalVideo() {
    var modal = document.getElementById('ot-video-modal');
    var video = document.getElementById('ot-video-modal-video');
    var openBtns = document.querySelectorAll('[data-ot-video-modal]');
    var closeBtn = modal && modal.querySelector('.ot-video-modal__close');
    var closeBtns = modal ? modal.querySelectorAll('[data-ot-video-close]') : [];
    var lastFocus = null;

    if (!modal || !video || !openBtns.length) return;

    function openModal() {
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('is-ot-video-open');
      if (closeBtn) closeBtn.focus();
      playVideo(video);
    }

    function closeModal() {
      video.pause();
      video.currentTime = 0;
      modal.hidden = true;
      document.body.classList.remove('is-ot-video-open');
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      }
    }

    openBtns.forEach(function (btn) {
      btn.addEventListener('click', openModal);
    });

    closeBtns.forEach(function (btn) {
      btn.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) {
        e.preventDefault();
        closeModal();
      }
    });
  }

  initInlineVideo();
  initModalVideo();
})();
