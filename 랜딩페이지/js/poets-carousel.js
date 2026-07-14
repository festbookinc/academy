(function () {
  'use strict';

  var AUTO_MS = 5500;

  function init() {
    var root = document.getElementById('i-poets-carousel');
    var track = document.getElementById('i-poets-carousel-track');
    var dotsWrap = document.getElementById('i-poets-carousel-dots');
    var viewport = root && root.querySelector('.i-poets-carousel__viewport');
    if (!root || !track || !dotsWrap || !viewport || !window.CarouselAutoplay) return;

    var cards = track.querySelectorAll('.i-poets-card');
    if (!cards.length) return;

    var active = 0;
    var prevBtn = root.querySelector('.i-poets-carousel__arrow--prev');
    var nextBtn = root.querySelector('.i-poets-carousel__arrow--next');

    var dots = CarouselAutoplay.buildDots(dotsWrap, cards.length, {
      dotClass: 'i-poets-carousel__dot',
      labelPrefix: '시인',
      onSelect: function (i) {
        goTo(i);
        autoplay.start();
      }
    });

    function measureMaxHeight() {
      var prev = active;
      var maxH = 0;
      cards.forEach(function (_, i) {
        goTo(i);
        maxH = Math.max(maxH, track.offsetHeight);
      });
      goTo(prev);
      viewport.style.minHeight = maxH + 'px';
    }

    function goTo(index) {
      active = (index + cards.length) % cards.length;
      cards.forEach(function (card, i) {
        card.classList.toggle('is-active', i === active);
      });
      dots.setActive(active);
    }

    function next() {
      goTo(active + 1);
    }

    function prev() {
      goTo(active - 1);
    }

    var autoplay = CarouselAutoplay.createAutoplay(function () {
      if (cards.length >= 2) next();
    }, AUTO_MS);

    goTo(0);
    measureMaxHeight();
    autoplay.start();

    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); autoplay.start(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); autoplay.start(); });

    CarouselAutoplay.bindHoverPause(root, autoplay.stop, autoplay.start);
    window.addEventListener('resize', measureMaxHeight);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
