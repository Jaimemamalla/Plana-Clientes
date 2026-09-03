(function () {
  if (!window.anime) return;

  var stack = document.getElementById('isostack');
  var section = document.getElementById('motor');
  if (!stack || !section) return;

  var createTimeline = anime.createTimeline;
  var utils          = anime.utils;

  var group = stack.querySelector('.iso-slats');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  if (reduce) return;

  function noise(i, salt) {
    var x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  /* Dirección y magnitud por separado: con signed() puro salían láminas casi
     quietas, porque el ruido daba valores cerca de cero. Así todas se van de
     verdad, unas más que otras. */
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
      rotate: signed(i, 2) * 42,
      opacity: 0,
      scaleX: 0.5
    };
  }

  /* ---- el recorrido ----
     0    a 450: las piezas llegan dispersas y se montan
     450  a 600: el isotipo, quieto
     600  a 1000: se desmonta y las piezas se van
     La barra amarilla no entra en la timeline: no se mueve nunca. */
  /* estado de partida, para que en progreso 0 ya estén dispersas */
  slats.forEach(function (el, i) {
    utils.set(el, scatterIn(i));
  });

  var tl = createTimeline({ autoplay: false });

  slats.forEach(function (el, i) {
    var e = edge(i);
    var from = scatterIn(i);

    tl.add(el, {
      translateX: [from.translateX, 0],
      translateY: [from.translateY, 0],
      rotate: [from.rotate, 0],
      opacity: [0, 1],
      scaleX: [0.5, 1],
      duration: 380,
      ease: 'out(3)'
    }, Math.round(e * 70));

    tl.add(el, {
      translateX: [0, dir(i, 3) * mag(i, 13, 120 + e * 140, 200)],
      translateY: [0, (i - mid) * 38 + signed(i, 4) * 34],
      rotate: [0, signed(i, 5) * (16 + e * 36)],
      opacity: [1, 0],
      duration: 340,
      ease: 'in(2)'
    }, 600 + Math.round((1 - e) * 60));
  });

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
