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
  apiKey: "AIzaSyD2uUjX1QunIVyF1rO5ZUXuc-L7jE-tbuU",
  authDomain: "burritos-moni-y-lilia.firebaseapp.com",
  projectId: "burritos-moni-y-lilia",
  storageBucket: "burritos-moni-y-lilia.firebasestorage.app",
  messagingSenderId: "240389163242",
  appId: "1:240389163242:web:5a938561311035646f6f93",
  measurementId: "G-05LY342SBQ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
