const header = document.querySelector('.header');
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const clearCartBtn = document.getElementById('clear-cart');
const checkoutWhatsAppBtn = document.getElementById('checkout-whatsapp');
const filterBtns = document.querySelectorAll('.filter-btn');
const productCards = document.querySelectorAll('.product-card');
const revealEls = document.querySelectorAll('.reveal');

const LS_CART_KEY = 'monigochops_cart_v2';
const LS_SOLD_KEY = 'monigochops_sold_v2';

let cart = [];
let soldIds = new Set();

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
});

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function loadState() {
  try {
    const savedCart = JSON.parse(localStorage.getItem(LS_CART_KEY) || '[]');
    if (Array.isArray(savedCart)) cart = savedCart;

    const savedSold = JSON.parse(localStorage.getItem(LS_SOLD_KEY) || '[]');
    if (Array.isArray(savedSold)) soldIds = new Set(savedSold);
  } catch (error) {
    cart = [];
    soldIds = new Set();
  }
}

function saveState() {
  localStorage.setItem(LS_CART_KEY, JSON.stringify(cart));
  localStorage.setItem(LS_SOLD_KEY, JSON.stringify(Array.from(soldIds)));
}

function getCardId(card) {
  const title = (card.querySelector('h3')?.textContent || card.dataset.name || '').trim();
  const price = String(card.dataset.price || '');
  const imgSrc = card.querySelector('.product-main-media img')?.getAttribute('src') || '';
  return `${title}__${price}__${imgSrc}`;
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
    card.querySelector('.sold-badge')?.remove();

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
  if (!cartItemsEl || !cartTotalEl) return;

  cartItemsEl.innerHTML = '';
  let total = 0;

  if (!cart.length) {
    const empty = document.createElement('li');
    empty.textContent = 'Tu carrito está vacío.';
    cartItemsEl.appendChild(empty);
  } else {
    cart.forEach((item, index) => {
      const li = document.createElement('li');
      li.textContent = `${index + 1}. ${item.title} — €${item.price}`;
      cartItemsEl.appendChild(li);
      total += item.price;
    });
  }

  cartTotalEl.textContent = total;
  saveState();
}

function generateOrderId() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${Math.floor(Math.random() * 900 + 100)}`;
}

function buildWhatsAppInvoiceText(orderId) {
  const total = cart.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
  const lines = [];

  lines.push('🧾 Pedido Monigochops');
  lines.push(`ID: MONIGOCHOPS-${orderId}`);
  lines.push('');
  lines.push('Productos:');

  cart.forEach((item, idx) => {
    lines.push(`${idx + 1}. ${item.title} — €${item.price}`);
  });

  lines.push('');
  lines.push(`TOTAL: €${total}`);
  lines.push('');
  lines.push('📲 Pago por Bizum');
  lines.push('Enviar a: +34 662 283 283');
  lines.push(`Concepto: MONIGOCHOPS-${orderId}`);
  lines.push('');
  lines.push('🚚 Envío: lo hablamos por aquí.');
  lines.push('Gracias.');

  return lines.join('\n');
}

function openWhatsAppWithText(text) {
  const phone = '34662283283';
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener');
}

function markCartItemsAsSold() {
  cart.forEach(item => soldIds.add(item.id));
  saveState();
  applySoldToAllCards();
}

productCards.forEach(card => {
  const btn = card.querySelector('.add-cart');
  const mainImg = card.querySelector('.product-main-media img');
  const thumbs = card.querySelectorAll('.img-wrapper img');

  thumbs.forEach(thumb => {
    thumb.addEventListener('mouseenter', () => {
      if (mainImg) {
        mainImg.src = thumb.src;
        mainImg.alt = thumb.alt;
      }
    });

    thumb.addEventListener('click', () => {
      if (mainImg) {
        mainImg.src = thumb.src;
        mainImg.alt = thumb.alt;
      }
    });
  });

  btn?.addEventListener('click', () => {
    const id = getCardId(card);
    if (soldIds.has(id)) return;

    const title = (card.querySelector('h3')?.textContent || card.dataset.name || 'Producto').trim();
    const price = Number(card.dataset.price) || 0;

    cart.push({ id, title, price });
    updateCart();

    btn.textContent = '✔ Añadido';
    setTimeout(() => {
      if (!soldIds.has(id)) btn.textContent = 'Añadir al carrito';
    }, 800);
  });
});

clearCartBtn?.addEventListener('click', () => {
  cart = [];
  updateCart();
});

checkoutWhatsAppBtn?.addEventListener('click', () => {
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

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(item => item.classList.remove('is-active'));
    btn.classList.add('is-active');

    const filter = btn.dataset.filter;

    productCards.forEach(card => {
      const match = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('is-hidden', !match);
    });
  });
});

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();

    const name = contactForm.querySelector('input[type="text"]')?.value?.trim() || '';
    const email = contactForm.querySelector('input[type="email"]')?.value?.trim() || '';
    const message = contactForm.querySelector('textarea')?.value?.trim() || '';

    const to = 'inthemidle@hotmail.com';
    const subject = encodeURIComponent('Contacto desde Monigochops');
    const body = encodeURIComponent(
      `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}\n`
    );

    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  });
}

(function initLightbox() {
  const overlay = document.createElement('div');
  overlay.className = 'mc-lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Galería ampliada');

  overlay.innerHTML = `
    <div class="mc-lightbox__panel" tabindex="-1">
      <button class="mc-lightbox__close" type="button" aria-label="Cerrar">×</button>
      <button class="mc-lightbox__nav mc-lightbox__prev" type="button" aria-label="Anterior">‹</button>
      <div class="mc-lightbox__stage">
        <img class="mc-lightbox__img is-visible" alt="">
      </div>
      <button class="mc-lightbox__nav mc-lightbox__next" type="button" aria-label="Siguiente">›</button>
      <div class="mc-lightbox__counter" aria-live="polite"></div>
      <div class="mc-lightbox__hint">Rueda: zoom · Arrastra: mover · Doble clic: reset</div>
    </div>
  `;

  document.body.appendChild(overlay);

  const panel = overlay.querySelector('.mc-lightbox__panel');
  const imgEl = overlay.querySelector('.mc-lightbox__img');
  const closeBtn = overlay.querySelector('.mc-lightbox__close');
  const nextBtn = overlay.querySelector('.mc-lightbox__next');
  const prevBtn = overlay.querySelector('.mc-lightbox__prev');
  const counterEl = overlay.querySelector('.mc-lightbox__counter');

  let lastActiveEl = null;
  let galleryItems = [];
  let currentIndex = 0;
  let isAnimating = false;

  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  function applyTransform() {
    imgEl.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    imgEl.classList.toggle('is-zoomed', scale > 1);
  }

  function resetZoom() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    isDragging = false;
    applyTransform();
  }

  function updateCounter() {
    counterEl.textContent = galleryItems.length > 1
      ? `${currentIndex + 1} / ${galleryItems.length}`
      : '';
  }

  function setNavVisibility() {
    const hasMultiple = galleryItems.length > 1;
    nextBtn.style.display = hasMultiple ? 'flex' : 'none';
    prevBtn.style.display = hasMultiple ? 'flex' : 'none';
  }

  function renderImage(index, direction = 'next', immediate = false) {
    if (!galleryItems[index] || isAnimating) return;

    const item = galleryItems[index];
    resetZoom();

    if (immediate) {
      imgEl.className = 'mc-lightbox__img is-visible';
      imgEl.src = item.src;
      imgEl.alt = item.alt || 'Imagen ampliada';
      applyTransform();
      updateCounter();
      return;
    }

    isAnimating = true;
    imgEl.classList.remove(
      'is-visible',
      'is-enter-from-right',
      'is-enter-from-left',
      'is-exit-to-left',
      'is-exit-to-right'
    );
    imgEl.classList.add(direction === 'next' ? 'is-exit-to-left' : 'is-exit-to-right');

    setTimeout(() => {
      imgEl.src = item.src;
      imgEl.alt = item.alt || 'Imagen ampliada';
      imgEl.classList.remove('is-exit-to-left', 'is-exit-to-right');
      imgEl.classList.add(direction === 'next' ? 'is-enter-from-right' : 'is-enter-from-left');
      applyTransform();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          imgEl.classList.remove('is-enter-from-right', 'is-enter-from-left');
          imgEl.classList.add('is-visible');
          updateCounter();

          setTimeout(() => {
            isAnimating = false;
          }, 280);
        });
      });
    }, 180);
  }

  function openGallery(items, startIndex = 0) {
    if (!items.length) return;
    galleryItems = items;
    currentIndex = startIndex;
    lastActiveEl = document.activeElement;

    setNavVisibility();
    renderImage(currentIndex, 'next', true);

    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => panel.focus(), 0);
  }

  function closeGallery() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    galleryItems = [];
    currentIndex = 0;
    imgEl.src = '';
    imgEl.alt = '';
    counterEl.textContent = '';
    isAnimating = false;
    resetZoom();

    if (lastActiveEl && typeof lastActiveEl.focus === 'function') {
      lastActiveEl.focus();
    }
  }

  function nextImage() {
    if (!galleryItems.length || galleryItems.length === 1 || isAnimating) return;
    currentIndex = (currentIndex + 1) % galleryItems.length;
    renderImage(currentIndex, 'next');
  }

  function prevImage() {
    if (!galleryItems.length || galleryItems.length === 1 || isAnimating) return;
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    renderImage(currentIndex, 'prev');
  }

  function getProductGallery(card) {
    if (!card) return [];
    const rawImgs = Array.from(card.querySelectorAll('.product-main-media img, .img-wrapper img'));

    const unique = [];
    const seen = new Set();

    rawImgs.forEach(img => {
      const src = img.getAttribute('src');
      if (!src || seen.has(src)) return;
      seen.add(src);
      unique.push({
        src,
        alt: img.getAttribute('alt') || ''
      });
    });

    return unique;
  }

  function getGlobalGallery(selector) {
    return Array.from(document.querySelectorAll(selector)).map(img => ({
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt') || ''
    }));
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  closeBtn.addEventListener('click', closeGallery);
  nextBtn.addEventListener('click', nextImage);
  prevBtn.addEventListener('click', prevImage);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeGallery();
  });

  imgEl.addEventListener('wheel', e => {
    if (!overlay.classList.contains('is-open')) return;
    e.preventDefault();

    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    scale = clamp(Number((scale + delta).toFixed(2)), 1, 4);

    if (scale === 1) {
      translateX = 0;
      translateY = 0;
    }

    applyTransform();
  }, { passive: false });

  imgEl.addEventListener('dblclick', () => {
    resetZoom();
  });

  imgEl.addEventListener('mousedown', e => {
    if (scale <= 1) return;
    e.preventDefault();
    isDragging = true;
    dragStartX = e.clientX - translateX;
    dragStartY = e.clientY - translateY;
    imgEl.classList.add('is-dragging');
  });

  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    translateX = e.clientX - dragStartX;
    translateY = e.clientY - dragStartY;
    applyTransform();
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    imgEl.classList.remove('is-dragging');
  });

  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('is-open')) return;

    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowRight' && scale === 1) nextImage();
    if (e.key === 'ArrowLeft' && scale === 1) prevImage();

    if (e.key === '+' || e.key === '=') {
      scale = clamp(Number((scale + 0.2).toFixed(2)), 1, 4);
      applyTransform();
    }

    if (e.key === '-') {
      scale = clamp(Number((scale - 0.2).toFixed(2)), 1, 4);
      if (scale === 1) {
        translateX = 0;
        translateY = 0;
      }
      applyTransform();
    }

    if (e.key === '0') {
      resetZoom();
    }
  });

  document.addEventListener('click', e => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.closest('a') || target.closest('button')) return;

    const isStoreImg = target.matches('.product-main-media img, .img-wrapper img');
    const isDesignImg = target.matches('.service-card img');
    const isFeaturedImg = target.matches('.featured-card img');

    if (!isStoreImg && !isDesignImg && !isFeaturedImg) return;

    e.preventDefault();

    if (isStoreImg) {
      const card = target.closest('.product-card');
      const gallery = getProductGallery(card);
      const clickedSrc = target.getAttribute('src');
      const startIndex = Math.max(0, gallery.findIndex(item => item.src === clickedSrc));
      openGallery(gallery, startIndex);
      return;
    }

    if (isDesignImg) {
      const gallery = getGlobalGallery('.service-card img');
      const clickedSrc = target.getAttribute('src');
      const startIndex = Math.max(0, gallery.findIndex(item => item.src === clickedSrc));
      openGallery(gallery, startIndex);
      return;
    }

    if (isFeaturedImg) {
      const gallery = getGlobalGallery('.featured-card img');
      const clickedSrc = target.getAttribute('src');
      const startIndex = Math.max(0, gallery.findIndex(item => item.src === clickedSrc));
      openGallery(gallery, startIndex);
    }
  }, { passive: false });
})();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

revealEls.forEach(el => revealObserver.observe(el));

loadState();
updateCart();
applySoldToAllCards();
