const products = [
  { id: 0, name: 'Classic Straight Indigo', fit: 'Straight', price: '₹1,699', priceNum: 1699, img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80', img2: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80', badge: 'New', desc: 'Your dependable, everyday pair. A structured mid-weight denim with a straight leg and a lived-in indigo wash.', wash: 'Classic Indigo' },
  { id: 1, name: 'Heavy Wash Baggy', fit: 'Baggy', price: '₹1,899', priceNum: 1899, img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80', img2: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80', badge: 'Bestseller', desc: 'Wide volume through thigh and knee with heavy stone wash fading and vintage whiskering.', wash: 'Heavy Stonewash' },
  { id: 2, name: 'Vintage Blue Wide Leg', fit: 'Wide', price: '₹1,999', priceNum: 1999, img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80', img2: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', badge: '', desc: 'Relaxed dramatic drape cut from 14oz Japanese-style ring-spun cotton denim.', wash: 'Vintage Blue' },
  { id: 3, name: 'Relaxed Black Denim', fit: 'Relaxed', price: '₹1,699', priceNum: 1699, img: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80', img2: 'https://images.unsplash.com/photo-1506629905607-d4052e16f733?auto=format&fit=crop&w=800&q=80', badge: '', desc: 'Sulphur-dyed deep matte black that fades into subtle charcoal highlights with prolonged wear.', wash: 'Washed Black' },
  { id: 4, name: 'Dark Indigo Bootcut', fit: 'Bootcut', price: '₹2,199', priceNum: 2199, img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', img2: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80', badge: 'New', desc: 'Fitted through the hip with a slight flare below the knee for an elongated, retro profile.', wash: 'Dark Indigo' },
  { id: 5, name: 'Washed Grey Straight', fit: 'Straight', price: '₹1,499', priceNum: 1499, img: 'https://images.unsplash.com/photo-1506629905607-d4052e16f733?auto=format&fit=crop&w=800&q=80', img2: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80', badge: 'Sale', desc: 'Clean straight leg in an overdyed slate grey with subtle hand-scraping on thighs.', wash: 'Slate Grey' },
  { id: 6, name: 'Raw Denim Relaxed', fit: 'Relaxed', price: '₹1,899', priceNum: 1899, img: 'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?auto=format&fit=crop&w=800&q=80', img2: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80', badge: '', desc: 'Unwashed 14.5oz rigid raw selvedge denim built to break in and mold uniquely to your body.', wash: 'Rigid Raw Denim' },
  { id: 7, name: 'Faded Blue Baggy', fit: 'Baggy', price: '₹1,799', priceNum: 1799, img: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=800&q=80', img2: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80', badge: '', desc: 'Late 90s skater cut with generous leg room and authentic vintage sun-bleach wash.', wash: 'Sun Faded Blue' }
];

const themes = {
  minimal: {
    hero: 'DENIM,<br><i>REDEFINED.</i>',
    sub: 'Built for the way you move.',
    kicker: 'Drop 08 / Autumn denim',
    bagTitle: 'Your Bag',
    searchPlaceholder: 'SEARCH BY FIT, STYLE, OR WASH...',
    checkoutLabel: 'Proceed to Checkout <i>↗</i>',
    manifestLabel: 'SHOPPING BAG'
  },
  street: {
    hero: 'FIND<br>YOUR <i>FIT.</i>',
    sub: 'Big silhouettes. Zero apologies.',
    kicker: 'New drop / Made loud',
    bagTitle: 'STREET BAG',
    searchPlaceholder: 'SEARCH STREETWEAR DENIM...',
    checkoutLabel: 'CHECKOUT NOW <i>↗</i>',
    manifestLabel: 'BAG MANIFEST // 02'
  },
  industrial: {
    hero: 'BUILT<br>TO <i>LAST.</i>',
    sub: 'Heavyweight denim. Everyday fits. Made for movement.',
    kicker: 'Raw goods / Issue 08',
    bagTitle: 'MANIFEST // 03',
    searchPlaceholder: 'SPEC_SEARCH // FIT, CODE, WASH...',
    checkoutLabel: 'DISPATCH ORDER <i>↗</i>',
    manifestLabel: 'MANIFEST // CARGO SPEC [03]'
  },
  indian: {
    hero: 'YOUR<br>EVERYDAY <i>DENIM.</i>',
    sub: 'Fits designed for modern Indian men.',
    kicker: 'Denim, for right now',
    bagTitle: 'Shopping Bag',
    searchPlaceholder: 'Search fits crafted for India...',
    checkoutLabel: 'Place Order <i>↗</i>',
    manifestLabel: 'YOUR SELECTIONS'
  }
};

let currentTheme = 'minimal';
let currentPdpId = 0;
let currentSelectedSize = '32';
let cart = [];

// Toast notification helper
let toastTimeout;
function showToast(msg) {
  const toast = document.querySelector('.toast');
  if (!toast) return;
  toast.innerHTML = `${msg} <span>×</span>`;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

// Product Card Component
function productCard(p) {
  return `
    <article class="product-card" data-product-id="${p.id}">
      <div class="product-image">
        <img src="${p.img}" alt="${p.name}" loading="lazy">
        ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
        <button class="quick-add" data-quick-add="${p.id}">+ Quick add</button>
      </div>
      <div class="product-meta">
        <div>
          <h3>${p.name}</h3>
          <p>${p.fit} fit · ${p.wash}</p>
        </div>
        <strong>${p.price}</strong>
      </div>
    </article>
  `;
}

let currentSortMode = 'featured';
let currentFitFilter = 'all';

// Draw Products to Grids
function drawProducts(filterList = null) {
  const listToDraw = filterList !== null ? filterList : products;
  const homeGrid = document.querySelector('#home .product-grid');
  const collectionGrid = document.querySelector('.collection-grid');

  if (homeGrid && filterList === null) {
    homeGrid.innerHTML = products.slice(0, 4).map(productCard).join('');
  }
  if (collectionGrid) {
    if (listToDraw.length === 0) {
      collectionGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; font-family: var(--mono);">
          <p style="font-size: 15px; margin-bottom: 14px;">No denim styles matched your selected filters.</p>
          <button class="button primary" id="resetCollectionFiltersBtn" style="cursor:pointer;">View all styles <i>↗</i></button>
        </div>
      `;
    } else {
      collectionGrid.innerHTML = listToDraw.map(productCard).join('');
    }
    const countEl = document.querySelector('.collection-count');
    if (countEl) countEl.textContent = `${listToDraw.length} piece${listToDraw.length === 1 ? '' : 's'}`;
  }
}

// Master Filter & Sort function for collection page
function filterAndSortProducts() {
  let list = [...products];

  // 1. Fit filter from checkboxes or active fit button
  const checkedFits = Array.from(document.querySelectorAll('.filter-panel input[type="checkbox"]:checked'))
    .map(cb => cb.value)
    .filter(val => ['Baggy', 'Straight', 'Relaxed', 'Wide', 'Bootcut'].includes(val));

  if (checkedFits.length > 0) {
    list = list.filter(p => checkedFits.some(f => f.toLowerCase() === p.fit.toLowerCase()));
  } else if (currentFitFilter && currentFitFilter !== 'all') {
    list = list.filter(p => p.fit.toLowerCase() === currentFitFilter.toLowerCase());
  }

  // 2. Price filter checkboxes
  const checkedPrices = Array.from(document.querySelectorAll('.filter-panel input[type="checkbox"]:checked'))
    .map(cb => cb.value)
    .filter(val => ['under-1500', '1500-2000', 'above-2000'].includes(val));

  if (checkedPrices.length > 0) {
    list = list.filter(p => {
      return checkedPrices.some(priceKey => {
        if (priceKey === 'under-1500') return p.priceNum < 1500;
        if (priceKey === '1500-2000') return p.priceNum >= 1500 && p.priceNum <= 1999;
        if (priceKey === 'above-2000') return p.priceNum >= 2000;
        return true;
      });
    });
  }

  // 3. Sorting
  if (currentSortMode === 'price-asc') {
    list.sort((a, b) => a.priceNum - b.priceNum);
  } else if (currentSortMode === 'price-desc') {
    list.sort((a, b) => b.priceNum - a.priceNum);
  } else {
    list.sort((a, b) => a.id - b.id);
  }

  drawProducts(list);
}

// Reset all collection filters to view all products
function resetAllCollectionFilters() {
  currentFitFilter = 'all';
  currentSortMode = 'featured';
  document.querySelectorAll('.fit-filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.fit === 'all');
  });
  document.querySelectorAll('.filter-panel input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
  const sortBtn = document.querySelector('.sort');
  if (sortBtn) sortBtn.textContent = 'Sort: Featured ⌄';
  filterAndSortProducts();
}

// Set Theme
function setTheme(name) {
  currentTheme = name;
  document.body.dataset.theme = name;
  document.querySelectorAll('[data-theme-select]').forEach(b => {
    b.classList.toggle('active', b.dataset.themeSelect === name);
  });
  
  const t = themes[name] || themes.minimal;
  const h1 = document.querySelector('.hero h1');
  const sub = document.querySelector('.hero-sub');
  const kicker = document.querySelector('.hero-kicker');
  const manifest = document.querySelector('.cart-sys-label');
  const checkoutBtn = document.querySelector('#checkoutBtn');
  const searchInput = document.querySelector('#searchInput');

  if (h1) h1.innerHTML = t.hero;
  if (sub) sub.textContent = t.sub;
  if (kicker) kicker.textContent = t.kicker;
  if (manifest) manifest.textContent = t.manifestLabel;
  if (checkoutBtn) checkoutBtn.innerHTML = t.checkoutLabel;
  if (searchInput) searchInput.placeholder = t.searchPlaceholder;
}

// Navigation Helper
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.querySelector(pageId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Load Product into PDP
function loadProductToPdp(productId) {
  const p = products.find(item => item.id === Number(productId)) || products[0];
  currentPdpId = p.id;
  
  const title = document.querySelector('.pdp-title');
  const fitEyebrow = document.querySelector('.pdp-fit-eyebrow');
  const price = document.querySelector('.pdp-price');
  const btnPrice = document.querySelector('.pdp-btn-price');
  const desc = document.querySelector('.pdp-desc');
  const washName = document.querySelector('.pdp-wash-name');
  const mainImg = document.querySelector('.pdp-main-img');
  const secImg = document.querySelector('.pdp-sec-img');
  const crumbTitle = document.querySelector('.pdp-crumb-title');

  if (title) title.innerHTML = p.name.replace(' ', '<br>');
  if (fitEyebrow) fitEyebrow.textContent = `${p.fit} fit / ${p.wash}`;
  if (price) price.innerHTML = `${p.price} <s>₹${p.priceNum + 500}</s> <span>23% off</span>`;
  if (btnPrice) btnPrice.textContent = p.price;
  if (desc) desc.textContent = p.desc;
  if (washName) washName.textContent = p.wash;
  if (mainImg) { mainImg.src = p.img; mainImg.alt = p.name; }
  if (secImg) { secImg.src = p.img2; secImg.alt = `${p.name} details`; }
  if (crumbTitle) crumbTitle.textContent = p.name;

  navigateTo('#product');
}

// ==================== CART / BAG LOGIC ====================
function openCart() {
  const cartOverlay = document.querySelector('#cartOverlay');
  if (cartOverlay) {
    cartOverlay.classList.add('open');
    cartOverlay.setAttribute('aria-hidden', 'false');
  }
}

function closeCart() {
  const cartOverlay = document.querySelector('#cartOverlay');
  if (cartOverlay) {
    cartOverlay.classList.remove('open');
    cartOverlay.setAttribute('aria-hidden', 'true');
  }
}

function addToCart(productId, size = '32') {
  const product = products.find(p => p.id === Number(productId));
  if (!product) return;

  const existing = cart.find(item => item.id === product.id && item.size === size);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      fit: product.fit,
      wash: product.wash,
      price: product.price,
      priceNum: product.priceNum,
      img: product.img,
      size: size,
      qty: 1
    });
  }

  renderCart();
  showToast(`Added <b>${product.name}</b> (Size ${size}) to your bag`);
  openCart();
}

function updateCartQty(index, delta) {
  if (cart[index]) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
      showToast('Item removed from bag');
    }
  }
  renderCart();
}

function removeCartItem(index) {
  if (cart[index]) {
    const item = cart[index];
    cart.splice(index, 1);
    showToast(`Removed <b>${item.name}</b>`);
  }
  renderCart();
}

function renderCart() {
  const container = document.querySelector('#cartItemsList');
  const navBagBadge = document.querySelector('.cart-button b');
  const headerCount = document.querySelector('#cartHeaderCount');
  const subtotalEl = document.querySelector('#cartSubtotal');
  const shippingEl = document.querySelector('#cartShipping');
  const totalEl = document.querySelector('#cartTotal');
  const freeShipText = document.querySelector('#freeShippingText');
  const freeShipProg = document.querySelector('#freeShippingProgress');
  const footerEl = document.querySelector('#cartFooter');

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.priceNum * item.qty), 0);

  // Update badge count
  if (navBagBadge) navBagBadge.textContent = totalItems;
  if (headerCount) headerCount.textContent = `(${totalItems})`;

  // Free shipping threshold: 1499
  const freeThreshold = 1499;
  let shipping = 0;

  if (subtotal === 0) {
    shipping = 0;
    if (freeShipText) {
      freeShipText.classList.remove('unlocked');
      freeShipText.innerHTML = `Complimentary shipping above <b>₹1,499</b>`;
    }
    if (freeShipProg) freeShipProg.style.width = '0%';
  } else if (subtotal >= freeThreshold) {
    shipping = 0;
    if (freeShipText) {
      freeShipText.classList.add('unlocked');
      freeShipText.innerHTML = `<span>✓ FREE SHIPPING UNLOCKED</span> <b>₹0</b>`;
    }
    if (freeShipProg) freeShipProg.style.width = '100%';
  } else {
    shipping = 99;
    const diff = freeThreshold - subtotal;
    const pct = Math.min(100, Math.round((subtotal / freeThreshold) * 100));
    if (freeShipText) {
      freeShipText.classList.remove('unlocked');
      freeShipText.innerHTML = `Add <b>₹${diff.toLocaleString('en-IN')}</b> more for FREE Shipping`;
    }
    if (freeShipProg) freeShipProg.style.width = `${pct}%`;
  }

  const finalTotal = subtotal + shipping;

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  if (shippingEl) shippingEl.textContent = shipping === 0 ? (subtotal === 0 ? '₹0' : 'FREE') : `₹${shipping}`;
  if (totalEl) totalEl.textContent = `₹${finalTotal.toLocaleString('en-IN')}`;

  // Render items
  if (cart.length === 0) {
    if (container) {
      container.innerHTML = `
        <div class="cart-empty-state">
          <span class="cart-empty-badge">[ EMPTY_MANIFEST ]</span>
          <h3 class="cart-empty-title">Your Bag is Empty</h3>
          <p>Explore our denim silhouettes to find your perfect fit.</p>
          <button class="button primary" id="cartShopBtn">Explore Collection <i>↗</i></button>
        </div>
      `;
    }
  } else {
    if (container) {
      container.innerHTML = cart.map((item, idx) => `
        <div class="cart-item" data-cart-index="${idx}">
          <img src="${item.img}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <div class="cart-item-top">
              <div>
                <h4 class="cart-item-title">${item.name}</h4>
                <p class="cart-item-spec">${item.fit} · Size ${item.size} · ${item.wash}</p>
              </div>
              <button class="cart-item-remove" data-remove-index="${idx}" title="Remove item">✕</button>
            </div>
            <div class="cart-item-bottom">
              <div class="cart-stepper">
                <button class="cart-dec" data-dec-index="${idx}">−</button>
                <span>${item.qty}</span>
                <button class="cart-inc" data-inc-index="${idx}">+</button>
              </div>
              <strong class="cart-item-price">₹${(item.priceNum * item.qty).toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>
      `).join('');
    }
  }
}

// ==================== SEARCH LOGIC ====================
function openSearch() {
  const searchOverlay = document.querySelector('#searchOverlay');
  const searchInput = document.querySelector('#searchInput');
  if (searchOverlay) {
    searchOverlay.classList.add('open');
    searchOverlay.setAttribute('aria-hidden', 'false');
    if (searchInput) {
      searchInput.value = '';
      setTimeout(() => searchInput.focus(), 150);
      filterSearch('');
    }
  }
}

function closeSearch() {
  const searchOverlay = document.querySelector('#searchOverlay');
  if (searchOverlay) {
    searchOverlay.classList.remove('open');
    searchOverlay.setAttribute('aria-hidden', 'true');
  }
}

function filterSearch(query) {
  const cleanQ = query.trim().toLowerCase();
  const clearBtn = document.querySelector('#searchClear');
  const resultsGrid = document.querySelector('#searchResultsGrid');
  const countText = document.querySelector('#searchCountText');

  if (clearBtn) {
    clearBtn.classList.toggle('visible', cleanQ.length > 0);
  }

  const matches = products.filter(p => {
    if (!cleanQ) return true;
    return (
      p.name.toLowerCase().includes(cleanQ) ||
      p.fit.toLowerCase().includes(cleanQ) ||
      p.wash.toLowerCase().includes(cleanQ) ||
      p.desc.toLowerCase().includes(cleanQ) ||
      p.price.toLowerCase().includes(cleanQ)
    );
  });

  if (countText) {
    countText.textContent = `${matches.length} STYLE${matches.length === 1 ? '' : 'S'} FOUND`;
  }

  if (resultsGrid) {
    if (matches.length === 0) {
      resultsGrid.innerHTML = `
        <div class="search-empty">
          <p>No denim styles found matching "<b>${query}</b>".</p>
          <span style="font-size:11px;opacity:0.7">Try searching "Baggy", "Straight", "Raw", or "Indigo"</span>
        </div>
      `;
    } else {
      resultsGrid.innerHTML = matches.map(p => `
        <div class="search-item" data-search-product="${p.id}">
          <img src="${p.img}" alt="${p.name}" class="search-item-img">
          <div class="search-item-info">
            <h4>${p.name}</h4>
            <p>${p.fit} fit · ${p.wash}</p>
            <strong>${p.price}</strong>
          </div>
          <button class="search-item-add" data-search-add="${p.id}">+ Add</button>
        </div>
      `).join('');
    }
  }
}

// ==================== EVENT LISTENERS & SETUP ====================
document.addEventListener('DOMContentLoaded', () => {
  drawProducts();
  setTheme('minimal');
  renderCart();

  // Theme selection buttons
  document.querySelectorAll('[data-theme-select]').forEach(button => {
    button.addEventListener('click', () => setTheme(button.dataset.themeSelect));
  });

  // Device toggle buttons
  document.querySelectorAll('[data-device]').forEach(button => {
    button.addEventListener('click', () => {
      document.body.classList.toggle('mobile-preview', button.dataset.device === 'mobile');
      document.querySelectorAll('[data-device]').forEach(b => b.classList.toggle('active', b === button));
    });
  });

  // Search button click
  const searchBtn = document.querySelector('.search-button');
  if (searchBtn) searchBtn.addEventListener('click', openSearch);

  // Search close button
  const searchClose = document.querySelector('#searchClose');
  if (searchClose) searchClose.addEventListener('click', closeSearch);

  // Search clear button
  const searchClear = document.querySelector('#searchClear');
  const searchInput = document.querySelector('#searchInput');
  if (searchClear && searchInput) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.focus();
      filterSearch('');
    });
  }

  // Search typing
  if (searchInput) {
    searchInput.addEventListener('input', e => filterSearch(e.target.value));
  }

  // Search quick tags
  document.querySelectorAll('.search-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const q = tag.dataset.query;
      if (searchInput) {
        searchInput.value = q;
        filterSearch(q);
      }
    });
  });

  // Search Overlay backdrop click
  const searchOverlay = document.querySelector('#searchOverlay');
  if (searchOverlay) {
    searchOverlay.addEventListener('click', e => {
      if (e.target === searchOverlay) closeSearch();
    });
  }

  // Cart button click
  const cartBtn = document.querySelector('.cart-button');
  if (cartBtn) cartBtn.addEventListener('click', openCart);

  // Cart close button
  const cartClose = document.querySelector('#cartClose');
  if (cartClose) cartClose.addEventListener('click', closeCart);

  // Cart Overlay backdrop click
  const cartOverlay = document.querySelector('#cartOverlay');
  if (cartOverlay) {
    cartOverlay.addEventListener('click', e => {
      if (e.target === cartOverlay) closeCart();
    });
  }

  // Checkout button
  const checkoutBtn = document.querySelector('#checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Your bag is empty! Add denim styles first.');
      } else {
        showToast('🎉 Order initiated! Redirecting to secure checkout...');
      }
    });
  }

  // Account button
  const accountBtn = document.querySelector('.account-button');
  if (accountBtn) {
    accountBtn.addEventListener('click', () => {
      showToast('Signed in as Guest Member · Denim Club #804');
    });
  }

  // PDP size picker
  document.querySelectorAll('.size-picker button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-picker button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      currentSelectedSize = btn.textContent.trim();
    });
  });

  // PDP Add to Bag & Buy Now
  const pdpAddCart = document.querySelector('#pdpAddCart');
  if (pdpAddCart) {
    pdpAddCart.addEventListener('click', () => {
      addToCart(currentPdpId, currentSelectedSize);
    });
  }

  const pdpBuyNow = document.querySelector('#pdpBuyNow');
  if (pdpBuyNow) {
    pdpBuyNow.addEventListener('click', () => {
      addToCart(currentPdpId, currentSelectedSize);
      openCart();
    });
  }

  // PDP Pincode checker
  const pincodeCheckBtn = document.querySelector('#pincodeCheckBtn');
  if (pincodeCheckBtn) {
    pincodeCheckBtn.addEventListener('click', () => {
      const statusEl = document.querySelector('#deliveryStatus');
      if (statusEl) {
        statusEl.innerHTML = '<span style="color:#2e663b">✓ Express Delivery available in 2-4 days (COD verified)</span>';
        showToast('Pincode verified · Express Shipping Available');
      }
    });
  }

  // PDP Swatches
  document.querySelectorAll('.swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      const washTitle = swatch.getAttribute('title') || 'Classic Indigo';
      const washLabel = document.querySelector('.pdp-wash-name');
      if (washLabel) washLabel.textContent = washTitle;
    });
  });

  // Collection Quick Fit Filters
  document.querySelectorAll('.fit-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fit-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFitFilter = btn.dataset.fit || 'all';
      filterAndSortProducts();
    });
  });

  // Collection Filter Panel Checkboxes
  document.querySelectorAll('.filter-panel input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      filterAndSortProducts();
    });
  });

  // Collection Sort Toggle
  const sortBtn = document.querySelector('.sort');
  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      if (currentSortMode === 'featured') {
        currentSortMode = 'price-asc';
        sortBtn.textContent = 'Sort: Price: Low to High ⌄';
      } else if (currentSortMode === 'price-asc') {
        currentSortMode = 'price-desc';
        sortBtn.textContent = 'Sort: Price: High to Low ⌄';
      } else {
        currentSortMode = 'featured';
        sortBtn.textContent = 'Sort: Featured ⌄';
      }
      filterAndSortProducts();
    });
  }

  // Mobile Menu Toggle
  const menuToggle = document.querySelector('.menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      showToast('<b>Navigation</b>: <a href="#collection" style="color:#fff;text-decoration:underline;margin:0 4px">View All Jeans</a> · <a href="#fits" style="color:#fff;text-decoration:underline;margin:0 4px">Fits</a> · <a href="#story" style="color:#fff;text-decoration:underline;margin:0 4px">Our Denim</a>');
    });
  }

  // Size Guide trigger
  const sizeGuideBtn = document.querySelector('.size-guide-btn');
  if (sizeGuideBtn) {
    sizeGuideBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('📏 <b>Size Guide</b>: 28 (28" Waist) · 30 (30" Waist) · 32 (32" Waist) · 34 (34" Waist) · 36 (36" Waist)');
    });
  }

  // Global delegation
  document.addEventListener('click', e => {
    // Quick Add button click
    const quickAddBtn = e.target.closest('.quick-add');
    if (quickAddBtn) {
      e.stopPropagation();
      e.preventDefault();
      const pCard = quickAddBtn.closest('.product-card');
      const pId = pCard ? pCard.dataset.productId : quickAddBtn.dataset.quickAdd;
      addToCart(pId, '32');
      return;
    }

    // Search item quick add
    const searchAddBtn = e.target.closest('.search-item-add');
    if (searchAddBtn) {
      e.stopPropagation();
      const pId = searchAddBtn.dataset.searchAdd;
      addToCart(pId, '32');
      closeSearch();
      return;
    }

    // Search item click to view PDP
    const searchItem = e.target.closest('.search-item');
    if (searchItem && !e.target.closest('.search-item-add')) {
      const pId = searchItem.dataset.searchProduct;
      closeSearch();
      loadProductToPdp(pId);
      return;
    }

    // Cart Stepper - Inc
    const incBtn = e.target.closest('.cart-inc');
    if (incBtn) {
      const idx = Number(incBtn.dataset.incIndex);
      updateCartQty(idx, 1);
      return;
    }

    // Cart Stepper - Dec
    const decBtn = e.target.closest('.cart-dec');
    if (decBtn) {
      const idx = Number(decBtn.dataset.decIndex);
      updateCartQty(idx, -1);
      return;
    }

    // Cart Remove
    const removeBtn = e.target.closest('.cart-item-remove');
    if (removeBtn) {
      const idx = Number(removeBtn.dataset.removeIndex);
      removeCartItem(idx);
      return;
    }

    // Empty Cart shop button
    if (e.target.id === 'cartShopBtn') {
      closeCart();
      resetAllCollectionFilters();
      navigateTo('#collection');
      return;
    }

    // Reset filters button from empty collection state
    if (e.target.id === 'resetCollectionFiltersBtn') {
      resetAllCollectionFilters();
      return;
    }

    // Product Card click (Navigate to PDP)
    const productCardEl = e.target.closest('.product-card');
    if (productCardEl && !e.target.closest('.quick-add')) {
      const pId = productCardEl.dataset.productId;
      loadProductToPdp(pId);
      return;
    }

    // Fit grid buttons on Home
    const fitGridBtn = e.target.closest('.fit-grid button');
    if (fitGridBtn) {
      const fit = fitGridBtn.dataset.fit;
      currentFitFilter = fit;
      document.querySelectorAll('.fit-filter-btn').forEach(b => {
        b.classList.toggle('active', (b.dataset.fit || '').toLowerCase() === fit.toLowerCase());
      });
      document.querySelectorAll('.filter-panel input[type="checkbox"]').forEach(cb => cb.checked = false);
      filterAndSortProducts();
      navigateTo('#collection');
      return;
    }

    // Links to collection (e.g. "View all", "Shop jeans", "Explore denim", "Jeans", "Shop" in footer)
    const collLink = e.target.closest('a[href="#collection"]');
    if (collLink) {
      e.preventDefault();
      resetAllCollectionFilters();
      navigateTo('#collection');
      return;
    }

    // Links to new arrivals / shop section on home
    const shopSectionLink = e.target.closest('a[href="#shop"]');
    if (shopSectionLink) {
      e.preventDefault();
      navigateTo('#home');
      const shopSec = document.querySelector('#shop');
      if (shopSec) shopSec.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Links to home / wordmark
    const homeLink = e.target.closest('a[href="#home"], .wordmark');
    if (homeLink) {
      e.preventDefault();
      navigateTo('#home');
      return;
    }

    const fitsLink = e.target.closest('a[href="#fits"]');
    if (fitsLink) {
      e.preventDefault();
      navigateTo('#home');
      const fitSec = document.querySelector('#fits');
      if (fitSec) fitSec.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const storyLink = e.target.closest('a[href="#story"]');
    if (storyLink) {
      e.preventDefault();
      navigateTo('#home');
      const storySec = document.querySelector('#story');
      if (storySec) storySec.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Footer search trigger
    const footerSearch = e.target.closest('.footer-search-trigger');
    if (footerSearch) {
      e.preventDefault();
      openSearch();
      return;
    }

    // Footer contact trigger
    const footerContact = e.target.closest('.footer-contact-trigger');
    if (footerContact) {
      e.preventDefault();
      showToast('Support: care@infitdenim.com · +91 98200 12345 (Mon–Sat)');
      return;
    }

    // Footer track order trigger
    const footerTrack = e.target.closest('.footer-track-trigger');
    if (footerTrack) {
      e.preventDefault();
      showToast('Track Order: Check your SMS/WhatsApp for the tracking link');
      return;
    }

    // Footer policy links
    const policyLink = e.target.closest('.footer-policy-link');
    if (policyLink) {
      e.preventDefault();
      const policyName = policyLink.dataset.policy || 'Policy';
      showToast(`<b>${policyName}</b>: 7-day doorstep exchanges & COD available across India`);
      return;
    }

    // Filter Trigger Panel
    if (e.target.closest('.filter-trigger')) {
      const panel = document.querySelector('.filter-panel');
      if (panel) panel.classList.toggle('open');
    }

    // Toast close
    if (e.target.closest('.toast span')) {
      document.querySelector('.toast').classList.remove('show');
    }
  });

  // Keyboard accessibility (ESC to close modals)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeSearch();
      closeCart();
    }
  });
});

// Run immediate init in case DOM is already parsed
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  drawProducts();
  setTheme('minimal');
  renderCart();
}
