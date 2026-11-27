// Configuración de la página web (Dashboard)
// Base de datos: repositorio PRIVADO de GitHub (ver apk/www/datos.js). Aquí NO va ningún token:
// el token se entrega cifrado en el código de activación de cada usuario.
window.APP_CONFIG = {
  DATOS: { repo: "jrodriguezc4/CapturaIMEI-datos" },

  // Datos que aparecen en el acta PDF
  ENTREGA: { nombre: "JHON MARCO RODRIGUEZ CORREA", cargo: "Analista de ingenieria de datos" },
  VALOR_EQUIPO: 1000000,
  ADICIONALES: [
    ["Forro Carcaza", 5000],
    ["Vidrio templado", 2000],
    ["Estuche antilluvia", 10000]
  ]
};
