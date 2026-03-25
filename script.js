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


(function initHandmadeCards() {
  const handmadeCards = document.querySelectorAll('.handmade-card');

  handmadeCards.forEach(card => {
    const mainButton = card.querySelector('.handmade-media');
    const mainImg = card.querySelector('.handmade-media img');
    const chip = card.querySelector('.handmade-chip');
    const thumbs = card.querySelectorAll('.handmade-thumb');

    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        thumbs.forEach(item => item.classList.remove('is-active'));
        thumb.classList.add('is-active');

        const type = thumb.dataset.type || 'image';
        const src = thumb.dataset.src || '';
        const poster = thumb.dataset.poster || '';
        const alt = thumb.dataset.alt || '';

        if (mainImg) {
          mainImg.src = poster || src;
          mainImg.alt = alt;
        }

        if (mainButton) {
          mainButton.dataset.type = type;
          mainButton.dataset.src = src;
          mainButton.dataset.poster = poster;
          mainButton.dataset.alt = alt;
        }

        if (chip) {
          chip.textContent = type === 'video' ? 'Vídeo' : 'Foto';
        }
      });
    });

    const activeThumb = card.querySelector('.handmade-thumb.is-active') || card.querySelector('.handmade-thumb');
    activeThumb?.click();
  });
})();

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
        <video class="mc-lightbox__video" controls playsinline preload="metadata"></video>
      </div>
      <button class="mc-lightbox__nav mc-lightbox__next" type="button" aria-label="Siguiente">›</button>
      <div class="mc-lightbox__counter" aria-live="polite"></div>
      <div class="mc-lightbox__hint">Rueda o pellizco: zoom · Arrastra: mover · Doble toque/doble clic: reset</div>
    </div>
  `;

  document.body.appendChild(overlay);

  const panel = overlay.querySelector('.mc-lightbox__panel');
  const imgEl = overlay.querySelector('.mc-lightbox__img');
  const videoEl = overlay.querySelector('.mc-lightbox__video');
  const closeBtn = overlay.querySelector('.mc-lightbox__close');
  const nextBtn = overlay.querySelector('.mc-lightbox__next');
  const prevBtn = overlay.querySelector('.mc-lightbox__prev');
  const counterEl = overlay.querySelector('.mc-lightbox__counter');

  let lastActiveEl = null;
  let galleryItems = [];
  let currentIndex = 0;
  let isAnimating = false;
  let activeType = 'image';

  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  let touchMode = null;
  let touchStartDistance = 0;
  let pinchStartScale = 1;
  let lastTapAt = 0;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getActiveMediaEl() {
    return activeType === 'video' ? videoEl : imgEl;
  }

  function applyTransform() {
    const mediaEl = getActiveMediaEl();
    mediaEl.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    mediaEl.classList.toggle('is-zoomed', scale > 1);
  }

  function resetZoom() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    isDragging = false;
    touchMode = null;
    imgEl.classList.remove('is-dragging');
    videoEl.classList.remove('is-dragging');
    applyTransform();
  }

  function updateCounter() {
    counterEl.textContent = galleryItems.length > 1 ? `${currentIndex + 1} / ${galleryItems.length}` : '';
  }

  function setNavVisibility() {
    const hasMultiple = galleryItems.length > 1;
    nextBtn.style.display = hasMultiple ? 'flex' : 'none';
    prevBtn.style.display = hasMultiple ? 'flex' : 'none';
  }

  function deactivateMedia() {
    imgEl.classList.remove('is-visible', 'is-exit-to-left', 'is-exit-to-right', 'is-enter-from-right', 'is-enter-from-left');
    videoEl.classList.remove('is-visible', 'is-exit-to-left', 'is-exit-to-right', 'is-enter-from-right', 'is-enter-from-left');
    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.removeAttribute('poster');
    videoEl.load();
  }

  function renderMedia(index, direction = 'next', immediate = false) {
    if (!galleryItems[index] || isAnimating) return;
    const item = galleryItems[index];

    resetZoom();
    activeType = item.type === 'video' ? 'video' : 'image';
    deactivateMedia();

    const mediaEl = getActiveMediaEl();

    const assignContent = () => {
      if (activeType === 'video') {
        videoEl.src = item.src;
        if (item.poster) videoEl.poster = item.poster;
        videoEl.setAttribute('aria-label', item.alt || 'Vídeo ampliado');
      } else {
        imgEl.src = item.src;
        imgEl.alt = item.alt || 'Imagen ampliada';
      }
      applyTransform();
      updateCounter();
    };

    if (immediate) {
      mediaEl.classList.add('is-visible');
      assignContent();
      return;
    }

    isAnimating = true;
    mediaEl.classList.add(direction === 'next' ? 'is-exit-to-left' : 'is-exit-to-right');

    setTimeout(() => {
      deactivateMedia();
      assignContent();
      mediaEl.classList.add(direction === 'next' ? 'is-enter-from-right' : 'is-enter-from-left');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          mediaEl.classList.remove('is-enter-from-right', 'is-enter-from-left');
          mediaEl.classList.add('is-visible');
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
    renderMedia(currentIndex, 'next', true);
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => panel.focus(), 0);
  }

  function closeGallery() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    galleryItems = [];
    currentIndex = 0;
    isAnimating = false;
    activeType = 'image';
    imgEl.src = '';
    imgEl.alt = '';
    deactivateMedia();
    counterEl.textContent = '';
    resetZoom();
    if (lastActiveEl && typeof lastActiveEl.focus === 'function') lastActiveEl.focus();
  }

  function nextImage() {
    if (!galleryItems.length || galleryItems.length === 1 || isAnimating || scale > 1) return;
    currentIndex = (currentIndex + 1) % galleryItems.length;
    renderMedia(currentIndex, 'next');
  }

  function prevImage() {
    if (!galleryItems.length || galleryItems.length === 1 || isAnimating || scale > 1) return;
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    renderMedia(currentIndex, 'prev');
  }

  function normalizeItems(items) {
    return items.map(item => ({
      type: item.type || 'image',
      src: item.src,
      poster: item.poster || '',
      alt: item.alt || ''
    })).filter(item => item.src);
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
      unique.push({ type: 'image', src, alt: img.getAttribute('alt') || '' });
    });

    return unique;
  }

  function getGlobalGallery(selector) {
    return Array.from(document.querySelectorAll(selector)).map(img => ({
      type: 'image',
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt') || ''
    }));
  }

  function getHandmadeGallery(card) {
    if (!card) return [];
    return normalizeItems(
      Array.from(card.querySelectorAll('.handmade-thumb')).map(thumb => ({
        type: thumb.dataset.type || 'image',
        src: thumb.dataset.src || '',
        poster: thumb.dataset.poster || '',
        alt: thumb.dataset.alt || ''
      }))
    );
  }

  function getDistance(t1, t2) {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  }

  function beginDrag(clientX, clientY) {
    if (scale <= 1) return;
    isDragging = true;
    dragStartX = clientX - translateX;
    dragStartY = clientY - translateY;
    getActiveMediaEl().classList.add('is-dragging');
  }

  function updateDrag(clientX, clientY) {
    if (!isDragging) return;
    translateX = clientX - dragStartX;
    translateY = clientY - dragStartY;
    applyTransform();
  }

  function endDrag() {
    isDragging = false;
    imgEl.classList.remove('is-dragging');
    videoEl.classList.remove('is-dragging');
  }

  closeBtn.addEventListener('click', closeGallery);
  nextBtn.addEventListener('click', nextImage);
  prevBtn.addEventListener('click', prevImage);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeGallery();
  });

  overlay.addEventListener('wheel', e => {
    if (!overlay.classList.contains('is-open')) return;
    if (activeType !== 'image') return;
    e.preventDefault();

    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    scale = clamp(Number((scale + delta).toFixed(2)), 1, 5);

    if (scale === 1) {
      translateX = 0;
      translateY = 0;
    }

    applyTransform();
  }, { passive: false });

  overlay.addEventListener('dblclick', () => {
    if (activeType === 'image') resetZoom();
  });

  overlay.addEventListener('mousedown', e => {
    if (activeType !== 'image') return;
    beginDrag(e.clientX, e.clientY);
  });

  document.addEventListener('mousemove', e => {
    if (activeType !== 'image') return;
    updateDrag(e.clientX, e.clientY);
  });

  document.addEventListener('mouseup', endDrag);

  overlay.addEventListener('touchstart', e => {
    if (!overlay.classList.contains('is-open')) return;

    if (e.touches.length === 2 && activeType === 'image') {
      touchMode = 'pinch';
      touchStartDistance = getDistance(e.touches[0], e.touches[1]);
      pinchStartScale = scale;
      return;
    }

    if (e.touches.length === 1 && activeType === 'image') {
      const now = Date.now();
      if (now - lastTapAt < 300) {
        resetZoom();
      }
      lastTapAt = now;

      if (scale > 1) {
        touchMode = 'drag';
        beginDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }
  }, { passive: true });

  overlay.addEventListener('touchmove', e => {
    if (!overlay.classList.contains('is-open')) return;

    if (touchMode === 'pinch' && e.touches.length === 2 && activeType === 'image') {
      e.preventDefault();
      const distance = getDistance(e.touches[0], e.touches[1]);
      scale = clamp(Number((pinchStartScale * (distance / touchStartDistance)).toFixed(2)), 1, 5);

      if (scale === 1) {
        translateX = 0;
        translateY = 0;
      }

      applyTransform();
      return;
    }

    if (touchMode === 'drag' && e.touches.length === 1 && activeType === 'image') {
      e.preventDefault();
      updateDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  overlay.addEventListener('touchend', () => {
    touchMode = null;
    endDrag();
  });

  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('is-open')) return;

    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowRight' && scale === 1) nextImage();
    if (e.key === 'ArrowLeft' && scale === 1) prevImage();

    if (activeType === 'image' && (e.key === '+' || e.key === '=')) {
      scale = clamp(Number((scale + 0.2).toFixed(2)), 1, 5);
      applyTransform();
    }

    if (activeType === 'image' && e.key === '-') {
      scale = clamp(Number((scale - 0.2).toFixed(2)), 1, 5);
      if (scale === 1) {
        translateX = 0;
        translateY = 0;
      }
      applyTransform();
    }

    if (activeType === 'image' && e.key === '0') {
      resetZoom();
    }
  });

  document.addEventListener('click', e => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.closest('a') || target.closest('.add-cart')) return;

    const isStoreImg = target.matches('.product-main-media img, .img-wrapper img');
    const isDesignImg = target.matches('.service-card img');
    const isFeaturedImg = target.matches('.featured-card img');
    const handmadeMain = target.closest('.handmade-media');
    const handmadeThumb = target.closest('.handmade-thumb');

    if (!isStoreImg && !isDesignImg && !isFeaturedImg && !handmadeMain && !handmadeThumb) return;

    e.preventDefault();

    if (handmadeMain || handmadeThumb) {
      const card = target.closest('.handmade-card');
      const gallery = getHandmadeGallery(card);
      const src = handmadeThumb?.dataset.src || handmadeMain?.dataset.src || '';
      const startIndex = Math.max(0, gallery.findIndex(item => item.src === src));
      openGallery(gallery, startIndex);
      return;
    }

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

(function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  const acceptBtn = document.getElementById('cookie-accept');
  const rejectBtn = document.getElementById('cookie-reject');
  const LS_COOKIE_KEY = 'monigochops_cookie_consent_v1';

  if (!banner || !acceptBtn || !rejectBtn) return;

  const saved = localStorage.getItem(LS_COOKIE_KEY);
  if (!saved) {
    banner.hidden = false;
    requestAnimationFrame(() => banner.classList.add('is-visible'));
  }

  function saveConsent(status) {
    localStorage.setItem(LS_COOKIE_KEY, status);
    banner.classList.remove('is-visible');
    setTimeout(() => {
      banner.hidden = true;
    }, 220);
  }

  acceptBtn.addEventListener('click', () => saveConsent('accepted'));
  rejectBtn.addEventListener('click', () => saveConsent('rejected'));
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
