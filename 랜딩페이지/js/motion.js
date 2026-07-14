(function () {
  var OT_WORD_STEP_MS = 42;
  var OT_WORD_FADE_MS = 160;
  var OT_BLOCK_START_MS = 220;
  var OT_BLOCK_NEXT_MS = 0;

  function motionOn() {
    return window.LandingMotion && LandingMotion.isOn();
  }

  function motionReduced() {
    return window.LandingMotion && LandingMotion.prefersReduced();
  }

  function resetOtTypewriter() {
    var dialogue = document.querySelector('.ot-dialogue');
    if (dialogue) {
      delete dialogue.dataset.otSequenceRunning;
      dialogue.classList.remove('is-complete');
    }

    document.querySelectorAll('.ot-dialogue .quote-block').forEach(function (block) {
      block.classList.remove('is-typing');
      delete block.dataset.otWordCount;

      var p = block.querySelector('p');
      if (p && p.dataset.otOriginal) {
        p.innerHTML = p.dataset.otOriginal;
        delete p.dataset.otTyped;
        delete p.dataset.otOriginal;
      }
    });

    document.querySelectorAll('.ot-dialogue .hl-mark').forEach(function (mark) {
      mark.classList.remove('is-revealed');
    });
  }

  function wrapOtWords(p) {
    if (p.dataset.otTyped) return 0;

    p.dataset.otOriginal = p.innerHTML;
    p.dataset.otTyped = '1';

    var wordIndex = 0;
    var walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    var textNodes = [];

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach(function (node) {
      var text = node.textContent;
      var chunks = text.match(/\S+\s*/g);
      var frag = document.createDocumentFragment();

      if (!chunks) {
        node.parentNode.removeChild(node);
        return;
      }

      chunks.forEach(function (chunk) {
        var span = document.createElement('span');
        span.className = 'ot-word';
        span.style.setProperty('--ot-i', String(wordIndex));
        span.textContent = chunk;
        frag.appendChild(span);
        wordIndex += 1;
      });

      node.parentNode.replaceChild(frag, node);
    });

    return wordIndex;
  }

  function runOtSequence() {
    var dialogue = document.querySelector('.ot-dialogue');
    if (!dialogue || dialogue.dataset.otSequenceRunning) return;

    var blocks = dialogue.querySelectorAll('.quote-block');
    if (!blocks.length) return;

    dialogue.dataset.otSequenceRunning = '1';

    function revealHlMark() {
      dialogue.classList.add('is-complete');
      var hlMark = dialogue.querySelector('.hl-mark');
      if (!hlMark) return;
      window.requestAnimationFrame(function () {
        hlMark.classList.add('is-revealed');
      });
    }

    function playBlock(index) {
      if (index >= blocks.length) {
        delete dialogue.dataset.otSequenceRunning;
        revealHlMark();
        return;
      }

      var block = blocks[index];
      var wordCount = parseInt(block.dataset.otWordCount || '0', 10);

      var startDelay = index === 0 ? OT_BLOCK_START_MS : OT_BLOCK_NEXT_MS;

      block.classList.add('is-visible');

      window.setTimeout(function () {
        block.classList.add('is-typing');

        window.setTimeout(function () {
          playBlock(index + 1);
        }, wordCount * OT_WORD_STEP_MS + OT_WORD_FADE_MS);
      }, startDelay);
    }

    playBlock(0);
  }

  function initOtTypewriter() {
    resetOtTypewriter();
    if (!motionOn() || motionReduced()) {
      document.querySelectorAll('.ot-dialogue .quote-block').forEach(function (block) {
        block.classList.add('is-visible');
      });
      var dialogue = document.querySelector('.ot-dialogue');
      if (dialogue) dialogue.classList.add('is-complete');
      document.querySelectorAll('.ot-dialogue .hl-mark').forEach(function (mark) {
        mark.classList.add('is-revealed');
      });
      return;
    }

    document.querySelectorAll('.ot-dialogue .quote-block').forEach(function (block) {
      var p = block.querySelector('p');
      if (!p) return;
      block.dataset.otWordCount = String(wrapOtWords(p));
    });
  }

  function initOtSequenceObserver() {
    if (!motionOn() || motionReduced()) return;

    var dialogue = document.querySelector('.ot-dialogue');
    if (!dialogue) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runOtSequence();
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    io.observe(dialogue);
  }

  function applyQuoteAnims() {
    var types = ['left', 'right', 'left'];
    document.querySelectorAll('.quote-block').forEach(function (el, i) {
      el.setAttribute('data-a', types[i] || 'up');
      el.setAttribute('data-d', String(i + 1));
      el.classList.remove('is-visible', 'is-typing');
      delete el.dataset.otWordCount;
    });
  }

  function initScrollObserver() {
    if (!motionOn()) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    document.querySelectorAll('[data-a]').forEach(function (el) {
      if (el.classList.contains('quote-block') && el.closest('.ot-dialogue')) return;
      if (el.classList.contains('i-bookstore__photo') && el.closest('#bookstore-carousel')) return;
      io.observe(el);
    });
  }

  function initHeroEntrance() {
    var heroItems = document.querySelectorAll('[data-m="in"]');

    if (!motionOn()) {
      heroItems.forEach(function (el) { el.classList.add('is-loaded'); });
      document.querySelectorAll('[data-a]').forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    heroItems.forEach(function (el) { el.classList.remove('is-loaded'); });
    void document.documentElement.offsetHeight;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        heroItems.forEach(function (el) { el.classList.add('is-loaded'); });
      });
    });
  }

  function refresh() {
    applyQuoteAnims();
    initOtTypewriter();
    initHeroEntrance();
    initScrollObserver();
    initOtSequenceObserver();
    if (typeof window.__styleLabV2RefreshStats === 'function') {
      window.__styleLabV2RefreshStats();
    }
    if (typeof window.__styleLabV3RefreshHeroSubjectReel === 'function') {
      window.__styleLabV3RefreshHeroSubjectReel();
    }
    if (typeof window.__styleLabV3RefreshBookstoreCarousel === 'function') {
      window.__styleLabV3RefreshBookstoreCarousel();
    }
  }

  if (window.StyleLab) StyleLab.onRefresh('motion', refresh);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh);
  } else {
    refresh();
  }
})();
