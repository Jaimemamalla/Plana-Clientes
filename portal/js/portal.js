(function () {
  'use strict';

  var cfg = window.PLANA_PORTAL || {};

  var CONFIGURADO = !!(
    cfg.supabaseUrl &&
    cfg.supabaseAnonKey &&
    cfg.supabaseUrl.indexOf('TU_PROYECTO') === -1 &&
    cfg.supabaseAnonKey.indexOf('TU_ANON_KEY') === -1
  );

  var FASES = ['briefing', 'busqueda', 'cribado', 'entrevistas', 'shortlist', 'oferta', 'cubierta'];

  var ETIQUETA_FASE = {
    briefing: 'Briefing',
    busqueda: 'Búsqueda',
    cribado: 'Cribado',
    entrevistas: 'Entrevistas',
    shortlist: 'Shortlist',
    oferta: 'Oferta',
    cubierta: 'Cubierta',
    pausada: 'En pausa'
  };

  var MODALIDAD = {
    presencial: 'Presencial',
    hibrido: 'Híbrido',
    remoto: 'Remoto'
  };

  var ESTADO_FINALISTA = {
    presentado: 'Nuevo',
    entrevista: 'En entrevista',
    oferta: 'Con oferta',
    contratado: 'Contratación',
    descartado: 'Fuera del proceso'
  };

  var ICONO_DOC = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" stroke="#4FB3E8" stroke-width="2" stroke-linejoin="round"/><path d="M14 3v5h5" stroke="#4FB3E8" stroke-width="2" stroke-linejoin="round"/></svg>';

  /* ============ UTILIDADES ============ */

  function $(id) {
    return document.getElementById(id);
  }

  /* Crea elementos sin innerHTML. Todo lo que viene de la base de datos pasa
     por aquí como texto, así que un nombre con "<script>" se ve tal cual y no
     se ejecuta. */
  function h(tag, props) {
    var el = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'on') Object.keys(v).forEach(function (ev) { el.addEventListener(ev, v[ev]); });
      else if (k === 'style') el.setAttribute('style', v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      if (Array.isArray(c)) c.forEach(function (x) { if (x) el.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); });
      else el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
  }

  /* es-ES no agrupa los números de cuatro cifras ("4410"), y en precios queda
     raro al lado de "42.000". useGrouping:'always' lo fuerza donde se admite. */
  var numero;
  try {
    numero = new Intl.NumberFormat('es-ES', { useGrouping: 'always', maximumFractionDigits: 2 });
  } catch (e) {
    numero = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
  }

  function euros(n) {
    return numero.format(Number(n) || 0) + ' €';
  }

  /* Las fechas "2026-09-16" se leen como hora local. new Date('2026-09-16')
     las toma como UTC, y en cualquier huso al oeste de Greenwich saldría el
     día anterior. */
  function leerFecha(s) {
    if (!s) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      var p = s.split('-');
      return new Date(+p[0], +p[1] - 1, +p[2]);
    }
    return new Date(s);
  }

  function hoy() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function diasHasta(s) {
    var f = leerFecha(s);
    if (!f) return null;
    var dia = new Date(f.getFullYear(), f.getMonth(), f.getDate());
    return Math.round((dia - hoy()) / 86400000);
  }

  function relativo(n) {
    if (n === null) return '';
    if (n === 0) return 'hoy';
    if (n === 1) return 'mañana';
    if (n === -1) return 'ayer';
    return n > 0 ? 'en ' + n + ' días' : 'hace ' + (-n) + ' días';
  }

  function mayuscula(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  var FMT_FECHA = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  var FMT_MOMENTO = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  function fecha(s) {
    var f = leerFecha(s);
    return f ? FMT_FECHA.format(f) : '—';
  }

  function sumarDias(s, n) {
    var f = leerFecha(s);
    return new Date(f.getFullYear(), f.getMonth(), f.getDate() + n);
  }

  /* ============ VISTAS ============ */

  var VISTAS = ['v-carga', 'v-login', 'v-olvido', 'v-nueva', 'v-panel'];

  function ver(id) {
    VISTAS.forEach(function (v) {
      $(v).hidden = v !== id;
    });
    var foco = null;
    if (id === 'v-login') foco = $('l-email');
    if (id === 'v-olvido') foco = $('o-email');
    if (id === 'v-nueva') foco = $('n-clave');
    if (foco) foco.focus();
    window.scrollTo(0, 0);
  }

  function mensaje(el, texto, tipo) {
    if (!texto) {
      el.hidden = true;
      return;
    }
    el.textContent = texto;
    el.className = 'msg ' + (tipo === 'ok' ? 'msg-ok' : 'msg-mal');
    el.hidden = false;
  }

  var toastT;
  function toast(texto) {
    var t = $('toast');
    t.textContent = texto;
    t.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove('on'); }, 3200);
  }

  function ocupado(boton, si, texto) {
    if (si) {
      boton.dataset.texto = boton.textContent;
      boton.textContent = texto;
      boton.disabled = true;
    } else {
      boton.textContent = boton.dataset.texto || boton.textContent;
      boton.disabled = false;
    }
  }

  /* ============ ACCESO A DATOS ============ */

  /* Dos implementaciones con la misma forma: Supabase de verdad y la
     demostración. El resto del archivo no sabe cuál está usando. */

  function resultado(p) {
    return p.then(function (r) {
      if (r.error) throw r.error;
      return r.data;
    });
  }

  function apiSupabase() {
    var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        /* implicit y no PKCE: con PKCE el enlace de recuperar contraseña
           solo funciona en el mismo navegador que lo pidió, y mucha gente
           abre el correo en el móvil. */
        flowType: 'implicit'
      }
    });

    return {
      sesion: function () {
        return sb.auth.getSession().then(function (r) { return r.data.session; });
      },
      entrar: function (email, clave) {
        return resultado(sb.auth.signInWithPassword({ email: email, password: clave }));
      },
      salir: function () {
        return sb.auth.signOut();
      },
      recuperar: function (email) {
        return resultado(sb.auth.resetPasswordForEmail(email, {
          redirectTo: location.origin + location.pathname
        }));
      },
      nuevaClave: function (clave) {
        return resultado(sb.auth.updateUser({ password: clave }));
      },
      alCambiar: function (fn) {
        sb.auth.onAuthStateChange(function (evento, sesion) {
          /* La documentación de Supabase pide no llamar a su API dentro de
             este callback: puede bloquearse esperando al propio evento. */
          setTimeout(function () { fn(evento, sesion); }, 0);
        });
      },
      cargar: function () {
        return Promise.all([
          resultado(sb.from('miembros').select('nombre, cargo, empresa_id').maybeSingle()),
          resultado(sb.from('empresas').select('*').maybeSingle()),
          resultado(sb.from('vacantes').select('*').order('abierta_en', { ascending: false })),
          resultado(sb.from('finalistas').select('*').order('encaje', { ascending: false, nullsFirst: false })),
          resultado(sb.from('eventos').select('*').order('fecha', { ascending: false }).limit(300)),
          resultado(sb.from('facturas').select('*, finalistas(nombre)').order('emitida_en', { ascending: false })),
          resultado(sb.from('documentos').select('*').order('creado_en', { ascending: false }))
        ]).then(function (r) {
          return {
            miembro: r[0],
            empresa: r[1],
            vacantes: r[2] || [],
            finalistas: r[3] || [],
            eventos: r[4] || [],
            facturas: r[5] || [],
            documentos: r[6] || []
          };
        });
      },
      valorar: function (id, decision, comentario) {
        return resultado(sb.rpc('valorar_finalista', {
          p_finalista: id,
          p_decision: decision,
          p_comentario: comentario || ''
        }));
      },
      urlArchivo: function (ruta) {
        /* Enlace firmado de un minuto: si alguien lo reenvía, caduca. */
        return resultado(sb.storage.from('documentos').createSignedUrl(ruta, 60)).then(function (d) {
          return d.signedUrl;
        });
      }
    };
  }

  function apiDemo() {
    var d = window.PLANA_DEMO();
    return {
      cargar: function () {
        return new Promise(function (ok) { setTimeout(function () { ok(d); }, 300); });
      },
      salir: function () {
        return Promise.resolve();
      },
      valorar: function (id, decision, comentario) {
        var f = d.finalistas.filter(function (x) { return x.id === id; })[0];
        if (!f) return Promise.reject(new Error('Finalista no encontrado'));
        f.decision_cliente = decision;
        f.comentario_cliente = (comentario || '').trim() || null;
        if (decision !== 'pendiente') {
          d.eventos.unshift({
            id: 'e' + Date.now(),
            vacante_id: f.vacante_id,
            fecha: new Date().toISOString(),
            titulo: (decision === 'interesa' ? 'Te interesa ' : 'Descartas a ') + f.nombre,
            detalle: 'Valoración desde el área de clientes'
          });
        }
        return Promise.resolve();
      },
      urlArchivo: function () {
        return Promise.resolve(null);
      }
    };
  }

  /* ============ ESTADO ============ */

  var api = null;
  var modoDemo = false;
  var datos = null;
  var emailSesion = '';
  var vacanteSel = null;

  function activas(lista) {
    return lista.filter(function (v) { return v.fase !== 'cubierta' && v.fase !== 'pausada'; });
  }

  function finalistasDe(v) {
    return datos.finalistas.filter(function (f) { return f.vacante_id === v.id; });
  }

  function pendientesDeValorar() {
    var abiertas = {};
    activas(datos.vacantes).forEach(function (v) { abiertas[v.id] = true; });
    return datos.finalistas.filter(function (f) {
      return abiertas[f.vacante_id] &&
        f.decision_cliente === 'pendiente' &&
        f.estado !== 'contratado' &&
        f.estado !== 'descartado';
    });
  }

  function garantia(v) {
    if (v.fase !== 'cubierta' || !v.cubierta_en) return null;
    var pasados = -diasHasta(v.cubierta_en);
    return {
      total: v.garantia_dias,
      pasados: Math.max(0, pasados),
      quedan: v.garantia_dias - pasados,
      fin: sumarDias(v.cubierta_en, v.garantia_dias)
    };
  }

  /* ============ PANEL ============ */

  function pintarPanel() {
    var nombre = (datos.miembro && datos.miembro.nombre) || emailSesion;
    $('u-nombre').textContent = nombre;
    $('u-empresa').textContent = datos.empresa ? datos.empresa.nombre : '';
    $('cinta-demo').hidden = !modoDemo;

    var existe = vacanteSel && datos.vacantes.some(function (v) { return v.id === vacanteSel; });
    if (!existe) {
      var primera = activas(datos.vacantes)[0] || datos.vacantes[0];
      vacanteSel = primera ? primera.id : null;
    }

    $('panel').replaceChildren(
      pintarSaludo(nombre),
      pintarKpis(),
      pintarRejilla(),
      pintarInferior()
    );
  }

  function textoPlan(e) {
    if (e.plana_ilimitada) return 'Plana Ilimitada';
    if (e.tramo_descuento) return 'Escala Plana: −' + e.tramo_descuento + '% en todos los packs';
    return 'Packs a precio de lista';
  }

  function pintarSaludo(nombre) {
    var e = datos.empresa;
    return h('section', { class: 'saludo' },
      h('h1', { id: 'saludo-h1', tabindex: '-1', text: 'Hola, ' + nombre.split(' ')[0] }),
      h('p', { text: e.nombre + ' · ' + textoPlan(e) })
    );
  }

  function kpi(etiqueta, valor, sub, destaca) {
    return h('div', { class: 'kpi' + (destaca ? ' destaca' : '') },
      h('div', { class: 'k-lbl', text: etiqueta }),
      h('div', { class: 'k-val', text: String(valor) }),
      h('div', { class: 'k-sub', text: sub })
    );
  }

  function pintarKpis() {
    var enMarcha = activas(datos.vacantes);
    var cubiertas = datos.vacantes.filter(function (v) { return v.fase === 'cubierta'; });

    var pend = pendientesDeValorar();
    var vacPend = {};
    pend.forEach(function (f) { vacPend[f.vacante_id] = true; });
    var nVacPend = Object.keys(vacPend).length;

    var proxima = enMarcha
      .filter(function (v) { return v.shortlist_prevista && diasHasta(v.shortlist_prevista) >= 0; })
      .sort(function (a, b) { return diasHasta(a.shortlist_prevista) - diasHasta(b.shortlist_prevista); })[0];

    var garantias = cubiertas
      .map(function (v) { return garantia(v); })
      .filter(function (g) { return g && g.quedan > 0; })
      .sort(function (a, b) { return a.quedan - b.quedan; });

    return h('section', { class: 'kpis', 'aria-label': 'Resumen' },
      kpi('Finalistas por valorar', pend.length,
        pend.length ? 'Te esperan en ' + nVacPend + (nVacPend === 1 ? ' vacante' : ' vacantes') : 'Estás al día', true),
      kpi('Vacantes en marcha', enMarcha.length,
        cubiertas.length + (cubiertas.length === 1 ? ' cubierta' : ' cubiertas')),
      kpi('Próxima shortlist',
        proxima ? mayuscula(relativo(diasHasta(proxima.shortlist_prevista))) : '—',
        proxima ? proxima.titulo : 'Sin fechas previstas'),
      kpi('Garantías en curso', garantias.length,
        garantias.length ? 'La próxima termina en ' + garantias[0].quedan + ' días' : 'Ninguna activa')
    );
  }

  function chipFase(fase) {
    var clase = 'chip';
    if (fase === 'cubierta') clase += ' ok';
    else if (fase === 'shortlist' || fase === 'oferta') clase += ' sol';
    else if (fase === 'pausada') clase += ' gris';
    return h('span', { class: clase, text: ETIQUETA_FASE[fase] || fase });
  }

  function avance(fase) {
    var i = FASES.indexOf(fase);
    return i < 0 ? 0 : Math.round(i / (FASES.length - 1) * 100);
  }

  function pintarRejilla() {
    var orden = activas(datos.vacantes).concat(datos.vacantes.filter(function (v) {
      return v.fase === 'cubierta' || v.fase === 'pausada';
    }));

    var lista = h('nav', { class: 'lista-vac', 'aria-label': 'Vacantes' },
      h('h2', { class: 'bloque-tit' }, 'Vacantes', h('small', { text: String(datos.vacantes.length) })),
      orden.length ? orden.map(function (v) {
        return h('button', {
          type: 'button',
          class: 'vac',
          'aria-current': v.id === vacanteSel ? 'true' : 'false',
          on: {
            click: function () {
              vacanteSel = v.id;
              pintarPanel();
              if (window.innerWidth <= 1020) $('detalle').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        },
          h('div', { class: 'v-top' },
            h('div', null,
              h('div', { class: 'v-tit', text: v.titulo }),
              h('div', { class: 'v-meta', text: 'Pack ' + v.pack + (v.ubicacion ? ' · ' + v.ubicacion : '') })
            ),
            chipFase(v.fase)
          ),
          h('div', { class: 'progreso', 'aria-hidden': 'true' },
            h('i', { style: 'width:' + avance(v.fase) + '%' })
          )
        );
      }) : h('p', { class: 'vacio', text: 'Todavía no hay vacantes.' })
    );

    var v = datos.vacantes.filter(function (x) { return x.id === vacanteSel; })[0];

    return h('div', { class: 'rejilla' },
      lista,
      h('section', { class: 'caja detalle', id: 'detalle' },
        v ? pintarDetalle(v) : h('p', { class: 'vacio', text: 'Cuando abramos tu primera vacante, la verás aquí.' })
      )
    );
  }

  function dato(etiqueta, valor, sub) {
    return h('div', { class: 'dato' },
      h('span', { text: etiqueta }),
      h('b', { text: valor }),
      sub ? h('small', { text: sub }) : null
    );
  }

  function pintarDetalle(v) {
    var meta = [];
    if (v.ubicacion) meta.push(v.ubicacion);
    if (v.modalidad) meta.push(MODALIDAD[v.modalidad]);
    if (v.salario_min && v.salario_max) meta.push(euros(v.salario_min) + ' – ' + euros(v.salario_max));
    meta.push('Pack ' + v.pack);

    var idx = FASES.indexOf(v.fase);
    var fases = h('ol', { class: 'fases', 'aria-label': 'Fases del proceso' },
      FASES.map(function (f, i) {
        var clase = '';
        if (idx >= 0 && i < idx) clase = 'hecha';
        if (i === idx) clase = v.fase === 'cubierta' ? 'hecha actual' : 'actual';
        return h('li', { class: clase },
          ETIQUETA_FASE[f],
          i === idx ? h('span', { class: 'sr', text: ' (fase actual)' }) : null
        );
      })
    );

    var datosV;
    var g = garantia(v);
    if (v.fase === 'cubierta') {
      datosV = h('div', { class: 'datos' },
        dato('Abierta', fecha(v.abierta_en)),
        dato('Cubierta', fecha(v.cubierta_en),
          v.cubierta_en ? 'En ' + Math.round((leerFecha(v.cubierta_en) - leerFecha(v.abierta_en)) / 86400000) + ' días' : null),
        dato('Perfiles evaluados', numero.format(v.candidatos_evaluados))
      );
    } else {
      datosV = h('div', { class: 'datos' },
        dato('Abierta', fecha(v.abierta_en), mayuscula(relativo(diasHasta(v.abierta_en)))),
        dato('Shortlist prevista', fecha(v.shortlist_prevista),
          v.shortlist_prevista ? mayuscula(relativo(diasHasta(v.shortlist_prevista))) : null),
        dato('Cierre estimado', fecha(v.prediccion_cierre), v.prediccion_cierre ? 'Estimación de Planax' : null)
      );
    }

    var bloqueGarantia = null;
    if (g) {
      if (g.quedan > 0) {
        bloqueGarantia = h('div', { class: 'garantia' },
          h('div', { class: 'g-top' },
            h('b', { text: 'Reposición garantizada' }),
            h('span', { text: 'Quedan ' + g.quedan + ' de ' + g.total + ' días' })
          ),
          h('div', { class: 'progreso', 'aria-hidden': 'true' },
            h('i', { style: 'width:' + Math.min(100, Math.round(g.pasados / g.total * 100)) + '%' })
          ),
          h('p', {
            class: 'vacio',
            style: 'padding:8px 0 0',
            text: 'Si la persona contratada no funciona antes del ' + FMT_FECHA.format(g.fin) + ', buscamos a otra sin volver a cobrarte el pack.'
          })
        );
      } else {
        bloqueGarantia = h('p', { class: 'vacio', text: 'Garantía cumplida el ' + FMT_FECHA.format(g.fin) + '.' });
      }
    }

    var fins = finalistasDe(v);
    var maximo = Math.max(v.candidatos_evaluados || 0, 1);
    function filaEmbudo(nombre, n) {
      return h('div', { class: 'e-fila' },
        h('span', { text: nombre }),
        h('div', { class: 'e-barra', 'aria-hidden': 'true' },
          h('i', { style: 'width:' + Math.round(n / maximo * 100) + '%' })
        ),
        h('b', { text: numero.format(n) })
      );
    }

    var eventos = datos.eventos.filter(function (e) { return e.vacante_id === v.id; });

    var vacioFinalistas = 'Los finalistas aparecerán aquí en cuanto estén listos';
    if (v.shortlist_prevista && diasHasta(v.shortlist_prevista) >= 0) {
      vacioFinalistas += ', previsiblemente ' + relativo(diasHasta(v.shortlist_prevista));
    }

    return [
      h('div', { class: 'd-cab' },
        h('div', null,
          h('h2', { text: v.titulo }),
          h('p', { class: 'd-meta', text: meta.join(' · ') })
        ),
        chipFase(v.fase)
      ),
      fases,
      datosV,
      bloqueGarantia,
      h('div', { class: 'sec-d' },
        h('h3', { text: 'Embudo' }),
        h('div', { class: 'embudo' },
          filaEmbudo('Perfiles evaluados', v.candidatos_evaluados || 0),
          filaEmbudo('Entrevistas', v.entrevistas_realizadas || 0),
          filaEmbudo('Finalistas', fins.length)
        )
      ),
      h('div', { class: 'sec-d' },
        h('h3', { text: 'Finalistas' }),
        fins.length
          ? h('div', { class: 'finalistas' }, fins.map(function (f) { return pintarFinalista(f, v); }))
          : h('p', { class: 'vacio', text: vacioFinalistas + '.' })
      ),
      h('div', { class: 'sec-d' },
        h('h3', { text: 'Actividad' }),
        eventos.length
          ? h('ol', { class: 'cronologia' }, eventos.map(function (e) {
            return h('li', null,
              h('time', { datetime: e.fecha, text: FMT_MOMENTO.format(new Date(e.fecha)) }),
              h('p', { text: e.titulo }),
              e.detalle ? h('small', { text: e.detalle }) : null
            );
          }))
          : h('p', { class: 'vacio', text: 'Sin actividad todavía.' })
      )
    ];
  }

  function pintarFinalista(f, v) {
    var editable = v.fase !== 'cubierta' && f.estado !== 'contratado' && f.estado !== 'descartado';
    var elegida = f.decision_cliente;

    var chipClase = 'chip';
    if (f.estado === 'contratado') chipClase += ' ok';
    else if (f.estado === 'descartado') chipClase += ' gris';
    else if (f.estado === 'oferta') chipClase += ' sol';

    var sub = [];
    if (f.puesto_actual) sub.push(f.puesto_actual);
    if (f.anos_experiencia !== null && f.anos_experiencia !== undefined) {
      sub.push(f.anos_experiencia + (f.anos_experiencia === 1 ? ' año' : ' años'));
    }

    var tarjeta = h('article', { class: 'fin' + (elegida === 'interesa' ? ' interesa' : '') });

    var hijos = [
      h('div', { class: 'f-cab' },
        h('div', null,
          h('div', { class: 'f-nom', text: f.nombre }),
          sub.length ? h('div', { class: 'f-sub', text: sub.join(' · ') }) : null
        ),
        h('span', { class: chipClase, text: ESTADO_FINALISTA[f.estado] || f.estado })
      )
    ];

    if (f.encaje !== null && f.encaje !== undefined) {
      hijos.push(h('div', { class: 'encaje' },
        h('span', { text: 'Encaje' }),
        h('div', { class: 'progreso', 'aria-hidden': 'true' }, h('i', { style: 'width:' + f.encaje + '%' })),
        h('b', { text: f.encaje + '%' })
      ));
    }

    if (f.resumen) hijos.push(h('p', { class: 'f-res', text: f.resumen }));
    if (f.pretension_salarial) hijos.push(h('p', { class: 'f-sub', text: 'Pretensión salarial: ' + euros(f.pretension_salarial) }));

    if (f.cv_ruta) {
      hijos.push(h('div', null,
        h('button', { type: 'button', class: 'btn btn-borde btn-sm', text: 'Ver CV', on: { click: function () { abrirArchivo(f.cv_ruta); } } })
      ));
    }

    if (editable) {
      var comentario = h('textarea', {
        id: 'com-' + f.id,
        maxlength: '2000',
        placeholder: 'Comentario para tu consultora (opcional)'
      });
      comentario.value = f.comentario_cliente || '';

      var bSi = h('button', { type: 'button', class: 'btn btn-borde btn-sm si', 'aria-pressed': String(elegida === 'interesa'), text: 'Me interesa' });
      var bNo = h('button', { type: 'button', class: 'btn btn-borde btn-sm no', 'aria-pressed': String(elegida === 'no_interesa'), text: 'No encaja' });
      var bGuardar = h('button', { type: 'button', class: 'btn btn-tinta btn-sm', text: 'Guardar valoración', disabled: true });

      function sucio() {
        var cambiaDecision = elegida !== f.decision_cliente;
        var cambiaComentario = comentario.value.trim() !== (f.comentario_cliente || '');
        bGuardar.disabled = !(cambiaDecision || cambiaComentario);
      }

      function elegir(valor) {
        elegida = elegida === valor ? 'pendiente' : valor;
        bSi.setAttribute('aria-pressed', String(elegida === 'interesa'));
        bNo.setAttribute('aria-pressed', String(elegida === 'no_interesa'));
        sucio();
      }

      bSi.addEventListener('click', function () { elegir('interesa'); });
      bNo.addEventListener('click', function () { elegir('no_interesa'); });
      comentario.addEventListener('input', sucio);

      bGuardar.addEventListener('click', function () {
        ocupado(bGuardar, true, 'Guardando…');
        api.valorar(f.id, elegida, comentario.value)
          .then(function () { return api.cargar(); })
          .then(function (d) {
            datos = d;
            pintarPanel();
            toast('Valoración guardada. Tu consultora la verá al momento.');
          })
          .catch(function (err) {
            console.error('[Plana] No se pudo guardar la valoración:', err);
            ocupado(bGuardar, false);
            toast('No se ha podido guardar. Inténtalo de nuevo.');
          });
      });

      hijos.push(
        h('div', { class: 'decision', role: 'group', 'aria-label': 'Tu valoración de ' + f.nombre }, bSi, bNo),
        h('label', { class: 'sr', for: 'com-' + f.id, text: 'Comentario sobre ' + f.nombre }),
        comentario,
        h('div', null, bGuardar)
      );
    } else if (f.decision_cliente !== 'pendiente' && f.estado !== 'contratado') {
      hijos.push(h('p', { class: 'f-sub', text: f.decision_cliente === 'interesa' ? 'Te interesó' : 'Lo descartaste' }));
    }

    hijos.forEach(function (x) { if (x) tarjeta.appendChild(x); });
    return tarjeta;
  }

  function pintarInferior() {
    return h('div', { class: 'inferior' },
      h('div', { class: 'col-lat' },
        pintarFacturas(),
        pintarDocumentos()
      ),
      h('div', { class: 'col-lat' },
        pintarConsultor(),
        pintarPlan()
      )
    );
  }

  function estadoFactura(f) {
    if (f.estado === 'pendiente' && f.vence_en && diasHasta(f.vence_en) < 0) return 'vencida';
    return f.estado;
  }

  function pintarFacturas() {
    var fs = datos.facturas;
    var pendiente = 0;
    var pagadoAno = 0;
    var ano = new Date().getFullYear();
    fs.forEach(function (f) {
      if (f.estado === 'pagada') {
        if (leerFecha(f.emitida_en).getFullYear() === ano) pagadoAno += Number(f.importe);
      } else {
        pendiente += Number(f.importe);
      }
    });

    var etiqueta = { pendiente: 'Pendiente', pagada: 'Pagada', vencida: 'Vencida' };
    var clase = { pendiente: 'chip sol', pagada: 'chip ok', vencida: 'chip mal' };

    return h('section', { class: 'caja' },
      h('h2', { class: 'bloque-tit', text: 'Facturas' }),
      fs.length ? [
        h('div', { class: 'resumen-fact' },
          h('span', null, 'Pendiente ', h('b', { text: euros(pendiente) })),
          h('span', null, 'Pagado en ' + ano + ' ', h('b', { text: euros(pagadoAno) }))
        ),
        h('div', { class: 'tabla-scroll' },
          h('table', null,
            h('thead', null, h('tr', null,
              h('th', { scope: 'col', text: 'Concepto' }),
              h('th', { scope: 'col', text: 'Emitida' }),
              h('th', { scope: 'col', text: 'Vence' }),
              h('th', { scope: 'col', text: 'Estado' }),
              h('th', { scope: 'col', style: 'text-align:right', text: 'Importe' }),
              h('th', { scope: 'col' }, h('span', { class: 'sr', text: 'PDF' }))
            )),
            h('tbody', null, fs.map(function (f) {
              var e = estadoFactura(f);
              return h('tr', null,
                h('td', null,
                  f.concepto,
                  f.numero ? h('div', { class: 'f-sub', text: f.numero }) : null,
                  f.finalistas ? h('div', { class: 'f-sub', text: 'Contratación: ' + f.finalistas.nombre }) : null
                ),
                h('td', { text: fecha(f.emitida_en) }),
                h('td', { text: f.estado === 'pagada' ? '—' : fecha(f.vence_en) }),
                h('td', null, h('span', { class: clase[e], text: etiqueta[e] })),
                h('td', { class: 'num', text: euros(f.importe) }),
                h('td', { style: 'text-align:right' },
                  f.pdf_ruta ? h('button', {
                    type: 'button',
                    class: 'btn btn-borde btn-sm',
                    'aria-label': 'Descargar factura ' + (f.numero || f.concepto),
                    text: 'PDF',
                    on: { click: function () { abrirArchivo(f.pdf_ruta); } }
                  }) : null
                )
              );
            }))
          )
        )
      ] : h('p', { class: 'vacio', text: 'Aún no hay facturas.' })
    );
  }

  function pintarDocumentos() {
    var titulos = {};
    datos.vacantes.forEach(function (v) { titulos[v.id] = v.titulo; });
    var tipo = { informe: 'Informe', contrato: 'Contrato', otro: 'Documento' };

    return h('section', { class: 'caja' },
      h('h2', { class: 'bloque-tit', text: 'Informes y documentos' }),
      datos.documentos.length
        ? h('ul', { class: 'docs' }, datos.documentos.map(function (d) {
          var ico = h('span', { class: 'd-ico' });
          ico.innerHTML = ICONO_DOC;
          var sub = tipo[d.tipo] + ' · ' + (d.creado_en ? FMT_FECHA.format(new Date(d.creado_en)) : '—');
          return h('li', null,
            ico,
            h('div', { class: 'd-txt' },
              h('b', { text: d.titulo }),
              h('span', { text: sub })
            ),
            h('button', {
              type: 'button',
              class: 'btn btn-borde btn-sm',
              'aria-label': 'Abrir ' + d.titulo,
              text: 'Abrir',
              on: { click: function () { abrirArchivo(d.ruta); } }
            })
          );
        }))
        : h('p', { class: 'vacio', text: 'Los informes de cada proceso aparecerán aquí.' })
    );
  }

  function pintarConsultor() {
    var e = datos.empresa;
    var email = e.consultor_email || 'hello@beplana.com';
    var asunto = encodeURIComponent('Área de clientes · ' + e.nombre);
    return h('section', { class: 'caja consultor' },
      h('h2', { class: 'bloque-tit', text: 'Tu contacto en Plana' }),
      h('div', { class: 'c-nom', text: e.consultor_nombre || 'Equipo de Plana' }),
      h('p', { class: 'f-sub', text: email }),
      h('div', { class: 'c-acc' },
        h('a', { class: 'btn btn-sol btn-sm', href: 'mailto:' + email + '?subject=' + asunto, text: 'Escribir' }),
        e.consultor_telefono
          ? h('a', { class: 'btn btn-borde btn-sm', href: 'tel:' + e.consultor_telefono.replace(/[^\d+]/g, ''), text: 'Llamar' })
          : null
      )
    );
  }

  function pintarPlan() {
    var e = datos.empresa;
    var ano = new Date().getFullYear();
    var esteAno = datos.vacantes.filter(function (v) { return leerFecha(v.abierta_en).getFullYear() === ano; }).length;
    var packs = {};
    datos.vacantes.forEach(function (v) { packs[v.pack] = v.garantia_dias; });

    var filas = [
      h('li', null, h('span', { text: 'Modalidad' }), h('b', { text: e.plana_ilimitada ? 'Plana Ilimitada' : 'Packs por vacante' })),
      h('li', null, h('span', { text: 'Escala Plana' }), h('b', { text: e.tramo_descuento ? '−' + e.tramo_descuento + '%' : 'Precio de lista' })),
      h('li', null, h('span', { text: 'Vacantes en ' + ano }), h('b', { text: String(esteAno) }))
    ];
    Object.keys(packs).forEach(function (p) {
      filas.push(h('li', null, h('span', { text: 'Garantía pack ' + p }), h('b', { text: packs[p] + ' días' })));
    });

    return h('section', { class: 'caja' },
      h('h2', { class: 'bloque-tit', text: 'Tu plan' }),
      h('ul', { class: 'plan-lista' }, filas),
      h('p', { class: 'f-sub', style: 'margin-top:12px' },
        h('a', { class: 'enlace', href: '../#packs', text: 'Ver packs y precios' })
      )
    );
  }

  /* Se abre la pestaña antes de pedir el enlace: si se abriera después de la
     espera, el navegador lo trataría como una ventana emergente y la
     bloquearía. */
  function abrirArchivo(ruta) {
    if (modoDemo) {
      toast('En la demostración los archivos no se abren.');
      return;
    }
    var ventana = window.open('', '_blank');
    if (ventana) ventana.opener = null;
    api.urlArchivo(ruta)
      .then(function (url) {
        if (ventana) ventana.location.href = url;
        else location.href = url;
      })
      .catch(function (err) {
        console.error('[Plana] No se pudo abrir el archivo:', err);
        if (ventana) ventana.close();
        toast('No se ha podido abrir el archivo.');
      });
  }

  /* ============ ENTRAR Y SALIR ============ */

  function entrarPanel() {
    ver('v-carga');
    return api.cargar()
      .then(function (d) {
        if (!d.miembro || !d.empresa) {
          return api.salir().then(function () {
            ver('v-login');
            mensaje($('m-login'), 'Tu usuario todavía no está asociado a ninguna empresa. Escríbenos a hello@beplana.com y lo activamos.');
          });
        }
        datos = d;
        pintarPanel();
        ver('v-panel');
        $('saludo-h1').focus({ preventScroll: true });
        vigilarInactividad();
      })
      .catch(function (err) {
        console.error('[Plana] No se pudieron cargar los datos del área de clientes:', err);
        ver('v-login');
        mensaje($('m-login'), 'No hemos podido cargar tus datos. Recarga la página o escríbenos a hello@beplana.com.');
      });
  }

  function salir(aviso) {
    parar();
    return api.salir().then(function () {
      datos = null;
      vacanteSel = null;
      $('panel').replaceChildren();
      $('f-login').reset();
      if (modoDemo) {
        modoDemo = false;
        api = CONFIGURADO && window.supabase ? apiReal : null;
      }
      ver('v-login');
      mensaje($('m-login'), aviso || '', 'ok');
    });
  }

  /* Cierre por inactividad: es un panel con datos de candidatos y facturas,
     y en un ordenador compartido la sesión no debería quedarse abierta. */
  var ultimaActividad = Date.now();
  var reloj = null;
  var EVENTOS_ACTIVIDAD = ['pointerdown', 'keydown', 'scroll', 'touchstart'];

  function marcar() {
    ultimaActividad = Date.now();
  }

  function vigilarInactividad() {
    parar();
    marcar();
    EVENTOS_ACTIVIDAD.forEach(function (ev) { addEventListener(ev, marcar, { passive: true }); });
    var limite = (cfg.minutosInactividad || 30) * 60000;
    reloj = setInterval(function () {
      if (Date.now() - ultimaActividad > limite) {
        salir('Hemos cerrado la sesión tras ' + (cfg.minutosInactividad || 30) + ' minutos sin actividad.');
      }
    }, 30000);
  }

  function parar() {
    clearInterval(reloj);
    EVENTOS_ACTIVIDAD.forEach(function (ev) { removeEventListener(ev, marcar); });
  }

  function valido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  $('f-login').addEventListener('submit', function (e) {
    e.preventDefault();
    var m = $('m-login');
    var email = $('l-email').value.trim();
    var clave = $('l-clave').value;

    if (!api || modoDemo) {
      mensaje(m, 'El área de clientes aún no está conectada. Puedes ver la demostración de abajo.');
      return;
    }
    if (!valido(email) || !clave) {
      mensaje(m, 'Escribe tu email y tu contraseña.');
      return;
    }

    mensaje(m, '');
    var b = $('b-login');
    ocupado(b, true, 'Entrando…');
    api.entrar(email, clave)
      .then(function () {
        emailSesion = email;
        $('l-clave').value = '';
        ocupado(b, false);
        return entrarPanel();
      })
      .catch(function (err) {
        ocupado(b, false);
        $('l-clave').value = '';
        /* Mismo mensaje si el email no existe que si la contraseña está mal:
           no se le dice a nadie qué emails tienen cuenta. */
        if (err && err.status === 429) mensaje(m, 'Demasiados intentos. Espera unos minutos.');
        else if (err && (err.status === 400 || err.code === 'invalid_credentials')) mensaje(m, 'Email o contraseña incorrectos.');
        else {
          console.error('[Plana] Error al entrar:', err);
          mensaje(m, 'No hemos podido conectar. Inténtalo de nuevo.');
        }
      });
  });

  $('a-olvido').addEventListener('click', function () {
    $('o-email').value = $('l-email').value.trim();
    mensaje($('m-olvido'), '');
    ver('v-olvido');
  });

  $('a-volver').addEventListener('click', function () {
    ver('v-login');
  });

  $('f-olvido').addEventListener('submit', function (e) {
    e.preventDefault();
    var m = $('m-olvido');
    var email = $('o-email').value.trim();
    if (!api || modoDemo) {
      mensaje(m, 'El área de clientes aún no está conectada.');
      return;
    }
    if (!valido(email)) {
      mensaje(m, 'Escribe un email válido.');
      return;
    }
    var b = $('b-olvido');
    ocupado(b, true, 'Enviando…');
    api.recuperar(email)
      .then(function () {
        mensaje(m, 'Si ese email tiene acceso, te llegará un enlace en unos minutos. Revisa también el spam.', 'ok');
      })
      .catch(function (err) {
        if (err && err.status === 429) mensaje(m, 'Ya te hemos enviado un enlace hace poco. Espera unos minutos.');
        else {
          /* Salvo el límite de envíos, se responde igual que si hubiera ido
             bien, por la misma razón que al entrar. */
          console.error('[Plana] Error al pedir recuperación:', err);
          mensaje(m, 'Si ese email tiene acceso, te llegará un enlace en unos minutos. Revisa también el spam.', 'ok');
        }
      })
      .then(function () { ocupado(b, false); });
  });

  $('f-nueva').addEventListener('submit', function (e) {
    e.preventDefault();
    var m = $('m-nueva');
    var c1 = $('n-clave').value;
    var c2 = $('n-clave2').value;
    if (c1.length < 10) {
      mensaje(m, 'La contraseña tiene que tener al menos 10 caracteres.');
      return;
    }
    if (c1 !== c2) {
      mensaje(m, 'Las dos contraseñas no coinciden.');
      return;
    }
    var b = $('b-nueva');
    ocupado(b, true, 'Guardando…');
    api.nuevaClave(c1)
      .then(function () {
        $('f-nueva').reset();
        history.replaceState(null, '', location.pathname);
        ocupado(b, false);
        return entrarPanel();
      })
      .catch(function (err) {
        ocupado(b, false);
        console.error('[Plana] Error al cambiar la contraseña:', err);
        if (err && err.code === 'same_password') mensaje(m, 'Tiene que ser distinta de la anterior.');
        else if (err && err.code === 'weak_password') mensaje(m, 'Esa contraseña es demasiado fácil de adivinar. Prueba con otra más larga.');
        else mensaje(m, 'El enlace ha caducado o ya se usó. Pide uno nuevo desde "¿Has olvidado la contraseña?".');
      });
  });

  $('b-salir').addEventListener('click', function () {
    salir();
  });

  $('b-demo').addEventListener('click', function () {
    modoDemo = true;
    api = apiDemo();
    emailSesion = 'demo@empresa.es';
    mensaje($('m-login'), '');
    entrarPanel();
  });

  /* ============ ARRANQUE ============ */

  var apiReal = null;

  if (!CONFIGURADO) {
    $('aviso-demo').hidden = false;
    ver('v-login');
    /* portal/?demo entra directo a la demostración, para poder enseñarla
       con un enlace. Solo mientras no haya base de datos conectada. */
    if (/[?&]demo(&|=|$)/.test(location.search)) $('b-demo').click();
    return;
  }

  if (!window.supabase) {
    ver('v-login');
    mensaje($('m-login'), 'No se ha podido cargar el acceso. Comprueba tu conexión y recarga la página.');
    return;
  }

  apiReal = apiSupabase();
  api = apiReal;

  /* Si se llega desde el enlace de "recuperar contraseña" o desde la
     invitación inicial (Add user → Send invitation), Supabase crea una
     sesión temporal al leer la URL. El enlace de invitación lleva
     type=invite en vez de type=recovery: sin reconocerlo aquí también, un
     cliente nuevo entraría directo al panel sin llegar a poner nunca una
     contraseña. */
  var vieneDeRecuperar = /type=(recovery|invite)/.test(location.hash);

  api.alCambiar(function (evento) {
    if (evento === 'PASSWORD_RECOVERY') {
      ver('v-nueva');
    } else if (evento === 'SIGNED_OUT' && !modoDemo) {
      parar();
      datos = null;
      if (!$('v-panel').hidden) ver('v-login');
    }
  });

  if (vieneDeRecuperar) {
    ver('v-nueva');
    return;
  }

  api.sesion()
    .then(function (s) {
      if (s) {
        emailSesion = s.user && s.user.email ? s.user.email : '';
        return entrarPanel();
      }
      ver('v-login');
    })
    .catch(function (err) {
      console.error('[Plana] Error al comprobar la sesión:', err);
      ver('v-login');
    });
})();
