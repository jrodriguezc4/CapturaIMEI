// Ajustes que necesita el proyecto Android después de "npx cap add android":
// permisos de cámara, dependencia del lector de códigos de ML Kit, dataBinding e ícono de la app.
const fs = require("fs");
const path = require("path");
const raiz = path.join(__dirname, "..", "android", "app");

const manifest = path.join(raiz, "src/main/AndroidManifest.xml");
let m = fs.readFileSync(manifest, "utf8");
const permisos = [
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />',
  '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />'
];
for (const p of permisos) {
  const nombre = p.match(/name="([^"]+)"/)[1];
  if (!m.includes('"' + nombre + '"')) m = m.replace("<application", p + "\n    <application");
}
if (!m.includes("com.google.mlkit.vision.DEPENDENCIES")) {
  m = m.replace("</application>", '    <meta-data android:name="com.google.mlkit.vision.DEPENDENCIES" android:value="barcode_ui"/>\n    </application>');
}
fs.writeFileSync(manifest, m);

// Lector de etiquetas propio (texto + códigos de barras por recortes), ver apk/native/
const java = path.join(raiz, "src/main/java/co/com/palmastumaco/dispositivos");
fs.mkdirSync(java, { recursive: true });
for (const f of ["MainActivity.java", "LectorEtiquetaPlugin.java"]) {
  fs.copyFileSync(path.join(__dirname, "..", "native", f), path.join(java, f));
}

const gradle = path.join(raiz, "build.gradle");
let g = fs.readFileSync(gradle, "utf8");
if (!g.includes("dataBinding")) {
  g = g.replace(/android\s*\{/, "android {\n    buildFeatures {\n        dataBinding true\n    }");
}
// Librerías de Google para el lector (incluidas en la APK: funcionan sin internet y sin Firebase)
if (!g.includes("com.google.mlkit:text-recognition")) {
  g = g.replace(/\ndependencies\s*\{/, "\ndependencies {\n" +
    "    implementation 'com.google.mlkit:text-recognition:16.0.1'\n" +
    "    implementation 'com.google.mlkit:barcode-scanning:17.2.0'\n" +
    "    implementation 'androidx.exifinterface:exifinterface:1.3.7'");
  if (!g.includes("com.google.mlkit:text-recognition")) throw new Error("No se encontró el bloque dependencies en app/build.gradle");
}
// Número de versión: GitHub Actions lo pasa en APP_VERSION_CODE (1, 2, 3...) y APP_VERSION_NAME (1.0.N).
// La APK lo usa para saber si hay una versión más nueva publicada.
const vCodigo = parseInt(process.env.APP_VERSION_CODE || "", 10);
if (vCodigo > 0) {
  const vNombre = process.env.APP_VERSION_NAME || "1.0." + vCodigo;
  g = g.replace(/versionCode\s+\d+/, "versionCode " + vCodigo).replace(/versionName\s+"[^"]*"/, 'versionName "' + vNombre + '"');
  console.log("Versión " + vNombre + " (" + vCodigo + ")");
}
fs.writeFileSync(gradle, g);

// Ícono con la palma de Palmas de Tumaco
const res = path.join(raiz, "src/main/res");
for (const d of ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]) {
  const origen = path.join(__dirname, "..", "icons", d + ".png");
  for (const n of ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"]) {
    const destino = path.join(res, "mipmap-" + d, n);
    if (fs.existsSync(path.dirname(destino))) fs.copyFileSync(origen, destino);
  }
}
fs.rmSync(path.join(res, "mipmap-anydpi-v26"), { recursive: true, force: true });
console.log("Proyecto Android ajustado.");
