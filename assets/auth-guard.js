// ============================================================
//  Puerta de acceso (auth guard) — con roles y permisos
//  ------------------------------------------------------------
//  Se incluye al inicio de cada informe. Valida:
//    1) que haya sesión de Supabase (si no, va al login),
//    2) que el usuario tenga permiso sobre ESTE módulo.
//  admin/superadmin ven todo; operador solo sus módulos habilitados.
//
//  Requiere (en este orden) antes de este archivo:
//    1) @supabase/supabase-js
//    2) assets/config.js
//    3) assets/modules.js
//    4) assets/auth-guard.js  (este)
// ============================================================
(function () {
  var root = document.documentElement;
  root.style.visibility = "hidden";

  function reveal() { root.style.visibility = ""; }
  function goToLogin() {
    var dest = location.pathname.split("/").pop() || "";
    var target = "index.html";
    if (dest && dest !== "index.html") target += "?next=" + encodeURIComponent(dest);
    location.replace(target);
  }
  function denied() { location.replace("index.html?denied=1"); }

  try {
    var cfg = window.SUPABASE_CONFIG || {};
    if (!window.supabase || !cfg.url || cfg.url.indexOf("TU-PROYECTO") !== -1) {
      console.warn("[auth-guard] Supabase sin configurar: acceso sin login.");
      reveal();
      return;
    }

    var client = window.supabase.createClient(cfg.url, cfg.anonKey);

    client.auth.getSession().then(function (res) {
      var session = res && res.data ? res.data.session : null;
      if (!session) { goToLogin(); return; }

      // Traemos el perfil (rol + módulos habilitados) del usuario logueado.
      client.from("profiles").select("role, allowed_modules").eq("id", session.user.id).single()
        .then(function (p) {
          var role = p && p.data ? p.data.role : null;
          var allowed = (p && p.data && p.data.allowed_modules) || [];

          if (role === "admin" || role === "superadmin") { reveal(); return; }

          var mod = window.currentModule ? window.currentModule() : null;
          if (!mod) { reveal(); return; }              // página no restringida
          if (allowed.indexOf(mod.key) !== -1) { reveal(); return; }
          denied();                                     // operador sin permiso
        })
        .catch(function () { denied(); });
    }).catch(function () { goToLogin(); });
  } catch (e) {
    console.error("[auth-guard]", e);
    reveal();
  }
})();
