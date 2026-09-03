(function () {
  if (!window.anime) return;

  var host = document.getElementById('planax');
  if (!host) return;

  var animate = anime.animate;
  var utils   = anime.utils;

  var W = 1400;
  var H = 64;
  var CY = 32;
  var BEATS = 4;
  var STEP = W / BEATS;

  /* Un latido por tramo, en vez de dos en todo el ancho: así el pulso se
     encuentra picos a menudo y no recorre una raya vacía. */
  function beat(x0) {
    var x = x0 + STEP * 0.42;
    return ' H' + (x).toFixed(0) +
           ' L' + (x + 10).toFixed(0) + ',' + CY +
           ' L' + (x + 20).toFixed(0) + ',8' +
           ' L' + (x + 30).toFixed(0) + ',56' +
           ' L' + (x + 40).toFixed(0) + ',20' +
           ' L' + (x + 52).toFixed(0) + ',' + CY;
  }

  var d = 'M0,' + CY;
  for (var i = 0; i < BEATS; i++) {
    d += beat(i * STEP);
  }
  d += ' H' + W;

  var wrap = document.createElement('div');
  wrap.className = 'edgepulse';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML =
    '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
    '<path class="base" d="' + d + '"></path>' +
    '<path class="glow" d="' + d + '"></path>' +
    '<path class="dot" d="' + d + '"></path>' +
    '</svg>';
  host.insertBefore(wrap, host.firstChild);

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var glow = wrap.querySelector('.glow');
  var dot  = wrap.querySelector('.dot');
  var len  = glow.getTotalLength();

  var SEG = 260;
  var SWEEP = 4200;

  utils.set(glow, { strokeDasharray: SEG + ' ' + len });
  utils.set(dot,  { strokeDasharray: '0.1 ' + len });

  animate(glow, {
    strokeDashoffset: [SEG, -len],
    duration: SWEEP,
    ease: 'linear',
    loop: true
  });

  /* El punto va clavado en la cabeza del tramo brillante. Con dasharray
     "SEG len" y desfase D, el tramo ocupa de -D a -D+SEG, así que la cabeza
     está en -D+SEG: el punto tiene que ir a D-SEG, y por eso recorre
     len+SEG, no len. Con rangos distintos se iba quedando atrás. */
  animate(dot, {
    strokeDashoffset: [0, -(len + SEG)],
    duration: SWEEP,
    ease: 'linear',
    loop: true
  });
})();
