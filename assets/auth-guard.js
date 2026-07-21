// ============================================================
//  Puerta de acceso (auth guard)
//  ------------------------------------------------------------
//  Se incluye al inicio de cada dashboard. Si NO hay sesión
//  activa de Supabase, redirige a index.html (pantalla de login).
//  No modifica en nada la lógica del dashboard: solo decide si
//  se muestra o no.
//
//  Requiere que ANTES se hayan cargado, en este orden:
//    1) https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
//    2) assets/config.js
//    3) assets/auth-guard.js   (este archivo)
// ============================================================
(function () {
  // Ocultamos la página hasta confirmar la sesión, para que no
  // "parpadee" el contenido antes de redirigir.
  var root = document.documentElement;
  root.style.visibility = "hidden";

  function goToLogin() {
    // Guardamos a dónde quería ir para volver después del login.
    var dest = location.pathname.split("/").pop() || "";
    var target = "index.html";
    if (dest && dest !== "index.html") target += "?next=" + encodeURIComponent(dest);
    location.replace(target);
  }

  function reveal() {
    root.style.visibility = "";
  }

  try {
    var cfg = window.SUPABASE_CONFIG || {};
    if (!window.supabase || !cfg.url || cfg.url.indexOf("TU-PROYECTO") !== -1) {
      // Supabase todavía no está configurado: mostramos igual para no
      // bloquear el trabajo mientras se termina de configurar el login.
      console.warn("[auth-guard] Supabase sin configurar: acceso sin login.");
      reveal();
      return;
    }
    var client = window.supabase.createClient(cfg.url, cfg.anonKey);
    client.auth.getSession().then(function (res) {
      var session = res && res.data ? res.data.session : null;
      if (session) reveal();
      else goToLogin();
    }).catch(function () {
      goToLogin();
    });
  } catch (e) {
    console.error("[auth-guard]", e);
    reveal();
  }
})();
