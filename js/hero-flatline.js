/* ==========================================================================
   PLANA · Hero "El fee ha muerto"
   Timeline con anime.js v4. El relato, en orden:

     1. Entra el copy y la tarjeta.
     2. El fee está vivo: el electro late tres veces mientras la cifra de
        agencia sube hasta 9.000 €. Un punto cabalga la punta del trazo.
     3. Muere: el último latido cae, el trazo se apaga en gris y un tachado
        rojo barre los 9.000 €.
     4. Se aplana: la línea amarilla cruza el resto de la tarjeta. Es el
        isotipo. A la vez se subraya "fee" en el titular y la barra del logo
        del nav se abre desde el centro.
     5. Aterriza Plana: 4.900 € cuenta, la píldora del ahorro entra con
        muelle y la línea plana queda respirando con un brillo en bucle.

   Todo cuelga de una sola timeline: para recolocar un momento, mueve su
   posición en ms, no toques las duraciones de las demás.
   ========================================================================== */
(function () {
  if (!window.anime) return;

  var card = document.getElementById('flatcard');
  if (!card) return;

  var animate       = anime.animate;
  var createTimeline = anime.createTimeline;
  var createSpring  = anime.createSpring;
  var utils         = anime.utils;

  /* ---- piezas ---- */
  var ekg   = card.querySelector('.ekg');
  var beat  = ekg.querySelector('.beat');
  var head  = ekg.querySelector('.head');
  var flat  = ekg.querySelector('.flat');
  var sheen = ekg.querySelector('.sheen');
  var rail  = ekg.querySelector('.rail');

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

  /* ---- formato de cifras ----
     useGrouping:'always' es obligatorio: es-ES no agrupa por defecto los
     números de cuatro cifras, así que 9000 se quedaba en "9000 €". */
  var nf;
  try { nf = new Intl.NumberFormat('es-ES', { useGrouping: 'always' }); }
  catch (e) { nf = new Intl.NumberFormat('es-ES'); }
  function money(el, v) {
    if (!el) return;
    el.textContent = nf.format(Math.round(v)) + (el.getAttribute('data-suffix') || '');
  }
  var n = { vac: 0, agencia: 0, plana: 0, ahorro: 0 };

  /* ---- longitudes de trazo ---- */
  var beatLen = beat.getTotalLength();
  var flatLen = flat.getTotalLength();

  /* Momentos de los tres picos, en fracción del recorrido del electro.
     Salen de medir el path: los verticales cuentan mucha longitud. */
  var SPIKES = [0.21, 0.52, 0.86];
  var BEAT_MS = 1700;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- estado final, para reduced-motion y como red de seguridad ---- */
  function settle() {
    utils.set(beat,  { strokeDashoffset: 0, stroke: '#C9D6E2', opacity: 0.5 });
    utils.set(flat,  { strokeDashoffset: 0, opacity: 1 });
    utils.set(head,  { opacity: 0 });
    utils.set(cutEl, { scaleX: 1, opacity: 1 });
    utils.set(agencyEl, { opacity: 1 });
    utils.set(underline, { scaleX: 1 });
    utils.set(savePill,  { scale: 1, opacity: 1 });
    utils.set(newBlock,  { scale: 1, opacity: 1 });
    utils.set(card, { opacity: 1, y: 0, scale: 1 });
    copy.forEach(function (el) { utils.set(el, { opacity: 1, y: 0 }); });
    money(vacEl, 45000); money(agencyEl, 9000); money(planaEl, 4900); money(saveEl, 4100);
  }

  if (reduce) { settle(); return; }

  /* ---- estado de partida ---- */
  function reset() {
    utils.set(beat,  { strokeDasharray: beatLen, strokeDashoffset: beatLen, stroke: '#4FB3E8', opacity: 1 });
    utils.set(flat,  { strokeDasharray: flatLen, strokeDashoffset: flatLen, opacity: 1 });
    utils.set(head,  { strokeDasharray: '0.1 ' + beatLen, strokeDashoffset: 0, opacity: 0 });
    utils.set(sheen, { strokeDasharray: '54 ' + (flatLen + 54), strokeDashoffset: 54, opacity: 0 });
    utils.set(rail,  { opacity: 0 });
    utils.set(cutEl, { scaleX: 0, opacity: 0 });
    utils.set(agencyEl, { opacity: 0 });   /* que no se vea el "0 €" antes de contar */
    utils.set(underline, { scaleX: 0 });
    utils.set(savePill,  { scale: 0.86, opacity: 0 });
    utils.set(newBlock,  { scale: 0.96, opacity: 0 });
    utils.set(card, { opacity: 0, y: 26, scale: 0.985 });
    copy.forEach(function (el) { utils.set(el, { opacity: 0, y: 20 }); });
    /* la barra del isotipo NO se rebobina: el logo debe estar entero desde el
       primer frame. En el momento plano solo da un golpe de luz. */
    n.vac = n.agencia = n.plana = n.ahorro = 0;
    money(vacEl, 0); money(agencyEl, 0); money(planaEl, 0); money(saveEl, 0);
  }
  reset();

  /* Brillo en bucle sobre la línea plana. Arranca cuando la timeline acaba. */
  var breathe = animate(sheen, {
    strokeDashoffset: [54, -flatLen],
    opacity: [0, 0.8, 0],
    duration: 1700,
    ease: 'inOutSine',
    loop: true,
    loopDelay: 3200,
    autoplay: false
  });

  /* ---- la timeline ---- */
  var tl = createTimeline({
    defaults: { ease: 'outQuad' },
    autoplay: false,
    onComplete: function () { breathe.play(); }
  });

  /* 1 · entrada */
  tl.add(copy, {
    opacity: 1, y: 0, duration: 760, ease: 'out(3)',
    delay: anime.stagger(90)
  }, 0);

  tl.add(card, { opacity: 1, y: 0, scale: 1, duration: 820, ease: 'out(3)' }, 120);
  tl.add(rail, { opacity: 1, duration: 400 }, 420);

  /* 2 · el fee está vivo */
  tl.add(n, {
    vac: 45000, duration: 700, ease: 'outExpo',
    onUpdate: function () { money(vacEl, n.vac); }
  }, 460);

  tl.add(beat, { strokeDashoffset: 0, duration: BEAT_MS, ease: 'linear' }, 760);
  tl.add(head, { strokeDashoffset: -beatLen, duration: BEAT_MS, ease: 'linear' }, 760);
  tl.add(head, { opacity: [0, 1], duration: 180 }, 760);

  tl.add(agencyEl, { opacity: 1, duration: 260 }, 760);
  tl.add(n, {
    agencia: 9000, duration: BEAT_MS - 200, ease: 'linear',
    onUpdate: function () { money(agencyEl, n.agencia); }
  }, 760);

  /* un tirón en la cifra por cada latido */
  SPIKES.forEach(function (p) {
    tl.add(agencyEl, {
      scale: [1, 1.13, 1],
      duration: 380,
      ease: 'outQuad'
    }, 760 + BEAT_MS * p - 60);
  });

  /* 3 · muere el fee */
  var DEATH = 760 + BEAT_MS;                    // 2460
  tl.add(head, { opacity: 0, duration: 220 }, DEATH - 120);
  tl.add(beat, { stroke: '#C9D6E2', opacity: 0.5, duration: 620, ease: 'outQuad' }, DEATH);
  tl.add(cutEl, { opacity: 1, duration: 1 }, DEATH + 40);
  tl.add(cutEl, { scaleX: [0, 1], duration: 380, ease: 'out(4)' }, DEATH + 40);

  /* 4 · se aplana */
  var FLAT = DEATH + 260;                       // 2720
  tl.add(flat, { strokeDashoffset: 0, duration: 980, ease: 'out(4)' }, FLAT);
  tl.add(underline, { scaleX: [0, 1], duration: 820, ease: 'out(3)' }, FLAT + 60);
  /* el isotipo del nav acusa el golpe: la barra se estira y vuelve */
  if (isoBar) {
    tl.add(isoBar, {
      width: [56, 64, 56],
      x: [22, 18, 22],
      fill: ['#FFD75E', '#FFFFFF', '#FFD75E'],
      duration: 620,
      ease: 'inOutQuad'
    }, FLAT + 220);
  }

  /* 5 · aterriza Plana */
  tl.add(newBlock, { opacity: 1, scale: 1, duration: 620, ease: 'out(3)' }, FLAT + 320);
  tl.add(n, {
    plana: 4900, duration: 760, ease: 'outExpo',
    onUpdate: function () { money(planaEl, n.plana); }
  }, FLAT + 320);

  tl.add(savePill, {
    opacity: 1, scale: 1, duration: 900,
    ease: createSpring({ stiffness: 140, damping: 12 })
  }, FLAT + 760);
  tl.add(n, {
    ahorro: 4100, duration: 620, ease: 'outExpo',
    onUpdate: function () { money(saveEl, n.ahorro); }
  }, FLAT + 760);

  /* ---- disparo: cuando el hero entra en pantalla, una sola vez ---- */
  var fired = false;
  function fire() {
    if (fired) return;
    fired = true;
    tl.play();
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { fire(); io.disconnect(); } });
    }, { threshold: 0.3 });
    io.observe(card);
    /* si el hero no llega a verse (aterrizaje con ancla), no dejamos la
       tarjeta invisible para siempre: la damos por vista y en su sitio */
    setTimeout(function () {
      if (fired) return;
      fired = true;
      io.disconnect();
      settle();
      breathe.play();
    }, 4000);
  } else {
    fire();
  }

  /* ---- rebobinado manual ---- */
  if (replay) {
    replay.addEventListener('click', function () {
      breathe.pause();
      reset();
      tl.restart();
    });
  }
})();
