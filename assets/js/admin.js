/**
 * GROPESTAMPADOS.UY — Admin JS
 * Netlify Identity RBAC, Canvas WebP compression, CRUD, authenticated save
 */

// ─── Redirección instantánea si no hay sesión ─────────────
// Comprobación suave que no crashea en Safari privado.
;(function immediateAuthGuard() {
  try {
    const stored = localStorage.getItem('gotrue.user') ||
                   localStorage.getItem('gotrue-js.user') ||
                   sessionStorage.getItem('gotrue.user');
    const hasAnyGoTrueKey = Object.keys(localStorage).some(k => k.startsWith('gotrue'));
    if (!stored && !hasAnyGoTrueKey) {
      window.location.replace('/login.html');
    }
  } catch(e) {
    // Safari privado: no redirigir para no romper el flujo
  }
})();

const STATUS_OPTIONS = [
  { value: "pocas",         label: "🟠 Pocas Unidades" },
  { value: "disponible",    label: "🟢 Disponible" },
  { value: "encargue",      label: "🔵 Por Encargue" },
  { value: "sin-stock",     label: "🔴 Sin Stock" },
  { value: "no-disponible", label: "⚫ No Disponible" },
];

let products = [];
let categories = ["Remeras", "Canguros", "Gorros", "Sublimados", "Regalos", "Otro"];
let reviews = [];
let visualConfig = { mint: '#BFFF00', purp: '#8A2BE2', magenta: '#FF00FF', bg: '#080810', logoPrimary: 'grop', logoSubtext: 'Estampados' };

let authToken = "";
let editingId = null;
let compressedImageB64 = null;

const productsList = document.getElementById("products-list");
const addBtn       = document.getElementById("add-product-btn");
const productModal = document.getElementById("product-modal");
const modalTitle   = document.getElementById("modal-title");
const productForm  = document.getElementById("product-form");
const cancelBtn    = document.getElementById("cancel-btn");
const saveBtn      = document.getElementById("save-btn");
const toast        = document.getElementById("toast");
const imgInput     = document.getElementById("img-input");
const imgPreview   = document.getElementById("img-preview");
const imgUploadArea = document.getElementById("img-upload-area");

// Reviews Elements
let editingReviewId = null;
const reviewModal = document.getElementById("review-modal");
const reviewForm = document.getElementById("review-form");

// ─── Identity Check ───────────────────────────────────────
function initIdentity() {
  const netlifyIdentity = window.netlifyIdentity;
  if (!netlifyIdentity) {
    window.location.href = "/login.html";
    return;
  }

  const user = netlifyIdentity.currentUser();

  if (!user) {
    netlifyIdentity.on("init", (u) => checkUser(u));
    netlifyIdentity.init();
  } else {
    checkUser(user);
  }
}

function checkUser(user) {
  if (!user) {
    window.location.replace("/login.html");
    return;
  }

  // Usuario logueado → mostrar el panel
  // La seguridad la da "Invite Only" en Netlify Identity:
  // solo el admin puede tener cuenta, cualquier logueado = admin.
  document.body.style.display = '';
  authToken = user.token?.access_token || "";
  document.getElementById("admin-user-name").textContent = user.email || "Admin";
  loadProducts();
}

// ─── Productos iniciales (seeds) ─────────────────────────
// Son los mismos del catálogo público. Si Netlify Blobs está vacío,
// se guardan automáticamente en el primer acceso del admin.
const DEMO_PRODUCTS_SEED = [
  { id:"d1", name:"Remera Básica Unisex",       description:"100% algodón. Talle XS al 3XL. Estampado con tu logo o diseño. Disponible en todos los colores.",                                price:590,  stock:50,  category:"Remeras",    status:"casa",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>\u{1F455}</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%23049B7A' font-family='sans-serif' font-weight='bold'>REMERA B\u00c1SICA</text></svg>" },
  { id:"d2", name:"Canguro Personalizado",       description:"Algodón premium. Estampado en frente y espalda. Por mayor a partir de 6 unidades.",                                               price:960,  stock:20,  category:"Canguros",   status:"pocas",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>\u{1F998}</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%23f97316' font-family='sans-serif' font-weight='bold'>CANGURO CUSTOM</text></svg>" },
  { id:"d3", name:"Polo Manga Corta",            description:"Piqué 100% algodón. Talle XS al 3XL. Ideal para uniformes y empresas. Envío gratis.",                                              price:880,  stock:30,  category:"Remeras",    status:"disponible",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>\u{1F454}</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%2322c55e' font-family='sans-serif' font-weight='bold'>POLO PREMIUM</text></svg>" },
  { id:"d4", name:"Gorro Trucker Tu Logo",       description:"Frente rígido, malla trasera. Bordado o sublimado. Por mayor a partir de 10u.",                                                    price:450,  stock:45,  category:"Gorros",     status:"disponible",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>\u{1F9E2}</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%2306b6d4' font-family='sans-serif' font-weight='bold'>GORRO CUSTOM</text></svg>" },
  { id:"d5", name:"Taza Sublimada 300ml",        description:"Sublimación full wrap. Tu foto, diseño o logo. El regalo ideal para profesores y equipos.",                                         price:320,  stock:100, category:"Sublimados", status:"disponible",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>\u2615</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%23a78bfa' font-family='sans-serif' font-weight='bold'>TAZA SUBLIMADA</text></svg>" },
  { id:"d6", name:"Kit Regalo Profe",            description:"Taza + lapicera sublimada + caram año. Set listo para regalar. Caja incluida.",                                                   price:950,  stock:15,  category:"Regalos",    status:"casa",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>\u{1F381}</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%23049B7A' font-family='sans-serif' font-weight='bold'>KIT REGALO</text></svg>" },
  { id:"d7", name:"Caram\u00e1\u00f1o 650ml",             description:"Aluminio sublimado. Tu foto o dise\u00f1o en alta resoluci\u00f3n. Colores y personajes. Por mayor.",                                     price:480,  stock:0,   category:"Sublimados", status:"sin-stock",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>\u{1F964}</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%23ef4444' font-family='sans-serif' font-weight='bold'>CARAM\u00c1\u00d1O</text></svg>" },
  { id:"d8", name:"Remera DTF Full Print",       description:"Estampado DTF de alta definici\u00f3n. Colores vibrantes, lavado resistente. Ideal para dise\u00f1os complejos.",                        price:750,  stock:8,   category:"Remeras",    status:"pocas",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>\u{1F3A8}</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%23f97316' font-family='sans-serif' font-weight='bold'>DTF FULL PRINT</text></svg>" },
  { id:"d9", name:"Buzo Sublimado Full",         description:"Tela 100% poli\u00e9ster sublimable. Dise\u00f1o en todo el cuerpo. Por encargue, consultar plazos.",                                    price:1400, stock:0,   category:"Canguros",   status:"encargue",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>\u{1F9E5}</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%2306b6d4' font-family='sans-serif' font-weight='bold'>BUZO SUBLIMADO</text></svg>" },
  { id:"d10", name:"Delantal con Bolsillo",     description:"Sublimado full color. Reglamentario. Ideal para profesionales y regalos corporativos.",                                            price:600,  stock:25,  category:"Regalos",    status:"disponible",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>\u{1F373}</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%2322c55e' font-family='sans-serif' font-weight='bold'>DELANTAL</text></svg>" },
];

// ─── Load Products ────────────────────────────────────────
async function loadProducts() {
  showLoading(true);
  let data = null;

  // BLOQUE 1: Solo red. Si esto falla es un error real de conexión.
  try {
    const res = await fetch("/api/get-products");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (e) {
    console.error('loadProducts [network] error:', e);
    showToast("⚠️ No se pudo conectar. Reintentá en unos segundos.", "error");
    if (products.length === 0) {
      products = DEMO_PRODUCTS_SEED;
      try { renderCategories(); renderList(); renderReviews(); } catch(_) {}
    }
    showLoading(false);
    return;
  }

  // BLOQUE 2: Procesar datos y actualizar UI. Errores aquí NO son de conexión.
  try {
    if (data && data.products) {
      products   = data.products || [];
      categories = data.categories || categories;
      reviews    = data.reviews || [];

      if (data.visual_config && Object.keys(data.visual_config).length > 0) {
        const { favicon: _dbFav, ...cleanVC } = data.visual_config;
        visualConfig = { ...visualConfig, ...cleanVC };
      }

      const savedFavicon = localStorage.getItem('grop_favicon');
      if (savedFavicon) {
        visualConfig.favicon = savedFavicon;
        try { setFavicon(savedFavicon); } catch(_) {}
      }

      const { favicon: _lsFav, logoImage: _lsLogo, ...cleanForLS } = visualConfig;
      try { localStorage.setItem('grop_visual', JSON.stringify(cleanForLS)); } catch(_) {}

      try { syncVisualUI(); } catch(uiErr) {
        console.warn('syncVisualUI error (non-critical):', uiErr);
      }
    } else if (Array.isArray(data) && data.length > 0) {
      products = data;
    } else {
      products = DEMO_PRODUCTS_SEED;
      showToast("\uD83D\uDCE6 Cargando catálogo inicial...");
      try { await saveProducts(true); } catch(_) {}
    }

    renderCategories();
    renderList();
    renderReviews();
  } catch (e) {
    console.error('loadProducts [UI] error:', e);
    // Intentar renderizar igualmente lo que tengamos
    try { renderCategories(); renderList(); renderReviews(); } catch(_) {}
  } finally {
    showLoading(false);
  }
}

// ─── Save Products ────────────────────────────────────────
async function saveProducts(silent = false) {
  const user = window.netlifyIdentity?.currentUser();
  if (user) {
    authToken = user.token?.access_token || authToken;
  }

  if (!silent) showLoading(true);
  try {
    // Excluir favicon del payload: es un base64 pesado que no
    // necesita ir a la DB (el navegador ya lo cachea en localStorage).
    const { favicon: _f, ...visualConfigLight } = visualConfig;
    
    const payload = {
      products: products,
      categories: categories,
      reviews: reviews,
      visual_config: visualConfigLight
    };
    
    const payloadStr = JSON.stringify(payload);
    const sizeMB = (new Blob([payloadStr]).size / (1024 * 1024)).toFixed(2);
    
    if (sizeMB > 5.5) {
      if(!silent) showLoading(false);
      showToast(`⚠️ Demasiado peso (${sizeMB}MB). Achica fotos o elimina productos obsoletos.`, "error");
      return;
    }
    
    const res = await fetch("/api/save-products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
      body: payloadStr,
    });

    if (!res.ok) throw new Error("Save failed");
    if (!silent) showToast("\u2705 Guardado correctamente");
  } catch (e) {
    if (!silent) showToast("\u274C Error al guardar", "error");
  } finally {
    if (!silent) showLoading(false);
  }
}

// ─── Render Categories ────────────────────────────────────
function renderCategories() {
  const catSel = document.getElementById("pcat");
  if (catSel) {
    catSel.innerHTML = `<option value="">Sin categoría</option>` +
      categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  }

  const catList = document.getElementById("categories-list");
  if (catList) {
    catList.innerHTML = categories.map((c, i) => `
      <div class="flex items-center justify-between p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl">
        <span class="text-sm font-semibold">${escapeHtml(c)}</span>
        <button class="text-red-400 hover:text-red-300 transition-colors p-1" onclick="deleteCategory(${i})">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    `).join("") || '<p class="text-xs text-gray-500">No hay categorías</p>';
  }
}

window.deleteCategory = async function(index) {
  if(confirm("¿Seguro que querés eliminar esta categoría? (Los productos seguirán existiendo)")) {
    categories.splice(index, 1);
    renderCategories();
    await saveProducts();
  }
};


// ─── Render Product List (Cards instead of rows) ──────────────
function renderList() {
  if (!productsList) return;

  // Stats update
  document.getElementById("stat-total").textContent = products.length;
  document.getElementById("stat-disponible").textContent = products.filter(p => !["sin-stock", "no-disponible"].includes(p.status)).length;
  document.getElementById("stat-pocas").textContent = products.filter(p => p.status === "pocas").length;
  document.getElementById("stat-stock").textContent = products.filter(p => p.status === "sin-stock" || p.stock === 0).length;

  if (products.length === 0) {
    productsList.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-[#2a2a2a] rounded-3xl bg-[#0d0d0d]">
        <div class="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-500 mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
        </div>
        <p class="text-xl font-bold text-gray-300">Inventario Vacío</p>
        <p class="text-[13px] text-gray-500 mt-1 max-w-xs">Agregá tu primer producto para empezar a vender.</p>
      </div>`;
    return;
  }

  productsList.innerHTML = products.map((p, idx) => {
    const statusLabel = STATUS_OPTIONS.find(s => s.value === p.status)?.label ?? p.status;
    const imgHTML = p.image
      ? `<img src="${p.image}" class="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover bg-[#050505] border border-[#1a1a1a] shadow-inner shrink-0" alt="">`
      : `<div class="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-3xl bg-[#111] border border-[#1a1a1a] shrink-0">👕</div>`;

    return `
    <div class="bg-[#111] rounded-3xl p-4 md:p-5 flex flex-col gap-4 border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all shadow-xl relative overflow-hidden group">
      <!-- Info Header -->
      <div class="flex gap-4 items-center">
        ${imgHTML}
        <div class="flex-1 min-w-0">
          <h3 class="font-black text-base md:text-lg text-white truncate leading-tight mb-1">${escapeHtml(p.name)}</h3>
          <span class="inline-block px-2 py-0.5 bg-[#1a1a1a] text-gray-400 text-[10px] font-bold tracking-widest uppercase rounded-md mb-2">${escapeHtml(p.category || "Sin categoría")}</span>
          <p class="text-[11px] font-semibold text-gray-400 truncate">${statusLabel}</p>
        </div>
        <!-- Acciones flotantes PC -->
        <div class="hidden md:flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300" onclick="editProduct(${idx})" title="Editar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
          </button>
          <button class="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center text-red-500" onclick="deleteProduct(${idx})" title="Eliminar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>

      <hr class="border-[#1a1a1a]">

      <!-- Counters -->
      <div class="grid grid-cols-2 gap-3 md:gap-4 mt-auto">
        <!-- Stock -->
        <div class="bg-[#080808] rounded-2xl p-3 border border-[#1a1a1a] flex flex-col justify-between">
          <span class="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-2 text-center">Unidades</span>
          <div class="flex justify-between items-center px-1">
            <button class="w-7 h-7 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg text-white font-bold text-lg flex items-center justify-center leading-none" onclick="adjustField(${idx}, 'stock', -1)">−</button>
            <span class="text-lg md:text-xl font-black text-white w-8 text-center">${p.stock ?? 0}</span>
            <button class="w-7 h-7 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg text-white font-bold text-lg flex items-center justify-center leading-none" onclick="adjustField(${idx}, 'stock', 1)">+</button>
          </div>
        </div>

        <!-- Precio -->
        <div class="bg-[#080808] rounded-2xl p-3 border border-[#1a1a1a] flex flex-col justify-between relative overflow-hidden">
          ${p.discount && p.discount > 0 ? `<div class="absolute -right-3 -top-3 w-10 h-10 bg-orange-500/20 rounded-full blur-md"></div>` : ""}
          <span class="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-2 text-center">Precio Uy</span>
          <div class="flex justify-between items-center px-1">
            <button class="w-7 h-7 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg text-white font-bold text-lg flex items-center justify-center leading-none" onclick="adjustField(${idx}, 'price', -50)">−</button>
            <span class="text-sm md:text-base font-black ${p.discount > 0 ? 'text-orange-400' : 'text-mint'} w-14 text-center leading-none">$${Number(p.price || 0).toLocaleString("es-UY")}</span>
            <button class="w-7 h-7 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg text-white font-bold text-lg flex items-center justify-center leading-none" onclick="adjustField(${idx}, 'price', 50)">+</button>
          </div>
        </div>
      </div>

      <!-- Acciones Móvil -->
      <div class="flex md:hidden gap-2 mt-1">
        <button class="flex-1 bg-white/5 py-2.5 rounded-xl text-xs font-bold text-gray-300" onclick="editProduct(${idx})">Editar</button>
        <button class="bg-red-500/10 px-4 rounded-xl text-xs font-bold text-red-500" onclick="deleteProduct(${idx})">Borrar</button>
      </div>
    </div>`;
  }).join("");
}

// ─── Counter Adjusters ────────────────────────────────────
window.adjustField = async function(idx, field, delta) {
  const current = Number(products[idx][field] || 0);
  const min = field === "stock" ? 0 : 0;
  products[idx][field] = Math.max(min, current + delta);
  renderList();
  await saveProducts();
};

// ─── Delete ───────────────────────────────────────────────
window.deleteProduct = async function(idx) {
  const name = products[idx].name;
  if (!confirm(`¿Borrar "${name}" permanentemente?`)) return;
  products.splice(idx, 1);
  renderList();
  await saveProducts();
};

// ─── Edit ─────────────────────────────────────────────────
window.editProduct = function(idx) {
  editingId = idx;
  const p = products[idx];
  populateForm(p);
  openProductModal("Editar Producto");
};

// ─── Add Product ──────────────────────────────────────────
addBtn?.addEventListener("click", () => {
  editingId = null;
  compressedImageB64 = null;
  productForm?.reset();
  if (imgPreview) imgPreview.innerHTML = "";
  openProductModal("Agregar Producto");
});

// ─── Modal Open/Close ─────────────────────────────────────
function openProductModal(title) {
  if (modalTitle) modalTitle.textContent = title;
  productModal?.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeProductModal() {
  productModal?.classList.add("hidden");
  document.body.style.overflow = "";
  editingId = null;
  compressedImageB64 = null;
}

cancelBtn?.addEventListener("click", closeProductModal);
productModal?.addEventListener("click", (e) => {
  if (e.target === productModal) closeProductModal();
});

// ─── Populate Form ────────────────────────────────────────
function populateForm(p) {
  document.getElementById("pname").value = p.name || "";
  document.getElementById("pdesc").value = p.description || "";
  document.getElementById("pprice").value = p.price || "";
  document.getElementById("pdiscount").value = p.discount || "";
  document.getElementById("pstock").value = p.stock ?? "";
  document.getElementById("pcat").value = p.category || "";
  document.getElementById("pstatus").value = p.status || "disponible";

  compressedImageB64 = p.image || null;
  if (imgPreview) {
    imgPreview.innerHTML = p.image
      ? `<img src="${p.image}" class="image-preview" alt="Preview">`
      : "";
  }
}

// ─── Form Submit ──────────────────────────────────────────
productForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const price = Number(document.getElementById("pprice").value) || 0;
  const discount = Number(document.getElementById("pdiscount").value) || 0;
  let originalPrice = null;
  
  if (discount > 0 && discount < 100) {
    // Si el precio es con descuento, calculamos el precio original para tacharlo.
    // Ej: si vale $80 y tiene 20% descuento -> original = 80 / (1 - 0.20) = 100
    originalPrice = Math.round(price / (1 - (discount / 100)));
  }

  const product = {
    id: editingId !== null ? (products[editingId].id || Date.now().toString()) : Date.now().toString(),
    name: document.getElementById("pname").value.trim(),
    description: document.getElementById("pdesc").value.trim(),
    price: price,
    discount: discount,
    originalPrice: originalPrice,
    stock: Number(document.getElementById("pstock").value) ?? 0,
    category: document.getElementById("pcat").value.trim(),
    status: document.getElementById("pstatus").value,
    image: compressedImageB64 || null,
    updatedAt: new Date().toISOString(),
  };

  if (!product.name) {
    showToast("⚠️ El nombre es obligatorio", "error");
    return;
  }

  if (editingId !== null) {
    products[editingId] = product;
  } else {
    products.push(product);
  }

  closeProductModal();
  renderList();
  await saveProducts();
});

// ─── Image Upload + Canvas Compression ───────────────────
imgUploadArea?.addEventListener("click", () => imgInput?.click());

imgInput?.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  compressImageToWebP(file);
});

// Drag & drop
imgUploadArea?.addEventListener("dragover", (e) => {
  e.preventDefault();
  imgUploadArea.style.borderColor = "var(--brand-mint)";
});

imgUploadArea?.addEventListener("dragleave", () => {
  imgUploadArea.style.borderColor = "";
});

imgUploadArea?.addEventListener("drop", (e) => {
  e.preventDefault();
  imgUploadArea.style.borderColor = "";
  const file = e.dataTransfer.files?.[0];
  if (file && file.type.startsWith("image/")) compressImageToWebP(file);
});

function compressImageToWebP(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 600;
      let { width, height } = img;
      const ratio = Math.min(MAX / width, MAX / height, 1);
      width  = Math.round(width  * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const webpB64 = canvas.toDataURL("image/webp", 0.65);
      compressedImageB64 = webpB64;

      if (imgPreview) {
        imgPreview.innerHTML = `<img src="${webpB64}" class="image-preview" alt="Preview">`;
      }

      // Show file size
      const sizeKB = Math.round((webpB64.length * 3 / 4) / 1024);
      showToast(`Imagen comprimida: ${width}×${height}px · ~${sizeKB}KB`);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

// ─── Logout ───────────────────────────────────────────────
document.getElementById("logout-btn")?.addEventListener("click", () => {
  window.netlifyIdentity?.logout();
  window.location.href = "/login.html";
});

// ─── Toast ────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  const msgEl = document.getElementById("toast-msg");
  const iconEl = document.getElementById("toast-icon");
  if (!toast || !msgEl || !iconEl) return;

  msgEl.textContent = msg;
  iconEl.innerHTML = type === "error" ? "❌" : "✨";
  
  if (type === "error") {
    toast.style.borderColor = "rgba(239,68,68,0.3)";
    toast.style.color = "#ef4444";
  } else {
    toast.style.borderColor = "rgba(191, 255, 0,0.3)";
    toast.style.color = "#BFFF00";
  }

  // Anim in
  toast.classList.remove("opacity-0", "-translate-y-4", "md:translate-y-4");
  
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { 
    toast.classList.add("opacity-0", "-translate-y-4", "md:translate-y-4"); 
  }, 2000);
}

// ─── Loading ──────────────────────────────────────────────
function showLoading(show) {
  const el = document.getElementById("admin-loader");
  el?.classList.toggle("hidden", !show);
}

// ─── Helpers ──────────────────────────────────────────────
function escapeHtml(str) {
  const el = document.createElement("div");
  el.textContent = str ?? "";
  return el.innerHTML;
}

// ─── Init & UI Logic ──────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Populate status select
  const statusSel = document.getElementById("pstatus");
  if (statusSel) {
    statusSel.innerHTML = STATUS_OPTIONS.map(s =>
      `<option value="${s.value}">${s.label}</option>`
    ).join("");
  }

  // Tabs Logic
  const allTabs = document.querySelectorAll("[data-target]");
  const contents = document.querySelectorAll(".tab-content");
  
  allTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.target;
      
      // Update UI tabs
      allTabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(`[data-target="${targetId}"]`).forEach(t => t.classList.add("active"));
      
      // Update content
      contents.forEach(c => {
        c.classList.remove("block", "animate-fade-in");
        c.classList.add("hidden");
      });
      
      const target = document.getElementById(targetId);
      if (target) {
        target.classList.remove("hidden");
        target.classList.add("block", "animate-fade-in");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

  // Category Add
  const addCatBtn = document.getElementById("add-cat-btn");
  const newCatInput = document.getElementById("new-cat-input");
  
  if (addCatBtn && newCatInput) {
    addCatBtn.addEventListener("click", async () => {
      const val = newCatInput.value.trim();
      if (!val) return;
      
      if (categories.includes(val)) {
        showToast("Esa categoría ya existe", "error");
        return;
      }
      
      categories.push(val);
      newCatInput.value = "";
      renderCategories();
      await saveProducts();
    });
  }

  // Calculator Logic
  const calcCost = document.getElementById("calc-cost");
  const calcMargin = document.getElementById("calc-margin");
  const calcPrice = document.getElementById("calc-price");
  const calcProfit = document.getElementById("calc-profit");

  function calculate() {
    const cost = parseFloat(calcCost.value) || 0;
    const marginPct = parseFloat(calcMargin.value) || 0;
    
    if (cost > 0) {
      // Precio = Costo / (1 - Margen) es el margen real sobre vta.
      // O Precio = Costo * (1 + Margen) es markup. 
      // Por simplicidad usaremos Markup (más común en el rubro).
      const price = Math.ceil(cost * (1 + (marginPct / 100)));
      const profit = price - cost;
      
      calcPrice.textContent = `$${price.toLocaleString("es-UY")}`;
      calcProfit.textContent = `$${profit.toLocaleString("es-UY")}`;
    } else {
      calcPrice.textContent = `$0`;
      calcProfit.textContent = `$0`;
    }
  }

  calcCost?.addEventListener("input", calculate);
  calcMargin?.addEventListener("input", calculate);

  // ─── Eventos de Reseñas / Testimonios (Event Delegation) ───
  document.addEventListener("click", (e) => {
    // Abrir modal de añadir reseña
    if (e.target.closest("#add-review-btn")) {
      editingReviewId = null;
      document.getElementById("review-modal-title").textContent = "Agregar Reseña";
      if(reviewForm) reviewForm.reset();
      if(reviewModal) reviewModal.classList.remove("hidden");
    }

    // Cerrar modal
    if (e.target.closest("#cancel-review-btn")) {
      if(reviewModal) reviewModal.classList.add("hidden");
      if(reviewForm) reviewForm.reset();
    }
  });

  if(reviewForm) {
    reviewForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const rName = document.getElementById("rname").value.trim();
      const rStars = parseInt(document.getElementById("rstars").value, 10);
      const rText = document.getElementById("rtext").value.trim();

      if(!rName || !rText) return;

      const newRev = {
        id: editingReviewId || "rev_" + Date.now(),
        name: rName,
        stars: rStars,
        text: rText,
        date: new Date().toISOString(),
        status: "approved" // Admin created reviews are auto-approved
      };

      if (editingReviewId) {
        reviews = reviews.map(r => r.id === editingReviewId ? newRev : r);
        showToast("Reseña actualizada");
      } else {
        reviews.unshift(newRev); // latest first
        showToast("Reseña agregada");
      }

      if(reviewModal) reviewModal.classList.add("hidden");
      renderReviews();
      await saveProducts(); // Guarda todo en blobs
    });
  }

  initIdentity();
  initVisualLivePreview();
});

// ─── Visual Settings Logic ─────────────────────────────────
const BLOCK_DEFS = {
  hero: { icon: '🦸', label: 'Títulos y Portada' },
  servicios: { icon: '🛠️', label: 'Servicios' },
  proceso: { icon: '⚙️', label: 'Pasos de Trabajo' },
  catalog: { icon: '🛍️', label: 'Tienda de Productos' },
  reviews: { icon: '⭐', label: 'Testimonios' },
  image_banner: { icon: '🖼️', label: 'Banner Ancho (Imagen)' },
  rich_text: { icon: '📝', label: 'Párrafo o Título Libre' }
};

let currentEditingSectionIndex = -1;

function syncVisualUI() {
  // Logo image only
  if (visualConfig.logoImage) {
    const pi = document.getElementById('logo-img-preview-img');
    const pw = document.getElementById('logo-img-preview');
    const ph = document.getElementById('logo-img-placeholder');
    const cb = document.getElementById('logo-img-clear');
    if (pi)  pi.src = visualConfig.logoImage;
    if (pw)  pw.classList.remove('hidden');
    if (ph)  ph.classList.add('hidden');
    if (cb)  cb.classList.remove('hidden');
  }

  // Colors
  const defaultColors = { mint: '#BFFF00', purp: '#8A2BE2', magenta: '#FF00FF', bg: '#080810' };
  const bc = (id, hex) => {
    let c = hex || defaultColors[id];
    // Auto-reparación si se guardaron en negro por el bug anterior
    if (c === '#000000' && id !== 'bg') c = defaultColors[id];
    if (c === '#000000' && id === 'bg' && visualConfig.mint === '#000000') c = defaultColors[id];

    setVal('v-color-' + id, c);
    const pe = document.getElementById('v-preview-' + id);
    if (pe) pe.style.background = c;
    const he = document.getElementById('v-hex-' + id);
    if (he) he.textContent = c.toUpperCase();
  };
  bc('mint',    visualConfig.mint);
  bc('purp',    visualConfig.purp);
  bc('magenta', visualConfig.magenta);
  bc('bg',      visualConfig.bg);

  // WhatsApp & Footer
  setVal('v-whatsapp', visualConfig.whatsapp || '59897116015');
  setVal('v-footer-copyright', (visualConfig.footer || {}).copyright || '');

  // Theme
  setVal('v-active-theme', visualConfig.activeTheme || 'none');
  updateThemeIconPreview(visualConfig.activeTheme || 'none');

  // Builder
  initBuilderData();
  renderPageBuilder();
  updateVisualPreviewDOM();
  
  // Favicon Sync
  if (visualConfig.favicon) {
    const pFav = document.getElementById('fav-img-preview-img');
    const vw = document.getElementById('fav-img-preview');
    const vh = document.getElementById('fav-img-placeholder');
    const vc = document.getElementById('fav-img-clear');
    if(pFav) pFav.src = visualConfig.favicon;
    if(vw) vw.classList.remove('hidden');
    if(vh) vh.classList.add('hidden');
    if(vc) vc.classList.remove('hidden');
    setFavicon(visualConfig.favicon);
  }
}

function setFavicon(url) {
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.href = url;
}

function initBuilderData() {
  // Resetear si no existe O si llegó como array vacío (ej: DB guardó [])
  const needsReset = !visualConfig.sections ||
                     !Array.isArray(visualConfig.sections) ||
                     visualConfig.sections.length === 0;

  if (needsReset) {
    visualConfig.sections = [
      { type: 'hero',      id: 'sec_default_1', config: visualConfig.hero      || {}, visible: visualConfig.sectionVisible?.hero      !== false },
      { type: 'servicios', id: 'sec_default_2', config: visualConfig.servicios  || {}, visible: visualConfig.sectionVisible?.servicios  !== false },
      { type: 'proceso',   id: 'sec_default_3', config: visualConfig.proceso    || {}, visible: visualConfig.sectionVisible?.proceso    !== false },
      { type: 'catalog',   id: 'sec_default_4', config: {},                            visible: visualConfig.sectionVisible?.catalog    !== false },
      { type: 'reviews',   id: 'sec_default_5', config: {},                            visible: visualConfig.sectionVisible?.reviews    !== false },
    ];
    if (Array.isArray(visualConfig.sectionOrder) && visualConfig.sectionOrder.length > 0) {
      visualConfig.sections.sort((a, b) => {
        const ai = visualConfig.sectionOrder.indexOf(a.type);
        const bi = visualConfig.sectionOrder.indexOf(b.type);
        return (ai !== -1 ? ai : 99) - (bi !== -1 ? bi : 99);
      });
    }
  }
}


function renderPageBuilder() {
  const c = document.getElementById('builder-list');
  if (!c) return;
  
  if(visualConfig.sections.length === 0) {
      c.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">No hay secciones. Añadí una para comenzar.</p>';
      return;
  }

  c.innerHTML = visualConfig.sections.map((sec, i) => {
    const def = BLOCK_DEFS[sec.type] || { icon: '📄', label: 'Desconocido' };
    const isV = sec.visible !== false;
    return `
    <div class="flex flex-col gap-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-3 transition-all ${isV ? '' : 'opacity-50 grayscale'}">
      <div class="flex items-center gap-3">
        <span class="text-xl w-8 text-center shrink-0 cursor-move text-gray-600 hover:text-white" title="Arrastrar no disp. Usar flechas">⣿</span>
        <span class="text-xl shrink-0">${def.icon}</span>
        <span class="text-sm font-bold text-white flex-1 truncate">${def.label}</span>
        
        <div class="flex items-center gap-1 shrink-0">
          <button onclick="moveBuilderSec(${i},-1)" ${i===0?'disabled':''} class="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${i===0?'opacity-20 cursor-not-allowed':'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}">↑</button>
          <button onclick="moveBuilderSec(${i},1)"  ${i===visualConfig.sections.length-1?'disabled':''} class="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${i===visualConfig.sections.length-1?'opacity-20 cursor-not-allowed':'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'}">↓</button>
          <button onclick="toggleBuilderSec(${i})" class="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${isV?'bg-mint/10 text-mint':'bg-white/5 text-gray-600'} hover:scale-110" title="${isV?'Ocultar':'Mostrar'}">
            ${isV?'👁️':'🙈'}
          </button>
          <button onclick="deleteBuilderSec(${i})" class="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20" title="Eliminar">🗑️</button>
          <button onclick="editBuilderSec(${i})" class="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" title="Editar Contenido">✍️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

window.moveBuilderSec = function(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= visualConfig.sections.length) return;
  const temp = visualConfig.sections[i];
  visualConfig.sections[i] = visualConfig.sections[j];
  visualConfig.sections[j] = temp;
  renderPageBuilder();
};

window.toggleBuilderSec = function(i) {
  visualConfig.sections[i].visible = !(visualConfig.sections[i].visible !== false);
  renderPageBuilder();
};

window.deleteBuilderSec = function(i) {
  if(confirm('¿Seguro que deseas eliminar este bloque?')) {
    visualConfig.sections.splice(i, 1);
    renderPageBuilder();
  }
};

window.editBuilderSec = function(i) {
  currentEditingSectionIndex = i;
  const sec = visualConfig.sections[i];
  const def = BLOCK_DEFS[sec.type];
  document.getElementById('editor-modal-title').innerHTML = `${def.icon} ${def.label}`;
  
  const body = document.getElementById('editor-modal-body');
  body.innerHTML = '';
  
  const c = sec.config || {};
  
  if (sec.type === 'hero') {
    body.innerHTML = `
      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-[10px] uppercase font-bold text-gray-500 mb-2">Título Principal</label>
          <textarea id="b-hero-title" class="admin-input !bg-[#050505] resize-none" rows="2">${c.title||''}</textarea>
        </div>
        <div>
          <label class="block text-[10px] uppercase font-bold text-gray-500 mb-2">Subtítulo</label>
          <textarea id="b-hero-sub" class="admin-input !bg-[#050505] resize-none" rows="3">${c.subtitle||''}</textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[10px] uppercase font-bold text-gray-500 mb-2">Botón Principal (CTA 1)</label>
            <input type="text" id="b-hero-cta1" class="admin-input !bg-[#050505]" value="${c.cta1Text||''}">
          </div>
          <div>
            <label class="block text-[10px] uppercase font-bold text-gray-500 mb-2">Botón Secundario (CTA 2)</label>
            <input type="text" id="b-hero-cta2" class="admin-input !bg-[#050505]" value="${c.cta2Text||''}">
          </div>
        </div>
        <label class="flex items-center gap-2 mt-2 cursor-pointer">
          <input type="checkbox" id="b-hero-hidecta2" ${c.hideCta2?'checked':''} class="w-4 h-4 rounded bg-[#222] border-[#333] text-mint focus:ring-mint">
          <span class="text-sm text-gray-400">Ocultar Botón Secundario</span>
        </label>
      </div>
    `;
  } else if (sec.type === 'servicios') {
    body.innerHTML = `
      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-[10px] uppercase font-bold text-gray-500 mb-2">Título de Sección</label>
          <input type="text" id="b-svc-title" class="admin-input !bg-[#050505]" value="${c.title||''}">
        </div>
        <div id="b-svc-items" class="flex flex-col gap-3"></div>
      </div>
    `;
    const itemsContainer = document.getElementById('b-svc-items');
    const items = c.items && c.items.length ? c.items : [
      {icon: '🖨️', title: 'Servicio 1', desc: 'Descripción'},
      {icon: '☕', title: 'Servicio 2', desc: 'Descripción'}
    ];
    items.forEach((it, idx) => {
        itemsContainer.innerHTML += `
        <div class="bg-[#050505] border border-[#1a1a1a] rounded-xl p-3 flex flex-col gap-2 b-svc-item">
            <div class="flex gap-2">
                <input type="text" class="admin-input !bg-[#111] !py-2 text-xl text-center w-16 svc-i-icon" placeholder="Ícono" value="${it.icon||''}">
                <input type="text" class="admin-input !bg-[#111] !py-2 flex-1 text-sm svc-i-title" placeholder="Título" value="${it.title||''}">
            </div>
            <textarea class="admin-input !bg-[#111] resize-none text-xs svc-i-desc" rows="2" placeholder="Descripción">${it.desc||''}</textarea>
        </div>`;
    });
  } else if (sec.type === 'proceso') {
      body.innerHTML = `
      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-[10px] uppercase font-bold text-gray-500 mb-2">Título de Sección</label>
          <input type="text" id="b-proc-title" class="admin-input !bg-[#050505]" value="${c.title||''}">
        </div>
        <div id="b-proc-steps" class="flex flex-col gap-3"></div>
      </div>
    `;
    const itemsContainer = document.getElementById('b-proc-steps');
    const steps = c.steps && c.steps.length ? c.steps : [
      {title: 'Paso 1', desc: 'Desc'}
    ];
    steps.forEach((it, idx) => {
        itemsContainer.innerHTML += `
        <div class="bg-[#050505] border border-[#1a1a1a] rounded-xl p-3 flex flex-col gap-2 b-proc-step">
            <input type="text" class="admin-input !bg-[#111] !py-2 flex-1 text-sm proc-i-title" placeholder="Título" value="${it.title||''}">
            <textarea class="admin-input !bg-[#111] resize-none text-xs proc-i-desc" rows="2" placeholder="Descripción">${it.desc||''}</textarea>
        </div>`;
    });
  } else if (sec.type === 'image_banner') {
     body.innerHTML = `
      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-[10px] uppercase font-bold text-gray-500 mb-2">URL de la Imagen (Resolución 1920x800 recomendada)</label>
          <input type="text" id="b-img-url" class="admin-input !bg-[#050505]" placeholder="https://..." value="${c.imageUrl||''}">
        </div>
        <div>
          <label class="block text-[10px] uppercase font-bold text-gray-500 mb-2">Enlace de destino al hacer click (Opcional)</label>
          <input type="text" id="b-img-link" class="admin-input !bg-[#050505]" placeholder="https://..." value="${c.link||''}">
        </div>
      </div>
    `;
  } else if (sec.type === 'rich_text') {
     body.innerHTML = `
      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-[10px] uppercase font-bold text-gray-500 mb-2">Título Principal</label>
          <input type="text" id="b-rt-title" class="admin-input !bg-[#050505]" placeholder="Escribe un título..." value="${c.title||''}">
        </div>
        <div>
          <label class="block text-[10px] uppercase font-bold text-gray-500 mb-2">Contenido</label>
          <textarea id="b-rt-content" class="admin-input !bg-[#050505] min-h-[150px] resize-y" placeholder="Puedes escribir párrafos aquí...">${c.content||''}</textarea>
        </div>
      </div>
    `;
  } else {
     body.innerHTML = `<p class="text-xs text-gray-500 text-center py-10">Este bloque funciona de forma automática y no requiere configuración manual desde aquí.</p>`;
  }
  
  document.getElementById('section-editor-modal').classList.remove('hidden');
};

document.getElementById('save-section-editor').addEventListener('click', () => {
    if(currentEditingSectionIndex === -1) return;
    const sec = visualConfig.sections[currentEditingSectionIndex];
    if(!sec.config) sec.config = {};
    const c = sec.config;
    
    if (sec.type === 'hero') {
        c.title = document.getElementById('b-hero-title').value;
        c.subtitle = document.getElementById('b-hero-sub').value;
        c.cta1Text = document.getElementById('b-hero-cta1').value;
        c.cta2Text = document.getElementById('b-hero-cta2').value;
        c.hideCta2 = document.getElementById('b-hero-hidecta2').checked;
    } else if (sec.type === 'servicios') {
        c.title = document.getElementById('b-svc-title').value;
        const domItems = document.querySelectorAll('.b-svc-item');
        c.items = Array.from(domItems).map(el => ({
            icon: el.querySelector('.svc-i-icon').value,
            title: el.querySelector('.svc-i-title').value,
            desc: el.querySelector('.svc-i-desc').value
        }));
    } else if (sec.type === 'proceso') {
        c.title = document.getElementById('b-proc-title').value;
        const domItems = document.querySelectorAll('.b-proc-step');
        c.steps = Array.from(domItems).map(el => ({
            title: el.querySelector('.proc-i-title').value,
            desc: el.querySelector('.proc-i-desc').value
        }));
    } else if (sec.type === 'image_banner') {
        c.imageUrl = document.getElementById('b-img-url').value;
        c.link = document.getElementById('b-img-link').value;
    } else if (sec.type === 'rich_text') {
        c.title = document.getElementById('b-rt-title').value;
        c.content = document.getElementById('b-rt-content').value;
    }
    
    document.getElementById('section-editor-modal').classList.add('hidden');
    renderPageBuilder();
});

// Create Block Logic
const addSecBtn = document.getElementById('add-section-btn');
if(addSecBtn) {
    addSecBtn.addEventListener('click', () => {
        document.getElementById('section-picker-modal').classList.remove('hidden');
    });
}

const closeSecPicker = document.getElementById('close-section-picker');
if(closeSecPicker) {
    closeSecPicker.addEventListener('click', () => {
        document.getElementById('section-picker-modal').classList.add('hidden');
    });
}

const closeSecEditor = document.getElementById('close-section-editor');
if(closeSecEditor) {
    closeSecEditor.addEventListener('click', () => {
        document.getElementById('section-editor-modal').classList.add('hidden');
    });
}

document.querySelectorAll('.add-type-btn').forEach(btn => {
   btn.addEventListener('click', () => {
       const type = btn.dataset.type;
       visualConfig.sections.push({
           type: type,
           id: 'sec_' + Math.random().toString(36).substr(2, 9),
           config: {},
           visible: true
       });
       document.getElementById('section-picker-modal').classList.add('hidden');
       renderPageBuilder();
   });
});

function updateVisualPreviewDOM() {
  const m   = visualConfig.mint    || '#BFFF00';
  const p   = visualConfig.purp    || '#8A2BE2';
  const mag = visualConfig.magenta || '#FF00FF';
  const bg  = visualConfig.bg      || '#080810';

  // Logo preview
  const pImg  = document.getElementById('preview-logo-img');
  
  if (visualConfig.logoImage) {
    if (pImg)  { pImg.src = visualConfig.logoImage; pImg.classList.remove('hidden'); }
  } else {
    if (pImg)    pImg.classList.add('hidden');
  }

  const pc = document.getElementById('preview-container');
  if (pc) pc.style.background = bg;

  const root = document.documentElement.style;
  root.setProperty('--c-mint',    m);
  root.setProperty('--c-mint-l',  m + 'cc');
  root.setProperty('--c-purp',    p);
  root.setProperty('--c-magenta', mag);
  root.setProperty('--c-bg',      bg);
}

function collectVisualConfigFromUI() {
  visualConfig.mint    = document.getElementById('v-color-mint')?.value    || visualConfig.mint;
  visualConfig.purp    = document.getElementById('v-color-purp')?.value    || visualConfig.purp;
  visualConfig.magenta = document.getElementById('v-color-magenta')?.value || visualConfig.magenta;
  visualConfig.bg      = document.getElementById('v-color-bg')?.value      || visualConfig.bg;

  visualConfig.footer = { copyright: document.getElementById('v-footer-copyright')?.value || '' };
  visualConfig.whatsapp = document.getElementById('v-whatsapp')?.value || visualConfig.whatsapp;
  visualConfig.activeTheme = document.getElementById('v-active-theme')?.value || 'none';
}

function updateThemeIconPreview(theme) {
  const iconMap = {
    'none': '✨',
    'halloween': '🎃',
    'xmas': '🎄',
    'valentines': '💖'
  };
  const iconEl = document.getElementById('v-theme-icon');
  if(iconEl) iconEl.textContent = iconMap[theme] || '✨';
}

function compressFaviconImage(file) {
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const MAX = 64;
      const canvas = document.createElement('canvas');
      canvas.width = MAX; canvas.height = MAX;
      const ctx = canvas.getContext('2d');
      const minDim = Math.min(img.width, img.height);
      const sx = (img.width - minDim) / 2;
      const sy = (img.height - minDim) / 2;
      ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, MAX, MAX);
      const b64 = canvas.toDataURL('image/png');
      // Guardar solo en localStorage y en memoria, NO en DB (demasiado pesado)
      visualConfig.favicon = b64;
      localStorage.setItem('grop_favicon', b64);
      const pFav = document.getElementById('fav-img-preview-img');
      const vw = document.getElementById('fav-img-preview');
      const vh = document.getElementById('fav-img-placeholder');
      const vc = document.getElementById('fav-img-clear');
      if (pFav) pFav.src = b64; if (vw) vw.classList.remove('hidden');
      if (vh) vh.classList.add('hidden'); if (vc) vc.classList.remove('hidden');
      setFavicon(b64);
      showToast('✅ Favicon actualizado y guardado localmente');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function compressLogoImage(file) {
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const MAX = 600;
      let { width, height } = img;
      const ratio = Math.min(MAX / width, MAX / height, 1);
      width = Math.round(width * ratio); height = Math.round(height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const b64 = canvas.toDataURL('image/webp', 0.65);
      visualConfig.logoImage = b64;
      const pi = document.getElementById('logo-img-preview-img');
      const pw = document.getElementById('logo-img-preview');
      const ph = document.getElementById('logo-img-placeholder');
      const cb = document.getElementById('logo-img-clear');
      if (pi) pi.src = b64; if (pw) pw.classList.remove('hidden');
      if (ph) ph.classList.add('hidden'); if (cb) cb.classList.remove('hidden');
      updateVisualPreviewDOM();
      showToast(`Logo: ${width}×${height}px`);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function initVisualLivePreview() {
  // Sub-tabs
  document.querySelectorAll('.visual-subtab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.visual-subtab').forEach(t => {
        t.style.background = ''; t.style.color = ''; t.style.borderColor = '';
        t.classList.add('border-[#2a2a2a]', 'bg-[#111]', 'text-gray-400');
      });
      tab.classList.remove('border-[#2a2a2a]', 'bg-[#111]', 'text-gray-400');
      tab.style.background = 'rgba(191,255,0,0.1)';
      tab.style.color = '#BFFF00';
      tab.style.borderColor = 'rgba(191,255,0,0.3)';
      document.querySelectorAll('.vtab-content').forEach(c => c.classList.add('hidden'));
      document.getElementById(tab.dataset.vtab)?.classList.remove('hidden');
    });
  });

  // Favicon binding
  const fa = document.getElementById('favicon-upload-area');
  const fi = document.getElementById('fav-img-input');
  const fc = document.getElementById('fav-img-clear');
  fa?.addEventListener('click',    () => fi?.click());
  fa?.addEventListener('dragover', e => { e.preventDefault(); fa.style.borderColor = '#BFFF00'; });
  fa?.addEventListener('dragleave', () => { fa.style.borderColor = ''; });
  fa?.addEventListener('drop', e => { e.preventDefault(); fa.style.borderColor = ''; const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith('image/') || f?.name.endsWith('.ico')) compressFaviconImage(f); });
  fi?.addEventListener('change', e => { const f = e.target.files?.[0]; if (f) compressFaviconImage(f); });
  fc?.addEventListener('click', () => {
    visualConfig.favicon = null;
    const fw = document.getElementById('fav-img-preview');
    const fh = document.getElementById('fav-img-placeholder');
    if (fw) fw.classList.add('hidden'); if (fh) fh.classList.remove('hidden');
    fc.classList.add('hidden'); if (fi) fi.value = '';
    setFavicon('/favicon.ico');
  });

  // Logo image upload
  const la = document.getElementById('logo-upload-area');
  const li = document.getElementById('logo-img-input');
  const lc = document.getElementById('logo-img-clear');
  la?.addEventListener('click',    () => li?.click());
  la?.addEventListener('dragover', e => { e.preventDefault(); la.style.borderColor = '#BFFF00'; });
  la?.addEventListener('dragleave', () => { la.style.borderColor = ''; });
  la?.addEventListener('drop', e => { e.preventDefault(); la.style.borderColor = ''; const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith('image/')) compressLogoImage(f); });
  li?.addEventListener('change', e => { const f = e.target.files?.[0]; if (f) compressLogoImage(f); });
  lc?.addEventListener('click', () => {
    visualConfig.logoImage = null;
    const pw = document.getElementById('logo-img-preview');
    const ph = document.getElementById('logo-img-placeholder');
    if (pw) pw.classList.add('hidden'); if (ph) ph.classList.remove('hidden');
    lc.classList.add('hidden'); if (li) li.value = '';
    updateVisualPreviewDOM();
  });

  // Colors live
  ['mint','purp','magenta','bg'].forEach(id => {
    document.getElementById('v-color-' + id)?.addEventListener('input', e => {
      visualConfig[id] = e.target.value;
      syncVisualUI();
    });
  });

  // Theme Live
  document.getElementById('v-active-theme')?.addEventListener('change', e => {
    visualConfig.activeTheme = e.target.value;
    updateThemeIconPreview(e.target.value);
  });

  // Save
  document.getElementById('save-visual-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('save-visual-btn');
    collectVisualConfigFromUI();
    btn.disabled = true; btn.innerHTML = 'Guardando...';
    localStorage.setItem('grop_visual', JSON.stringify(visualConfig));
    await saveProducts();
    showToast('✨ Sitio actualizado');
    btn.disabled = false;
    btn.innerHTML = `<svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Aplicar y Guardar Todo`;
  });
}


// ─── Render Reviews ────────────────────────────────────────
window.renderReviews = function() {
  const reviewsList = document.getElementById("reviews-list");
  if (!reviewsList) return;

  if (reviews.length === 0) {
    reviewsList.innerHTML = `<div class="col-span-full py-12 text-center text-gray-500 text-sm border-2 border-dashed border-[#1a1a1a] rounded-xl flex flex-col items-center justify-center">
      <span class="text-4xl mb-4 opacity-50">✨</span>
      Aún no agregaste reseñas.
    </div>`;
    return;
  }

  const pendingReviews = reviews.filter(r => r.status === "pending");
  const approvedReviews = reviews.filter(r => r.status === "approved");

  let html = "";

  // Sección: Pendientes de Aprobación
  if (pendingReviews.length > 0) {
    html += `<div class="col-span-full mb-2 border-b border-[#2a2a2a] pb-2"><h3 class="text-xl font-bold text-yellow-500">⏳ Pendientes de Aprobación</h3><p class="text-xs text-gray-500">Estas reseñas fueron enviadas por clientes y esperan tu revisión.</p></div>`;
    
    html += pendingReviews.map(r => {
      const starString = "⭐".repeat(r.stars) || "⭐";
      return `
        <div class="bg-yellow-500/5 border border-yellow-500/30 rounded-2xl p-5 flex flex-col gap-3 relative transition-colors shadow-lg">
          <div class="flex justify-between items-start">
            <div class="flex flex-col gap-1">
              <h3 class="font-bold text-lg text-white leading-none">${window.escapeHtml(r.name)}</h3>
              <p class="text-[10px] text-yellow-500">${starString}</p>
            </div>
          </div>
          <p class="text-sm text-gray-300 italic line-clamp-4 my-1">"${window.escapeHtml(r.text)}"</p>
          
          <div class="flex gap-2 relative z-10 pt-3 mt-1 border-t border-white/5 justify-end">
            <button onclick="deleteReview('${r.id}')" class="text-red-500 font-bold opacity-80 hover:opacity-100 transition-opacity px-4 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-xs flex-1">
              Rechazar / Eliminar
            </button>
            <button onclick="toggleReviewStatus('${r.id}')" class="text-mint font-bold opacity-80 hover:opacity-100 transition-opacity px-4 py-2 bg-mint/10 hover:bg-mint/20 rounded-xl flex gap-1 items-center justify-center text-xs flex-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg> Aprobar
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  // Separador si hay de ambas
  if (pendingReviews.length > 0 && approvedReviews.length > 0) {
    html += `<div class="col-span-full h-8"></div>`;
  }

  // Sección: Ya Publicadas
  html += `<div class="col-span-full mb-2 border-b border-[#2a2a2a] pb-2"><h3 class="text-xl font-bold text-mint">✅ Visibles en la Web</h3><p class="text-xs text-gray-500">Reseñas que todo el público puede ver.</p></div>`;
  
  if (approvedReviews.length === 0) {
    html += `<div class="col-span-full py-8 text-center text-gray-500 text-sm border-2 border-dashed border-[#1a1a1a] rounded-xl flex flex-col items-center justify-center">Aún no hay reseñas aprobadas.</div>`;
  } else {
    html += approvedReviews.map(r => {
      const starString = "⭐".repeat(r.stars) || "⭐";
      return `
        <div class="bg-[#111] border border-[#2a2a2a] rounded-2xl p-5 flex flex-col gap-3 relative transition-colors shadow-lg opacity-80 hover:opacity-100">
          <div class="flex justify-between items-start">
            <div class="flex flex-col gap-1">
              <h3 class="font-bold text-lg text-gray-300 leading-none">${window.escapeHtml(r.name)}</h3>
              <p class="text-[10px] text-yellow-500/70">${starString}</p>
            </div>
          </div>
          <p class="text-sm text-gray-500 italic line-clamp-3 my-1">"${window.escapeHtml(r.text)}"</p>
          
          <div class="flex gap-2 relative z-10 pt-3 mt-1 border-t border-white/5 justify-between">
            <button onclick="toggleReviewStatus('${r.id}')" class="text-yellow-500 opacity-60 hover:opacity-100 transition-opacity p-2 hover:bg-white/5 rounded-lg text-xs font-bold" title="Ocultar (volver a pendiente)">
              Ocultar
            </button>
            <div class="flex gap-1">
              <button onclick="editReview('${r.id}')" class="text-blue-400 opacity-60 hover:opacity-100 transition-opacity p-2 hover:bg-white/5 rounded-lg">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </button>
              <button onclick="deleteReview('${r.id}')" class="text-red-500 opacity-60 hover:opacity-100 transition-opacity p-2 hover:bg-white/5 rounded-lg">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  reviewsList.innerHTML = html;
};

window.editReview = function(id) {
  const rev = reviews.find(r => r.id === id);
  if(!rev) return;
  
  editingReviewId = id;
  document.getElementById("review-modal-title").textContent = "Editar Reseña";
  
  document.getElementById("rname").value = rev.name;
  document.getElementById("rstars").value = rev.stars;
  document.getElementById("rtext").value = rev.text;
  
  document.getElementById("review-modal").classList.remove("hidden");
};

window.deleteReview = async function(id) {
  if (confirm("¿Estás seguro de que deseas eliminar esta reseña?")) {
    reviews = reviews.filter(r => r.id !== id);
    renderReviews();
    await saveProducts();
    showToast("Reseña eliminada", "error");
  }
};

window.toggleReviewStatus = async function(id) {
  const rev = reviews.find(r => r.id === id);
  if(!rev) return;
  
  if (rev.status === "pending") {
    rev.status = "approved";
    showToast("Reseña Aprobada ✅");
  } else {
    rev.status = "pending";
    showToast("Reseña Ocultada (Pendiente)", "error");
  }
  
  renderReviews();
  await saveProducts();
};

// ════════════════════════════════════════════════════════════
// CALCULADORA PRO — IVA, Flete, Margen, Precio Final
// ════════════════════════════════════════════════════════════
(function initCalcPro() {
  const ids = ['tc-base','tc-flete','tc-iva','tc-margin','tc-extra','tc-units'];
  
  function fmtUYU(n) {
    return '$' + Math.round(n).toLocaleString('es-UY');
  }
  
  function calcPro() {
    const base   = parseFloat(document.getElementById('tc-base')?.value)   || 0;
    const flete  = parseFloat(document.getElementById('tc-flete')?.value)  || 0;
    const ivaPct = parseFloat(document.getElementById('tc-iva')?.value)    ?? 22;
    const margin = parseFloat(document.getElementById('tc-margin')?.value) ?? 40;
    const extra  = parseFloat(document.getElementById('tc-extra')?.value)  || 0;
    const units  = Math.max(1, parseInt(document.getElementById('tc-units')?.value) || 1);

    // Prorrateo por unidad
    const fleteUnit  = flete / units;
    const extraUnit  = extra / units;
    const costoUnit  = base + fleteUnit + extraUnit;

    // IVA sobre el costo total
    const ivaMonto   = costoUnit * (ivaPct / 100);
    const costoConIva = costoUnit + ivaMonto;

    // Precio de venta con markup sobre el costo con IVA
    const precioFinal = costoConIva * (1 + margin / 100);
    const ganancia    = precioFinal - costoConIva;

    // Actualizar IVA label dinámico
    const ivaRow = document.querySelector('#tc-r-iva')?.closest('div');
    if (ivaRow) {
      const label = ivaRow.querySelector('span:first-child');
      if (label) label.textContent = `+ IVA (${ivaPct}%)`;
    }

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('tc-r-base',      fmtUYU(base));
    set('tc-r-flete',     fmtUYU(fleteUnit));
    set('tc-r-extra',     fmtUYU(extraUnit));
    set('tc-r-costounit', fmtUYU(costoUnit));
    set('tc-r-iva',       fmtUYU(ivaMonto));
    set('tc-r-costoiva',  fmtUYU(costoConIva));
    set('tc-r-profit',    fmtUYU(ganancia));
    set('tc-r-final',     fmtUYU(precioFinal));
  }

  // Bind events una vez que el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    ids.forEach(id => {
      document.getElementById(id)?.addEventListener('input', calcPro);
    });
    calcPro(); // Calcular con valores por defecto
  });
})();

// ════════════════════════════════════════════════════════════
// CONVERSOR DE DIVISAS — Tiempo Real
// API: Open Exchange Rates (free, no key required para 1 base)
// Fallback: exchangerate.host
// ════════════════════════════════════════════════════════════
;(function initConverter() {
  let rates = {};         // { USD: 1, UYU: 39.5, EUR: 0.92, ... }
  let baseRates = {};     // rates en UYU como base
  let lastFetch = 0;

  const CURRENCIES = ['UYU','USD','EUR','BRL','JPY','GBP','ARS'];

  async function fetchRates() {
    try {
      // Usamos ExchangeRate-API open endpoint (sin limite ni key)
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      rates = { USD: 1, ...data.rates };
      
      // Convertir todo a base UYU
      const usdToUyu = rates['UYU'] || 39.5;
      baseRates['USD'] = usdToUyu;
      baseRates['UYU'] = 1;
      baseRates['EUR'] = usdToUyu / (rates['EUR'] || 0.92);
      baseRates['BRL'] = usdToUyu / (rates['BRL'] || 5.1);
      baseRates['JPY'] = usdToUyu / (rates['JPY'] || 151);
      baseRates['GBP'] = usdToUyu / (rates['GBP'] || 0.79);
      baseRates['ARS'] = usdToUyu / (rates['ARS'] || 1000);

      lastFetch = Date.now();
      const now = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
      const el = document.getElementById('conv-last-update');
      if (el) el.textContent = `Actualizado a las ${now}`;

      const statusEl = document.getElementById('conv-status');
      if (statusEl) {
        statusEl.className = 'text-[10px] px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full font-bold uppercase tracking-wider';
        statusEl.textContent = '⬤ En Vivo';
      }

      convertAll();
    } catch (e) {
      const statusEl = document.getElementById('conv-status');
      if (statusEl) {
        statusEl.className = 'text-[10px] px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full font-bold uppercase tracking-wider';
        statusEl.textContent = '⬤ Offline';
      }
      // Fallback con tasas aproximadas
      baseRates = { UYU: 1, USD: 39.5, EUR: 43, BRL: 7.8, JPY: 0.27, GBP: 50, ARS: 0.042 };
      const el = document.getElementById('conv-last-update');
      if (el) el.textContent = 'Datos aproximados (sin conexión a API)';
      convertAll();
    }
  }

  function convertAll() {
    if (!Object.keys(baseRates).length) return;
    const amount = parseFloat(document.getElementById('conv-amount')?.value) || 0;
    const from   = document.getElementById('conv-from')?.value || 'USD';

    // Convertir amount de la moneda origen a UYU primero
    const amountInUYU = amount * (baseRates[from] || 1);

    CURRENCIES.forEach(currency => {
      const el = document.getElementById(`conv-${currency}`);
      if (!el) return;

      if (currency === from) {
        el.textContent = currency === 'JPY' || currency === 'ARS'
          ? amount.toLocaleString('es-UY', { maximumFractionDigits: 0 })
          : amount.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        el.style.opacity = '0.4';
        return;
      }

      el.style.opacity = '1';
      const converted = amountInUYU / (baseRates[currency] || 1);

      // Formatear según moneda
      let formatted;
      if (currency === 'JPY') {
        formatted = '¥' + Math.round(converted).toLocaleString('es-UY');
      } else if (currency === 'ARS') {
        formatted = '$' + Math.round(converted).toLocaleString('es-UY');
      } else if (currency === 'UYU') {
        formatted = '$' + converted.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } else {
        const symbols = { USD: 'US$', EUR: '€', BRL: 'R$', GBP: '£' };
        formatted = (symbols[currency] || '') + converted.toLocaleString('es-UY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      el.textContent = formatted;
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('conv-amount')?.addEventListener('input', convertAll);
    document.getElementById('conv-from')?.addEventListener('change', convertAll);

    // Fetch inmediato
    fetchRates();

    // Actualizar rates cada 5 minutos
    setInterval(fetchRates, 5 * 60 * 1000);
  });
})();

