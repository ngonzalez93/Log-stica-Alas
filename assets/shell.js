// ============================================================
//  Shell de dashboard: barra superior (cabecera banner azul) con
//  logo ALAS + "Volver al menú" + "Importar datos", y footer banner.
//  Se incluye al final de cada dashboard.
//
//  Requiere: assets/alas-logo.js, assets/modules.js,
//            assets/import-widget.js (window.openImport).
// ============================================================
(function () {
  function init() {
    var mod = window.currentModule ? window.currentModule() : null;

    var css = ''+
    '.app-bar{position:sticky;top:0;z-index:900;background:linear-gradient(90deg,#1D4ED8,#1E40AF);color:#fff;'+
      'box-shadow:0 2px 10px rgba(15,27,46,.18)}'+
    '.app-bar-in{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 22px}'+
    '.app-bar .brand{display:flex;align-items:center;gap:12px}'+
    '.app-bar .brand .tag{font-family:"Space Grotesk",sans-serif;font-weight:600;font-size:11px;letter-spacing:.14em;'+
      'text-transform:uppercase;color:rgba(255,255,255,.85);border-left:1px solid rgba(255,255,255,.35);padding-left:12px}'+
    '.app-bar .acts{display:flex;align-items:center;gap:10px}'+
    '.app-btn{display:inline-flex;align-items:center;gap:7px;font-family:"Space Grotesk",sans-serif;font-weight:500;'+
      'font-size:13.5px;padding:9px 15px;border-radius:9px;cursor:pointer;border:1px solid rgba(255,255,255,.45);'+
      'background:rgba(255,255,255,.08);color:#fff;text-decoration:none;transition:.15s}'+
    '.app-btn:hover{background:rgba(255,255,255,.18)}'+
    '.app-btn.solid{background:#fff;color:#1D4ED8;border-color:#fff}'+
    '.app-btn.solid:hover{background:#EAF1FE}'+
    '.app-btn svg{width:16px;height:16px}'+
    '.app-foot{background:#0F1B2E;color:#fff;margin-top:40px}'+
    '.app-foot-in{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;'+
      'gap:16px;flex-wrap:wrap;padding:20px 22px;font-size:12.5px;color:rgba(255,255,255,.72)}'+
    '.app-foot .fbrand{display:flex;align-items:center;gap:10px}'+
    '@media(max-width:640px){.app-bar .brand .tag{display:none}.app-btn{padding:8px 11px;font-size:12.5px}}';
    var st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

    // ----- barra superior -----
    var bar=document.createElement("header"); bar.className="app-bar";
    var importBtn = (mod && window.openImport)
      ? '<button class="app-btn solid" id="appImport">'+
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'+
          'Importar datos</button>'
      : '';
    bar.innerHTML =
      '<div class="app-bar-in">'+
        '<div class="brand">'+ (window.alasLogo?window.alasLogo("white",26):"ALAS") +
          '<span class="tag">Logística · KPI</span></div>'+
        '<div class="acts">'+
          '<a class="app-btn" href="index.html">'+
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>'+
            'Volver al menú</a>'+
          importBtn +
        '</div>'+
      '</div>';
    document.body.insertBefore(bar, document.body.firstChild);

    // ----- footer -----
    var foot=document.createElement("footer"); foot.className="app-foot";
    foot.innerHTML =
      '<div class="app-foot-in">'+
        '<div class="fbrand">'+ (window.alasLogo?window.alasLogo("white",22):"ALAS") +'</div>'+
        '<div>Panel autónomo de indicadores logísticos · Los datos se cargan desde tu Excel.</div>'+
      '</div>';
    document.body.appendChild(foot);

    var ib=document.getElementById("appImport");
    if(ib) ib.addEventListener("click", function(){ window.openImport(mod.key); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
