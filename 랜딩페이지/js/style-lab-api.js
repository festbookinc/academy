(function (global) {
  var hooks = {
    motion: null,
    stats: null,
    heroSubjectReel: null,
    bookstoreCarousel: null
  };

  function call(name) {
    if (typeof hooks[name] === 'function') hooks[name]();
  }

  global.StyleLab = {
    hooks: hooks,
    onRefresh: function (name, fn) {
      hooks[name] = fn;
    },
    refresh: call,
    refreshMotionChain: function () {
      call('motion');
      call('stats');
      call('heroSubjectReel');
      call('bookstoreCarousel');
    }
  };

  global.__styleLabV2RefreshMotion = function () {
    global.StyleLab.refreshMotionChain();
  };
  global.__styleLabV2RefreshStats = function () {
    call('stats');
  };
  global.__styleLabV3RefreshHeroSubjectReel = function () {
    call('heroSubjectReel');
  };
  global.__styleLabV3RefreshBookstoreCarousel = function () {
    call('bookstoreCarousel');
  };
})(window);
