/**
 * GROPESTAMPADOS.UY — Public JS v2
 * Neuromarketing sort, real-time filter, card render, modal + WhatsApp
 */

const WHATSAPP = "59897116015";

const STATUS_PRIORITY = {
  "casa": 1, "pocas": 2, "disponible": 3,
  "encargue": 4, "sin-stock": 5, "no-disponible": 6,
};

const STATUS_CFG = {
  "casa":          { label: "🏠 Producto de la Casa", badge: "badge-casa",         card: "status-casa" },
  "pocas":         { label: "🟠 Pocas unidades",      badge: "badge-pocas",         card: "" },
  "disponible":    { label: "🟢 Disponible",          badge: "badge-disponible",    card: "" },
  "encargue":      { label: "🔵 Por encargue",        badge: "badge-encargue",      card: "" },
  "sin-stock":     { label: "🔴 Sin stock",           badge: "badge-sin-stock",     card: "status-sin-stock" },
  "no-disponible": { label: "⚫ No disponible",       badge: "badge-no-disponible", card: "status-no-disponible" },
};

// ── Demo products shown when API is empty ─────────────────
const DEMO_PRODUCTS = [
  {
    id:"d1", name:"Remera Oversize Anime Kuro",
    description:"Algodón pesado 100%. Estampado DTF ultra resistente. Corte streetwear. Ideal para fans del shonen.",
    price:990, stock:15, category:"Anime", status:"casa",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>🔥</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%23BFFF00' font-family='sans-serif' font-weight='bold'>ANIME OVERSIZE</text></svg>"
  },
  {
    id:"d2", name:"Hoodie Básico Streetwear",
    description:"Canguro de frisa invisible. Ajuste holgado, capucha doble. Tu logo / diseño bordado o en DTF.",
    price:1450, stock:20, category:"Canguros", status:"disponible",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>🦘</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%238A2BE2' font-family='sans-serif' font-weight='bold'>HOODIE STREETWEAR</text></svg>"
  },
  {
    id:"d3", name:"Remera Sublimada Minimalista",
    description:"Spun premium tacto algodón. Diseños aesthetic o geométricos incorporados en la tela.",
    price:650, stock:30, category:"Remeras", status:"disponible",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>👕</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%23FF00FF' font-family='sans-serif' font-weight='bold'>REMERA AESTHETIC</text></svg>"
  },
  {
    id:"d4", name:"Gorro Trucker Custom",
    description:"Visera curva, red plástica atrás. Estampa frontal. Ideal egresados, empresas o bandas.",
    price:450, stock:45, category:"Gorros", status:"disponible",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>🧢</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%2306b6d4' font-family='sans-serif' font-weight='bold'>TRUCKER CUSTOM</text></svg>"
  },
  {
    id:"d5", name:"Taza Mágica Anime/Juegos",
    description:"Taza negra que revela el diseño al verter líquido caliente. ¡Personalizable al 100%!",
    price:500, stock:5, category:"Tazas", status:"pocas",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>☕</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%23BFFF00' font-family='sans-serif' font-weight='bold'>TAZA MÁGICA</text></svg>"
  },
  {
    id:"d6", name:"Azulejo Sublimado 20x20",
    description:"Azulejo cerámico de alto brillo con soporte. Arte musical, portadas de discos o fotos.",
    price:350, stock:50, category:"Sublimados", status:"casa",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>🖼️</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%238A2BE2' font-family='sans-serif' font-weight='bold'>AZULEJO DECORATIVO</text></svg>"
  },
  {
    id:"d7", name:"Conjunto Urbano (Buzo + Remera)",
    description:"Pack Streetwear. Hacela como tú quieras. Descuento llevando ambas prendas.",
    price:2100, stock:0, originalPrice: 2440, category:"Streetwear", status:"encargue",
    image: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' style='background:%230f0f1a'><text x='50%' y='45%' text-anchor='middle' dominant-baseline='middle' font-size='72' font-family='sans-serif'>🛹</text><text x='50%' y='68%' text-anchor='middle' dominant-baseline='middle' font-size='14' fill='%23FF00FF' font-family='sans-serif' font-weight='bold'>PACK URBANO</text></svg>"
  }
];

// ── State ─────────────────────────────────────────────────
let allProducts = [];
let activeCategory = "todos";
let searchQuery = "";

// ── DOM ───────────────────────────────────────────────────
const grid     = () => document.getElementById("products-grid");
const loader   = () => document.getElementById("loader");
const empty    = () => document.getElementById("empty-state");

// ── Hamburger ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const ham = document.getElementById("hamburger");
  const menu = document.getElementById("mobile-menu");
  ham?.addEventListener("click", () => {
    ham.classList.toggle("open");
    menu.classList.toggle("open");
    ham.setAttribute("aria-expanded", menu.classList.contains("open"));
    menu.setAttribute("aria-hidden", !menu.classList.contains("open"));
  });
});

// ── Modal close ───────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("modal-overlay");
  document.getElementById("modal-close")?.addEventListener("click", closeModal);
  overlay?.addEventListener("click", e => { if(e.target === overlay) closeModal(); });
  document.addEventListener("keydown", e => { if(e.key === "Escape") closeModal(); });
});

function closeModal(){
  document.getElementById("modal-overlay")?.classList.remove("open");
  document.body.style.overflow = "";
}

// ── Category ─────────────────────────────────────────────
function setCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll("[data-category]").forEach(el =>
    el.classList.toggle("active", el.dataset.category === cat)
  );
  document.querySelectorAll("[data-mobile-category]").forEach(el =>
    el.classList.toggle("active", el.dataset.mobileCategory === cat)
  );
  renderProducts();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-category]").forEach(el =>
    el.addEventListener("click", () => setCategory(el.dataset.category))
  );
  document.querySelectorAll("[data-mobile-category]").forEach(el => {
    el.addEventListener("click", () => {
      setCategory(el.dataset.mobileCategory);
      document.getElementById("hamburger")?.classList.remove("open");
      document.getElementById("mobile-menu")?.classList.remove("open");
    });
  });
});

// ── Search ────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("search-input")?.addEventListener("input", e => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderProducts();
  });
});

// ── Sort (neuromarketing) ─────────────────────────────────
function sortProducts(arr){
  return [...arr].sort((a,b) => (STATUS_PRIORITY[a.status]??99) - (STATUS_PRIORITY[b.status]??99));
}

// ── Filter ────────────────────────────────────────────────
function filterProducts(arr){
  return arr.filter(p => {
    const matchCat = activeCategory === "todos" || p.category === activeCategory;
    const matchQ   = !searchQuery ||
      p.name?.toLowerCase().includes(searchQuery) ||
      (p.description||"").toLowerCase().includes(searchQuery);
    return matchCat && matchQ;
  });
}

// ── Render Cards ──────────────────────────────────────────
function renderProducts(){
  const g = grid();
  if(!g) return;

  const filtered = filterProducts(sortProducts(allProducts));
  g.innerHTML = "";

  if(filtered.length === 0){
    empty()?.classList.remove("hidden");
    return;
  }
  empty()?.classList.add("hidden");

  filtered.forEach((p, i) => {
    const cfg = STATUS_CFG[p.status] ?? STATUS_CFG["disponible"];
    const canBuy = p.status !== "no-disponible";
    const shortLabel = cfg.label.replace(/^\S+\s/, "");

    const card = document.createElement("article");
    card.className = `product-card anim-fade-up ${cfg.card}`;
    card.style.animationDelay = `${i * 0.04}s`;
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", `Ver ${p.name}`);
    card.addEventListener("click", () => openModal(p));
    card.addEventListener("keydown", e => { if(e.key === "Enter" || e.key === " ") openModal(p); });

    const imgContent = p.image
      ? `<img class="card-img" src="${p.image}" alt="${esc(p.name)}" loading="lazy">`
      : `<div class="card-img-placeholder">👕</div>`;

    const priceCurrent = p.price ? `$${Number(p.price).toLocaleString("es-UY")}` : "";
    const priceOriginal = p.originalPrice ? `$${Number(p.originalPrice).toLocaleString("es-UY")}` : "";
    
    // Si hay precio original, lo mostramos tachado arriba/al lado del precio actual
    let priceHTML = `<span></span>`;
    if (p.price) {
      if (p.originalPrice) {
        priceHTML = `
          <div class="flex flex-col">
            <span class="text-[10px] text-gray-500 line-through leading-none">${priceOriginal}</span>
            <span class="card-price text-mint">${priceCurrent}</span>
          </div>
        `;
      } else {
        priceHTML = `<span class="card-price">${priceCurrent}</span>`;
      }
    }

    const stockHTML = (p.stock !== undefined && p.stock !== null) ? `<span class="card-stock">${p.stock} u.</span>` : "";
    
    // Badge de oferta
    const discountBadge = (p.discount && p.discount > 0) 
      ? `<span class="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg z-10">-${p.discount}%</span>`
      : "";

    card.innerHTML = `
      <div class="card-img-wrap relative">
        ${imgContent}
        <span class="status-badge ${cfg.badge}">${shortLabel}</span>
        ${discountBadge}
      </div>
      <div class="card-body">
        <h3 class="card-name">${esc(p.name)}</h3>
        <p class="card-desc">${esc(p.description||"")}</p>
        <div class="card-footer">
          ${priceHTML}
          ${stockHTML}
        </div>
        ${canBuy ? `<button class="btn btn-mint btn-sm mt-3 w-full" style="border-radius:10px;font-size:12px;padding:8px 12px" onclick="event.stopPropagation()">Ver detalle</button>` : ""}
      </div>
    `;

    g.appendChild(card);
  });
}

// ── Modal ─────────────────────────────────────────────────
function openModal(p){
  const overlay  = document.getElementById("modal-overlay");
  const body     = document.getElementById("modal-body");
  if(!overlay || !body) return;

  const cfg    = STATUS_CFG[p.status] ?? STATUS_CFG["disponible"];
  const canBuy = p.status !== "no-disponible";
  const waMsg  = encodeURIComponent(`Hola! Vi el producto *${p.name}* en GROPESTAMPADOS.UY y quiero consultar precio 👕`);
  const waURL  = `https://wa.me/${WHATSAPP}?text=${waMsg}`;
  const shortLabel = cfg.label.replace(/^\S+\s/, "");

  const imgHTML = p.image
    ? `<img src="${p.image}" alt="${esc(p.name)}" style="width:100%;max-height:280px;object-fit:contain;border-radius:16px 16px 0 0;background:var(--bg-card)">`
    : `<div style="width:100%;height:200px;display:flex;align-items:center;justify-content:center;font-size:4rem;background:var(--bg-card);border-radius:16px 16px 0 0">👕</div>`;

  const discountBadge = (p.discount && p.discount > 0) 
    ? `<span style="position:absolute;top:12px;right:12px;background:var(--mint);padding:4px 8px;border-radius:6px;font-weight:bold;font-size:12px;color:#fff">-${p.discount}%</span>`
    : "";

  body.innerHTML = `
    <div style="position:relative">
      ${imgHTML}
      <span class="status-badge ${cfg.badge}" style="position:absolute;top:12px;left:12px">${shortLabel}</span>
      ${discountBadge}
    </div>
    <div style="padding:20px 20px 24px">
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:1.7rem;letter-spacing:0.03em;color:var(--text);line-height:1.1;margin-bottom:8px">${esc(p.name)}</h2>
      <p style="font-size:13px;color:var(--text-sec);line-height:1.7;margin-bottom:16px">${esc(p.description||"Sin descripción.")}</p>

      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:16px">
        ${p.price ? `<div>
          <p style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px">Precio</p>
          <div style="display:flex;align-items:center;gap:8px">
            <p style="font-family:'Bebas Neue',sans-serif;font-size:2rem;color:var(--text);line-height:1;letter-spacing:0.03em">$${Number(p.price).toLocaleString("es-UY")}</p>
            ${p.originalPrice ? `<p style="font-size:1rem;color:var(--text-dim);text-decoration:line-through">$${Number(p.originalPrice).toLocaleString("es-UY")}</p>` : ""}
          </div>
        </div>` : "<div></div>"}
        ${p.stock !== undefined && p.stock !== null ? `<div style="text-align:right">
          <p style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px">Stock</p>
          <p style="font-size:1.3rem;font-weight:800;color:var(--text)">${p.stock} u.</p>
        </div>` : ""}
      </div>

      ${p.category ? `<p style="font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:14px">Categoría: ${esc(p.category)}</p>` : ""}

      ${canBuy
        ? `<div style="display:flex;flex-direction:column;gap:10px;">
            <button onclick="window.__gropCurrentProduct=${JSON.stringify(JSON.stringify(p))};closeModal();setTimeout(()=>openCustomModal(JSON.parse(window.__gropCurrentProduct)),80)" style="width:100%;background:#BFFF00;color:#080810;font-weight:900;font-size:15px;border:none;border-radius:12px;padding:14px 18px;cursor:pointer;font-family:inherit;letter-spacing:0.03em;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 0 20px rgba(191,255,0,0.25);transition:transform 0.15s" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
              ✏️ Personalizar esta prenda
            </button>
            <a href="${waURL}" target="_blank" rel="noopener"><button class="btn btn-whatsapp" style="width:100%">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Consultar sin personalizar
            </button></a>
          </div>`
        : `<p style="text-align:center;color:var(--text-dim);font-size:13px;font-weight:700;padding:14px 0">Este producto no está disponible actualmente</p>`
      }
    </div>
  `;

  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}
window.openModal = openModal;

// ── Fetch products & Categories ───────────────────────────
async function loadProducts(){
  loader()?.classList.remove("hidden");
  empty()?.classList.add("hidden");

  try {
    const res = await fetch("/api/get-products");
    if(!res.ok) throw new Error();
    const data = await res.json();
    
    if (data && data.products) {
      allProducts = data.products || DEMO_PRODUCTS;
      if (data.categories && data.categories.length > 0) {
        renderDynamicCategories(data.categories);
      }
      // Siempre llamar a renderReviews para que la UI vacía se inicialice si hace falta
      renderReviews(data.reviews || []);
    } else {
      allProducts = Array.isArray(data) && data.length > 0 ? data : DEMO_PRODUCTS;
    }
  } catch(e) {
    // Fallback to demo products
    allProducts = DEMO_PRODUCTS;
  } finally {
    loader()?.classList.add("hidden");
    // Update hero stat
    const stat = document.getElementById("hero-stat-products");
    if(stat) stat.textContent = allProducts.length + "+";
    renderProducts();
  }
}

function renderDynamicCategories(cats) {
  const container = document.getElementById("catalog-filters");
  if (!container) return;
  
  // Guardamos el botón 'Todos'
  const btnTodos = `<button class="px-5 py-2 rounded-full border border-transparent bg-white/5 text-[#8b8ba8] text-sm font-semibold hover:bg-white/10 hover:text-white transition-all ${activeCategory === 'todos' ? 'active-filter' : ''}" data-category="todos">Todos</button>`;
  
  const catBtns = cats.map(c => 
    `<button class="px-5 py-2 rounded-full border border-transparent bg-white/5 text-[#8b8ba8] text-sm font-semibold hover:bg-white/10 hover:text-white transition-all ${activeCategory === c ? 'active-filter' : ''}" data-category="${esc(c)}">${esc(c)}</button>`
  ).join("");
  
  container.innerHTML = btnTodos + catBtns;
  
  // Re-attach events
  document.querySelectorAll("[data-category]").forEach(el =>
    el.addEventListener("click", () => setCategory(el.dataset.category))
  );
}

// ── Util ──────────────────────────────────────────────────
function esc(str){
  const el = document.createElement("div");
  el.textContent = str ?? "";
  return el.innerHTML;
}

// ── Init ─────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setCategory("todos");
  loadProducts();
});

// ── Render Reviews Carousel ───────────────────────────────
window.renderReviews = function(reviews) {
  const section = document.getElementById("reviews-section");
  const carousel = document.getElementById("reviews-carousel");
  if (!section || !carousel) return;

  const approvedReviews = reviews ? reviews.filter(r => r.status === "approved") : [];

  // Siempre mostramos la sección para que el botón "Dejanos tu reseña" sea accesible
  section.classList.remove("hidden");

  if (approvedReviews.length === 0) {
    carousel.innerHTML = `
      <div class="w-full py-12 flex flex-col items-center justify-center text-center px-4 opacity-70">
        <span class="text-4xl mb-4 opacity-50">✨</span>
        <h4 class="text-white font-bold mb-2">Aún no hay testimonios</h4>
        <p class="text-sm text-gray-400 max-w-sm">Sé la primera persona en dejarnos tu opinión sobre nuestros productos y probar el nuevo sistema.</p>
      </div>
    `;
    return;
  }

  carousel.innerHTML = approvedReviews.map((r, i) => {
    const stars = "⭐".repeat(r.stars || 5);
    const initial = r.name ? r.name.charAt(0).toUpperCase() : "U";
    return `
      <div class="snap-center shrink-0 w-[85vw] md:w-[400px] bg-[#111] border border-white/10 rounded-3xl p-8 flex flex-col gap-5 hover:border-mint/50 transition-colors shadow-xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-mint/5 rounded-full blur-[50px] pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-32 h-32 bg-purple/10 rounded-full blur-[50px] pointer-events-none"></div>
        
        <div class="flex items-center gap-4 z-10">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-mint via-mint-l to-purple flex items-center justify-center text-xl font-black text-[#080810] shadow-lg shrink-0">
            ${initial}
          </div>
          <div class="flex flex-col">
            <h4 class="font-bold text-white text-lg leading-tight">${esc(r.name)}</h4>
            <span class="text-[10px] text-mint drop-shadow-[0_0_5px_rgba(191, 255, 0,0.5)] tracking-[0.2em] mt-0.5">${stars}</span>
          </div>
        </div>
        
        <div class="relative z-10">
          <svg class="absolute -top-2 -left-3 w-8 h-8 text-white/5" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
          <p class="text-[15px] text-[#8b8ba8] italic leading-relaxed pl-6">
            "${esc(r.text)}"
          </p>
        </div>
      </div>
    `;
  }).join("");
};
// ── Public Review Submission ──────────────────────────────
// Usamos style.display porque el modal usa inline styles, no clases Tailwind
(function setupPublicReviews() {
  const btn     = document.getElementById("open-public-review-btn");
  const modal   = document.getElementById("public-review-modal");
  const closeX  = document.getElementById("close-public-review");
  const form    = document.getElementById("public-review-form");
  const success = document.getElementById("pr-success-msg");
  const submit  = document.getElementById("pr-submit-btn");

  if (!btn || !modal) { 
    console.warn("Review modal elements not found");
    return; 
  }

  function openModal() {
    modal.style.display = "flex";
    if (form) form.style.display = "";
    if (success) success.style.display = "none";
    if (form) form.reset();
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }

  btn.addEventListener("click", openModal);
  closeX?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  form?.addEventListener("submit", async function(e) {
    e.preventDefault();
    if (submit) { submit.disabled = true; submit.textContent = "Enviando..."; }

    const name  = document.getElementById("pr-name")?.value?.trim();
    const stars = parseInt(document.getElementById("pr-stars")?.value, 10);
    const text  = document.getElementById("pr-text")?.value?.trim();

    if (!name || !text) {
      if (submit) { submit.disabled = false; submit.textContent = "Enviar Reseña"; }
      return;
    }

    try {
      const res = await fetch("/api/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, stars, text })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Error ${res.status}: ${errText}`);
      }

      if (form) form.style.display = "none";
      if (success) success.style.display = "block";
    } catch(err) {
      console.error("Review submit error:", err);
      alert("Falla del servidor: " + err.message);
    } finally {
      if (submit) { submit.disabled = false; submit.textContent = "Enviar Reseña"; }
    }
  });
})();

