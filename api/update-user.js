// POST /api/update-user  {id, password?, role?, modules[]?}  → cambia clave / rol / módulos. Solo admin.
const U = require("./_util");

module.exports = async function (req, res) {
  try {
    var gate = await U.requireAdmin(req);
    if (gate.error) return U.send(res, gate.code, { error: gate.error });

    var body = await U.readJson(req);
    var id = String(body.id || "");
    if (!id) return U.send(res, 400, { error: "Falta el id del usuario." });

    // No permitir tocar a un superadmin desde el panel.
    var targetRole = await U.getRole(id);
    if (targetRole === "superadmin") return U.send(res, 403, { error: "No se puede modificar a un superadministrador." });

    // Cambio de contraseña (auth admin)
    if (typeof body.password === "string" && body.password.length) {
      if (body.password.length < 6) return U.send(res, 400, { error: "La contraseña debe tener al menos 6 caracteres." });
      var pw = await fetch(U.SUPABASE_URL + "/auth/v1/admin/users/" + id, {
        method: "PUT", headers: U.svcHeaders({ "content-type": "application/json" }),
        body: JSON.stringify({ password: body.password })
      });
      if (!pw.ok) { var e1 = await pw.text(); return U.send(res, 400, { error: "No se pudo cambiar la clave: " + e1 }); }
    }

    // Cambio de rol / módulos (profiles)
    if (body.role !== undefined || body.modules !== undefined) {
      var role = body.role === "admin" ? "admin" : "operador";
      var modules = Array.isArray(body.modules) ? body.modules : [];
      if (role !== "operador") modules = [];
      var up = await fetch(U.SUPABASE_URL + "/rest/v1/profiles?id=eq." + id, {
        method: "PATCH", headers: U.svcHeaders({ "content-type": "application/json", Prefer: "return=minimal" }),
        body: JSON.stringify({ role: role, allowed_modules: modules })
      });
      if (!up.ok) { var e2 = await up.text(); return U.send(res, 400, { error: "No se pudo actualizar el perfil: " + e2 }); }
    }

    U.send(res, 200, { ok: true });
  } catch (e) {
    U.send(res, 500, { error: String(e && e.message || e) });
  }
};
