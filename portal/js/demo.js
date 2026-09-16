/* Datos ficticios para la demostración del área de clientes.

   Tienen la misma forma que lo que devuelve Supabase, así que el panel no
   distingue de dónde vienen. Las fechas se calculan desde hoy para que la
   demostración no envejezca: la shortlist siempre es "mañana". */
window.PLANA_DEMO = function () {
  var hoy = new Date();

  function dia(n) {
    var d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + n);
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + dd;
  }

  function momento(n, hora) {
    return new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + n, hora || 10, 0).toISOString();
  }

  return {
    miembro: {
      nombre: 'Andrea',
      cargo: 'Responsable de personas'
    },
    empresa: {
      id: 'demo',
      nombre: 'Empresa Demo S.L.',
      sector: 'Software',
      tramo_descuento: 10,
      plana_ilimitada: false,
      consultor_nombre: 'Tu consultora en Plana',
      consultor_email: 'hello@beplana.com',
      consultor_telefono: null
    },
    vacantes: [
      {
        id: 'v1',
        titulo: 'Desarrollador/a backend',
        ubicacion: 'Madrid',
        modalidad: 'hibrido',
        salario_min: 42000,
        salario_max: 50000,
        pack: 'Altitud',
        fase: 'shortlist',
        abierta_en: dia(-19),
        shortlist_prevista: dia(1),
        prediccion_cierre: dia(16),
        cubierta_en: null,
        garantia_dias: 90,
        candidatos_evaluados: 138,
        entrevistas_realizadas: 11
      },
      {
        id: 'v4',
        titulo: 'Head of Finance',
        ubicacion: 'Barcelona',
        modalidad: 'hibrido',
        salario_min: 75000,
        salario_max: 90000,
        pack: 'Estratosfera',
        fase: 'entrevistas',
        abierta_en: dia(-12),
        shortlist_prevista: dia(10),
        prediccion_cierre: dia(34),
        cubierta_en: null,
        garantia_dias: 120,
        candidatos_evaluados: 96,
        entrevistas_realizadas: 6
      },
      {
        id: 'v2',
        titulo: 'Técnico/a de atención al cliente',
        ubicacion: 'Oviedo',
        modalidad: 'presencial',
        salario_min: 22000,
        salario_max: 25000,
        pack: 'Despegue',
        fase: 'cribado',
        abierta_en: dia(-6),
        shortlist_prevista: dia(9),
        prediccion_cierre: dia(24),
        cubierta_en: null,
        garantia_dias: 60,
        candidatos_evaluados: 64,
        entrevistas_realizadas: 0
      },
      {
        id: 'v3',
        titulo: 'Responsable de marketing',
        ubicacion: 'Remoto',
        modalidad: 'remoto',
        salario_min: 45000,
        salario_max: 55000,
        pack: 'Altitud',
        fase: 'cubierta',
        abierta_en: dia(-70),
        shortlist_prevista: dia(-52),
        prediccion_cierre: null,
        cubierta_en: dia(-31),
        garantia_dias: 90,
        candidatos_evaluados: 212,
        entrevistas_realizadas: 14
      }
    ],
    finalistas: [
      {
        id: 'f1',
        vacante_id: 'v1',
        nombre: 'Laura M.',
        puesto_actual: 'Backend en una fintech',
        anos_experiencia: 6,
        pretension_salarial: 48000,
        encaje: 91,
        resumen: 'Diseña APIs con volumen alto de tráfico. Busca un equipo de producto más pequeño.',
        cv_ruta: 'demo/cv-laura.pdf',
        estado: 'presentado',
        decision_cliente: 'interesa',
        comentario_cliente: 'Nos encaja mucho. ¿Podemos verla esta semana?'
      },
      {
        id: 'f2',
        vacante_id: 'v1',
        nombre: 'Daniel R.',
        puesto_actual: 'Desarrollador en una consultora',
        anos_experiencia: 4,
        pretension_salarial: 44000,
        encaje: 84,
        resumen: 'Proyectos variados para clientes grandes. Quiere quedarse en un solo producto.',
        cv_ruta: 'demo/cv-daniel.pdf',
        estado: 'presentado',
        decision_cliente: 'pendiente',
        comentario_cliente: null
      },
      {
        id: 'f3',
        vacante_id: 'v1',
        nombre: 'Nerea L.',
        puesto_actual: 'Ingeniera de datos',
        anos_experiencia: 5,
        pretension_salarial: 50000,
        encaje: 78,
        resumen: 'Fuerte en bases de datos y rendimiento. Menos experiencia en diseño de APIs.',
        cv_ruta: 'demo/cv-nerea.pdf',
        estado: 'presentado',
        decision_cliente: 'pendiente',
        comentario_cliente: null
      },
      {
        id: 'f4',
        vacante_id: 'v3',
        nombre: 'Marta G.',
        puesto_actual: 'Marketing en e-commerce',
        anos_experiencia: 8,
        pretension_salarial: 52000,
        encaje: 93,
        resumen: 'Ha llevado adquisición y marca en dos e-commerce en crecimiento.',
        cv_ruta: 'demo/cv-marta.pdf',
        estado: 'contratado',
        decision_cliente: 'interesa',
        comentario_cliente: null
      },
      {
        id: 'f5',
        vacante_id: 'v3',
        nombre: 'Sergio P.',
        puesto_actual: 'Growth en una startup',
        anos_experiencia: 5,
        pretension_salarial: 48000,
        encaje: 82,
        resumen: 'Muy orientado a datos y experimentación.',
        cv_ruta: 'demo/cv-sergio.pdf',
        estado: 'descartado',
        decision_cliente: 'no_interesa',
        comentario_cliente: null
      }
    ],
    eventos: [
      { id: 'e1', vacante_id: 'v1', fecha: momento(0, 9), titulo: 'Te interesa Laura M.', detalle: 'Valoración desde el área de clientes' },
      { id: 'e2', vacante_id: 'v1', fecha: momento(-1, 17), titulo: 'Tres finalistas presentados', detalle: null },
      { id: 'e3', vacante_id: 'v1', fecha: momento(-8), titulo: 'Entrevistas del equipo en marcha', detalle: null },
      { id: 'e4', vacante_id: 'v1', fecha: momento(-12), titulo: 'Cribado con Planax completado', detalle: '138 perfiles evaluados' },
      { id: 'e5', vacante_id: 'v1', fecha: momento(-19), titulo: 'Vacante abierta', detalle: 'Pack Altitud' },
      { id: 'e6', vacante_id: 'v4', fecha: momento(-3), titulo: 'Seis entrevistas realizadas', detalle: null },
      { id: 'e7', vacante_id: 'v4', fecha: momento(-12), titulo: 'Vacante abierta', detalle: 'Pack Estratosfera · búsqueda confidencial' },
      { id: 'e8', vacante_id: 'v2', fecha: momento(-2), titulo: 'Cribado con Planax en curso', detalle: null },
      { id: 'e9', vacante_id: 'v2', fecha: momento(-6), titulo: 'Vacante abierta', detalle: 'Pack Despegue' },
      { id: 'e10', vacante_id: 'v3', fecha: momento(-31), titulo: 'Contratación cerrada con Marta G.', detalle: 'Empieza la reposición garantizada de 90 días' },
      { id: 'e11', vacante_id: 'v3', fecha: momento(-52), titulo: 'Finalistas presentados', detalle: null },
      { id: 'e12', vacante_id: 'v3', fecha: momento(-70), titulo: 'Vacante abierta', detalle: 'Pack Altitud' }
    ],
    facturas: [
      { id: 'fa3', vacante_id: 'v4', numero: 'DEMO-003', concepto: 'Pack Estratosfera · Head of Finance', importe: 7110, emitida_en: dia(-12), vence_en: dia(18), estado: 'pendiente', pdf_ruta: 'demo/fa3.pdf' },
      { id: 'fa2', vacante_id: 'v1', numero: 'DEMO-002', concepto: 'Pack Altitud · Desarrollador/a backend', importe: 4410, emitida_en: dia(-19), vence_en: dia(11), estado: 'pendiente', pdf_ruta: 'demo/fa2.pdf' },
      { id: 'fa1', vacante_id: 'v3', numero: 'DEMO-001', concepto: 'Pack Altitud · Responsable de marketing', importe: 4410, emitida_en: dia(-70), vence_en: dia(-40), estado: 'pagada', pdf_ruta: 'demo/fa1.pdf' }
    ],
    documentos: [
      { id: 'd1', vacante_id: 'v1', tipo: 'informe', titulo: 'Informe de mercado salarial · Desarrollador/a backend', ruta: 'demo/d1.pdf', creado_en: momento(-15) },
      { id: 'd2', vacante_id: 'v3', tipo: 'informe', titulo: 'Informe de cierre · Responsable de marketing', ruta: 'demo/d2.pdf', creado_en: momento(-31) },
      { id: 'd3', vacante_id: null, tipo: 'contrato', titulo: 'Condiciones del servicio', ruta: 'demo/d3.pdf', creado_en: momento(-70) }
    ]
  };
};
