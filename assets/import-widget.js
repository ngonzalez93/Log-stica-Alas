// ============================================================
//  Widget de importación (modal reutilizable).
//  Se abre con window.openImport(moduleKey) desde cualquier dashboard.
//  Disponible para cualquier usuario autenticado (RLS permite insertar).
//
//  Requiere: @supabase/supabase-js, XLSX, assets/config.js,
//            assets/import-spec.js, (gsap opcional).
// ============================================================
(function () {
  var cfg = window.SUPABASE_CONFIG || {};
  var configured = window.supabase && cfg.url && cfg.url.indexOf("TU-PROYECTO") === -1;
  var client = configured ? window.supabase.createClient(cfg.url, cfg.anonKey) : null;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = !!window.gsap && !reduce;
  var TYPE_LABEL = { text:"Texto", number:"Número", int:"Entero", date:"Fecha", time:"Hora", bool:"Sí / No" };
  var state = { spec:null, recs:null, fileDupes:0 };
  var built = false;

  /* ---------- utilidades ---------- */
  function stripDiacritics(str){ var o=String(str==null?"":str).normalize("NFD"), r=""; for(var i=0;i<o.length;i++){ var k=o.charCodeAt(i); if(k<0x300||k>0x36f) r+=o[i]; } return r; }
  function norm(s){ return stripDiacritics(s).trim().toLowerCase().replace(/\s+/g," "); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
  function parseNumber(v){
    if(v==null||v==="") return null;
    if(typeof v==="number") return isNaN(v)?null:v;
    var s=String(v).trim().replace(/\s/g,"").replace(/[₲$]/g,"");
    if(s.indexOf(",")!==-1 && s.indexOf(".")!==-1){ s=s.replace(/\./g,"").replace(",","."); }
    else if(s.indexOf(",")!==-1){ s=s.replace(",","."); }
    var n=parseFloat(s); return isNaN(n)?null:n;
  }
  function toISO(v){
    if(v==null||v==="") return null;
    function f(y,m,d){ return y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0"); }
    if(v instanceof Date && !isNaN(v)) return f(v.getFullYear(), v.getMonth()+1, v.getDate());
    if(typeof v==="number"){ var d=new Date(Math.round((v-25569)*86400000)); return isNaN(d)?null:f(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate()); }
    var dd=new Date(v); return isNaN(dd)?null:f(dd.getFullYear(),dd.getMonth()+1,dd.getDate());
  }
  function toBool(v){
    if(v==null||v==="") return null;
    if(typeof v==="boolean") return v;
    var s=norm(v);
    if(["si","sí","s","true","verdadero","1","x","ok"].indexOf(s)!==-1) return true;
    if(["no","n","false","falso","0"].indexOf(s)!==-1) return false;
    return null;
  }
  function toMinutes(v){  // hora (fracción de día de Excel, Date o "HH:MM") → minutos desde medianoche
    if(v==null||v==="") return null;
    if(v instanceof Date && !isNaN(v)) return v.getUTCHours()*60+v.getUTCMinutes()+v.getUTCSeconds()/60;
    if(typeof v==="number") return (v>=0 && v<2) ? v*1440 : v;
    var s=String(v).trim();
    var m=s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if(m) return (+m[1])*60+(+m[2])+(m[3]?(+m[3])/60:0);
    var n=parseNumber(s); if(n!=null) return (n>=0&&n<2)?n*1440:n;
    return null;
  }
  function coerce(v, type){
    if(v==null||(typeof v==="string"&&v.trim()==="")) return null;
    if(type==="text") return String(v).trim();
    if(type==="number") return parseNumber(v);
    if(type==="int"){ var n=parseNumber(v); return n==null?null:Math.round(n); }
    if(type==="date") return toISO(v);
    if(type==="time") return toMinutes(v);
    if(type==="bool") return toBool(v);
    return v;
  }
  function cyrb53(str, seed){
    var h1=0xdeadbeef^seed, h2=0x41c6ce57^seed;
    for(var i=0,ch;i<str.length;i++){ ch=str.charCodeAt(i); h1=Math.imul(h1^ch,2654435761); h2=Math.imul(h2^ch,1597334677); }
    h1=Math.imul(h1^(h1>>>16),2246822507); h1^=Math.imul(h2^(h2>>>13),3266489909);
    h2=Math.imul(h2^(h2>>>16),2246822507); h2^=Math.imul(h1^(h1>>>13),3266489909);
    return 4294967296*(2097151&h2)+(h1>>>0);
  }
  function hashRec(spec, rec){
    var s=spec.columns.map(function(c){ var v=rec[c.field];
      if(v===null||v===undefined) return ""; if(typeof v==="boolean") return v?"1":"0"; return String(v);
    }).join("");
    return cyrb53(s,1).toString(16)+cyrb53(s,2).toString(16);
  }

  /* ---------- estilos + DOM del modal (una vez) ---------- */
  function build(){
    if(built) return; built=true;
    var css = ''+
    '.iw-ov{position:fixed;inset:0;background:rgba(15,27,46,.5);display:none;align-items:center;justify-content:center;z-index:9999;padding:20px;font-family:Inter,system-ui,sans-serif}'+
    '.iw-ov.show{display:flex}'+
    '.iw-modal{background:#fff;border-radius:16px;box-shadow:0 24px 70px rgba(15,27,46,.3);width:100%;max-width:560px;max-height:90vh;overflow:auto;padding:24px;position:relative;color:#0F1B2E}'+
    '.iw-x{position:absolute;top:14px;right:16px;border:none;background:none;font-size:24px;color:#64748B;cursor:pointer;line-height:1}'+
    '.iw-h{font-family:"Space Grotesk",sans-serif;font-weight:700;font-size:19px;margin:0 4px 2px 0}'+
    '.iw-sub{color:#64748B;font-size:13px;margin-bottom:14px}'+
    '.iw-note{font-size:12.5px;color:#92400E;background:#FEF3E2;border:1px solid #F6D9AE;border-radius:10px;padding:10px 13px;margin-bottom:14px}'+
    '.iw-guide table{width:100%;border-collapse:collapse;font-size:13px}'+
    '.iw-guide th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:#64748B;font-weight:700;padding:8px 10px;border-bottom:1px solid #E2E8F0}'+
    '.iw-guide td{padding:8px 10px;border-bottom:1px solid #E2E8F0}'+
    '.iw-guide tr:last-child td{border-bottom:none}'+
    '.iw-cn{font-family:"Space Grotesk";font-weight:600}'+
    '.iw-req{color:#DC2626;font-weight:600}.iw-opt{color:#64748B}'+
    '.iw-tp{font-size:11px;background:#F4F6FA;border:1px solid #E2E8F0;border-radius:6px;padding:2px 7px;color:#64748B}'+
    '.iw-drop{margin-top:14px;border:2px dashed #E2E8F0;border-radius:12px;padding:26px;text-align:center;cursor:pointer;background:#F4F6FA;transition:.15s}'+
    '.iw-drop:hover,.iw-drop.over{border-color:#1D4ED8;background:#DBEAFE}'+
    '.iw-drop b{display:block;font-size:13.5px}.iw-drop small{color:#64748B}'+
    '.iw-panel{margin-top:14px;border-radius:10px;padding:13px 15px;font-size:13px}'+
    '.iw-panel.err{background:#FDECEC;border:1px solid #F3C6C6;color:#8A1C1C}'+
    '.iw-panel.ok{background:#E7F6ED;border:1px solid #BBE7C9;color:#14612F}'+
    '.iw-panel.info{background:#DBEAFE;border:1px solid #BBD3FB;color:#1E40AF}'+
    '.iw-panel ul{margin:8px 0 0;padding-left:20px}'+
    '.iw-btn{background:#1D4ED8;color:#fff;font-family:"Space Grotesk";font-weight:500;font-size:14px;padding:11px 18px;border:none;border-radius:10px;cursor:pointer;margin-top:14px}'+
    '.iw-btn:hover{background:#1E40AF}.iw-btn:disabled{opacity:.6;cursor:default}'+
    '.iw-prog{display:flex;flex-direction:column;align-items:center;padding:10px 0}'+
    '.iw-ring{position:relative;width:130px;height:130px}.iw-ring svg{transform:rotate(-90deg)}'+
    '.iw-pct{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:"Space Grotesk";font-weight:600;font-size:26px}'+
    '.iw-check{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0}'+
    '.iw-check svg{width:58px;height:58px;color:#1D4ED8;transform:none}'+
    '.iw-pmsg{margin-top:12px;color:#64748B;font-size:13px;text-align:center}'+
    '.iw-hidden{display:none!important}';
    var st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

    var ov=document.createElement("div"); ov.className="iw-ov"; ov.id="iwOv";
    ov.innerHTML =
      '<div class="iw-modal">'+
        '<button class="iw-x" id="iwX">×</button>'+
        '<div id="iwForm">'+
          '<h3 class="iw-h" id="iwTitle"></h3>'+
          '<div class="iw-sub" id="iwTable"></div>'+
          '<div id="iwProposed"></div>'+
          '<div class="iw-guide"><table><thead><tr><th>Columna en el Excel</th><th>Tipo</th><th>Obligatoria</th></tr></thead><tbody id="iwGuide"></tbody></table></div>'+
          '<div class="iw-drop" id="iwDrop"><b>Arrastrá tu Excel acá o hacé clic</b><small>.xlsx, .xls — se valida antes de importar</small></div>'+
          '<input type="file" id="iwFile" accept=".xlsx,.xls,.XLSX" style="display:none">'+
          '<div id="iwValidation"></div>'+
        '</div>'+
        '<div id="iwProgress" class="iw-hidden"><div class="iw-prog">'+
          '<div class="iw-ring"><svg width="130" height="130" viewBox="0 0 130 130">'+
            '<circle cx="65" cy="65" r="55" fill="none" stroke="#E2E8F0" stroke-width="9"/>'+
            '<circle id="iwRing" cx="65" cy="65" r="55" fill="none" stroke="#1D4ED8" stroke-width="9" stroke-linecap="round" stroke-dasharray="345.6" stroke-dashoffset="345.6"/>'+
          '</svg><div class="iw-pct" id="iwPct">0%</div>'+
          '<div class="iw-check" id="iwCheck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div></div>'+
          '<div class="iw-pmsg" id="iwPmsg">Preparando…</div>'+
          '<button class="iw-btn iw-hidden" id="iwAgain">Importar otro archivo</button>'+
        '</div></div>'+
      '</div>';
    document.body.appendChild(ov);

    document.getElementById("iwX").onclick = close;
    ov.addEventListener("click", function(e){ if(e.target===ov) close(); });
    document.getElementById("iwAgain").onclick = resetForm;
    var drop=document.getElementById("iwDrop"), fileEl=document.getElementById("iwFile");
    drop.onclick=function(){ fileEl.click(); };
    fileEl.onchange=function(e){ handleFile(e.target.files[0]); e.target.value=""; };
    ["dragenter","dragover"].forEach(function(ev){ drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.add("over");}); });
    ["dragleave","drop"].forEach(function(ev){ drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.remove("over");}); });
    drop.addEventListener("drop",function(e){ if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
  }

  /* ---------- flujo ---------- */
  function open(key){
    if(!configured){ alert("Supabase no está configurado."); return; }
    var spec = window.IMPORT_SPECS && window.IMPORT_SPECS[key];
    if(!spec){ alert("No hay definición de importación para este módulo."); return; }
    build();
    state.spec=spec; state.recs=null;
    document.getElementById("iwTitle").textContent = "Importar · " + spec.title;
    document.getElementById("iwTable").textContent = "Se guarda en la tabla: " + spec.table;
    document.getElementById("iwProposed").innerHTML = spec.proposed
      ? '<div class="iw-note">Este módulo no tenía Excel: estas columnas son un <b>formato propuesto</b>. Ajustá tu planilla a estos nombres.</div>' : "";
    document.getElementById("iwGuide").innerHTML = spec.columns.map(function(c){
      return '<tr><td class="iw-cn">'+esc(c.header)+'</td><td><span class="iw-tp">'+TYPE_LABEL[c.type]+'</span></td>'+
        '<td>'+(c.required?'<span class="iw-req">Sí</span>':'<span class="iw-opt">No</span>')+'</td></tr>';
    }).join("");
    resetForm();
    document.getElementById("iwOv").classList.add("show");
    if(hasGSAP) gsap.from("#iwOv .iw-modal",{ y:16, opacity:0, duration:.35, ease:"power2.out" });
  }
  function close(){ document.getElementById("iwOv").classList.remove("show"); }
  function resetForm(){
    document.getElementById("iwForm").classList.remove("iw-hidden");
    document.getElementById("iwProgress").classList.add("iw-hidden");
    document.getElementById("iwValidation").innerHTML="";
    document.getElementById("iwFile").value="";
    state.recs=null;
  }

  function analyze(wb, spec){
    var best=null;
    wb.SheetNames.forEach(function(name){
      var aoa=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,raw:true,blankrows:false});
      var limit=Math.min(aoa.length,25);
      for(var r=0;r<limit;r++){
        var normed=(aoa[r]||[]).map(norm), req=0, opt=0;
        spec.columns.forEach(function(c){ var i=normed.indexOf(norm(c.header)); if(i!==-1){ c.required?req++:opt++; } });
        var score=req*100+opt;
        if(!best||score>best.score) best={score:score,sheet:name,headerRow:r,aoa:aoa,normed:normed};
      }
    });
    return best;
  }
  function validateAndBuild(wb){
    var spec=state.spec, best=analyze(wb,spec);
    if(!best) return { error:["El archivo está vacío o no se pudo leer."] };
    var missing=[];
    spec.columns.forEach(function(c){ if(c.required && best.normed.indexOf(norm(c.header))===-1) missing.push(c.header); });
    if(missing.length) return { error:missing, sheet:best.sheet };
    var optMissing=[];
    spec.columns.forEach(function(c){ if(!c.required && best.normed.indexOf(norm(c.header))===-1) optMissing.push(c.header); });
    var idx={}; spec.columns.forEach(function(c){ idx[c.field]=best.normed.indexOf(norm(c.header)); });
    var seen={}, recs=[], total=0, dupes=0;
    for(var r=best.headerRow+1;r<best.aoa.length;r++){
      var raw=best.aoa[r]||[]; var rec={}, any=false;
      spec.columns.forEach(function(c){ var i=idx[c.field]; var v=(i===-1)?null:raw[i]; v=coerce(v,c.type); rec[c.field]=v; if(v!==null&&v!=="") any=true; });
      if(!any) continue;
      total++;
      var h=hashRec(spec,rec);
      if(seen[h]){ dupes++; continue; }
      seen[h]=1; rec.row_hash=h; recs.push(rec);
    }
    return { recs:recs, total:total, fileDupes:dupes, optMissing:optMissing, sheet:best.sheet };
  }
  function showValidation(res){
    var box=document.getElementById("iwValidation");
    if(res.error){
      box.innerHTML='<div class="iw-panel err"><b>No se puede importar.</b> Faltan columnas obligatorias'+
        (res.sheet?' (hoja «'+esc(res.sheet)+'»)':'')+':<ul>'+res.error.map(function(c){return '<li>«'+esc(c)+'»</li>';}).join("")+'</ul></div>';
      state.recs=null; return;
    }
    state.recs=res.recs; state.fileDupes=res.fileDupes;
    var opt=res.optMissing.length?'<div style="margin-top:6px;font-size:12px">Opcionales no encontradas (van vacías): '+res.optMissing.map(function(c){return '«'+esc(c)+'»';}).join(", ")+'.</div>':"";
    box.innerHTML='<div class="iw-panel ok"><b>Archivo válido.</b> '+res.total+' filas · '+res.fileDupes+' duplicadas en el archivo · <b>'+res.recs.length+'</b> a importar.'+opt+
      '</div><button class="iw-btn" id="iwImport"'+(res.recs.length?'':' disabled')+'>Importar '+res.recs.length+' registros</button>';
    document.getElementById("iwImport").onclick=runImport;
  }
  function handleFile(file){
    if(!file) return;
    var box=document.getElementById("iwValidation");
    box.innerHTML='<div class="iw-panel info">Leyendo «'+esc(file.name)+'»…</div>';
    var rd=new FileReader();
    rd.onload=function(ev){ try{ var wb=XLSX.read(new Uint8Array(ev.target.result),{type:"array"}); showValidation(validateAndBuild(wb)); }
      catch(e){ box.innerHTML='<div class="iw-panel err">No se pudo leer: '+esc(e.message)+'</div>'; } };
    rd.readAsArrayBuffer(file);
  }

  var CIRC=345.6;
  function setProgress(p){
    document.getElementById("iwPct").textContent=Math.round(p*100)+"%";
    var off=CIRC*(1-p);
    if(hasGSAP) gsap.to("#iwRing",{ strokeDashoffset:off, duration:.3, ease:"power1.out" });
    else document.getElementById("iwRing").setAttribute("stroke-dashoffset",off);
  }
  function showCheck(){
    document.getElementById("iwPct").style.opacity=0;
    var chk=document.getElementById("iwCheck");
    if(hasGSAP){ gsap.to("#iwRing",{strokeDashoffset:0,duration:.3}); gsap.fromTo(chk,{opacity:0,scale:.4},{opacity:1,scale:1,duration:.5,ease:"back.out(2)"}); }
    else chk.style.opacity=1;
  }
  async function runImport(){
    if(!state.recs || !state.recs.length || !client) return;
    document.getElementById("iwForm").classList.add("iw-hidden");
    document.getElementById("iwProgress").classList.remove("iw-hidden");
    document.getElementById("iwCheck").style.opacity=0; document.getElementById("iwPct").style.opacity=1;
    document.getElementById("iwAgain").classList.add("iw-hidden");
    document.getElementById("iwPmsg").textContent="Importando registros…";
    setProgress(0);
    var recs=state.recs, table=state.spec.table, BATCH=400, inserted=0, processed=0;
    try{
      for(var i=0;i<recs.length;i+=BATCH){
        var batch=recs.slice(i,i+BATCH);
        var resp=await client.from(table).upsert(batch,{onConflict:"row_hash",ignoreDuplicates:true}).select("row_hash");
        if(resp.error) throw resp.error;
        inserted += resp.data?resp.data.length:0; processed += batch.length;
        setProgress(processed/recs.length);
      }
      setProgress(1); showCheck();
      var skipped=recs.length-inserted;
      document.getElementById("iwPmsg").innerHTML='<b style="color:#0F1B2E;font-size:15px">'+inserted+' registros nuevos</b><br>'+
        skipped+' omitidos (ya estaban) · '+state.fileDupes+' duplicados en el archivo';
      document.getElementById("iwAgain").classList.remove("iw-hidden");
    }catch(e){
      document.getElementById("iwPmsg").innerHTML='<span style="color:#DC2626">Error: '+esc(e.message||e)+'</span><br><small>¿Corriste schema.sql e import.sql en Supabase?</small>';
      document.getElementById("iwAgain").classList.remove("iw-hidden");
    }
  }

  window.openImport = open;
})();
