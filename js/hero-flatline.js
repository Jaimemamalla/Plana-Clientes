(function () {
  if (!window.anime) return;

  var card = document.getElementById('flatcard');
  if (!card) return;

  var createTimeline = anime.createTimeline;
  var createSpring   = anime.createSpring;
  var utils          = anime.utils;

  /* ---- piezas ---- */
  var ekg  = card.querySelector('.ekg');
  var line = ekg.querySelector('.line');
  var head = ekg.querySelector('.head');

  var vacEl    = card.querySelector('.fc-top [data-count]');
  var agencyEl = card.querySelector('.fc-old [data-count]');
  var cutEl    = card.querySelector('.fc-old .cut');
  var planaEl  = card.querySelector('.fc-new [data-count]');
  var newBlock = card.querySelector('.fc-new');
  var savePill = card.querySelector('.fc-save');
  var saveEl   = card.querySelector('.fc-save [data-count]');
  var replay   = document.getElementById('fcReplay');

  var underline = document.querySelector('.hero h1 .mark .ul');
  var isoBar    = document.querySelector('header.nav .logo .iso rect');

  var copy = [
    document.querySelector('.hero-copy .eyebrow'),
    document.querySelector('.hero-copy h1'),
    document.querySelector('.hero-copy .hero-sub'),
    document.querySelector('.hero-copy .hero-cta')
  ].filter(Boolean);

  /* ---- formato de cifras ---- */
  var nf;
  try { nf = new Intl.NumberFormat('es-ES', { useGrouping: 'always' }); }
  catch (e) { nf = new Intl.NumberFormat('es-ES'); }

  function money(el, v) {
    if (!el) return;
    el.textContent = nf.format(Math.round(v)) + (el.getAttribute('data-suffix') || '');
  }

  var n = { vac: 0, agencia: 0, plana: 0, ahorro: 0 };

  /* ---- el trazo ----
     La x crece siempre a lo largo del path, así que se puede buscar por
     bisección a qué punto del recorrido corresponde cada x. De ahí salen los
     tres picos y el punto exacto en que la línea se queda plana, en vez de
     tenerlos escritos a mano. */
  var lineLen = line.getTotalLength();

  function fracAtX(x) {
    var lo = 0;
    var hi = lineLen;
    for (var k = 0; k < 24; k++) {
      var mid = (lo + hi) / 2;
      if (line.getPointAtLength(mid).x < x) lo = mid; else hi = mid;
    }
    return ((lo + hi) / 2) / lineLen;
  }

  var FLAT_FRAC = fracAtX(204);
  var SPIKES = [fracAtX(60), fracAtX(128), fracAtX(196)];

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- estado final ---- */
  function settle() {
    utils.set(line, { strokeDashoffset: 0 });
    utils.set(head, { opacity: 0 });
    utils.set(cutEl, { scaleX: 1, opacity: 1 });
    utils.set(agencyEl, { opacity: 1 });
    utils.set(underline, { scaleX: 1 });
    utils.set(savePill, { scale: 1, opacity: 1 });
    utils.set(newBlock, { scale: 1, opacity: 1 });
    utils.set(card, { opacity: 1, y: 0, scale: 1 });
    copy.forEach(function (el) { utils.set(el, { opacity: 1, y: 0 }); });
    money(vacEl, 45000);
    money(agencyEl, 9000);
    money(planaEl, 4900);
    money(saveEl, 4100);
  }

  if (reduce) {
    settle();
    return;
  }

  /* ---- estado de partida ---- */
  function reset() {
    utils.set(line, {
      strokeDasharray: lineLen,
      strokeDashoffset: lineLen
    });
    utils.set(head, {
      strokeDasharray: '0.1 ' + lineLen,
      strokeDashoffset: 0,
      stroke: '#4FB3E8',
      opacity: 0
    });
    utils.set(cutEl, { scaleX: 0, opacity: 0 });
    utils.set(agencyEl, { opacity: 0 });
    utils.set(underline, { scaleX: 0 });
    utils.set(savePill, { scale: 0.86, opacity: 0 });
    utils.set(newBlock, { scale: 0.96, opacity: 0 });
    utils.set(card, { opacity: 0, y: 26, scale: 0.985 });
    copy.forEach(function (el) { utils.set(el, { opacity: 0, y: 20 }); });
    n.vac = n.agencia = n.plana = n.ahorro = 0;
    money(vacEl, 0);
    money(agencyEl, 0);
    money(planaEl, 0);
    money(saveEl, 0);
  }

  reset();

  var DRAW_AT = 760;
  var DRAW_MS = 2400;
  var FLAT = DRAW_AT + DRAW_MS * FLAT_FRAC;

  var done = false;
  var tl = createTimeline({
    defaults: { ease: 'outQuad' },
    autoplay: false,
    onComplete: function () { done = true; }
  });

  /* 1 · entrada */
  tl.add(copy, {
    opacity: 1,
    y: 0,
    duration: 760,
    ease: 'out(3)',
    delay: anime.stagger(90)
  }, 0);

  tl.add(card, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 820,
    ease: 'out(3)'
  }, 120);

  tl.add(n, {
    vac: 45000,
    duration: 700,
    ease: 'outExpo',
    onUpdate: function () { money(vacEl, n.vac); }
  }, 460);

  /* 2 · la línea, de un tirón: late y luego se queda plana */
  tl.add(line, {
    strokeDashoffset: 0,
    duration: DRAW_MS,
    ease: 'linear'
  }, DRAW_AT);

  tl.add(head, {
    strokeDashoffset: -lineLen,
    duration: DRAW_MS,
    ease: 'linear'
  }, DRAW_AT);

  tl.add(head, { opacity: [0, 1], duration: 180 }, DRAW_AT);
  tl.add(head, { stroke: '#FFD75E', duration: 220 }, FLAT - 110);
  tl.add(head, { opacity: 0, duration: 260 }, DRAW_AT + DRAW_MS - 260);

  tl.add(agencyEl, { opacity: 1, duration: 260 }, DRAW_AT);
  tl.add(n, {
    agencia: 9000,
    duration: FLAT - DRAW_AT - 120,
    ease: 'linear',
    onUpdate: function () { money(agencyEl, n.agencia); }
  }, DRAW_AT);

  /* un tirón en la cifra por cada latido */
  SPIKES.forEach(function (p) {
    tl.add(agencyEl, {
      scale: [1, 1.13, 1],
      duration: 380,
      ease: 'outQuad'
    }, DRAW_AT + DRAW_MS * p - 60);
  });

  /* 3 · en cuanto se aplana, el fee se tacha */
  tl.add(cutEl, { opacity: 1, duration: 1 }, FLAT + 40);
  tl.add(cutEl, { scaleX: [0, 1], duration: 380, ease: 'out(4)' }, FLAT + 40);
  tl.add(underline, { scaleX: [0, 1], duration: 820, ease: 'out(3)' }, FLAT + 60);

  if (isoBar) {
    tl.add(isoBar, {
      width: [56, 64, 56],
      x: [22, 18, 22],
      fill: ['#FFD75E', '#FFFFFF', '#FFD75E'],
      duration: 620,
      ease: 'inOutQuad'
    }, FLAT + 220);
  }

  /* 4 · aterriza Plana */
  tl.add(newBlock, {
    opacity: 1,
    scale: 1,
    duration: 620,
    ease: 'out(3)'
  }, FLAT + 320);

  tl.add(n, {
    plana: 4900,
    duration: 760,
    ease: 'outExpo',
    onUpdate: function () { money(planaEl, n.plana); }
  }, FLAT + 320);

  tl.add(savePill, {
    opacity: 1,
    scale: 1,
    duration: 900,
    ease: createSpring({ stiffness: 140, damping: 12 })
  }, FLAT + 760);

  tl.add(n, {
    ahorro: 4100,
    duration: 620,
    ease: 'outExpo',
    onUpdate: function () { money(saveEl, n.ahorro); }
  }, FLAT + 760);

  /* ---- red de seguridad ---- */
  var TOTAL_MS = FLAT + 1700;

  function watchdog() {
    if (done) return;
    if (document.visibilityState !== 'visible') {
      setTimeout(watchdog, 2000);
      return;
    }
    settle();
  }

  /* ---- disparo: cuando el hero entra en pantalla, una sola vez ---- */
  var fired = false;

  function fire() {
    if (fired) return;
    fired = true;
    tl.play();
    setTimeout(watchdog, TOTAL_MS + 1400);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          fire();
          io.disconnect();
        }
      });
    }, { threshold: 0.3 });
    io.observe(card);
    setTimeout(function () {
      if (fired) return;
      fired = true;
      io.disconnect();
      settle();
    }, 4000);
  } else {
    fire();
  }

  if (replay) {
    replay.addEventListener('click', function () {
      reset();
      tl.restart();
    });
  }
})();
