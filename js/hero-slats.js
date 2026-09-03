(function () {
  if (!window.anime) return;

  var stack = document.getElementById('isostack');
  if (!stack) return;

  var animate        = anime.animate;
  var createTimeline = anime.createTimeline;
  var stagger        = anime.stagger;
  var utils          = anime.utils;

  var group = stack.querySelector('.iso-slats');
  var bar   = stack.querySelector('.iso-bar');
  var hero  = document.querySelector('.hero');

  var underline = document.querySelector('.hero h1 .mark .ul');
  var isoBar    = document.querySelector('header.nav .logo .iso rect');

  var copy = [
    document.querySelector('.hero-copy .eyebrow'),
    document.querySelector('.hero-copy h1'),
    document.querySelector('.hero-copy .hero-sub'),
    document.querySelector('.hero-copy .hero-cta')
  ].filter(Boolean);

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce) {
    if (underline) {
      utils.set(underline, { scaleX: 1 });
    }
    copy.forEach(function (el) {
      utils.set(el, { opacity: 1, y: 0 });
    });
    return;
  }

  /* ---- geometría del círculo por láminas ---- */
  var CX = 180;
  var CY = 180;
  var R = 140;
  var SLATS = 15;
  var GAP = 2.2;
  var pitch = (R * 2) / SLATS;
  var h = pitch - GAP;
  var mid = (SLATS - 1) / 2;

  var NS = 'http://www.w3.org/2000/svg';
  var slats = [];

  for (var i = 0; i < SLATS; i++) {
    var yc = CY - R + (i + 0.5) * pitch;
    var half = Math.sqrt(Math.max(0, R * R - (yc - CY) * (yc - CY)));
    var rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', (CX - half).toFixed(2));
    rect.setAttribute('y', (yc - h / 2).toFixed(2));
    rect.setAttribute('width', (half * 2).toFixed(2));
    rect.setAttribute('height', h.toFixed(2));
    rect.setAttribute('rx', Math.min(h / 2, 9).toFixed(2));
    rect.setAttribute('fill', '#4FB3E8');
    group.appendChild(rect);
    slats.push(rect);
  }

  stack.classList.add('js');

  function noise(i, salt) {
    var x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function signed(i, salt) {
    return noise(i, salt) * 2 - 1;
  }

  function edge(i) {
    return Math.abs(i - mid) / mid;
  }

  /* ---- 1 · montaje al cargar ---- */
  utils.set(slats, {
    opacity: 0,
    translateX: function (el, i) {
      return signed(i, 1) * 150;
    },
    translateY: function (el, i) {
      return (i - mid) * 26;
    },
    rotate: function (el, i) {
      return signed(i, 2) * 34;
    },
    scaleX: 0.55
  });

  utils.set(bar, {
    opacity: 0,
    scaleX: 0
  });

  if (underline) {
    utils.set(underline, { scaleX: 0 });
  }

  copy.forEach(function (el) {
    utils.set(el, { opacity: 0, y: 20 });
  });

  var done = false;

  var intro = createTimeline({
    defaults: { ease: 'out(3)' },
    autoplay: false,
    onComplete: function () {
      done = true;
      armScroll();
    }
  });

  intro.add(copy, {
    opacity: 1,
    y: 0,
    duration: 760,
    delay: stagger(90)
  }, 0);

  intro.add(slats, {
    opacity: 1,
    translateX: 0,
    translateY: 0,
    rotate: 0,
    scaleX: 1,
    duration: 1100,
    ease: 'out(4)',
    delay: stagger(55, { from: 'center' })
  }, 260);

  /* y encima barre la barra plana */
  intro.add(bar, {
    opacity: 1,
    duration: 1
  }, 1500);

  intro.add(bar, {
    scaleX: [0, 1],
    duration: 760,
    ease: 'out(4)'
  }, 1500);

  if (underline) {
    intro.add(underline, {
      scaleX: [0, 1],
      duration: 820,
      ease: 'out(3)'
    }, 1560);
  }

  if (isoBar) {
    intro.add(isoBar, {
      width: [56, 64, 56],
      x: [22, 18, 22],
      fill: ['#FFD75E', '#FFFFFF', '#FFD75E'],
      duration: 620,
      ease: 'inOutQuad'
    }, 1700);
  }

  /* ---- 2 · desmontaje atado al scroll ---- */
  var scrollTl = null;

  function armScroll() {
    if (scrollTl || !hero) return;

    scrollTl = createTimeline({
      defaults: { ease: 'inOutQuad' },
      autoplay: false
    });

    slats.forEach(function (el, i) {
      var e = edge(i);
      var at = Math.round((1 - e) * 300);

      scrollTl.add(el, {
        translateX: [0, signed(i, 3) * (90 + e * 230)],
        translateY: [0, (i - mid) * 34 + signed(i, 4) * 30],
        rotate: [0, signed(i, 5) * (14 + e * 30)],
        opacity: [1, 0],
        duration: 700
      }, at);
    });

    var RANGE = 0.5;

    function measure() {
      var r = hero.getBoundingClientRect();
      var p = -r.top / Math.max(1, r.height * RANGE);
      if (p < 0) return 0;
      if (p > 1) return 1;
      return p;
    }

    var aim = measure();
    var shown = aim;
    var ticking = false;

    function frame() {
      ticking = false;
      aim = measure();
      shown += (aim - shown) * 0.18;
      if (Math.abs(aim - shown) < 0.0005) {
        shown = aim;
      }
      scrollTl.seek(scrollTl.duration * shown);
      if (shown !== aim) {
        kick();
      }
    }

    function kick() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(frame);
    }

    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', kick);
    scrollTl.seek(scrollTl.duration * shown);
    kick();
  }

  /* ---- red de seguridad ---- */
  var TOTAL_MS = 2320;

  function watchdog() {
    if (done) return;
    if (document.visibilityState !== 'visible') {
      setTimeout(watchdog, 2000);
      return;
    }
    utils.set(slats, {
      opacity: 1,
      translateX: 0,
      translateY: 0,
      rotate: 0,
      scaleX: 1
    });
    utils.set(bar, {
      opacity: 1,
      scaleX: 1
    });
    if (underline) {
      utils.set(underline, { scaleX: 1 });
    }
    copy.forEach(function (el) {
      utils.set(el, { opacity: 1, y: 0 });
    });
    done = true;
    armScroll();
  }

  intro.play();
  setTimeout(watchdog, TOTAL_MS + 1400);
})();
