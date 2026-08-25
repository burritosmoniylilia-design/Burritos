// firebase-config.js
//
// 1) Ve a https://console.firebase.google.com
// 2) Crea un proyecto nuevo (gratis) llamado, por ejemplo, "burritos-moni-y-lilia"
// 3) Dentro del proyecto -> "Configuración del proyecto" (ícono de engranaje) ->
//    baja hasta "Tus apps" -> clic en el ícono </> (Web) -> registra la app.
// 4) Firebase te va a mostrar un bloque como el de abajo (firebaseConfig).
//    COPIA y PEGA esos valores aquí abajo, reemplazando los que dicen "PEGA_AQUI...".
// 5) Activa Firestore: en el menú izquierdo -> "Firestore Database" -> "Crear base de datos"
//    -> modo producción -> elige la región más cercana (ej. us-central).
// 6) En Firestore -> pestaña "Reglas", pega las reglas que están en INSTRUCCIONES.md
//    (para que la app pueda leer/escribir).
//
// Instrucciones completas y con capturas de referencia en INSTRUCCIONES.md

const firebaseConfig = {
  apiKey: "PEGA_AQUI_TU_API_KEY",
  authDomain: "PEGA_AQUI_TU_PROYECTO.firebaseapp.com",
  projectId: "PEGA_AQUI_TU_PROYECTO_ID",
  storageBucket: "PEGA_AQUI_TU_PROYECTO.appspot.com",
  messagingSenderId: "PEGA_AQUI_TU_SENDER_ID",
  appId: "PEGA_AQUI_TU_APP_ID",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
