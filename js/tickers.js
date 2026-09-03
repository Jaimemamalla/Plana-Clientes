(function () {
  if (!window.anime) return;

  var animate = anime.animate;
  var utils   = anime.utils;

  /* px por segundo, igual en todas las bandas sea cual sea su ancho */
  var SPEED = 60;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bands = [];

  function band(frases, sol, ref, pos) {
    if (!ref) return;

    var b = document.createElement('div');
    b.className = 'tkband' + (sol ? ' sol' : '');
    b.setAttribute('aria-hidden', 'true');

    var row = document.createElement('div');
    row.className = 'row';

    var html = frases.map(function (f) {
      return '<em>' + f + '</em>';
    }).join('');

    /* el contenido va duplicado: cuando la primera copia sale por la
       izquierda, la segunda ocupa su sitio y el bucle no se nota */
    row.innerHTML = html + html;
    b.appendChild(row);
    ref.parentNode.insertBefore(b, pos === 'before' ? ref : ref.nextSibling);

    bands.push({ el: b, row: row, anim: null, speed: { v: 1 } });
  }

  band(
    ['el fee ha muerto', 'sin fees', 'sin sorpresas', 'precio fijo y público', 'be smart, be plana'],
    false,
    document.getElementById('como'),
    'before'
  );

  band(
    ['pagas por el trabajo', 'no por el sueldo', 'la transparencia es el producto'],
    true,
    document.getElementById('comparativa'),
    'before'
  );

  if (!bands.length || reduce) return;

  function start(b, fromProgress) {
    var half = b.row.scrollWidth / 2;
    if (!half) return;

    if (b.anim) b.anim.revert();

    b.anim = animate(b.row, {
      x: [0, -half],
      duration: (half / SPEED) * 1000,
      ease: 'linear',
      loop: true
    });

    if (fromProgress) b.anim.progress = fromProgress;
    b.anim.speed = b.speed.v;
  }

  function startAll(keepProgress) {
    bands.forEach(function (b) {
      start(b, keepProgress && b.anim ? b.anim.progress : 0);
    });
  }

  startAll(false);

  /* Las anchuras cambian con la tipografía, que carga después, y con el
     tamaño de letra, que va en clamp. Sin volver a medir, la velocidad
     quedaría mal calculada. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { startAll(true); });
  }

  var resizeT;
  addEventListener('resize', function () {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () { startAll(true); }, 200);
  });

  /* al pasar el ratón frena, no se corta en seco */
  bands.forEach(function (b) {
    function ramp(to) {
      animate(b.speed, {
        v: to,
        duration: 320,
        ease: 'outQuad',
        onUpdate: function () {
          if (b.anim) b.anim.speed = b.speed.v;
        }
      });
    }
    b.el.addEventListener('pointerenter', function () { ramp(0); });
    b.el.addEventListener('pointerleave', function () { ramp(1); });
  });
})();
