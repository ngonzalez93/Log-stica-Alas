// ============================================================
//  Especificación de importación por módulo.
//  Define, para cada tabla, qué columnas espera el Excel, a qué
//  campo de la base van, su tipo y si son obligatorias.
//
//  Tipos:
//    text   → texto
//    number → número decimal (acepta 1.234,56 / 1234.56)
//    int    → número entero
//    date   → fecha (Date de Excel, serial o texto) → YYYY-MM-DD
//    bool   → Sí/No (Sí/Si/Verdadero/1 → true ; No/Falso/0 → false)
//
//  'proposed:true' marca módulos cuyo informe usa datos embebidos
//  (no tenían Excel): el formato es una propuesta basada en la tabla.
// ============================================================
window.IMPORT_SPECS = {
  tiempos: {
    key: "tiempos", title: "Tiempos de atención", table: "tiempos_atencion",
    sheetHint: "Registro",
    columns: [
      { header: "Tipo de flujo",        field: "tipo_flujo",         type: "text",   required: true  },
      { header: "Fecha",                field: "fecha",              type: "date",   required: true  },
      { header: "T1 Admin. (min)",      field: "t1_admin_min",       type: "number", required: false },
      { header: "T2 Preparación (min)", field: "t2_preparacion_min", type: "number", required: false },
      { header: "T3 Espera (min)",      field: "t3_espera_min",      type: "number", required: false },
      { header: "TTA (min)",            field: "tta_min",            type: "number", required: false },
      { header: "Error control",        field: "error_control",      type: "bool",   required: false },
      { header: "Reclamo",              field: "reclamo",            type: "bool",   required: false },
      { header: "Dentro de objetivo",   field: "dentro_objetivo",    type: "bool",   required: false },
      { header: "Anticipado",           field: "anticipado",         type: "bool",   required: false }
    ]
  },

  entregas: {
    key: "entregas", title: "Tiempos de entrega", table: "tiempos_entrega",
    columns: [
      { header: "Entrega",                field: "entrega",       type: "int",  required: true  },
      { header: "Almacén",                field: "almacen",       type: "text", required: false },
      { header: "ClDoc",                  field: "clase_doc",     type: "text", required: false },
      { header: "Fecha Carga del pedido", field: "fecha_carga",   type: "date", required: true  },
      { header: "Fecha Entrega",          field: "fecha_entrega", type: "date", required: true  },
      { header: "Descr. Etapa",           field: "descr_etapa",   type: "text", required: false }
    ]
  },

  gastos: {
    key: "gastos", title: "Gastos vs Presupuesto", table: "gastos_presupuesto",
    columns: [
      { header: "Grupo de Gastos", field: "grupo_gastos", type: "text",   required: true  },
      { header: "Orden Int",       field: "orden_int",    type: "text",   required: false },
      { header: "MES",             field: "mes",          type: "int",    required: true  },
      { header: "Gastos - 2026",   field: "gasto",        type: "number", required: true  },
      { header: "Presup - 2026",   field: "presupuesto",  type: "number", required: true  }
    ]
  },

  geo: {
    key: "geo", title: "Georreferenciación de clientes", table: "clientes_geo",
    columns: [
      { header: "Cod_Cliente",    field: "cod_cliente",    type: "text",   required: true  },
      { header: "Nom_Cliente",    field: "nom_cliente",    type: "text",   required: false },
      { header: "Depart_Cliente", field: "depart_cliente", type: "text",   required: false },
      { header: "Ciudad_Cliente", field: "ciudad_cliente", type: "text",   required: false },
      { header: "Vend_Asignado",  field: "vend_asignado",  type: "text",   required: false },
      { header: "Latitud",        field: "latitud",        type: "number", required: false },
      { header: "Longitud",       field: "longitud",       type: "number", required: false }
    ]
  },

  pendientes: {
    key: "pendientes", title: "Pedidos pendientes", table: "pedidos_pendientes", proposed: true,
    columns: [
      { header: "Pedido",      field: "pedido",     type: "text",   required: true  },
      { header: "Vendedor",    field: "vendedor",   type: "text",   required: false },
      { header: "Fecha",       field: "fecha",      type: "date",   required: false },
      { header: "Dias",        field: "dias",       type: "int",    required: false },
      { header: "Almacen",     field: "almacen",    type: "text",   required: false },
      { header: "Zona envio",  field: "zona_envio", type: "text",   required: false },
      { header: "Etapa",       field: "etapa",      type: "text",   required: false },
      { header: "Lineas",      field: "lineas",     type: "int",    required: false },
      { header: "Peso",        field: "peso_kg",    type: "number", required: false },
      { header: "Monto",       field: "monto",      type: "number", required: false }
    ]
  },

  fabrica: {
    key: "fabrica", title: "Atención — Fábrica", table: "atencion_fabrica", sheetHint: "Base",
    columns: [
      { header: "Turno",             field: "turno",             type: "text", required: true  },
      { header: "Fecha_Registro",    field: "fecha",             type: "date", required: true  },
      { header: "Hora_Registro",     field: "hora_registro",     type: "time", required: false },
      { header: "Hora_Inicio_Carga", field: "hora_inicio_carga", type: "time", required: false },
      { header: "Hora_Entregado",    field: "hora_entregado",    type: "time", required: false },
      { header: "Ruc_Cliente",       field: "ruc_cliente",       type: "text", required: false },
      { header: "Nom_Cliente",       field: "nom_cliente",       type: "text", required: false },
      { header: "Estado",            field: "estado",            type: "text", required: true  }
    ]
  }
};

window.IMPORT_ORDER = ["tiempos", "entregas", "gastos", "pendientes", "geo", "fabrica"];
