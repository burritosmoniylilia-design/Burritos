// data.js
// Datos semilla (seed) tomados de las hojas de cálculo del negocio.
// Estos valores se usan la primera vez que la app arranca (base vacía) Y
// también cada vez que agregas un ingrediente nuevo en este archivo: al
// abrir la app se crea automáticamente cualquier ingrediente de esta lista
// que todavía no exista en tu inventario (sin tocar los que ya editaste).
// Todo lo demás se edita desde la pestaña "Inventario" y se guarda en Firebase.

const SEED_INGREDIENTS = [
  // ---------- BURRITO DE RES ----------
  { id: 'tortilla',        name: 'Tortilla',                 categoria: 'burrito', costoUnidad: 80,  unidad: 'kg',     porcionesPorUnidad: 15,  requerimiento: '1 tortilla', core: true,  removible: false, stockPorciones: 0, alertaBaja: 30 },
  { id: 'carne',           name: 'Carne de res',              categoria: 'burrito', costoUnidad: 250, unidad: 'kg',     porcionesPorUnidad: 8,   requerimiento: '125 g',      core: true,  removible: false, stockPorciones: 0, alertaBaja: 20 },
  { id: 'arroz',           name: 'Arroz',                     categoria: 'burrito', costoUnidad: 32,  unidad: 'kg',     porcionesPorUnidad: 25,  requerimiento: '40 g',       core: false, removible: true,  stockPorciones: 0, alertaBaja: 20 },
  { id: 'cebolla_pimiento',name: 'Cebolla + pimiento',        categoria: 'burrito', costoUnidad: 25,  unidad: 'kg',     porcionesPorUnidad: 25,  requerimiento: '20 g',       core: false, removible: true,  stockPorciones: 0, alertaBaja: 20 },
  { id: 'frijol',          name: 'Frijol',                    categoria: 'burrito', costoUnidad: 50,  unidad: 'kg',     porcionesPorUnidad: 50,  requerimiento: '50 g',       core: false, removible: true,  stockPorciones: 0, alertaBaja: 20 },
  { id: 'pico_de_gallo',   name: 'Pico de gallo (tomate+cebolla+cilantro+limón)', categoria: 'burrito', costoUnidad: 26, unidad: 'kg', porcionesPorUnidad: 14, requerimiento: '70 g', core: false, removible: true, stockPorciones: 0, alertaBaja: 15 },
  { id: 'salsa_roja',      name: 'Salsa roja',                categoria: 'burrito', costoUnidad: 37,  unidad: 'kg',     porcionesPorUnidad: 20,  requerimiento: '50 g',       core: false, removible: true,  stockPorciones: 0, alertaBaja: 15 },
  { id: 'lechuga',         name: 'Lechuga',                   categoria: 'burrito', costoUnidad: 1,   unidad: 'porción directa', porcionesPorUnidad: 1, requerimiento: 'al gusto', core: false, removible: true, stockPorciones: 0, alertaBaja: 15 },
  { id: 'crema',           name: 'Crema',                     categoria: 'burrito', costoUnidad: 80,  unidad: 'kg',     porcionesPorUnidad: 25,  requerimiento: '40 g',       core: false, removible: true,  stockPorciones: 0, alertaBaja: 15 },
  { id: 'queso',           name: 'Queso',                     categoria: 'burrito', costoUnidad: 141, unidad: 'kg',     porcionesPorUnidad: 29,  requerimiento: '35 g',       core: false, removible: true,  stockPorciones: 0, alertaBaja: 15 },
  { id: 'condimentos',     name: 'Condimentos / adobo',       categoria: 'burrito', costoUnidad: 16,  unidad: 'paquete',porcionesPorUnidad: 8,   requerimiento: 'al gusto',   core: true,  removible: false, stockPorciones: 0, alertaBaja: 10 },
  { id: 'aguacate',        name: 'Aguacate (extra)',          categoria: 'burrito', costoUnidad: 80,  unidad: 'kg',     porcionesPorUnidad: 10,  requerimiento: '100 g',      core: false, removible: true,  stockPorciones: 0, alertaBaja: 10 },
  { id: 'papel',           name: 'Papel para envolver',       categoria: 'burrito', costoUnidad: 462, unidad: 'paquete',porcionesPorUnidad: 150, requerimiento: '30 cm',      core: true,  removible: false, stockPorciones: 0, alertaBaja: 30 },

  // ---------- BURRITO DE POLLO ----------
  // Nota: el costo de compra del pollo es una referencia (~$110/kg pechuga) —
  // VERIFICA y AJUSTA este precio en la pestaña Inventario en cuanto tengas
  // el dato real de tu proveedor.
  { id: 'pollo',           name: 'Pollo — VERIFICAR PRECIO',  categoria: 'burrito', costoUnidad: 110, unidad: 'kg',     porcionesPorUnidad: 8,   requerimiento: '125 g',      core: true,  removible: false, stockPorciones: 0, alertaBaja: 20 },

  // ---------- LIMONADA CON AZÚCAR ----------
  { id: 'apatzin',         name: 'Apatzin',                   categoria: 'bebida',  costoUnidad: 325, unidad: 'kg',     porcionesPorUnidad: 100, requerimiento: '10 g',       core: true,  removible: false, stockPorciones: 0, alertaBaja: 20 },
  { id: 'azucar',          name: 'Azúcar',                    categoria: 'bebida',  costoUnidad: 30,  unidad: 'kg',     porcionesPorUnidad: 20,  requerimiento: '50 g',       core: true,  removible: false, stockPorciones: 0, alertaBaja: 20 },
  // Agua y hielo son compartidos por TODAS las bebidas (no varían entre azúcar / monkfruit).
  { id: 'agua_purificada', name: 'Agua purificada',           categoria: 'bebida',  costoUnidad: 55,  unidad: 'garrafón',porcionesPorUnidad: 40, requerimiento: '500 ml',     core: true,  removible: false, stockPorciones: 0, alertaBaja: 15 },
  { id: 'hielo',           name: 'Hielo',                     categoria: 'bebida',  costoUnidad: 1,   unidad: 'porción directa', porcionesPorUnidad: 1, requerimiento: 'al gusto', core: true, removible: false, stockPorciones: 0, alertaBaja: 20 },
  { id: 'vaso_biocup',     name: 'Vaso BioCup 16oz',          categoria: 'bebida',  costoUnidad: 202, unidad: 'paquete',porcionesPorUnidad: 50,  requerimiento: '1 vaso',     core: true,  removible: false, stockPorciones: 0, alertaBaja: 20 },

  // ---------- LIMONADA CON MONKFRUIT ----------
  { id: 'apatzin_mk',      name: 'Apatzin (línea Monkfruit)', categoria: 'bebida',  costoUnidad: 325, unidad: 'kg',     porcionesPorUnidad: 100, requerimiento: '10 g',       core: true,  removible: false, stockPorciones: 0, alertaBaja: 20 },
  { id: 'monkfruit',       name: 'Monkfruit (endulzante) — VERIFICAR PRECIO', categoria: 'bebida', costoUnidad: 30, unidad: 'kg', porcionesPorUnidad: 20, requerimiento: '50 g', core: true, removible: false, stockPorciones: 0, alertaBaja: 20 },
  { id: 'vaso_biocup_mk',   name: 'Vaso BioCup 16oz (Monkfruit)', categoria: 'bebida', costoUnidad: 202, unidad: 'paquete', porcionesPorUnidad: 50, requerimiento: '1 vaso', core: true, removible: false, stockPorciones: 0, alertaBaja: 20 },
];

// Ids de ingredientes que ya no se usan (se fusionaron con otro). Si existen
// en tu inventario de Firebase, la app suma su stock al ingrediente vigente
// y borra el duplicado automáticamente al abrir.
const INGREDIENTES_FUSIONADOS = {
  agua_purificada_mk: 'agua_purificada',
  hielo_mk: 'hielo',
};

// Recetas: qué ingredientes lleva cada producto del menú por default.
// "cantidad" = número de porciones de ese ingrediente que usa 1 unidad del producto.
// "precioFijo" = precio de venta fijo (no cambia si se quita algo). Si no se
// definen, el precio se calcula como costo de la receta * (1 + margen).
const SEED_MENU = [
  {
    id: 'burrito_res',
    nombre: 'Burrito de Res',
    tipo: 'burrito',
    precioFijo: 105,
    ingredientes: [
      { ingredienteId: 'tortilla', cantidad: 1 },
      { ingredienteId: 'carne', cantidad: 1 },
      { ingredienteId: 'arroz', cantidad: 1 },
      { ingredienteId: 'cebolla_pimiento', cantidad: 1 },
      { ingredienteId: 'frijol', cantidad: 1 },
      { ingredienteId: 'pico_de_gallo', cantidad: 1 },
      { ingredienteId: 'salsa_roja', cantidad: 1 },
      { ingredienteId: 'lechuga', cantidad: 1 },
      { ingredienteId: 'crema', cantidad: 1 },
      { ingredienteId: 'queso', cantidad: 1 },
      { ingredienteId: 'condimentos', cantidad: 1 },
      { ingredienteId: 'papel', cantidad: 1 },
    ],
    // Ingredientes que NO vienen por default pero se pueden agregar como extra
    extrasDisponibles: ['aguacate', 'queso', 'crema', 'carne'],
  },
  {
    id: 'burrito_pollo',
    nombre: 'Burrito de Pollo',
    tipo: 'burrito',
    precioFijo: 95,
    ingredientes: [
      { ingredienteId: 'tortilla', cantidad: 1 },
      { ingredienteId: 'pollo', cantidad: 1 },
      { ingredienteId: 'arroz', cantidad: 1 },
      { ingredienteId: 'cebolla_pimiento', cantidad: 1 },
      { ingredienteId: 'frijol', cantidad: 1 },
      { ingredienteId: 'pico_de_gallo', cantidad: 1 },
      { ingredienteId: 'salsa_roja', cantidad: 1 },
      { ingredienteId: 'lechuga', cantidad: 1 },
      { ingredienteId: 'crema', cantidad: 1 },
      { ingredienteId: 'queso', cantidad: 1 },
      { ingredienteId: 'condimentos', cantidad: 1 },
      { ingredienteId: 'papel', cantidad: 1 },
    ],
    extrasDisponibles: ['aguacate', 'queso', 'crema', 'pollo'],
  },
  {
    id: 'limonada_azucar',
    nombre: 'Limonada con Azúcar',
    tipo: 'bebida',
    precioFijo:30,
    ingredientes: [
      { ingredienteId: 'apatzin', cantidad: 1 },
      { ingredienteId: 'azucar', cantidad: 1 },
      { ingredienteId: 'agua_purificada', cantidad: 1 },
      { ingredienteId: 'hielo', cantidad: 1 },
      { ingredienteId: 'vaso_biocup', cantidad: 1 },
    ],
    extrasDisponibles: [],
  },
  {
    id: 'limonada_monkfruit',
    nombre: 'Limonada con Monkfruit',
    tipo: 'bebida',
    precioFijo: 30,
    ingredientes: [
      { ingredienteId: 'apatzin_mk', cantidad: 1 },
      { ingredienteId: 'monkfruit', cantidad: 1 },
      { ingredienteId: 'agua_purificada', cantidad: 1 },
      { ingredienteId: 'hielo', cantidad: 1 },
      { ingredienteId: 'vaso_biocup_mk', cantidad: 1 },
    ],
    extrasDisponibles: [],
  },
];

// Reglas de precio de venta (tal como las definiste):
const REGLAS_PRECIO = {
  margenIndividual: 0.30, // precio de venta = costo * 1.30 (para lo que no tiene precioFijo, y para el costo de los extras)
  margenCombo: 0.25,      // precio combo = (costo burrito + costo bebida) * 1.25
};

// Configuración general editable desde la app (gastos fijos, etc.)
const CONFIG_DEFAULTS = {
  rentaMensual: 20000,
};
