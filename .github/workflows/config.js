// Configuración de la página web (Dashboard)
// Base de datos: Firebase Realtime Database (los datos se guardan en formato JSON).
// 1. Pega aquí los datos de tu proyecto Firebase (Configuración del proyecto → Tus apps → Web).
// 2. Mientras diga TU_PROYECTO, la página funciona en MODO DEMO con datos de ejemplo.
window.APP_CONFIG = {
  FIREBASE: {
    apiKey: "TU_API_KEY",
    databaseURL: "https://TU_PROYECTO-default-rtdb.firebaseio.com"
  },

  // Datos que aparecen en el acta PDF
  ENTREGA: { nombre: "JHON MARCO RODRIGUEZ CORREA", cargo: "Analista de ingenieria de datos" },
  VALOR_EQUIPO: 1000000,
  ADICIONALES: [
    ["Forro Carcaza", 5000],
    ["Vidrio templado", 2000],
    ["Estuche antilluvia", 10000]
  ]
};
