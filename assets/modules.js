// ============================================================
//  Catálogo de módulos (informes) del proyecto.
//  Fuente única usada por index.html, admin.html y auth-guard.js.
//  'key' es el identificador de permiso guardado en profiles.allowed_modules.
// ============================================================
window.APP_MODULES = [
  { key:"tiempos", href:"Tablero_Tiempos_Alas.html", tag:"Tiempos", title:"Tiempos de atención",
    desc:"TTA por tramos (administrativo, preparación, espera) y cumplimiento del objetivo.",
    icon:'<path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="9"/>' },
  { key:"fabrica", href:"Tablero_ATC_Fabrica_Alas.html", tag:"Tiempos · Fábrica", title:"Atención — Fábrica",
    desc:"Panel de tiempos de atención para la operación de fábrica.",
    icon:'<path d="M2 20h20"/><path d="M4 20V9l5 3V9l5 3V9l5 3v8"/>' },
  { key:"entregas", href:"reporte_tiempos_entrega.html", tag:"Entregas", title:"Tiempos de entrega",
    desc:"Reporte de tiempos de entrega de pedidos por almacén y etapa.",
    icon:'<rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>' },
  { key:"pendientes", href:"Informe_Pedidos_Pendientes.html", tag:"Pedidos", title:"Pedidos pendientes",
    desc:"Seguimiento de pedidos pendientes de facturación.",
    icon:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
  { key:"gastos", href:"informe_gastos_vs_presupuesto.html", tag:"Finanzas", title:"Gastos vs Presupuesto",
    desc:"Comparativo de gastos reales contra presupuesto por mes y grupo.",
    icon:'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
  { key:"geo", href:"Georreferenciacion_Clientes_Alas.html", tag:"Mapa", title:"Georreferenciación",
    desc:"Mapa de clientes con concentración y detalle por ubicación.",
    icon:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>' }
];

// Devuelve el módulo cuyo href coincide con el archivo actual (o null).
window.currentModule = function () {
  var file = (location.pathname.split("/").pop() || "").toLowerCase();
  return window.APP_MODULES.find(function (m) { return m.href.toLowerCase() === file; }) || null;
};
