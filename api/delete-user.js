// POST /api/delete-user  {id}  → elimina un usuario. Solo admin. No permite borrar superadmin.
const U = require("./_util");

module.exports = async function (req, res) {
  try {
    var gate = await U.requireAdmin(req);
    if (gate.error) return U.send(res, gate.code, { error: gate.error });

    var body = await U.readJson(req);
    var id = String(body.id || "");
    if (!id) return U.send(res, 400, { error: "Falta el id del usuario." });
    if (id === gate.user.id) return U.send(res, 400, { error: "No podés eliminar tu propio usuario." });

    var targetRole = await U.getRole(id);
    if (targetRole === "superadmin") return U.send(res, 403, { error: "No se puede eliminar a un superadministrador." });

    // Borra de auth; el perfil se borra en cascada (FK on delete cascade).
    var dl = await fetch(U.SUPABASE_URL + "/auth/v1/admin/users/" + id, { method: "DELETE", headers: U.svcHeaders() });
    if (!dl.ok) { var e = await dl.text(); return U.send(res, 400, { error: "No se pudo eliminar: " + e }); }

    U.send(res, 200, { ok: true });
  } catch (e) {
    U.send(res, 500, { error: String(e && e.message || e) });
  }
};
