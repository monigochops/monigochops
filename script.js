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

  cartTotalEl.textContent = total; // el HTML muestra "$", no lo tocamos
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
      // Si se marcó vendido por otra acción, no lo pisa
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
  // Marcar como vendido todos los ids del carrito
  cart.forEach(item => soldIds.add(item.id));
  saveState();
  applySoldToAllCards();
}

// Finalizar pedido por WhatsApp (factura + marcar vendidos + vaciar carrito)
checkoutWhatsAppBtn.addEventListener('click', () => {
  if (!cart.length) {
    alert('Tu carrito está vacío.');
    return;
  }

  const orderId = generateOrderId();
  const text = buildWhatsAppInvoiceText(orderId);

  // Abre WhatsApp con factura
  openWhatsAppWithText(text);

  // Marcar vendidos y vaciar carrito (según tu punto 9.a)
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
