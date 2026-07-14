(function (global) {
  try {
    var params = new URLSearchParams(global.location.search);
    global.document.documentElement.dataset.motion =
      params.get('motion') === 'off' ? 'off' : 'on';
  } catch (e) { /* ignore */ }
})(window);
