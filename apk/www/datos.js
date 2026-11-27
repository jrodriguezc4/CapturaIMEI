/* Base de datos de CapturaIMEI en un repositorio PRIVADO de GitHub (sin Firebase).
   Lo usan la APK (apk/www/index.html) y la web (index.html carga este mismo archivo).

   Cómo se guardan los datos (repositorio jrodriguezc4/CapturaIMEI-datos):
   - usuarios.json                         → {usuarios:{usuario:{nombre, rol, activo, creado_en, creado_por}}}
   - registros/AAAA-MM/<usuario>.json      → lista de registros (eventos) que ese usuario hizo ese mes.
       {k:"asig", id, imei, tipo, fecha_ingreso, nombre, cedula, labor, ...}   asignaciones e historial
       {k:"disp", id, imei, imei2, serial, marca, modelo, fecha, usuario}     datos del equipo
       {k:"pers", id, cedula, nombre, labor, activo, fecha, usuario}          base de personal
     Nada se borra: el estado actual se arma leyendo todos los registros.
   - firmas/<id>.png, evidencias/<id>.jpg  → imágenes (la APK las sube, la web las lee).

   Acceso: cada usuario recibe un "código de activación" (texto o QR) que lleva el token de GitHub
   cifrado con su código de ingreso (AES-GCM + PBKDF2). Sin el código correcto no se puede leer. */
(function(){
"use strict";
const API = "https://api.github.com";
const espera = ms => new Promise(r => setTimeout(r, ms));
const bytesAb64 = b => { let s = ""; for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); };
const b64aBytes = t => Uint8Array.from(atob(String(t).replace(/\s/g, "")), c => c.charCodeAt(0));
const textoAb64 = t => bytesAb64(new TextEncoder().encode(t));
const b64aTexto = t => new TextDecoder().decode(b64aBytes(t));
const nombreSeguro = u => String(u || "").toLowerCase().replace(/[^a-z0-9_-]/g, "_") || "sin_usuario";

class Repo {
  constructor(repo, token){ this.repo = repo; this.token = token; }
  async pedir(ruta, op = {}){
    let r;
    try {
      r = await fetch(API + "/repos/" + this.repo + ruta, {...op, cache:"no-store",
        headers:{Accept:"application/vnd.github+json", Authorization:"Bearer " + this.token, "X-GitHub-Api-Version":"2022-11-28", ...(op.headers || {})}});
    } catch(_){ throw new Error("SIN_CONEXION"); }
    if (r.status === 401) throw new Error("TOKEN_INVALIDO");
    if ((r.status === 403 || r.status === 429) && r.headers.get("x-ratelimit-remaining") === "0") throw new Error("LIMITE_GITHUB");
    return r;
  }
  // Comprueba que el token puede leer el repositorio
  async probar(){
    const r = await this.pedir("");
    if (r.status === 404 || r.status === 403) throw new Error("REPO_SIN_ACCESO");
    if (!r.ok) throw new Error("GitHub " + r.status);
    return r.json();
  }
  // Lista de archivos {ruta: sha}. Devuelve null si nada cambió desde "etag".
  async arbol(etag){
    const r = await this.pedir("/git/trees/main?recursive=1", {headers: etag ? {"If-None-Match": etag} : {}});
    if (r.status === 304) return null;
    if (r.status === 404 || r.status === 409) return {etag:null, archivos:{}};      // repositorio vacío
    if (!r.ok) throw new Error("GitHub " + r.status);
    const j = await r.json(), archivos = {};
    for (const x of j.tree || []) if (x.type === "blob") archivos[x.path] = x.sha;
    return {etag: r.headers.get("etag"), archivos};
  }
  async leerBlob(sha){
    const r = await this.pedir("/git/blobs/" + sha);
    if (!r.ok) throw new Error("GitHub " + r.status);
    return (await r.json()).content;
  }
  async leerJSON(sha){ return JSON.parse(b64aTexto(await this.leerBlob(sha))); }
  async leerArchivo(ruta){
    const r = await this.pedir("/contents/" + encodeURI(ruta) + "?ref=main");
    if (r.status === 404) return null;
    if (!r.ok) throw new Error("GitHub " + r.status);
    const j = await r.json();
    const b64 = j.content ? j.content : await this.leerBlob(j.sha);     // archivos de más de 1 MB
    return {sha:j.sha, b64};
  }
  // Lee, cambia y guarda un JSON. Si otro celular lo cambió al mismo tiempo, vuelve a intentar.
  async guardarJSON(ruta, cambiar, mensaje){
    for (let intento = 0; intento < 6; intento++){
      const actual = await this.leerArchivo(ruta);
      const nuevo = cambiar(actual ? JSON.parse(b64aTexto(actual.b64)) : null);
      if (nuevo === undefined) return false;
      const r = await this.pedir("/contents/" + encodeURI(ruta), {method:"PUT", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({message:mensaje, content:textoAb64(JSON.stringify(nuevo, null, 1)), branch:"main", ...(actual ? {sha:actual.sha} : {})})});
      if (r.ok) return true;
      if (r.status === 409 || r.status === 422) { await espera(400 * (intento + 1) + Math.random() * 400); continue; }
      if (r.status === 403 || r.status === 404) throw new Error("TOKEN_SIN_ESCRITURA");
      throw new Error("GitHub " + r.status);
    }
    throw new Error("CONFLICTO_GITHUB");
  }
  // Sube una imagen nueva (base64). Si ya existía, la da por subida.
  async subirBinario(ruta, b64, mensaje){
    const r = await this.pedir("/contents/" + encodeURI(ruta), {method:"PUT", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({message:mensaje, content:b64, branch:"main"})});
    if (r.ok || r.status === 422) return true;
    if (r.status === 403 || r.status === 404) throw new Error("TOKEN_SIN_ESCRITURA");
    throw new Error("GitHub " + r.status);
  }
  async leerImagen(ruta, tipo){
    const a = await this.leerArchivo(ruta);
    return a ? "data:" + tipo + ";base64," + a.b64.replace(/\s/g, "") : null;
  }
}

/* Agrega registros al archivo del usuario de este mes (sin repetir los que ya estaban, por id) */
async function enviarEventos(repo, usuario, eventos){
  if (!eventos.length) return;
  const ruta = `registros/${new Date().toISOString().slice(0, 7)}/${nombreSeguro(usuario)}.json`;
  const ahora = new Date().toISOString();
  await repo.guardarJSON(ruta, actual => {
    const lista = Array.isArray(actual) ? actual : [], ids = new Set(lista.map(e => e.id));
    const nuevos = eventos.filter(e => !ids.has(e.id));
    if (!nuevos.length) return undefined;
    return lista.concat(nuevos.map(e => ({...e, registrado_en: e.registrado_en || ahora})));
  }, `${usuario}: ${eventos.length} ${eventos.length === 1 ? "registro" : "registros"}`);
}

/* Trae solo los archivos que cambiaron. estado = {etag, shas:{ruta:sha}} (se guarda entre sesiones).
   alArchivo(ruta, datos) se llama por cada archivo nuevo o cambiado (usuarios.json o registros). */
async function traerCambios(repo, estado, alArchivo){
  estado.shas = estado.shas || {};
  const a = await repo.arbol(estado.etag);
  if (!a) return false;
  const rutas = Object.keys(a.archivos).filter(r => r === "usuarios.json" || /^registros\/.+\.json$/.test(r)).sort();
  for (const ruta of rutas){
    const sha = a.archivos[ruta];
    if (estado.shas[ruta] === sha) continue;
    await alArchivo(ruta, await repo.leerJSON(sha));
    estado.shas[ruta] = sha;
  }
  estado.etag = a.etag;
  return true;
}

/* Códigos de activación: el token de GitHub cifrado con el código de ingreso del usuario */
const PREFIJO = "CIMEI1.";
const b64url = t => t.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const desdeB64url = t => { t = t.replace(/-/g, "+").replace(/_/g, "/"); return t + "===".slice((t.length + 3) % 4); };
async function clave(codigo, sal){
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode("palmas-tumaco:" + String(codigo).trim()), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2", salt:sal, iterations:150000, hash:"SHA-256"}, base, {name:"AES-GCM", length:256}, false, ["encrypt", "decrypt"]);
}
const Acceso = {
  async crear({usuario, nombre, rol, codigo, repo, token}){
    const sal = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const c = new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM", iv}, await clave(codigo, sal), new TextEncoder().encode(JSON.stringify({repo, token}))));
    const p = {v:1, u:usuario, n:nombre || "", r:rol || "usuario", s:bytesAb64(sal), i:bytesAb64(iv), c:bytesAb64(c)};
    return PREFIJO + b64url(textoAb64(JSON.stringify(p)));
  },
  leer(texto){
    const t = String(texto || "").trim().replace(/\s/g, "");
    if (!t.startsWith(PREFIJO)) throw new Error("ACTIVACION_INVALIDA");
    try { const p = JSON.parse(b64aTexto(desdeB64url(t.slice(PREFIJO.length)))); if (!p.u || !p.c) throw 0; return p; }
    catch(_){ throw new Error("ACTIVACION_INVALIDA"); }
  },
  async abrir(p, codigo){
    try {
      const plano = await crypto.subtle.decrypt({name:"AES-GCM", iv:b64aBytes(p.i)}, await clave(codigo, b64aBytes(p.s)), b64aBytes(p.c));
      return JSON.parse(new TextDecoder().decode(plano));
    } catch(_){ throw new Error("CODIGO_INCORRECTO"); }
  }
};

const MENSAJES = {
  SIN_CONEXION:"No hay conexión con GitHub.", TOKEN_INVALIDO:"El token de GitHub ya no sirve (venció o fue borrado). El administrador debe crear uno nuevo.",
  LIMITE_GITHUB:"GitHub pidió esperar unos minutos (demasiadas consultas). Intenta de nuevo más tarde.",
  REPO_SIN_ACCESO:"El token no tiene acceso al repositorio de datos. Revisa que el token incluya ese repositorio.",
  TOKEN_SIN_ESCRITURA:"El token puede leer pero no guardar. En GitHub dale permiso \"Contents: Read and write\".",
  CONFLICTO_GITHUB:"Muchos cambios al mismo tiempo. Se volverá a intentar en la próxima sincronización.",
  ACTIVACION_INVALIDA:"Ese código de activación no es válido. Pide uno nuevo al administrador.",
  CODIGO_INCORRECTO:"Usuario o código incorrecto.", USUARIO_INACTIVO:"Tu usuario fue desactivado. Habla con el administrador."
};
const mensaje = e => { const m = String(e && e.message || e); return MENSAJES[m] || m; };

window.Datos = {Repo, enviarEventos, traerCambios, Acceso, mensaje, nombreSeguro, bytesAb64, textoAb64, REPO_POR_DEFECTO:"jrodriguezc4/CapturaIMEI-datos"};
})();
