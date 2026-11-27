// Tabla de valores de los dispositivos (de "Tabla de valores dispositivos.xlsx").
// La usan la APK y la web (index.html carga apk/www/valores.js) para el valor que aparece en el acta.
// Para cambiar un precio o agregar un modelo: edita esta lista y sube el cambio (la APK nueva sale sola).
window.VALORES = {
  // [marca, modelo, valor en pesos]
  EQUIPOS: [
    ["XIAOMI",  "REDMI 10C",       550000],
    ["XIAOMI",  "REDMI 13C",       550000],
    ["XIAOMI",  "REDMI 14C",       550000],
    ["XIAOMI",  "REDMI 15C",       550000],
    ["CUBOT",   "KINGKONG",       1000000],
    ["CUBOT",   "KINGKONG ES3",   1000000],
    ["CUBOT",   "KINGKONG ACE 2", 1000000],
    ["ULEFONE", "ARMOR X16",      1200000]
  ],
  // Adicionales que se entregan con el equipo: [nombre, valor]
  ADICIONALES: [
    ["Forro Carcaza",      5000],
    ["Vidrio Templado",    2000],
    ["Estuche Antilluvia", 10000],
    ["Piernera",           19000]
  ],
  // Valor si el equipo no está en la tabla
  VALOR_POR_DEFECTO: 1000000
};
// Busca el valor de un equipo por marca y modelo (sin importar mayúsculas, espacios ni tildes)
window.VALORES.buscar = function(marca, modelo){
  const n = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const mm = n(modelo), todo = n(marca) + mm;
  // primero coincidencia exacta, luego la más larga contenida en el texto
  const lista = window.VALORES.EQUIPOS.slice().sort((a, b) => b[1].length - a[1].length);
  return lista.find(([ma, mo]) => n(ma + mo) === todo || n(mo) === mm)
      || lista.find(([ma, mo]) => mm && (todo.includes(n(ma + mo)) || mm.includes(n(mo))))
      || null;
};
