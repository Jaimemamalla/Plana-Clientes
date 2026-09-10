(function () {

  /* Motor de idioma, compartido por las dos webs. El diccionario lo pone la
     página en window.PLANA_I18N antes de cargar este archivo.

     Se traduce por nodo de texto, no por elemento, para no tocar el marcado:
     así los SVG de las listas y los <b> dentro de los párrafos se quedan
     donde están. Los titulares que la capa de punch trocea en palabras van
     aparte, por elemento entero, y este archivo se carga antes que ella para
     pillarlos sin trocear. */

  var D = window.PLANA_I18N;
  if (!D) return;

  var TEXT    = D.text || {};
  var HEADS   = D.heads || {};
  var ATTRS   = D.attrs || {};
  var META    = D.meta || {};
  var TICKERS = D.tickers || [];
  var DOCK    = D.dock || null;

  var ES_META = {
    title: document.title,
    description: (document.querySelector('meta[name="description"]') || {}).content || ''
  };

  /* ---- inventario, tomado antes de que nadie toque el DOM ---- */
  var nodes = [];
  var heads = [];
  var attrs = [];

  function collect() {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var n;
    while ((n = w.nextNode())) {
      if (n.parentElement.closest('script, style')) continue;
      var t = n.textContent.trim();
      if (!t || !TEXT[t]) continue;
      nodes.push({ node: n, es: n.textContent, en: n.textContent.replace(t, TEXT[t]) });
    }

    if (D.headSelectors) {
      document.querySelectorAll(D.headSelectors).forEach(function (el) {
        var es = el.innerHTML.trim();
        if (HEADS[es]) heads.push({ el: el, es: es, en: HEADS[es] });
      });
    }

    ['placeholder', 'aria-label'].forEach(function (name) {
      document.querySelectorAll('[' + name + ']').forEach(function (el) {
        var es = el.getAttribute(name);
        if (ATTRS[es]) attrs.push({ el: el, name: name, es: es, en: ATTRS[es] });
      });
    });
  }

  collect();

  function apply(lang) {
    var en = lang === 'en';

    nodes.forEach(function (r) {
      r.node.textContent = en ? r.en : r.es;
    });

    attrs.forEach(function (r) {
      r.el.setAttribute(r.name, en ? r.en : r.es);
    });

    heads.forEach(function (r) {
      r.el.innerHTML = en ? r.en : r.es;
      r.el.removeAttribute('data-kin');
      r.el.classList.remove('kin', 'kin-in');
    });

    document.documentElement.lang = en ? 'en' : 'es';

    if (META.title) {
      document.title = en ? META.title : ES_META.title;
    }

    var desc = document.querySelector('meta[name="description"]');
    if (desc && META.description) {
      desc.content = en ? META.description : ES_META.description;
    }

    /* las bandas y el dock los crea el JS, así que se reescriben aquí */
    var bands = document.querySelectorAll('.tkband .row');
    TICKERS.forEach(function (pair, i) {
      var row = bands[i];
      if (!row) return;
      var list = en ? pair.en : pair.es;
      var html = list.map(function (f) { return '<em>' + f + '</em>'; }).join('');
      row.innerHTML = html + html;
    });

    var dock = document.getElementById('dock');
    if (dock && DOCK) {
      var d = en ? DOCK.en : DOCK.es;
      var b = dock.querySelector('b');
      var it = dock.querySelector('i');
      var a = dock.querySelector('a');
      if (b) b.textContent = d[0];
      if (it) it.textContent = d[1];
      if (a) a.textContent = d[2];
    }

    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      btn.textContent = en ? 'ES' : 'EN';
      btn.setAttribute('aria-label', en ? 'Ver esta página en español' : 'View this page in English');
    });

    try { localStorage.setItem('plana-lang', lang); } catch (e) {}
    dispatchEvent(new CustomEvent('plana:lang', { detail: { lang: lang } }));
  }

  /* ---- el botón ---- */
  var nav = document.querySelector('.nav-cta');
  if (nav) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'langbtn';
    btn.setAttribute('data-lang-btn', '');
    nav.insertBefore(btn, nav.firstChild);
    btn.addEventListener('click', function () {
      apply(document.documentElement.lang === 'en' ? 'es' : 'en');
    });
  }

  var initial = 'es';
  try {
    var saved = localStorage.getItem('plana-lang');
    if (saved) initial = saved;
  } catch (e) {}
  if (/[?&]lang=en\b/.test(location.search)) initial = 'en';
  if (/[?&]lang=es\b/.test(location.search)) initial = 'es';

  apply(initial);

  /* Las bandas y el dock los crea la capa de punch, que corre después de
     este archivo, así que en la primera pasada todavía no existen. */
  addEventListener('load', function () {
    if (document.documentElement.lang === 'en') apply('en');
  });
})();
