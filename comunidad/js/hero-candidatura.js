(function () {
  var card = document.getElementById('candcard');
  if (!card) return;

  var pasos = [].slice.call(card.querySelectorAll('.cs'));

  /* Dos pasos hechos, el tercero en curso y el cuarto pendiente. No se
     completa a propósito: es una candidatura viva, no un proceso cerrado. */
  var HECHOS = 2;

  function final() {
    pasos.forEach(function (p, i) {
      p.classList.toggle('done', i < HECHOS);
      p.classList.toggle('link', i < HECHOS);
      p.classList.toggle('now', i === HECHOS);
    });
  }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    final();
    return;
  }

  /* empieza cuando el titular ya ha entrado, para no competir con él */
  var INICIO = 900;
  var PASO = 1150;
  var RAIL = 520;

  function correr() {
    pasos.slice(0, HECHOS).forEach(function (p, i) {
      var t = INICIO + i * PASO;
      setTimeout(function () { p.classList.add('done'); }, t);
      setTimeout(function () { p.classList.add('link'); }, t + RAIL);
    });
    setTimeout(function () {
      pasos[HECHOS].classList.add('now');
    }, INICIO + HECHOS * PASO);
  }

  /* El hero casi siempre está en pantalla al cargar: entonces arranca ya,
     sin esperar al observer. Solo se espera si se entra con un ancla y la
     tarjeta queda fuera de vista. */
  var r = card.getBoundingClientRect();
  if (r.top < innerHeight && r.bottom > 0) {
    correr();
    return;
  }

  if (!('IntersectionObserver' in window)) {
    correr();
    return;
  }

  var io = new IntersectionObserver(function (es) {
    if (es[0].isIntersecting) {
      io.disconnect();
      correr();
    }
  }, { threshold: 0.35 });
  io.observe(card);
})();
