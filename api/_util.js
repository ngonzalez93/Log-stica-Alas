// ============================================================
//  Helpers compartidos para las funciones serverless de Vercel.
//  Archivo con prefijo "_" => Vercel NO lo expone como endpoint.
//
//  Variables de entorno requeridas (Vercel → Settings → Environment Variables):
//    SUPABASE_URL                = https://<proyecto>.supabase.co
//    SUPABASE_ANON_KEY           = <anon key>
//    SUPABASE_SERVICE_ROLE_KEY   = <service_role key>   (SECRETA)
//    USERNAME_DOMAIN             = alas.local           (opcional)
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.SUPABASE_ANON_KEY;
const DOMAIN = process.env.USERNAME_DOMAIN || "alas.local";

function send(res, code, obj) {
  res.statusCode = code;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(obj));
}

function readJson(req) {
  return new Promise(function (resolve) {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    var data = "";
    req.on("data", function (c) { data += c; });
    req.on("end", function () { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { resolve({}); } });
    req.on("error", function () { resolve({}); });
  });
}

function svcHeaders(extra) {
  return Object.assign({ apikey: SERVICE_ROLE, Authorization: "Bearer " + SERVICE_ROLE }, extra || {});
}

// Devuelve el usuario del token (o null).
async function getCaller(req) {
  var auth = req.headers["authorization"] || "";
  var token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  var r = await fetch(SUPABASE_URL + "/auth/v1/user", { headers: { apikey: ANON, Authorization: "Bearer " + token } });
  if (!r.ok) return null;
  return r.json();
}

async function getRole(userId) {
  var r = await fetch(SUPABASE_URL + "/rest/v1/profiles?id=eq." + userId + "&select=role", { headers: svcHeaders() });
  if (!r.ok) return null;
  var rows = await r.json();
  return rows[0] ? rows[0].role : null;
}

// Exige que el que llama sea admin o superadmin. Devuelve {user, role} o {error, code}.
async function requireAdmin(req) {
  if (!SUPABASE_URL || !SERVICE_ROLE || !ANON) {
    return { error: "Faltan variables de entorno en Vercel (SUPABASE_URL / ANON / SERVICE_ROLE).", code: 500 };
  }
  var user = await getCaller(req);
  if (!user || !user.id) return { error: "No autenticado.", code: 401 };
  var role = await getRole(user.id);
  if (role !== "admin" && role !== "superadmin") return { error: "Sin permiso.", code: 403 };
  return { user: user, role: role };
}

module.exports = { SUPABASE_URL, SERVICE_ROLE, ANON, DOMAIN, send, readJson, svcHeaders, getCaller, getRole, requireAdmin };
