// POST /api/create-user  {username, password, role, modules[]}  → crea usuario. Solo admin.
const U = require("./_util");

module.exports = async function (req, res) {
  try {
    var gate = await U.requireAdmin(req);
    if (gate.error) return U.send(res, gate.code, { error: gate.error });

    var body = await U.readJson(req);
    var username = String(body.username || "").trim().toLowerCase().replace(/\s+/g, "");
    var password = String(body.password || "");
    var role = body.role === "admin" ? "admin" : "operador";  // no se crean superadmin desde el panel
    var modules = Array.isArray(body.modules) ? body.modules : [];
    if (role !== "operador") modules = [];

    if (!/^[a-z0-9._-]{2,}$/.test(username)) return U.send(res, 400, { error: "Usuario inválido (solo letras, números, . _ -)." });
    if (password.length < 6) return U.send(res, 400, { error: "La contraseña debe tener al menos 6 caracteres." });

    var email = username + "@" + U.DOMAIN;

    // Crear en auth (confirmado, sin correo real)
    var cr = await fetch(U.SUPABASE_URL + "/auth/v1/admin/users", {
      method: "POST", headers: U.svcHeaders({ "content-type": "application/json" }),
      body: JSON.stringify({ email: email, password: password, email_confirm: true, user_metadata: { username: username } })
    });
    var crj = await cr.json();
    if (!cr.ok) {
      var m = (crj && (crj.msg || crj.error_description || crj.message)) || "No se pudo crear el usuario.";
      if (/already|exists|registered/i.test(m)) m = "Ese usuario ya existe.";
      return U.send(res, 400, { error: m });
    }
    var id = crj.id;

    // Perfil (upsert por si un trigger lo creó)
    var pr = await fetch(U.SUPABASE_URL + "/rest/v1/profiles", {
      method: "POST",
      headers: U.svcHeaders({ "content-type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify({ id: id, username: username, role: role, allowed_modules: modules })
    });
    if (!pr.ok) {
      var e = await pr.text();
      return U.send(res, 400, { error: "Usuario creado pero falló el perfil: " + e });
    }

    U.send(res, 200, { ok: true, id: id });
  } catch (e) {
    U.send(res, 500, { error: String(e && e.message || e) });
  }
};
