(function () {
  if (!window.anime) return;

  var stack = document.getElementById('isostack');
  var section = document.getElementById('motor');
  if (!stack || !section) return;

  var createTimeline = anime.createTimeline;
  var utils          = anime.utils;

  var wave = stack.querySelector('.iso-wave');
  var disc = stack.querySelector('.iso-disc');
  if (!wave || !disc) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  stack.classList.add('js');

  var CY = 180;

  /* Extremos de la línea. Al final va de 108 a 252 con punta redonda de radio
     10, que es exactamente la barra del isotipo: de 98 a 262 y 20 de grueso. */
  var FROM = { x0: 6, x1: 354, amp: 1, w: 9 };
  var TO   = { x0: 108, x1: 252, amp: 0, w: 20 };

  var state = {
    x0: FROM.x0,
    x1: FROM.x1,
    amp: FROM.amp,
    w: FROM.w
  };

  /* Tres senos de frecuencias distintas: el fee no oscila con un patrón
     reconocible, sube y baja sin orden. */
  function height(x) {
    return Math.sin(x * 0.045) * 40 +
           Math.sin(x * 0.11 + 1.3) * 19 +
           Math.sin(x * 0.19 + 2.1) * 9;
  }

  var STEP = 4;

  function draw() {
    var d = '';
    var x = state.x0;
    while (x < state.x1) {
      d += (d ? ' L' : 'M') + x.toFixed(1) + ',' + (CY + state.amp * height(x)).toFixed(1);
      x += STEP;
    }
    d += ' L' + state.x1.toFixed(1) + ',' + (CY + state.amp * height(state.x1)).toFixed(1);
    wave.setAttribute('d', d);
    wave.setAttribute('stroke-width', state.w.toFixed(1));
  }

  draw();
  utils.set(disc, { opacity: 0, scale: 0.86 });
  utils.set(wave, { stroke: '#7C9DBA' });

  /* ---- el recorrido ----
       0 a 620    la onda se calma, se acorta y engorda hasta ser la barra
       600 a 850  el círculo azul aparece alrededor
       850 a 1000 el isotipo, completo y quieto */
  var tl = createTimeline({ autoplay: false });

  tl.add(state, {
    amp: TO.amp,
    x0: TO.x0,
    x1: TO.x1,
    w: TO.w,
    duration: 620,
    ease: 'inOut(2)',
    onUpdate: draw
  }, 0);

  tl.add(wave, {
    stroke: '#FFD75E',
    duration: 620,
    ease: 'linear'
  }, 0);

  tl.add(disc, {
    opacity: [0, 1],
    scale: [0.86, 1],
    duration: 250,
    ease: 'out(3)'
  }, 600);

  function measure() {
    var r = section.getBoundingClientRect();
    var span = r.height - innerHeight;
    if (span <= 0) return 0;
    var p = -r.top / span;
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
    shown += (aim - shown) * 0.2;
    if (Math.abs(aim - shown) < 0.0005) {
      shown = aim;
    }
    tl.seek(tl.duration * shown);
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
  tl.seek(tl.duration * shown);
  kick();
})();
