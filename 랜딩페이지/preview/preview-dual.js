(function () {
  var DEVICE_W = 390;
  var DEVICE_H = 844;
  var MOBILE_SRC = 'index.html';
  var mobileFrame = document.getElementById('frame-mobile');
  var desktopFrame = document.getElementById('frame-desktop');
  var previewGrid = document.getElementById('preview-grid');
  var viewButtons = document.querySelectorAll('.preview-view-modes__btn');
  var mobileFit = document.getElementById('mobile-fit');
  var mobileScaler = document.getElementById('mobile-scaler');
  var mobileDevice = mobileScaler && mobileScaler.querySelector('.preview-device');

  function fitMobileDevice() {
    if (!mobileFit || !mobileScaler || !mobileDevice) return;
    if (previewGrid && previewGrid.dataset.view === 'desktop') return;
    var padY = 40;
    var availH = mobileFit.clientHeight - padY;
    var availW = mobileFit.clientWidth - 32;
    var scale = Math.min(1, availH / DEVICE_H, availW / DEVICE_W);
    mobileDevice.style.transform = scale < 1 ? 'scale(' + scale + ')' : '';
    mobileScaler.style.width = Math.round(DEVICE_W * scale) + 'px';
    mobileScaler.style.height = Math.round(DEVICE_H * scale) + 'px';
  }

  function refreshFrames() {
    mobileFrame.src = MOBILE_SRC;
    desktopFrame.src = 'index.html';
  }

  function syncViewButtons(view) {
    viewButtons.forEach(function (btn) {
      var active = btn.dataset.view === view;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function setView(view) {
    if (!previewGrid) return;
    previewGrid.dataset.view = view;
    syncViewButtons(view);
    fitMobileDevice();
  }

  viewButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setView(btn.dataset.view || 'both');
    });
  });

  document.getElementById('btn-refresh').addEventListener('click', refreshFrames);

  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
      e.preventDefault();
      refreshFrames();
    }
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '1') {
      e.preventDefault();
      setView('both');
    }
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '2') {
      e.preventDefault();
      setView('mobile');
    }
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '3') {
      e.preventDefault();
      setView('desktop');
    }
  });

  window.addEventListener('resize', fitMobileDevice);
  if (window.ResizeObserver && mobileFit) {
    new ResizeObserver(fitMobileDevice).observe(mobileFit);
  }
  if (window.ResizeObserver && previewGrid) {
    new ResizeObserver(fitMobileDevice).observe(previewGrid);
  }
  setView('both');
  fitMobileDevice();
})();
