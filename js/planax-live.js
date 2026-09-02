/* ==========================================================================
   PLANA · Planax en directo
   Timeline con anime.js v4 para el panel de la sección Planax. El relato:

     1. Un barrido de luz cruza el panel. Planax se pone a cribar.
     2. El embudo se llena por fases, no a la vez: 124 cribados, 18 en
        entrevista, 4 finalistas. Cada fase empuja a la siguiente.
     3. La línea de luz se dibuja y queda un punto recorriéndola en bucle.
        Es la frase de la sección hecha imagen: "una línea de luz que cruza
        cada proceso".
     4. Los insights entran después, porque son la conclusión de lo anterior.
     5. Los candidatos entran por la izquierda con su score contando.
     6. Cierran las dos cifras del lateral.

   La entrada del bloque (.panel y .px-side) la sigue llevando el .reveal de
   CSS. Aquí solo se conduce lo que pasa DENTRO del panel, que es el dato
   vivo. Para recolocar un momento, mueve su posición en ms.
   ========================================================================== */
(function () {
  if (!window.anime) return;

  var stage = document.querySelector('.px-stage');
  if (!stage) return;

  var animate        = anime.animate;
  var createTimeline = anime.createTimeline;
  var createSpring   = anime.createSpring;
  var stagger        = anime.stagger;
  var utils          = anime.utils;

  /* ---- piezas ---- */
  var panel = stage.querySelector('.panel');
  var scan  = stage.querySelector('.panel-scan');
  var pipes = Array.prototype.slice.call(stage.querySelectorAll('.pipe'));
  var line  = stage.querySelector('.panel-pulse .pl');
  var headP = stage.querySelector('.panel-pulse .ph');
  var chips = Array.prototype.slice.call(stage.querySelectorAll('.chip-i'));
  var cands = Array.prototype.slice.call(stage.querySelectorAll('.cand'));
  var sideV = Array.prototype.slice.call(stage.querySelectorAll('.px-side .hl .v'));

  /* ---- formato ---- */
  var nf;
  try { nf = new Intl.NumberFormat('es-ES', { useGrouping: 'always' }); }
  catch (e) { nf = new Intl.NumberFormat('es-ES'); }

  function paint(el, v) {
    el.textContent = (el.getAttribute('data-prefix') || '')
      + nf.format(Math.round(v))
      + (el.getAttribute('data-suffix') || '');
  }
  function target(el) { return parseFloat(el.getAttribute('data-count')) || 0; }

  /* Todo lo que cuenta, en un solo sitio: cada entrada guarda su elemento,
     su destino y el valor que se va animando. */
  var counters = [];
  function reg(el) {
    if (!el) return null;
    var c = { el: el, to: target(el), v: 0 };
    counters.push(c);
    return c;
  }
  var cPipes  = pipes.map(function (p) { return reg(p.querySelector('.num')); });
  var cScores = cands.map(function (c) { return reg(c.querySelector('.score')); });
  var cSide   = sideV.map(reg);

  var lineLen = line ? line.getTotalLength() : 0;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- estado final ---- */
  function settle() {
    counters.forEach(function (c) { c.v = c.to; paint(c.el, c.to); });
    pipes.forEach(function (p) {
      var i = p.querySelector('.bar i');
      if (i) i.style.width = i.getAttribute('data-w');
    });
    utils.set(line, { strokeDashoffset: 0 });
    utils.set(headP, { opacity: 0 });
    utils.set(scan, { opacity: 0 });
    chips.forEach(function (el) { utils.set(el, { opacity: 1, y: 0, scale: 1 }); });
    cands.forEach(function (el) { utils.set(el, { opacity: 1, x: 0 }); });
  }

  if (reduce) { settle(); return; }

  /* ---- estado de partida ---- */
  function reset() {
    counters.forEach(function (c) { c.v = 0; paint(c.el, 0); });
    pipes.forEach(function (p) {
      var i = p.querySelector('.bar i');
      if (i) i.style.width = '0%';
    });
    utils.set(line,  { strokeDasharray: lineLen, strokeDashoffset: lineLen });
    utils.set(headP, { strokeDasharray: '0.1 ' + lineLen, strokeDashoffset: 0, opacity: 0 });
    utils.set(scan,  { opacity: 0, x: '-120%' });
    chips.forEach(function (el) { utils.set(el, { opacity: 0, y: 10, scale: 0.94 }); });
    cands.forEach(function (el) { utils.set(el, { opacity: 0, x: -18 }); });
  }
  reset();

  /* El punto que recorre la línea, en bucle y para siempre. Arranca cuando
     la línea ya está dibujada. */
  var travel = animate(headP, {
    strokeDashoffset: [0, -lineLen],
    opacity: [{ to: 1, duration: 160 }, { to: 1, duration: 3000 }, { to: 0, duration: 240 }],
    duration: 3400,
    ease: 'linear',
    loop: true,
    autoplay: false
  });

  var done = false;
  var tl = createTimeline({
    defaults: { ease: 'out(3)' },
    autoplay: false,
    onComplete: function () { done = true; }
  });

  /* 1 · barrido: Planax se pone a cribar */
  tl.add(scan, { opacity: [0, 1], duration: 220 }, 0);
  tl.add(scan, { x: ['-120%', '320%'], duration: 1100, ease: 'inOutQuad' }, 0);
  tl.add(scan, { opacity: 0, duration: 260 }, 900);

  /* 2 · el embudo se llena por fases */
  var PIPE_START = 420;
  var PIPE_GAP   = 300;

  pipes.forEach(function (p, k) {
    var at  = PIPE_START + k * PIPE_GAP;
    var bar = p.querySelector('.bar i');
    var c   = cPipes[k];

    tl.add(p, { scale: [1, 1.035, 1], duration: 520, ease: 'outQuad' }, at);
    if (bar) {
      tl.add(bar, { width: ['0%', bar.getAttribute('data-w')], duration: 940, ease: 'out(4)' }, at);
    }
    if (c) {
      tl.add(c, {
        v: c.to, duration: 900, ease: 'outExpo',
        onUpdate: function () { paint(c.el, c.v); }
      }, at);
    }
  });

  /* 3 · la línea de luz, dibujándose mientras corre el embudo */
  var LINE_AT = PIPE_START + 240;
  tl.add(line, { strokeDashoffset: 0, duration: 1500, ease: 'inOutQuad' }, LINE_AT);
  tl.call(function () { travel.play(); }, LINE_AT + 1500);

  /* 4 · los insights, ya como conclusión */
  var CHIPS_AT = PIPE_START + 2 * PIPE_GAP + 620;
  tl.add(chips, {
    opacity: 1, y: 0, scale: 1,
    duration: 620,
    delay: stagger(110)
  }, CHIPS_AT);

  /* 5 · los candidatos entran por la izquierda con su score contando */
  var CANDS_AT = CHIPS_AT + 320;
  tl.add(cands, {
    opacity: 1, x: 0,
    duration: 700,
    delay: stagger(130)
  }, CANDS_AT);

  cScores.forEach(function (c, k) {
    if (!c) return;
    tl.add(c, {
      v: c.to, duration: 720, ease: 'outExpo',
      onUpdate: function () { paint(c.el, c.v); }
    }, CANDS_AT + k * 130 + 120);
  });

  /* 6 · cierran las cifras del lateral */
  var SIDE_AT = CANDS_AT + 420;
  cSide.forEach(function (c, k) {
    if (!c) return;
    tl.add(c, {
      v: c.to, duration: 820, ease: 'outExpo',
      onUpdate: function () { paint(c.el, c.v); }
    }, SIDE_AT + k * 160);
    tl.add(c.el, {
      scale: [0.9, 1],
      duration: 760,
      ease: createSpring({ stiffness: 130, damping: 13 })
    }, SIDE_AT + k * 160);
  });

  /* Red de seguridad. Si la timeline arranca y se queda a medias (cambio de
     pestaña, rAF estrangulado), el panel se quedaría con el barrido tapándolo
     y las cifras a cero. Pasado el tiempo total con margen, lo dejamos en su
     estado final. Si la pestaña no está visible no tocamos nada y volvemos a
     mirar luego, porque anime pausa sola y retoma al volver. */
  var TOTAL_MS = 3400;
  function watchdog() {
    if (done) return;
    if (document.visibilityState !== 'visible') { setTimeout(watchdog, 2000); return; }
    settle();
  }

  /* ---- disparo: cuando el panel entra en pantalla, una sola vez ---- */
  var fired = false;
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting || fired) return;
        fired = true;
        io.disconnect();
        tl.play();
        setTimeout(watchdog, TOTAL_MS + 2200);
      });
    }, { threshold: 0.3 });
    io.observe(panel || stage);
  } else {
    settle();
  }
})();
