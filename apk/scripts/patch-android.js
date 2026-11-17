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

const gradle = path.join(raiz, "build.gradle");
let g = fs.readFileSync(gradle, "utf8");
if (!g.includes("dataBinding")) {
  g = g.replace(/android\s*\{/, "android {\n    buildFeatures {\n        dataBinding true\n    }");
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
