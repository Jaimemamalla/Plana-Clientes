(function () {
  if (!window.anime) return;

  var stack = document.getElementById('isostack');
  var section = document.getElementById('motor');
  if (!stack || !section) return;

  var createTimeline = anime.createTimeline;
  var utils          = anime.utils;

  var group = stack.querySelector('.iso-slats');
  var disc  = stack.querySelector('.iso-disc');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce) return;

  /* ---- geometría del círculo por láminas ----
     Sin separación y sin esquinas redondeadas: así las láminas embaldosan el
     círculo en vez de leerse como una persiana. Aun así, el estado montado no
     son las láminas, es el <circle> real: se cambia una cosa por la otra. */
  var CX = 180;
  var CY = 180;
  var R = 140;
  var SLATS = 18;
  var pitch = (R * 2) / SLATS;
  var mid = (SLATS - 1) / 2;

  var NS = 'http://www.w3.org/2000/svg';
  var slats = [];

  for (var i = 0; i < SLATS; i++) {
    var yc = CY - R + (i + 0.5) * pitch;
    var half = Math.sqrt(Math.max(0, R * R - (yc - CY) * (yc - CY)));
    var rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', (CX - half).toFixed(2));
    rect.setAttribute('y', (yc - pitch / 2).toFixed(2));
    rect.setAttribute('width', (half * 2).toFixed(2));
    rect.setAttribute('height', pitch.toFixed(2));
    rect.setAttribute('fill', '#4FB3E8');
    group.appendChild(rect);
    slats.push(rect);
  }

  function noise(i, salt) {
    var x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function dir(i, salt) {
    return noise(i, salt) < 0.5 ? -1 : 1;
  }

  function mag(i, salt, base, extra) {
    return base + noise(i, salt) * extra;
  }

  function signed(i, salt) {
    return noise(i, salt) * 2 - 1;
  }

  function edge(i) {
    return Math.abs(i - mid) / mid;
  }

  function scatterIn(i) {
    return {
      translateX: dir(i, 1) * mag(i, 11, 150, 230),
      translateY: (i - mid) * 46,
      rotate: signed(i, 2) * 30,
      opacity: 0,
      scaleX: 0.6
    };
  }

  slats.forEach(function (el, i) {
    utils.set(el, scatterIn(i));
  });
  utils.set(disc, { opacity: 0 });

  /* ---- el recorrido ----
       0 a 380    las piezas llegan dispersas y se montan
       420 a 470  relevo: las láminas se apagan y aparece el círculo limpio
       470 a 600  el isotipo, quieto y sin costuras
       600 a 650  relevo a la inversa
       650 a 1000 se desmonta y las piezas se van
     La barra amarilla no entra aquí: no se mueve nunca. */
  var tl = createTimeline({ autoplay: false });

  slats.forEach(function (el, i) {
    var e = edge(i);
    var from = scatterIn(i);
    var at = Math.round(e * 70);

    tl.add(el, {
      translateX: [from.translateX, 0],
      translateY: [from.translateY, 0],
      rotate: [from.rotate, 0],
      scaleX: [0.6, 1],
      duration: 380,
      ease: 'out(3)'
    }, at);

    tl.add(el, {
      opacity: [0, 1],
      duration: 240,
      ease: 'linear'
    }, at);

    tl.add(el, {
      opacity: [1, 0],
      duration: 50,
      ease: 'linear'
    }, 420);

    tl.add(el, {
      opacity: [0, 1],
      duration: 50,
      ease: 'linear'
    }, 600);

    tl.add(el, {
      translateX: [0, dir(i, 3) * mag(i, 13, 120 + e * 140, 200)],
      translateY: [0, (i - mid) * 38 + signed(i, 4) * 34],
      rotate: [0, signed(i, 5) * (16 + e * 36)],
      duration: 350,
      ease: 'in(2)'
    }, 650 + Math.round((1 - e) * 60));

    tl.add(el, {
      opacity: [1, 0],
      duration: 300,
      ease: 'linear'
    }, 690 + Math.round((1 - e) * 60));
  });

  tl.add(disc, {
    opacity: [0, 1],
    duration: 50,
    ease: 'linear'
  }, 420);

  tl.add(disc, {
    opacity: [1, 0],
    duration: 50,
    ease: 'linear'
  }, 600);

  /* progreso 0 al entrar la sección, 1 al terminar su recorrido */
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
