(function () {

  /* Traducción por nodo de texto: respeta los SVG de las listas y los <b>
     dentro de los párrafos, que se traducen por separado. Los titulares que
     la capa de punch trocea en palabras van aparte, por elemento entero, y
     este archivo se carga antes que ella para pillarlos sin trocear. */

  var EN = {
    /* nav y hero */
    'El': 'The',
    'Cómo funciona': 'How it works',
    'Precios': 'Pricing',
    'Comparativa': 'Compare',
    'Candidatos': 'Candidates',
    'Ver precios': 'See pricing',
    'Selección a tarifa plana': 'Flat-rate recruitment',
    'fee': 'fee',
    'ha muerto.': 'is dead.',
    'Selección de personal a precio fijo y público.': 'Recruitment at a fixed, public price.',
    'Pagas por el trabajo, no un porcentaje del sueldo.': 'You pay for the work, not a cut of the salary.',
    'Sin fees. Sin sorpresas.': 'No fees. No surprises.',
    'Soy candidato/a': 'I am a candidate',
    'Una vacante de': 'A role paying',
    'Agencia': 'Agency',
    'Con Plana': 'With Plana',
    '/ vacante': '/ role',
    'Te ahorras': 'You save',

    /* cómo funciona */
    'Eliges online, buscamos con Planax y personas, y contratas. Lo que tarda una contratación, no una negociación de tarifas.':
      'You choose online, we search with Planax and people, you hire. As long as a hire takes, not as long as a fee negotiation.',
    'Elige tu pack': 'Pick your pack',
    'Sin llamadas comerciales eternas. Eliges online, como debe ser. El precio está en la web, no detrás de un formulario.':
      'No endless sales calls. You choose online, as it should be. The price is on the website, not behind a form.',
    'Planax y nuestro equipo se ponen a buscar': 'Planax and our team start searching',
    'IA para la velocidad, personas para acertar. Sigues todo el proceso en tiempo real desde tu panel, sin pedir updates por email.':
      'AI for speed, people for judgement. You follow the whole process live from your dashboard, without chasing updates by email.',
    'Contratas. Y punto.': 'You hire. That is it.',
    'Shortlist de finalistas, tú decides, nosotros cerramos. Si la persona no funciona, la reponemos gratis.':
      'A shortlist of finalists, you decide, we close. If the person does not work out, we replace them free.',

    /* motor */
    'Tarifa plana': 'Flat rate',
    'El fee sube con el sueldo, baja si negocias y cambia según quién pregunte. Nuestro precio no se mueve: está en la web, es el mismo para todos y no depende de lo que cobre la persona que contratas.':
      'The fee climbs with the salary, drops if you haggle and shifts depending on who is asking. Our price does not move: it is on the website, it is the same for everyone and it does not depend on what the person you hire earns.',

    /* packs */
    'Precios públicos': 'Public pricing',
    'El precio depende del perfil que buscas, no de lo que cobra. Está aquí escrito, sin "desde" ni asteriscos. La transparencia es el producto.':
      'The price depends on the profile you are after, not on what they earn. It is written right here, with no "from" and no asterisks. Transparency is the product.',
    'Despegue': 'Takeoff',
    'Perfiles operativos y junior: administración, soporte, customer service, ventas junior, oficina y operaciones.':
      'Operational and junior roles: admin, support, customer service, junior sales, office and operations.',
    'por vacante': 'per role',
    'Publicación multicanal y búsqueda activa': 'Multichannel posting and active search',
    'Cribado completo con Planax y entrevistas del equipo': 'Full screening with Planax and interviews by our team',
    'Shortlist de 3 a 5 finalistas': 'A shortlist of 3 to 5 finalists',
    'en 15 días laborables': 'in 15 working days',
    'Empezar': 'Get started',
    'Reposición garantizada 60 días': '60-day replacement guarantee',
    '⭐ Más popular': '⭐ Most popular',
    'Altitud': 'Altitude',
    'Mandos intermedios y especialistas: tech, finanzas, marketing, ingeniería y perfiles con escasez media.':
      'Middle management and specialists: tech, finance, marketing, engineering and roles of moderate scarcity.',
    'Todo lo del Pack Despegue': 'Everything in the Takeoff pack',
    'Headhunting directo': 'Direct headhunting',
    'a candidatos pasivos': 'of passive candidates',
    'Informe de mercado salarial de la posición incluido': 'Salary benchmark report for the role included',
    'Shortlist en 20 días laborables': 'Shortlist in 20 working days',
    'Reposición garantizada 90 días': '90-day replacement guarantee',
    'Estratosfera': 'Stratosphere',
    'Dirección y perfiles muy escasos: C-level, heads y perfiles nicho de alta competencia.':
      'Leadership and very scarce roles: C-level, heads and highly contested niche profiles.',
    'Todo lo del Pack Altitud': 'Everything in the Altitude pack',
    'Búsqueda confidencial': 'Confidential search',
    'y mapeo completo del mercado': 'and full market mapping',
    'Evaluación en profundidad de finalistas, referencias incluidas': 'In-depth assessment of finalists, references included',
    'Acompañamiento en oferta y negociación': 'Support through offer and negotiation',
    'Reposición garantizada 120 días': '120-day replacement guarantee',

    /* escala */
    'Escala Plana': 'The Plana scale',
    'Descuento por volumen, automático y público. Sin negociar.': 'Volume discount, automatic and public. No haggling.',
    '1 a 2 vacantes / año': '1 to 2 roles / year',
    'Tarifa': 'List price',
    'Precio de lista, sin letra pequeña': 'List price, no small print',
    '3 a 5 vacantes / año': '3 to 5 roles / year',
    'En todos los packs': 'On every pack',
    '6 a 9 vacantes / año': '6 to 9 roles / year',
    '10+ vacantes / año': '10+ roles / year',
    'Plana Ilimitada': 'Plana Unlimited',
    'Suscripción desde 3.900 €/mes con vacantes simultáneas incluidas. Modelo embedded.':
      'Subscription from €3,900/month with simultaneous roles included. Embedded model.',
    'Hablemos': 'Let us talk',

    /* calculadora */
    'Calculadora de ahorro': 'Savings calculator',
    'Mete el sueldo de la vacante y el fee típico de tu agencia. Te enseñamos la diferencia. En euros.':
      'Enter the salary for the role and your agency’s typical fee. We will show you the difference. In euros.',
    'Salario bruto anual de la vacante': 'Gross annual salary for the role',
    'Fee típico de agencia': 'Typical agency fee',
    'Comparamos contra el Pack Altitud (4.900 €), nuestro pack más contratado.':
      'We compare against the Altitude pack (€4,900), our most popular one.',
    'Con agencia tradicional': 'With a traditional agency',
    'Con Plana (Altitud)': 'With Plana (Altitude)',

    /* planax */
    'Motor de IA propio · en directo': 'Our own AI engine · live',
    'Ni robots ni cerebros con circuitos. Planax es una línea de luz que cruza cada proceso: criba, hace match, predice y te lo enseña en vivo. Para que las personas decidan antes y mejor.':
      'No robots, no brains made of circuitry. Planax is a line of light running through every process: it screens, matches, predicts and shows you the lot live. So that people can decide sooner and better.',
    'Backend Engineer': 'Backend Engineer',
    'Madrid · Híbrido · Pack Altitud': 'Madrid · Hybrid · Altitude pack',
    'En proceso': 'In progress',
    'Cribados por Planax': 'Screened by Planax',
    'En entrevista': 'Interviewing',
    'Finalistas': 'Finalists',
    'Cierre estimado': 'Estimated close',
    '14 días': '14 days',
    'Tensión salarial': 'Salary pressure',
    'Media': 'Medium',
    'Match comunidad': 'Community match',
    'Senior · 6 años · disponible': 'Senior · 6 years · available',
    'Mid-senior · 4 años · activo': 'Mid-senior · 4 years · active',
    'Senior · 7 años · pasivo': 'Senior · 7 years · passive',
    '"Planax no sustituye a las personas que seleccionan.': '"Planax does not replace the people who recruit.',
    'Las hace imparables."': 'It makes them unstoppable."',
    'Cribando candidatos a cualquier hora': 'Screening candidates at any hour',
    'Menos tiempo hasta la shortlist': 'Less time to shortlist',
    'Cribado conversacional': 'Conversational screening',
    'Entrevista inicial a cada candidato, a cualquier hora y en su idioma. Nadie espera tres días a que le llamen.':
      'A first interview for every candidate, at any hour and in their own language. Nobody waits three days for a call.',
    'Matching con la Comunidad Plana': 'Matching against the Plana Community',
    'Cruza cada vacante con miles de candidatos ya validados antes de salir a buscar fuera.':
      'It cross-checks every role against thousands of already vetted candidates before looking outside.',
    'Panel en tiempo real': 'Live dashboard',
    'Ves candidatos, fases y feedback al momento. Sin pedir updates por email.':
      'You see candidates, stages and feedback as they happen. No chasing updates by email.',
    'Predicción de cierre': 'Close prediction',
    'Estima los días hasta contratación y la tensión salarial del mercado para esa vacante concreta.':
      'It estimates the days to hire and the market salary pressure for that specific role.',
    'Informes automáticos': 'Automatic reports',
    'Resumen semanal del proceso generado solo. Te llega hecho, no lo pides.':
      'A weekly summary of the process, generated on its own. It arrives ready, you do not ask for it.',
    'IA para la velocidad.': 'AI for speed.',
    'Personas para acertar. Esa es toda la magia.': 'People for judgement. That is the whole trick.',

    /* comparativa */
    'Agencia tradicional vs Plana': 'Traditional agency vs Plana',
    'Agencia tradicional': 'Traditional agency',
    'Precio': 'Price',
    '18–25% del salario bruto': '18–25% of gross salary',
    'Precio fijo por pack': 'Fixed price per pack',
    'Transparencia': 'Transparency',
    '"Consultar precio"': '"Price on request"',
    'Precios públicos en la web': 'Public pricing on the website',
    'Seguimiento': 'Tracking',
    'Updates por email': 'Updates by email',
    'Muchos sin respuesta': 'Many never hear back',
    'Feedback garantizado': 'Feedback guaranteed',
    'Garantía': 'Guarantee',
    'Ninguna o 30 días': 'None, or 30 days',
    'Hasta 120 días': 'Up to 120 days',

    /* modal de plan */
    'Pack Altitud': 'Altitude pack',
    'Empieza tu contratación': 'Start your hire',
    'Déjanos tus datos y te contactamos en menos de 24h. Sin llamadas comerciales eternas.':
      'Leave us your details and we will be in touch within 24h. No endless sales calls.',
    'Nombre': 'Name',
    'Empresa': 'Company',
    'Email de trabajo': 'Work email',
    'Teléfono': 'Phone',
    '(opcional)': '(optional)',
    'Solicitar — te contactamos en 24h': 'Request — we reply within 24h',
    'Al enviar aceptas nuestra Política de Privacidad.': 'By submitting you accept our Privacy Policy.',
    'Recibido. Te contactamos en menos de 24h.': 'Got it. We will be in touch within 24h.',

    /* footer */
    'Selección a tarifa plana. Sin fees. Sin sorpresas.': 'Flat-rate recruitment. No fees. No surprises.',
    'Producto': 'Product',
    'Calculadora': 'Calculator',
    'Aviso legal': 'Legal notice',
    'Privacidad': 'Privacy',
    'Cookies': 'Cookies',
    '© 2026 Plana. Todos los derechos reservados.': '© 2026 Plana. All rights reserved.',
    'Hecho con': 'Made with',
    'entre Asturias y Madrid.': 'between Asturias and Madrid.'
  };

  /* titulares que la capa de punch trocea: van por elemento entero */
  var HEADS = {
    'Tres pasos. Cero teatro.': 'Three steps. Zero theatre.',
    'Packs por complejidad. No por sueldo.': 'Packs by complexity. Not by salary.',
    'Cuantas más contratas, más barato te sale cada una.': 'The more you hire, the less each hire costs you.',
    '¿Cuánto te ahorras con Plana?': 'How much do you save with Plana?',
    'Planax. El motor que lo <span class="y">mueve todo</span>.': 'Planax. The engine behind <span class="y">all of it</span>.',
    'La misma llamada de teléfono. Otro precio.': 'The same phone call. A different price.',
    'El fee sube y baja. <span class="y">La tarifa es plana.</span>': 'The fee goes up and down. <span class="y">The rate stays flat.</span>'
  };

  /* atributos, que el recorrido de nodos de texto no ve */
  var ATTRS = {
    'Plana, inicio': 'Plana, home',
    'Principal': 'Main',
    'Abrir menú': 'Open menu',
    'El isotipo de Plana: un círculo azul cruzado por una barra plana amarilla':
      'The Plana mark: a blue circle crossed by a flat yellow bar',
    'Panel en tiempo real de Planax (ejemplo)': 'Planax live dashboard (sample)',
    'Comparativa agencia tradicional frente a Plana': 'Traditional agency compared with Plana',
    'Cerrar': 'Close',
    'LinkedIn de Plana': 'Plana on LinkedIn',
    'Instagram de Plana': 'Plana on Instagram',
    'Tu nombre': 'Your name',
    'Nombre de tu empresa': 'Your company name',
    'tu@empresa.com': 'you@company.com',
    '+34 ...': '+34 ...'
  };

  /* lo que no es texto de la página */
  var META = {
    title: 'Plana — Flat-rate recruitment',
    description: 'The first Spanish flat-rate recruitment platform. No fees. No surprises. Packs at a fixed, public price, not a percentage of the salary. The fee is dead.',
    ticker1: ['the fee is dead', 'no fees', 'no surprises', 'fixed public pricing', 'be smart, be plana'],
    ticker2: ['you pay for the work', 'not for the salary', 'transparency is the product'],
    dock: ['From €2,900 per role', 'No fees. No surprises.', 'See pricing']
  };

  var ES_TICKER1 = ['el fee ha muerto', 'sin fees', 'sin sorpresas', 'precio fijo y público', 'be smart, be plana'];
  var ES_TICKER2 = ['pagas por el trabajo', 'no por el sueldo', 'la transparencia es el producto'];
  var ES_DOCK = ['Desde 2.900 € por vacante', 'Sin fees. Sin sorpresas.', 'Ver precios'];

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
      if (!t || !EN[t]) continue;
      nodes.push({ node: n, es: n.textContent, en: n.textContent.replace(t, EN[t]) });
    }
    document.querySelectorAll('.sec-head h2, .escala-head h3, .px-head h2, #motor-title, .calc-controls h3').forEach(function (el) {
      var es = el.innerHTML.trim();
      if (HEADS[es]) heads.push({ el: el, es: es, en: HEADS[es] });
    });

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
    document.title = en ? META.title : ES_META.title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.content = en ? META.description : ES_META.description;

    /* las bandas y el dock los crea el JS, así que se reescriben aquí */
    var bands = document.querySelectorAll('.tkband .row');
    [[ES_TICKER1, META.ticker1], [ES_TICKER2, META.ticker2]].forEach(function (pair, i) {
      var row = bands[i];
      if (!row) return;
      var list = en ? pair[1] : pair[0];
      var html = list.map(function (f) { return '<em>' + f + '</em>'; }).join('');
      row.innerHTML = html + html;
    });

    var dock = document.getElementById('dock');
    if (dock) {
      var d = en ? META.dock : ES_DOCK;
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
