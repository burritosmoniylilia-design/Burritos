# Burritos Moni y Lilia — Guía de instalación

No necesitas saber programar para esto. Son 3 partes:
**A) Crear la base de datos (Firebase)** — 10 min, una sola vez
**B) Publicar la app en internet (GitHub Pages)** — 10 min, una sola vez
**C) Instalarla en tu tablet/celular** — 1 min, en cada dispositivo

---

## PARTE A — Firebase (donde se guardan tus datos)

Esto es lo que hace que la tablet de caja y el celular de cocina vean **lo mismo al mismo tiempo**.

1. Ve a **https://console.firebase.google.com** e inicia sesión con una cuenta de Google (puede ser una nueva, dedicada al negocio).
2. Clic en **"Crear un proyecto"**. Nómbralo, por ejemplo, `burritos-moni-y-lilia`. Puedes desactivar Google Analytics (no lo necesitas), clic en **Crear proyecto**.
3. Dentro del proyecto, en el menú izquierdo busca **"Compilación" → "Firestore Database"**. Clic en **"Crear base de datos"**.
   - Elige la ubicación más cercana a ti (ej. `us-central` o `southamerica-east1`, la que te sugiera por defecto está bien).
   - Elige **"Iniciar en modo de producción"**.
4. Ve a la pestaña **"Reglas"** dentro de Firestore Database y reemplaza todo el contenido por esto:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

   > ⚠️ Esto deja la base de datos abierta a cualquiera que tenga el link — es lo más simple para empezar y es lo típico para un proyecto pequeño de un solo negocio. Si más adelante quieres agregar una contraseña de acceso, dímelo y te ayudo a agregar Firebase Authentication con usuario/contraseña.

   Clic en **"Publicar"**.

5. Ahora registra la app web: en el menú izquierdo, clic en el ⚙️ (engranaje) junto a "Descripción general del proyecto" → **"Configuración del proyecto"**. Baja hasta **"Tus apps"** → clic en el ícono **`</>`** (Web).
6. Ponle un apodo, ej. `app-burritos`, **no** actives Firebase Hosting ahí (usaremos GitHub Pages), clic en **"Registrar app"**.
7. Firebase te va a mostrar un bloque de código con `const firebaseConfig = { apiKey: "...", ... }`. **Copia esos valores.**

8. En los archivos que te compartí, abre **`firebase-config.js`** y reemplaza los valores `"PEGA_AQUI_..."` con los que te dio Firebase. Debe quedar algo así (con tus datos reales):

   ```js
   const firebaseConfig = {
     apiKey: "AIzaSyD...",
     authDomain: "burritos-moni-y-lilia.firebaseapp.com",
     projectId: "burritos-moni-y-lilia",
     storageBucket: "burritos-moni-y-lilia.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123",
   };
   ```

Guarda el archivo. Con esto, la app ya sabe a qué base de datos conectarse.

---

## PARTE B — Publicar en GitHub Pages (para tener un link permanente)

1. Ve a **https://github.com** y crea una cuenta si no tienes.
2. Clic en el botón **"+"** arriba a la derecha → **"New repository"**.
   - Nombre: `burritos-moni-y-lilia`
   - Marca **"Public"**
   - Clic en **"Create repository"**.
3. En la página del repo recién creado, busca el link **"uploading an existing file"** (o el botón "Add file" → "Upload files").
4. Arrastra **todos** los archivos de la carpeta que te compartí (`index.html`, `styles.css`, `app.js`, `data.js`, `firebase-config.js` —ya con tus claves—, `manifest.json`, `service-worker.js`, y la carpeta `icons` completa).
5. Abajo, clic en **"Commit changes"**.
6. Ve a la pestaña **"Settings"** del repositorio → menú izquierdo **"Pages"**.
   - En "Source", elige **"Deploy from a branch"**.
   - Branch: **`main`**, carpeta **`/ (root)`**. Clic en **"Save"**.
7. Espera 1-2 minutos. GitHub te va a mostrar un link como:
   `https://TU-USUARIO.github.io/burritos-moni-y-lilia/`

   Ese es el link permanente de tu app. Ábrelo en el navegador para probar que todo cargue y que la pestaña "Inventario" muestre tus ingredientes (la primera vez que abras, la app sola llena el inventario inicial con los datos de tus fotos).

**¿Cómo subo cambios después?** Cada vez que quieras actualizar algo (por ejemplo si yo te doy una versión nueva de algún archivo), solo repites el paso 4: subes el archivo actualizado al mismo repositorio, arrastrándolo — GitHub te va a preguntar si quieres reemplazar el existente, dices que sí.

---

## PARTE C — Instalarla en la tablet o celular

1. En la tablet/celular, abre **Chrome** (Android) o **Safari** (iPhone/iPad) y entra al link de GitHub Pages del paso B7.
2. **Android/Chrome**: te va a aparecer un banner o un ícono de "Instalar app" en la barra de direcciones (⋮ → "Instalar aplicación" / "Agregar a pantalla de inicio").
3. **iPhone/iPad/Safari**: toca el ícono de compartir (el cuadrito con flecha hacia arriba) → **"Agregar a pantalla de inicio"**.
4. Listo — te va a quedar un ícono en el escritorio como cualquier otra app, abre a pantalla completa (sin la barra del navegador) y funciona aunque se corte el wifi un momento (los datos se sincronizan solos cuando vuelve la conexión).

Repite este paso C en cada tablet/celular que uses en el negocio (caja, cocina, etc.) — todos apuntan al mismo link, así que todos ven la misma información.

---

## Cómo funciona la app (resumen rápido)

- **Inventario**: existencias por *porción* de cada ingrediente. "Reabastecer" te pide cuántas unidades de compra entraron (ej. cuántos kilos) y convierte solo a porciones. "Editar" te deja cambiar precio, unidad, etc.
- **Armar pedido**: eliges Burrito de Res y/o alguna Limonada, quitas ingredientes (✕) o agregas extras (+), y agregas al pedido actual. Si el pedido tiene un burrito y una bebida, se junta automáticamente como **combo** con el precio especial.
- **Pedidos**: cola en vivo (Pendiente → En preparación → Listo → Entregar). Al enviar un pedido desde "Armar pedido", el inventario se descuenta solo. "Cancelar" devuelve el inventario.
- **Finanzas**: total vendido, ganancia, y desglose de combos / burritos solos / bebidas solas, filtrable por hoy / 7 días / 30 días / todo.

## Reglas de precio ya configuradas

- Burrito o bebida individual: **costo × 1.30**
- Combo (burrito + bebida): **(costo burrito + costo bebida) × 1.25**

Si en algún momento quieres cambiar estos porcentajes, están en `data.js`, en el bloque `REGLAS_PRECIO` — o dime y te lo ajusto.

## Pendiente de tu parte

⚠️ La receta de **Limonada con Monkfruit** se sembró con el precio del endulzante Monkfruit como referencia (igual al de azúcar) porque en tu foto esa fila salía cortada. Entra a **Inventario → busca "Monkfruit"** y corrige el costo real — se recalcula todo automáticamente.

---

¿Quieres que te ayude a: (1) ponerle una contraseña simple a la app para que no cualquiera con el link vea tus finanzas, (2) agregar más productos al menú (otro tipo de burrito, otra bebida), o (3) un reporte de finanzas exportable a Excel? Dime y lo agregamos.
