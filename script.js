// HEADER SHADOW
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
  header.style.boxShadow = window.scrollY > 10 ? "0 8px 25px rgba(0,0,0,.1)" : "none";
});

// =====================
//  CARRITO + VENDIDOS
// =====================

const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const clearCartBtn = document.getElementById('clear-cart');
const checkoutWhatsAppBtn = document.getElementById('checkout-whatsapp');

const LS_CART_KEY = 'monigochops_cart_v1';
const LS_SOLD_KEY = 'monigochops_sold_v1';

let cart = [];
let soldIds = new Set();

function loadState() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(LS_CART_KEY) || '[]');
    if (Array.isArray(savedCart)) cart = savedCart;

    const savedSold = JSON.parse(localStorage.getItem(LS_SOLD_KEY) || '[]');
    if (Array.isArray(savedSold)) soldIds = new Set(savedSold);
  } catch (_) {
    cart = [];
    soldIds = new Set();
  }
}

function saveState() {
  localStorage.setItem(LS_CART_KEY, JSON.stringify(cart));
  localStorage.setItem(LS_SOLD_KEY, JSON.stringify(Array.from(soldIds)));
}

function getCardId(card) {
  const title = (card.querySelector('h3')?.textContent || '').trim();
  const price = String(card.dataset.price || '');
  const imgSrc = card.querySelector('img')?.getAttribute('src') || '';
  return `${title}__${price}__${imgSrc}`; // id estable sin tocar HTML
}

function applySoldToCard(card) {
  if (!card) return;

  const id = getCardId(card);
  const btn = card.querySelector('.add-cart');

  if (soldIds.has(id)) {
    card.classList.add('sold');

    if (!card.querySelector('.sold-badge')) {
      const badge = document.createElement('div');
      badge.className = 'sold-badge';
      badge.textContent = 'VENDIDO';
      card.appendChild(badge);
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'VENDIDO';
    }
  } else {
    card.classList.remove('sold');
    const badge = card.querySelector('.sold-badge');
    if (badge) badge.remove();
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Añadir al carrito';
    }
  }
}

function applySoldToAllCards() {
  document.querySelectorAll('.product-card').forEach(applySoldToCard);
}

function updateCart() {
  cartItemsEl.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.title} - €${item.price}`;
    cartItemsEl.appendChild(li);
    total += item.price;
  });

  cartTotalEl.textContent = total;
  saveState();
}

// Añadir productos
const addBtns = document.querySelectorAll('.add-cart');
addBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.product-card');
    if (!card) return;

    const id = getCardId(card);
    if (soldIds.has(id)) return;

    const title = (card.querySelector('h3')?.textContent || card.dataset.name || 'Producto').trim();
    const price = Number(card.dataset.price) || 0;

    cart.push({ id, title, price });
    updateCart();

    btn.textContent = "✔ Añadido";
    setTimeout(()=> {
      if (!soldIds.has(id)) btn.textContent = "Añadir al carrito";
    }, 800);
  });
});

// Vaciar carrito
clearCartBtn.addEventListener('click', () => {
  cart = [];
  updateCart();
});

function generateOrderId() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const rnd = Math.floor(Math.random() * 900 + 100); // 3 dígitos
  return `${y}${m}${day}-${hh}${mm}${ss}-${rnd}`;
}

function buildWhatsAppInvoiceText(orderId) {
  const total = cart.reduce((sum, it) => sum + (Number(it.price) || 0), 0);

  const lines = [];
  lines.push(`🧾 Pedido Monigochops`);
  lines.push(`ID: MONIGOCHOPS-${orderId}`);
  lines.push(``);
  lines.push(`Productos:`);

  cart.forEach((it, idx) => {
    lines.push(`${idx + 1}. ${it.title} — €${it.price}`);
  });

  lines.push(``);
  lines.push(`TOTAL: €${total}`);
  lines.push(``);
  lines.push(`📲 Pago por Bizum`);
  lines.push(`Enviar a: +34 662 283 283`);
  lines.push(`Concepto: MONIGOCHOPS-${orderId}`);
  lines.push(``);
  lines.push(`🚚 Envío: lo hablamos por aquí.`);
  lines.push(`Gracias!`);

  return lines.join('\n');
}

function openWhatsAppWithText(text) {
  const phone = '34662283283'; // sin +
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener');
}

function markCartItemsAsSold() {
  cart.forEach(item => soldIds.add(item.id));
  saveState();
  applySoldToAllCards();
}

// Finalizar pedido por WhatsApp
checkoutWhatsAppBtn.addEventListener('click', () => {
  if (!cart.length) {
    alert('Tu carrito está vacío.');
    return;
  }

  const orderId = generateOrderId();
  const text = buildWhatsAppInvoiceText(orderId);

  openWhatsAppWithText(text);

  markCartItemsAsSold();
  cart = [];
  updateCart();
});

// =====================
//  CONTACTO: EMAIL (mailto)
// =====================

const contactForm = document.getElementById('contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = contactForm.querySelector('input[type="text"]')?.value?.trim() || '';
    const email = contactForm.querySelector('input[type="email"]')?.value?.trim() || '';
    const message = contactForm.querySelector('textarea')?.value?.trim() || '';

    const to = 'inthemidle@hotmail.com';
    const subject = encodeURIComponent('Contacto desde Monigochops');
    const body = encodeURIComponent(
      `Nombre: ${name}\n` +
      `Email: ${email}\n\n` +
      `Mensaje:\n${message}\n`
    );

    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  });
}

// =====================
//  INIT
// =====================

loadState();
updateCart();
applySoldToAllCards();


// =====================================================
//  LIGHTBOX (Opción B) para DISEÑOS + TIENDA (imágenes)
//  - No toca tu HTML: crea el overlay vía JS
// =====================================================

(function initMonigochopsLightbox(){
  // Crea overlay una sola vez
  const overlay = document.createElement('div');
  overlay.className = 'mc-lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Vista ampliada');

  overlay.innerHTML = `
    <div class="mc-lightbox__panel" tabindex="-1">
      <button class="mc-lightbox__close" type="button" aria-label="Cerrar">×</button>
      <img class="mc-lightbox__img" alt="">
    </div>
  `;
  document.body.appendChild(overlay);

  const panel = overlay.querySelector('.mc-lightbox__panel');
  const imgEl = overlay.querySelector('.mc-lightbox__img');
  const closeBtn = overlay.querySelector('.mc-lightbox__close');

  let lastActiveEl = null;

  function open(src, altText){
    if (!src) return;

    lastActiveEl = document.activeElement;
    imgEl.src = src;
    imgEl.alt = altText || 'Imagen ampliada';

    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    // foco para ESC / accesibilidad
    setTimeout(() => panel.focus(), 0);
  }

  function close(){
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';

    // limpiar para evitar flashes de imagen anterior
    imgEl.src = '';

    if (lastActiveEl && typeof lastActiveEl.focus === 'function') {
      lastActiveEl.focus();
    }
  }

  // Cerrar: click fuera o botón
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  closeBtn.addEventListener('click', close);

  // Cerrar con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });

  // Delegación de eventos: DISEÑOS + TIENDA
  // - Captura clicks en imágenes sin tocar estructura
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const isDesignImg = target.matches('.service-card img');
    const isStoreImg = target.matches('.product-card .img-wrapper img, .product-card > img');

    if (!isDesignImg && !isStoreImg) return;

    const src = target.getAttribute('src');
    const alt = target.getAttribute('alt') || '';

    // evita comportamientos raros en móviles/drag
    e.preventDefault();
    open(src, alt);
  }, { passive: false });
})();
