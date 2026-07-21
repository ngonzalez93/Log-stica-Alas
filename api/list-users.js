// GET /api/list-users  → lista usuarios con su rol y módulos. Solo admin.
const U = require("./_util");

module.exports = async function (req, res) {
  try {
    var gate = await U.requireAdmin(req);
    if (gate.error) return U.send(res, gate.code, { error: gate.error });

    // Usuarios de auth
    var au = await fetch(U.SUPABASE_URL + "/auth/v1/admin/users?per_page=500", { headers: U.svcHeaders() });
    var auj = await au.json();
    if (!au.ok) return U.send(res, 400, { error: (auj && auj.msg) || "No se pudo listar auth." });
    var users = auj.users || [];

    // Perfiles
    var pr = await fetch(U.SUPABASE_URL + "/rest/v1/profiles?select=id,username,role,allowed_modules", { headers: U.svcHeaders() });
    var profs = pr.ok ? await pr.json() : [];
    var map = {};
    profs.forEach(function (p) { map[p.id] = p; });

    var out = users.map(function (u) {
      var p = map[u.id] || {};
      return {
        id: u.id,
        email: u.email,
        username: p.username || (u.email ? u.email.split("@")[0] : u.id),
        role: p.role || "operador",
        allowed_modules: p.allowed_modules || []
      };
    });
    // orden: superadmin, admin, operador, luego alfabético
    var rank = { superadmin: 0, admin: 1, operador: 2 };
    out.sort(function (a, b) { return (rank[a.role] - rank[b.role]) || a.username.localeCompare(b.username); });

    U.send(res, 200, { users: out });
  } catch (e) {
    U.send(res, 500, { error: String(e && e.message || e) });
  }
};
