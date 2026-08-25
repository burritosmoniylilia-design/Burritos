// app.js — Burritos Moni y Lilia
// Toda la app vive en este archivo para mantenerlo simple de mantener sin build tools.

/* ================= ESTADO GLOBAL ================= */
let INGREDIENTS = [];         // espejo en vivo de Firestore
let ORDERS = [];               // espejo en vivo de Firestore (pendiente/preparando/listo/entregado/cancelado)
let CONFIG = { ...CONFIG_DEFAULTS }; // espejo en vivo de meta/config (renta, etc.)
let builderState = {};         // { menuId: { removidos:Set, extras:{ingId:cantidad} } }
let cart = [];                 // items agregados al pedido actual, aún no enviados
let invFilter = 'todos';
let invSearch = '';
let finRange = 'hoy';
let facturaModo = 'ticket';    // 'ticket' | 'factura'
let facturaPedidoId = null;

/* ================= ARRANQUE ================= */
try { db.enablePersistence({ synchronizeTabs: true }).catch(()=>{}); } catch(e){}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initModals();
  ensureIngredientesActualizados().then(() => {
    listenIngredients();
    listenOrders();
  });
  listenConfig();
  document.getElementById('inv-search').addEventListener('input', e => { invSearch = e.target.value.toLowerCase(); renderInventario(); });
  document.querySelectorAll('.inv-toolbar [data-filter]').forEach(b => b.addEventListener('click', () => {
    invFilter = b.dataset.filter;
    document.querySelectorAll('.inv-toolbar [data-filter]').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    renderInventario();
  }));
  document.querySelectorAll('.filter-row [data-range]').forEach(b => b.addEventListener('click', () => {
    finRange = b.dataset.range;
    document.querySelectorAll('.filter-row [data-range]').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    renderFinanzas();
  }));
  document.getElementById('btn-enviar-pedido').addEventListener('click', enviarPedido);
  document.getElementById('btn-guardar-renta').addEventListener('click', guardarRenta);

  const facturaSelect = document.getElementById('factura-pedido');
  if (facturaSelect) facturaSelect.addEventListener('change', e => { facturaPedidoId = e.target.value || null; renderFactura(); });
  document.querySelectorAll('.factura-modo [data-modo]').forEach(b => b.addEventListener('click', () => {
    facturaModo = b.dataset.modo;
    document.querySelectorAll('.factura-modo [data-modo]').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.getElementById('factura-cliente').style.display = facturaModo === 'factura' ? 'block' : 'none';
    renderFactura();
  }));
  ['factura-cliente-nombre','factura-cliente-rfc','factura-cliente-uso','factura-cliente-metodo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', renderFactura);
  });
  const btnImprimir = document.getElementById('btn-imprimir-ticket');
  if (btnImprimir) btnImprimir.addEventListener('click', () => window.print());

  renderMenuBuilder();
  renderCart();
});

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 2600);
}

/* ================= TABS ================= */
function initTabs(){
  document.querySelectorAll('nav.tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('section.tab').forEach(s=>s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'finanzas') renderFinanzas();
      if (btn.dataset.tab === 'analiticas') renderAnaliticas();
      if (btn.dataset.tab === 'factura') { populateFacturaSelect(); renderFactura(); }
    });
  });
}

/* ================= SEED / MIGRACIÓN DE INGREDIENTES ================= */
// Crea en Firestore cualquier ingrediente de SEED_INGREDIENTS que todavía no
// exista (primera vez que arranca la app, o cuando agregas un ingrediente
// nuevo como el pollo). Nunca sobrescribe ingredientes que ya editaste.
// También fusiona ingredientes viejos (agua/hielo de monkfruit) con los
// vigentes, sumando su stock, y borra el duplicado.
function ensureIngredientesActualizados(){
  return db.collection('ingredients').get().then(snap => {
    const existentes = {};
    snap.docs.forEach(d => { existentes[d.id] = d.data(); });

    const batch = db.batch();
    let huboCambios = false;

    // 1) crear los que falten
    SEED_INGREDIENTS.forEach(ing => {
      if (!existentes[ing.id]) {
        batch.set(db.collection('ingredients').doc(ing.id), ing);
        huboCambios = true;
      }
    });

    // 2) fusionar duplicados viejos (agua_purificada_mk -> agua_purificada, hielo_mk -> hielo)
    Object.entries(INGREDIENTES_FUSIONADOS).forEach(([viejoId, nuevoId]) => {
      if (existentes[viejoId]) {
        const stockViejo = existentes[viejoId].stockPorciones || 0;
        if (stockViejo && existentes[nuevoId]) {
          batch.update(db.collection('ingredients').doc(nuevoId), {
            stockPorciones: firebase.firestore.FieldValue.increment(stockViejo)
          });
        }
        batch.delete(db.collection('ingredients').doc(viejoId));
        huboCambios = true;
      }
    });

    if (!huboCambios) return;
    return batch.commit().then(() => toast('Inventario actualizado ✅'));
  }).catch(err => { console.error(err); setConn(false); });
}

/* ================= CONEXIÓN ================= */
function setConn(ok){
  document.getElementById('conn-dot').classList.toggle('off', !ok);
  document.getElementById('conn-label').textContent = ok ? 'conectado' : 'sin conexión';
}

/* ================= LISTENERS FIRESTORE ================= */
function listenIngredients(){
  db.collection('ingredients').onSnapshot(snap => {
    setConn(true);
    INGREDIENTS = snap.docs.map(d => d.data());
    renderInventario();
    renderMenuBuilder();
  }, err => { console.error(err); setConn(false); });
}

function listenOrders(){
  db.collection('orders').orderBy('createdAt','desc').limit(300).onSnapshot(snap => {
    setConn(true);
    ORDERS = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    renderPedidos();
    renderFinanzas();
    if (document.getElementById('tab-analiticas').classList.contains('active')) renderAnaliticas();
    if (document.getElementById('tab-factura').classList.contains('active')) { populateFacturaSelect(); renderFactura(); }
  }, err => { console.error(err); setConn(false); });
}

function listenConfig(){
  db.collection('meta').doc('config').onSnapshot(doc => {
    CONFIG = { ...CONFIG_DEFAULTS, ...(doc.exists ? doc.data() : {}) };
    const input = document.getElementById('renta-mensual');
    if (input && document.activeElement !== input) input.value = CONFIG.rentaMensual;
    renderFinanzas();
  }, err => console.error(err));
}

function guardarRenta(){
  const val = parseFloat(document.getElementById('renta-mensual').value);
  if (isNaN(val) || val < 0){ toast('Ingresa una renta válida'); return; }
  db.collection('meta').doc('config').set({ rentaMensual: val }, { merge: true })
    .then(() => toast('Renta actualizada ✅'))
    .catch(err => toast('Error al guardar: ' + err.message));
}

/* ================= HELPERS DE PRECIO ================= */
function ingById(id){ return INGREDIENTS.find(i => i.id === id); }
function costoPorcion(ing){ return (ing.costoUnidad || 0) / (ing.porcionesPorUnidad || 1); }

function costoReceta(menuItem, removidos=[], extras={}){
  let costo = 0;
  menuItem.ingredientes.forEach(li => {
    if (removidos.includes(li.ingredienteId)) return;
    const ing = ingById(li.ingredienteId);
    if (!ing) return;
    costo += costoPorcion(ing) * li.cantidad;
  });
  Object.entries(extras).forEach(([ingId, cant]) => {
    if (!cant) return;
    const ing = ingById(ingId);
    if (!ing) return;
    costo += costoPorcion(ing) * cant;
  });
  return costo;
}
function costoExtras(extras={}){
  let costo = 0;
  Object.entries(extras).forEach(([ingId, cant]) => {
    if (!cant) return;
    const ing = ingById(ingId);
    if (!ing) return;
    costo += costoPorcion(ing) * cant;
  });
  return costo;
}
function precioIndividual(costo){ return round2(costo * (1 + REGLAS_PRECIO.margenIndividual)); }

// Precio de venta de un producto del menú: si tiene precioFijo, ese precio
// NO cambia por quitar ingredientes — solo sube si se agregan extras
// (el extra se cobra a costo + margen, igual que el resto del menú).
function precioVenta(mi, removidos=[], extras={}){
  if (mi.precioFijo != null){
    // precio base fijo (no cambia si se quita algo) + costo de los extras con el mismo margen del menú
    const extraConMargen = round2(costoExtras(extras) * (1 + REGLAS_PRECIO.margenIndividual));
    return round2(mi.precioFijo + extraConMargen);
  }
  return precioIndividual(costoReceta(mi, removidos, extras));
}
function round2(n){ return Math.round(n * 100) / 100; }
function money(n){ return '$' + (n||0).toFixed(2); }

/* ================= INVENTARIO ================= */
function renderInventario(){
  const grid = document.getElementById('inv-grid');
  let list = INGREDIENTS.slice().sort((a,b)=> a.categoria.localeCompare(b.categoria) || a.name.localeCompare(b.name));
  if (invFilter !== 'todos') list = list.filter(i => i.categoria === invFilter);
  if (invSearch) list = list.filter(i => i.name.toLowerCase().includes(invSearch));

  if (!list.length){ grid.innerHTML = '<div class="empty-col">No hay ingredientes que coincidan.</div>'; return; }

  grid.innerHTML = list.map(ing => {
    const cp = costoPorcion(ing);
    const stock = ing.stockPorciones || 0;
    const alerta = ing.alertaBaja || 10;
    const ref = Math.max(alerta * 3, 1);
    const pct = Math.max(0, Math.min(100, (stock/ref)*100));
    let barClass = '';
    if (stock <= 0) barClass = 'empty'; else if (stock <= alerta) barClass = 'low';
    return `
    <div class="ing-card">
      <div class="row1">
        <h4>${escapeHtml(ing.name)}</h4>
        <span class="cat-pill ${ing.categoria}">${ing.categoria === 'burrito' ? '🌯' : '🥤'} ${ing.categoria}</span>
      </div>
      <div class="meta mono">${money(ing.costoUnidad)} / ${escapeHtml(ing.unidad)} · ${money(cp)} por porción</div>
      <div class="meta">Uso por porción: ${escapeHtml(ing.requerimiento||'—')}</div>
      <div class="stockbar-wrap">
        <div class="stockbar ${barClass}"><div style="width:${pct}%"></div></div>
        <div class="stock-label"><span>${stock} porciones</span>${stock<=alerta?'<span style="color:var(--chile)">⚠ bajo</span>':''}</div>
      </div>
      <div class="actions">
        <button class="btn btn-dark btn-sm" onclick="openRestock('${ing.id}')">Reabastecer</button>
        <button class="btn btn-ghost btn-sm" onclick="openEditIng('${ing.id}')">Editar</button>
      </div>
    </div>`;
  }).join('');
}

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ---- modal ingrediente (nuevo/editar) ---- */
function initModals(){
  document.getElementById('btn-nuevo-ingrediente').addEventListener('click', () => openEditIng(null));
  document.getElementById('close-ing').addEventListener('click', () => toggleOverlay('overlay-ing', false));
  document.getElementById('btn-guardar-ing').addEventListener('click', guardarIngrediente);
  document.getElementById('close-restock').addEventListener('click', () => toggleOverlay('overlay-restock', false));
  document.getElementById('btn-confirmar-restock').addEventListener('click', confirmarRestock);
  document.getElementById('restock-unidades').addEventListener('input', updateRestockPreview);
}
function toggleOverlay(id, open){ document.getElementById(id).classList.toggle('open', open); }

function openEditIng(id){
  const ing = id ? ingById(id) : null;
  document.getElementById('ing-modal-title').textContent = ing ? 'Editar ingrediente' : 'Nuevo ingrediente';
  document.getElementById('ing-id').value = id || '';
  document.getElementById('ing-nombre').value = ing ? ing.name : '';
  document.getElementById('ing-categoria').value = ing ? ing.categoria : 'burrito';
  document.getElementById('ing-unidad').value = ing ? ing.unidad : '';
  document.getElementById('ing-costo').value = ing ? ing.costoUnidad : '';
  document.getElementById('ing-porciones').value = ing ? ing.porcionesPorUnidad : '';
  document.getElementById('ing-requerimiento').value = ing ? ing.requerimiento : '';
  document.getElementById('ing-alerta').value = ing ? ing.alertaBaja : 10;

  // Existencia actual, mostrada en la unidad de compra (kg, garrafón, etc.)
  // para poder corregirla directamente si te equivocaste al capturar.
  const stockField = document.getElementById('ing-stock-field');
  const stockInput = document.getElementById('ing-stock-actual');
  const stockUnidadLbl = document.getElementById('ing-stock-unidad-lbl');
  if (ing) {
    stockField.style.display = 'block';
    const porciones = ing.porcionesPorUnidad || 1;
    stockInput.value = round2((ing.stockPorciones || 0) / porciones);
    stockUnidadLbl.textContent = ing.unidad || 'unidad';
  } else {
    stockField.style.display = 'none';
    stockInput.value = '';
  }

  toggleOverlay('overlay-ing', true);
}

function slugify(s){
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'') || ('ing_' + Date.now());
}

function guardarIngrediente(){
  const existingId = document.getElementById('ing-id').value;
  const nombre = document.getElementById('ing-nombre').value.trim();
  if (!nombre){ toast('Ponle un nombre al ingrediente'); return; }
  const costo = parseFloat(document.getElementById('ing-costo').value) || 0;
  const porciones = parseFloat(document.getElementById('ing-porciones').value) || 1;
  const id = existingId || slugify(nombre);
  const prevStock = existingId ? (ingById(existingId)?.stockPorciones || 0) : 0;

  // Si estás editando y tocaste "existencia actual", esa cantidad (convertida
  // a porciones con las porciones-por-unidad ya guardadas) reemplaza el stock.
  let nuevoStock = prevStock;
  const stockActualInput = document.getElementById('ing-stock-actual');
  if (existingId && stockActualInput.value !== '') {
    const stockActualUnidades = parseFloat(stockActualInput.value);
    if (!isNaN(stockActualUnidades) && stockActualUnidades >= 0) {
      nuevoStock = round2(stockActualUnidades * porciones);
    }
  }

  const data = {
    id,
    name: nombre,
    categoria: document.getElementById('ing-categoria').value,
    unidad: document.getElementById('ing-unidad').value.trim() || 'unidad',
    costoUnidad: costo,
    porcionesPorUnidad: porciones,
    requerimiento: document.getElementById('ing-requerimiento').value.trim(),
    alertaBaja: parseFloat(document.getElementById('ing-alerta').value) || 10,
    core: existingId ? (ingById(existingId)?.core || false) : false,
    removible: existingId ? (ingById(existingId)?.removible !== false) : true,
    stockPorciones: nuevoStock,
  };
  db.collection('ingredients').doc(id).set(data, { merge: true })
    .then(() => { toast('Guardado ✅'); toggleOverlay('overlay-ing', false); })
    .catch(err => toast('Error al guardar: ' + err.message));
}

/* ---- reabastecer ---- */
function openRestock(id){
  const ing = ingById(id);
  document.getElementById('restock-id').value = id;
  document.getElementById('restock-nombre').textContent = ing.name;
  document.getElementById('restock-unidad-lbl').textContent = ing.unidad;
  document.getElementById('restock-unidades').value = '';
  document.getElementById('restock-preview').textContent = '';
  toggleOverlay('overlay-restock', true);
}
function updateRestockPreview(){
  const id = document.getElementById('restock-id').value;
  const ing = ingById(id);
  const u = parseFloat(document.getElementById('restock-unidades').value) || 0;
  const porciones = u * (ing.porcionesPorUnidad || 1);
  document.getElementById('restock-preview').textContent = u ? `Esto agrega ${porciones} porciones al inventario (costo total ${money(u*ing.costoUnidad)}).` : '';
}
function confirmarRestock(){
  const id = document.getElementById('restock-id').value;
  const ing = ingById(id);
  const u = parseFloat(document.getElementById('restock-unidades').value) || 0;
  if (u <= 0){ toast('Ingresa una cantidad válida'); return; }
  const porciones = u * (ing.porcionesPorUnidad || 1);
  db.collection('ingredients').doc(id).update({
    stockPorciones: firebase.firestore.FieldValue.increment(porciones)
  }).then(() => { toast(`+${porciones} porciones de ${ing.name}`); toggleOverlay('overlay-restock', false); });
}

/* ================= ARMAR PEDIDO ================= */
function getBuilderState(menuId){
  if (!builderState[menuId]) builderState[menuId] = { removidos: new Set(), extras: {} };
  return builderState[menuId];
}

function renderMenuBuilder(){
  const cont = document.getElementById('menu-list');
  if (!INGREDIENTS.length){ cont.innerHTML = '<p class="tab-desc">Cargando menú…</p>'; return; }

  cont.innerHTML = SEED_MENU.map(mi => {
    const st = getBuilderState(mi.id);
    const precio = precioVenta(mi, [...st.removidos], st.extras);

    const removiblesChips = mi.ingredientes
      .map(li => ({ li, ing: ingById(li.ingredienteId) }))
      .filter(x => x.ing && x.ing.removible)
      .map(({li, ing}) => {
        const off = st.removidos.has(li.ingredienteId);
        return `<button type="button" class="chip ${off?'off':''}" onclick="toggleRemovido('${mi.id}','${li.ingredienteId}')">
          ${off ? '↺' : '✕'} ${escapeHtml(ing.name)}
        </button>`;
      }).join('');

    const extrasRows = (mi.extrasDisponibles||[]).map(ingId => {
      const ing = ingById(ingId);
      if (!ing) return '';
      const cant = st.extras[ingId] || 0;
      return `<div class="extra-row">
        <span>+ ${escapeHtml(ing.name)} <span class="mono" style="color:var(--tinta-suave)">(${money(costoPorcion(ing))} c/u)</span></span>
        <div class="stepper">
          <button onclick="changeExtra('${mi.id}','${ingId}',-1)">−</button>
          <span class="mono">${cant}</span>
          <button onclick="changeExtra('${mi.id}','${ingId}',1)">+</button>
        </div>
      </div>`;
    }).join('');

    return `
    <div class="menu-item-card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <h3>${mi.tipo === 'burrito' ? '🌯' : '🥤'} ${escapeHtml(mi.nombre)}</h3>
        <span class="price-tag">${money(precio)}</span>
      </div>
      ${mi.precioFijo != null ? `<div class="meta" style="font-size:11.5px;color:var(--tinta-suave);margin-top:2px;">Precio fijo ${money(mi.precioFijo)}${(st.removidos.size)?' (quitar ingredientes no cambia el precio)':''}</div>` : ''}
      ${removiblesChips ? `<div class="chip-list">${removiblesChips}</div>` : ''}
      ${extrasRows ? `<div style="margin-top:8px;">${extrasRows}</div>` : ''}
      <button class="btn btn-green add-to-order-btn" onclick="agregarAlCarrito('${mi.id}')">+ Agregar al pedido</button>
    </div>`;
  }).join('');
}

function toggleRemovido(menuId, ingId){
  const st = getBuilderState(menuId);
  if (st.removidos.has(ingId)) st.removidos.delete(ingId); else st.removidos.add(ingId);
  renderMenuBuilder();
}
function changeExtra(menuId, ingId, delta){
  const st = getBuilderState(menuId);
  const next = Math.max(0, (st.extras[ingId]||0) + delta);
  st.extras[ingId] = next;
  renderMenuBuilder();
}

function agregarAlCarrito(menuId){
  const mi = SEED_MENU.find(m => m.id === menuId);
  const st = getBuilderState(menuId);
  const removidos = [...st.removidos];
  const extras = {...st.extras};
  const costo = costoReceta(mi, removidos, extras);
  const precio = precioVenta(mi, removidos, extras);

  cart.push({
    uid: 'l' + Date.now() + Math.random().toString(36).slice(2,6),
    menuId: mi.id,
    nombre: mi.nombre,
    tipo: mi.tipo, // 'burrito' | 'bebida'
    removidos,
    extras,
    costo: round2(costo),
    precioIndividual: precio,
  });

  builderState[menuId] = { removidos: new Set(), extras: {} };
  renderMenuBuilder();
  renderCart();
  toast(mi.nombre + ' agregado');
}

/* ---- carrito con emparejamiento de combos ---- */
function calcularCarrito(){
  // separa por tipo, empareja burrito+bebida como combo (25% sobre costo conjunto)
  const burritos = cart.filter(c => c.tipo === 'burrito');
  const bebidas = cart.filter(c => c.tipo === 'bebida');
  const nPares = Math.min(burritos.length, bebidas.length);
  const lineas = [];

  for (let i = 0; i < nPares; i++){
    const b = burritos[i], d = bebidas[i];
    const costoJunto = b.costo + d.costo;
    const precioJunto = round2(costoJunto * (1 + REGLAS_PRECIO.margenCombo));
    lineas.push({ esCombo: true, items: [b, d], costo: round2(costoJunto), precio: precioJunto });
  }
  for (let i = nPares; i < burritos.length; i++){
    lineas.push({ esCombo: false, items: [burritos[i]], costo: burritos[i].costo, precio: burritos[i].precioIndividual });
  }
  for (let i = nPares; i < bebidas.length; i++){
    lineas.push({ esCombo: false, items: [bebidas[i]], costo: bebidas[i].costo, precio: bebidas[i].precioIndividual });
  }
  const total = round2(lineas.reduce((s,l)=>s+l.precio,0));
  const costoTotal = round2(lineas.reduce((s,l)=>s+l.costo,0));
  return { lineas, total, costoTotal, nCombos: nPares };
}

function renderCart(){
  const wrap = document.getElementById('cart-lines');
  const banner = document.getElementById('combo-banner');
  const { lineas, total, nCombos } = calcularCarrito();

  banner.innerHTML = nCombos ? `<div class="combo-banner">🎉 ${nCombos} combo${nCombos>1?'s':''} aplicado${nCombos>1?'s':''} (burrito + bebida, ${Math.round(REGLAS_PRECIO.margenCombo*100)}% sobre el costo conjunto)</div>` : '';

  if (!cart.length){
    wrap.innerHTML = '<div class="cart-empty">Aún no agregas nada.</div>';
  } else {
    wrap.innerHTML = lineas.map(l => {
      const nombres = l.items.map(it => {
        let extra = '';
        const outs = it.removidos.map(id => escapeHtml(ingById(id)?.name || id)).join(', ');
        const ins = Object.entries(it.extras).filter(([,c])=>c>0).map(([id,c]) => `+${c} ${escapeHtml(ingById(id)?.name||id)}`).join(', ');
        if (outs) extra += `<div class="sub mod-out">sin: ${outs}</div>`;
        if (ins) extra += `<div class="sub mod-in">extra: ${ins}</div>`;
        return `<div style="margin-top:4px;"><strong>${escapeHtml(it.nombre)}</strong>${extra}</div>`;
      }).join('');
      return `<div class="cart-line">
        <div class="head"><span>${l.esCombo ? '🎁 Combo' : (l.items[0].tipo==='burrito'?'🌯 Burrito':'🥤 Bebida')}</span><span class="mono">${money(l.precio)}</span></div>
        ${nombres}
        <button class="del" onclick="quitarLinea('${l.items.map(i=>i.uid).join(',')}')">Quitar</button>
      </div>`;
    }).join('');
  }

  document.getElementById('cart-total-amt').textContent = money(total);
  document.getElementById('btn-enviar-pedido').disabled = cart.length === 0;
}

function quitarLinea(uids){
  const set = new Set(uids.split(','));
  cart = cart.filter(c => !set.has(c.uid));
  renderCart();
}

/* ---- enviar pedido a cocina ---- */
function siguienteNumeroPedido(){
  const ref = db.collection('meta').doc('contador');
  return db.runTransaction(tx => {
    return tx.get(ref).then(doc => {
      const actual = doc.exists ? (doc.data().valor || 0) : 0;
      const nuevo = actual + 1;
      tx.set(ref, { valor: nuevo }, { merge: true });
      return nuevo;
    });
  });
}

function enviarPedido(){
  if (!cart.length) return;
  const { lineas, total, costoTotal, nCombos } = calcularCarrito();

  // 1) validar stock suficiente
  const consumo = {}; // ingId -> porciones a descontar
  cart.forEach(item => {
    const mi = SEED_MENU.find(m => m.id === item.menuId);
    mi.ingredientes.forEach(li => {
      if (item.removidos.includes(li.ingredienteId)) return;
      consumo[li.ingredienteId] = (consumo[li.ingredienteId]||0) + li.cantidad;
    });
    Object.entries(item.extras).forEach(([ingId,c]) => {
      if (!c) return;
      consumo[ingId] = (consumo[ingId]||0) + c;
    });
  });

  const faltantes = Object.entries(consumo).filter(([ingId, cant]) => {
    const ing = ingById(ingId);
    return !ing || (ing.stockPorciones||0) < cant;
  });
  if (faltantes.length){
    const nombres = faltantes.map(([id]) => ingById(id)?.name || id).join(', ');
    toast('⚠ Stock insuficiente de: ' + nombres);
    return;
  }

  document.getElementById('btn-enviar-pedido').disabled = true;

  siguienteNumeroPedido().then(numero => {
    const batch = db.batch();
    Object.entries(consumo).forEach(([ingId, cant]) => {
      batch.update(db.collection('ingredients').doc(ingId), {
        stockPorciones: firebase.firestore.FieldValue.increment(-cant)
      });
    });
    const orderRef = db.collection('orders').doc();
    batch.set(orderRef, {
      numero,
      items: cart,
      lineas: lineas.map(l => ({ esCombo: l.esCombo, precio: l.precio, costo: l.costo, nombres: l.items.map(i=>i.nombre) })),
      total,
      costoTotal,
      nCombos,
      status: 'pendiente',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return batch.commit();
  }).then(() => {
    cart = [];
    renderCart();
    toast('Pedido enviado a cocina 🧾');
    document.querySelector('nav.tabs [data-tab="pedidos"]').click();
  }).catch(err => {
    toast('Error al enviar: ' + err.message);
  }).finally(() => {
    document.getElementById('btn-enviar-pedido').disabled = cart.length === 0;
  });
}

/* ================= PEDIDOS (COLA) ================= */
function renderPedidos(){
  const activos = ORDERS.filter(o => ['pendiente','preparando','listo'].includes(o.status));
  const badge = document.getElementById('badge-pedidos');
  badge.style.display = activos.length ? 'inline-block' : 'none';
  badge.textContent = activos.length;

  ['pendiente','preparando','listo'].forEach(status => {
    const col = document.getElementById('col-' + status);
    const lista = activos.filter(o => o.status === status).sort((a,b) => (a.numero||0) - (b.numero||0));
    if (!lista.length){ col.innerHTML = '<div class="empty-col">Nada aquí.</div>'; return; }
    col.innerHTML = lista.map(o => renderTicket(o)).join('');
  });
}

function renderTicket(o){
  const hora = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}) : '--:--';
  const itemsHtml = (o.items||[]).map(it => {
    const outs = (it.removidos||[]).map(id => ingById(id)?.name || id).join(', ');
    const ins = Object.entries(it.extras||{}).filter(([,c])=>c>0).map(([id,c])=>`+${c} ${ingById(id)?.name||id}`).join(', ');
    return `<li><strong>${escapeHtml(it.nombre)}</strong>
      ${outs?`<div class="mod-out">sin: ${escapeHtml(outs)}</div>`:''}
      ${ins?`<div class="mod-in">extra: ${escapeHtml(ins)}</div>`:''}
      </li>`;
  }).join('');

  let nextBtn = '';
  if (o.status === 'pendiente') nextBtn = `<button class="btn btn-primary btn-sm" onclick="avanzarPedido('${o.id}','preparando')">Empezar</button>`;
  if (o.status === 'preparando') nextBtn = `<button class="btn btn-primary btn-sm" onclick="avanzarPedido('${o.id}','listo')">Marcar listo</button>`;
  if (o.status === 'listo') nextBtn = `<button class="btn btn-green btn-sm" onclick="avanzarPedido('${o.id}','entregado')">Entregar</button>`;

  return `<div class="ticket">
    <span class="num">#${o.numero ?? '—'}</span><span class="time">${hora}</span>
    <ul>${itemsHtml}</ul>
    <div class="total">${money(o.total)}${o.nCombos?` · ${o.nCombos} combo${o.nCombos>1?'s':''}`:''}</div>
    <div class="actions">${nextBtn}<button class="btn btn-ghost btn-sm" onclick="cancelarPedido('${o.id}')">Cancelar</button></div>
  </div>`;
}

function avanzarPedido(id, status){
  db.collection('orders').doc(id).update({ status }).then(()=>toast('Actualizado'));
}

function cancelarPedido(id){
  const o = ORDERS.find(x => x.id === id);
  if (!o) return;
  if (!confirm('¿Cancelar este pedido y devolver el inventario?')) return;
  const consumo = {};
  (o.items||[]).forEach(item => {
    const mi = SEED_MENU.find(m => m.id === item.menuId);
    if (!mi) return;
    mi.ingredientes.forEach(li => {
      if ((item.removidos||[]).includes(li.ingredienteId)) return;
      consumo[li.ingredienteId] = (consumo[li.ingredienteId]||0) + li.cantidad;
    });
    Object.entries(item.extras||{}).forEach(([ingId,c]) => { if(c) consumo[ingId] = (consumo[ingId]||0) + c; });
  });
  const batch = db.batch();
  Object.entries(consumo).forEach(([ingId, cant]) => {
    batch.update(db.collection('ingredients').doc(ingId), { stockPorciones: firebase.firestore.FieldValue.increment(cant) });
  });
  batch.update(db.collection('orders').doc(id), { status: 'cancelado' });
  batch.commit().then(()=>toast('Pedido cancelado, inventario devuelto'));
}

/* ================= FINANZAS ================= */
function inRange(order){
  if (!order.createdAt || !order.createdAt.toDate) return finRange === 'todo';
  const d = order.createdAt.toDate();
  const now = new Date();
  if (finRange === 'hoy') return d.toDateString() === now.toDateString();
  if (finRange === '7') return (now - d) <= 7*24*3600*1000;
  if (finRange === '30') return (now - d) <= 30*24*3600*1000;
  return true;
}

// Renta aplicable al rango de fechas seleccionado, a partir de la renta
// mensual configurada (prorrateada por día, o por mes cuando el rango
// "todo" abarca varios meses con ventas).
function rentaAplicable(validas){
  const renta = CONFIG.rentaMensual || 0;
  if (finRange === 'hoy') return round2(renta / 30);
  if (finRange === '7') return round2(renta / 30 * 7);
  if (finRange === '30') return renta;
  const meses = new Set();
  validas.forEach(o => {
    if (o.createdAt && o.createdAt.toDate){
      const d = o.createdAt.toDate();
      meses.add(d.getFullYear() + '-' + d.getMonth());
    }
  });
  return round2(renta * Math.max(1, meses.size));
}

function renderFinanzas(){
  const validas = ORDERS.filter(o => o.status !== 'cancelado' && inRange(o));

  let totalVendido = 0, totalCosto = 0, nCombos = 0, nBurritoSolo = 0, nBebidaSolo = 0;
  const filas = [];

  validas.forEach(o => {
    (o.lineas||[]).forEach(l => {
      totalVendido += l.precio; totalCosto += l.costo;
      if (l.esCombo) nCombos++;
      else if (l.nombres[0] && SEED_MENU.find(m=>m.nombre===l.nombres[0])?.tipo === 'bebida') nBebidaSolo++;
      else nBurritoSolo++;
      filas.push({
        fecha: o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleDateString('es-MX') : '—',
        numero: o.numero,
        tipo: l.esCombo ? 'Combo' : l.nombres.join(' + '),
        costo: l.costo, precio: l.precio, ganancia: round2(l.precio - l.costo),
      });
    });
  });

  const ganancia = round2(totalVendido - totalCosto);
  const renta = rentaAplicable(validas);
  const utilidadNeta = round2(ganancia - renta);

  document.getElementById('kpi-grid').innerHTML = `
    <div class="kpi"><div class="lbl">Total vendido</div><div class="val">${money(totalVendido)}</div></div>
    <div class="kpi"><div class="lbl">Ganancia (venta − costo)</div><div class="val">${money(ganancia)}</div></div>
    <div class="kpi"><div class="lbl">Renta (prorrateada)</div><div class="val">${money(renta)}</div></div>
    <div class="kpi"><div class="lbl">Utilidad neta</div><div class="val">${money(utilidadNeta)}</div></div>
    <div class="kpi"><div class="lbl">Combos</div><div class="val">${nCombos}</div></div>
    <div class="kpi"><div class="lbl">Burritos solos</div><div class="val">${nBurritoSolo}</div></div>
    <div class="kpi"><div class="lbl">Bebidas solas</div><div class="val">${nBebidaSolo}</div></div>
  `;

  const rows = document.getElementById('fin-rows');
  if (!filas.length){ rows.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--tinta-suave);padding:18px;">Sin ventas en este rango.</td></tr>'; return; }
  rows.innerHTML = filas.slice().reverse().map(f => `
    <tr>
      <td>${f.fecha}</td>
      <td class="mono">#${f.numero ?? '—'}</td>
      <td>${escapeHtml(f.tipo)}</td>
      <td class="num mono">${money(f.costo)}</td>
      <td class="num mono">${money(f.precio)}</td>
      <td class="num mono">${money(f.ganancia)}</td>
    </tr>`).join('');
}

/* ================= ANALÍTICAS ================= */
const MESES_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function renderAnaliticas(){
  const cont = document.getElementById('analiticas-content');
  if (!cont) return;
  const validas = ORDERS.filter(o => o.status !== 'cancelado');
  if (!validas.length){ cont.innerHTML = '<div class="empty-col">Todavía no hay ventas para analizar.</div>'; return; }

  // porMes[mesKey] = { burritos: {menuId:{nombre,cant}}, bebidas: {menuId:{nombre,cant}} }
  const porMes = {};
  const totalBurritos = {}; // menuId -> {nombre, cant}
  const totalBebidas = {};

  validas.forEach(o => {
    if (!o.createdAt || !o.createdAt.toDate) return;
    const d = o.createdAt.toDate();
    const mesKey = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
    if (!porMes[mesKey]) porMes[mesKey] = { burritos: {}, bebidas: {}, fecha: d };
    (o.items||[]).forEach(item => {
      const bucketMes = item.tipo === 'burrito' ? porMes[mesKey].burritos : porMes[mesKey].bebidas;
      const bucketTotal = item.tipo === 'burrito' ? totalBurritos : totalBebidas;
      if (!bucketMes[item.menuId]) bucketMes[item.menuId] = { nombre: item.nombre, cant: 0 };
      bucketMes[item.menuId].cant++;
      if (!bucketTotal[item.menuId]) bucketTotal[item.menuId] = { nombre: item.nombre, cant: 0 };
      bucketTotal[item.menuId].cant++;
    });
  });

  function top(bucket){
    const arr = Object.values(bucket);
    if (!arr.length) return null;
    return arr.reduce((a,b) => b.cant > a.cant ? b : a);
  }

  const topBurritoTotal = top(totalBurritos);
  const topBebidaTotal = top(totalBebidas);

  const mesesOrdenados = Object.keys(porMes).sort().reverse();
  const filasMes = mesesOrdenados.map(key => {
    const [y, m] = key.split('-');
    const label = MESES_ES[parseInt(m,10)-1] + ' ' + y;
    const tb = top(porMes[key].burritos);
    const td = top(porMes[key].bebidas);
    return `<tr>
      <td>${escapeHtml(label)}</td>
      <td>${tb ? escapeHtml(tb.nombre) + ' <span class="mono" style="color:var(--tinta-suave)">('+tb.cant+')</span>' : '—'}</td>
      <td>${td ? escapeHtml(td.nombre) + ' <span class="mono" style="color:var(--tinta-suave)">('+td.cant+')</span>' : '—'}</td>
    </tr>`;
  }).join('');

  cont.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi"><div class="lbl">🌯 Platillo más vendido (histórico)</div><div class="val" style="font-size:16px;">${topBurritoTotal ? escapeHtml(topBurritoTotal.nombre) : '—'}</div></div>
      <div class="kpi"><div class="lbl">🥤 Bebida más vendida (histórico)</div><div class="val" style="font-size:16px;">${topBebidaTotal ? escapeHtml(topBebidaTotal.nombre) : '—'}</div></div>
    </div>
    <div class="card" style="overflow-x:auto;">
      <table class="fin-table">
        <thead><tr><th>Mes</th><th>🌯 Platillo más vendido</th><th>🥤 Bebida más vendida</th></tr></thead>
        <tbody>${filasMes}</tbody>
      </table>
    </div>
  `;
}

/* ================= FACTURA / TICKET ================= */
function populateFacturaSelect(){
  const select = document.getElementById('factura-pedido');
  if (!select) return;
  const valActual = select.value;
  const relevantes = ORDERS.filter(o => o.status !== 'cancelado').slice().sort((a,b) => (b.numero||0)-(a.numero||0));
  if (!relevantes.length){
    select.innerHTML = '<option value="">No hay pedidos todavía</option>';
    facturaPedidoId = null;
    return;
  }
  select.innerHTML = relevantes.map(o => {
    const hora = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'}) : '';
    return `<option value="${o.id}">#${o.numero ?? '—'} · ${hora} · ${money(o.total)}</option>`;
  }).join('');
  if (valActual && relevantes.some(o=>o.id===valActual)) select.value = valActual;
  else select.value = relevantes[0].id;
  facturaPedidoId = select.value;
}

function renderFactura(){
  const preview = document.getElementById('ticket-preview');
  if (!preview) return;
  const o = ORDERS.find(x => x.id === facturaPedidoId);
  if (!o){ preview.innerHTML = '<div class="cart-empty">Selecciona un pedido para generar el ticket.</div>'; return; }

  const fecha = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate().toLocaleString('es-MX',{dateStyle:'long',timeStyle:'short'}) : '—';
  const itemsHtml = (o.items||[]).map(it => {
    const outs = (it.removidos||[]).map(id => ingById(id)?.name || id).join(', ');
    const ins = Object.entries(it.extras||{}).filter(([,c])=>c>0).map(([id,c])=>`+${c} ${ingById(id)?.name||id}`).join(', ');
    return `<li><strong>${escapeHtml(it.nombre)}</strong>
      ${outs?`<div class="mod-out">sin: ${escapeHtml(outs)}</div>`:''}
      ${ins?`<div class="mod-in">extra: ${escapeHtml(ins)}</div>`:''}
      </li>`;
  }).join('');

  let clienteHtml = '';
  if (facturaModo === 'factura'){
    const nombre = document.getElementById('factura-cliente-nombre')?.value.trim() || '—';
    const rfc = document.getElementById('factura-cliente-rfc')?.value.trim() || '—';
    const uso = document.getElementById('factura-cliente-uso')?.value.trim() || '—';
    const metodo = document.getElementById('factura-cliente-metodo')?.value.trim() || '—';
    clienteHtml = `
      <div class="ticket-cliente">
        <div><strong>Receptor:</strong> ${escapeHtml(nombre)}</div>
        <div><strong>RFC:</strong> ${escapeHtml(rfc)}</div>
        <div><strong>Uso CFDI:</strong> ${escapeHtml(uso)}</div>
        <div><strong>Método de pago:</strong> ${escapeHtml(metodo)}</div>
      </div>`;
  }

  preview.innerHTML = `
    <div class="ticket-doc" id="ticket-preview-content">
      <div class="ticket-doc-head">
        <div class="ticket-doc-brand">🌯 Burritos Moni y Lilia</div>
        <div class="ticket-doc-tipo">${facturaModo === 'factura' ? 'FACTURA' : 'TICKET DE VENTA'}</div>
      </div>
      <div class="ticket-doc-meta">
        <span>Folio #${o.numero ?? '—'}</span>
        <span>${fecha}</span>
      </div>
      ${clienteHtml}
      <ul class="ticket-doc-items">${itemsHtml}</ul>
      <div class="ticket-doc-totales">
        <div><span>Costo interno</span><span class="mono">${money(o.costoTotal)}</span></div>
        <div class="total"><span>Total</span><span class="mono">${money(o.total)}</span></div>
      </div>
      <div class="ticket-doc-footer">¡Gracias por tu compra! 🌶️</div>
    </div>
  `;
}
