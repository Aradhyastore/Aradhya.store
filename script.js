const ARADHYA_API_BASE = "https://aradhyabackend.www-aradhya-co.workers.dev";
let cart = [];
let checkoutSubmitting = false;

function adjustShopQty(button, delta) {
  const row = button.parentElement;
  const value = row.querySelector('span');
  const next = Math.max(1, Math.min(99, parseInt(value.textContent || '1', 10) + delta));
  value.textContent = next;
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(id);
  if (page) page.classList.add('active');
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  const map = {home:0,products:1,gallery:2,mission:3,about:4,support:5};
  const navButton = document.querySelectorAll('nav button')[map[id]];
  if (navButton) navButton.classList.add('active');
  // Navigation intentionally does not force the browser back to the top.
  document.body.classList.remove('cart-open');
}

const PRODUCTS = {
  'white-lily': {id:1,name:'White Lily',price:299,fragrance:'Soft, clean and floral White Lily fragrance.',images:['assets/image-3.png','assets/image-3.png']},
  'white-oudh': {id:2,name:'White Oudh',price:299,fragrance:'A rich, warm and elegant White Oudh fragrance.',images:['assets/image-3.png','assets/image-3.png']},
  'mysore-chandan': {id:3,name:'Mysore Chandan',price:299,fragrance:'A classic sandalwood-inspired Mysore Chandan fragrance.',images:['assets/image-3.png','assets/image-3.png']},
  'lavender': {id:4,name:'Lavender',price:299,fragrance:'A calm, soothing Lavender fragrance for relaxed moments.',images:['assets/image-3.png','assets/image-3.png']},
  'pineapple': {id:5,name:'Pineapple',price:299,fragrance:'A fresh, bright and fruity Pineapple fragrance.',images:['assets/image-3.png','assets/image-3.png']},
  'mysore-kewda': {id:6,name:'Mysore Kewda',price:299,fragrance:'A distinctive traditional Mysore Kewda fragrance with a graceful floral character.',images:['assets/image-3.png','assets/image-3.png']},
  'mix-rose-bela-chandan-kewda': {id:7,name:'Mix – Rose, Bela, Chandan & Kewda',price:499,fragrance:'A blended combination of Rose, Bela, Chandan and Kewda.',images:['assets/image-3.png','assets/image-9.webp','assets/image-3.png']},
  'mix-white-lily-chandan-white-oudh': {id:8,name:'Mix – White Lily, Chandan, White Oudh, Mysore Kewda & Pineapple',price:499,fragrance:'A blended combination of White Lily, Chandan, White Oudh, Mysore Kewda and Pineapple.',images:['assets/image-3.png','assets/image-8.webp','assets/image-3.png']}
};

function openProductDetail(slug) {
  const product = PRODUCTS[slug];
  if (!product) return;
  const detail = document.getElementById('productDetailContent');
  if (!detail) return;
  const mixed = product.id === 7 || product.id === 8;
  const images = product.images.map((src,i) => `<img class="product-detail-thumb ${i===0?'active':''}" src="${src}" alt="${escapeHTML(product.name)} image ${i+1}" onclick="selectProductImage('${escapeHTML(src)}',this)">`).join('');
  detail.innerHTML = `
    <div class="product-detail-shell">
      <button type="button" class="btn product-detail-back" onclick="showPage('products')">← Back to Shop</button>
      <div class="product-detail-top">
        <div class="product-detail-gallery">
          <img id="productDetailMainImage" class="product-detail-main-image" src="${product.images[0]}" alt="${escapeHTML(product.name)}">
          <div class="product-detail-thumbs">${images}</div>
        </div>
        <div class="product-detail-info">
          <div class="eyebrow">ARADHYA • PREMIUM DHOOP CONES</div>
          <h2>${escapeHTML(product.name)}</h2>
          <span class="weight-pill">650 g</span>
          <div class="product-detail-price">₹${product.price.toLocaleString('en-IN')}</div>
          <div class="detail-fragrance"><strong>Fragrance:</strong> ${escapeHTML(product.fragrance)}</div>
          <p>Bring a soothing fragrance to your home with Aradhya Premium Dhoop Cones. Designed for everyday पूजा, meditation, relaxation, and creating a pleasant atmosphere, these aromatic cones add a traditional touch to your daily rituals.</p>
          <h3>Ingredients</h3>
          <ul><li>Charcoal Powder</li><li>Natural Oils</li><li>Herbal Extracts</li><li>Wood Powder</li><li>Resins &amp; Gums</li></ul>
          <h3>How to Use</h3>
          <ol><li>Place one dhoop cone upright on a heat-resistant holder.</li><li>Carefully light the tip.</li><li>Allow the tip to catch fire briefly, then gently extinguish the flame if required by the product instructions.</li><li>Allow the cone to smoulder and release fragrance.</li></ol>
          <h3>Safety</h3>
          <ul><li>Do not ingest.</li><li>Avoid direct inhalation of smoke.</li><li>Use in a well-ventilated area.</li><li>Keep away from children and pets.</li><li>Keep away from flammable objects.</li><li>Do not touch hot ash or holder until cooled.</li></ul>
          ${mixed ? '<p class="detail-fragrance"><strong>Mix fragrance:</strong> This product uses the dedicated mixed-fragrance cone image in the gallery.</p>' : ''}
          <div class="product-detail-actions">
            <button type="button" class="btn" onclick="addToCart('${escapeHTML(product.name)}',${product.price},${product.id},this)">🛒 Add to Cart</button>
          </div>
        </div>
      </div>
    </div>`;
  showPage('product-detail');
}

function selectProductImage(src, thumb) {
  const main = document.getElementById('productDetailMainImage');
  if (main) main.src = src;
  document.querySelectorAll('.product-detail-thumb').forEach(t => t.classList.remove('active'));
  if (thumb) thumb.classList.add('active');
}

function addToCart(name, price, productId, button) {
  const id = Number(productId);
  if (!Number.isInteger(id) || id < 1 || id > 8) {
    showToast('This product is not available for ordering yet.');
    return;
  }
  let selectedQty = 1;
  const card = button && button.closest('.shop-product-card');
  const qtyNode = card && card.querySelector('.qty-row span');
  if (qtyNode) selectedQty = Math.max(1, Math.min(99, parseInt(qtyNode.textContent || '1', 10)));
  const existing = cart.find(item => item.id === id);
  if (existing) existing.qty = Math.min(99, existing.qty + selectedQty);
  else cart.push({id, name, price:Number(price), qty:selectedQty});
  if (qtyNode) qtyNode.textContent = '1';
  renderCart();
  document.getElementById('cartPanel').classList.add('open');
  showToast(name + ' added to your cart.');
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.id === Number(productId));
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== Number(productId));
  else item.qty = Math.min(99, item.qty);
  renderCart();
}

function escapeHTML(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function renderCart() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartTotal').textContent = getCartTotal().toLocaleString('en-IN');
  const box = document.getElementById('cartItems');
  if (!cart.length) {
    box.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
    return;
  }
  box.innerHTML = cart.map(item => `
    <div class="cart-item">
      <span>${escapeHTML(item.name)}<br><small>₹${item.price.toLocaleString('en-IN')} × ${item.qty}</small></span>
      <span style="display:flex;align-items:center;gap:5px;flex-shrink:0">
        <button class="cart-close" type="button" aria-label="Remove one ${escapeHTML(item.name)}" onclick="changeQty(${item.id},-1)">−</button>
        <span>${item.qty}</span>
        <button class="cart-close" type="button" aria-label="Add one ${escapeHTML(item.name)}" onclick="changeQty(${item.id},1)">+</button>
      </span>
    </div>`).join('');
}

function toggleCart() { document.getElementById('cartPanel').classList.toggle('open'); }
function openModal(src) { document.getElementById('modalImage').src = src; document.getElementById('imageModal').classList.add('open'); }
function closeModal() { document.getElementById('imageModal').classList.remove('open'); document.getElementById('modalImage').src = ''; }

function showToast(message) {
  let toast = document.getElementById('aradhyaToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'aradhyaToast';
    toast.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:1200;max-width:calc(100% - 28px);padding:12px 18px;border:1px solid #b88b35;border-radius:12px;background:#100d08;color:#f5d77a;font:14px Arial,sans-serif;box-shadow:0 8px 28px #0009;text-align:center';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.display = 'block';
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => { toast.style.display = 'none'; }, 2600);
}

function openCheckout() {
  if (!cart.length) { showToast('Your cart is empty. Add a product first.'); return; }
  if (document.getElementById('checkoutLayer')) return;
  document.getElementById('cartPanel').classList.remove('open');
  const layer = document.createElement('div');
  layer.className = 'checkout-layer';
  layer.id = 'checkoutLayer';
  layer.innerHTML = `
    <section class="checkout-dialog" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle">
      <button class="checkout-close-btn" type="button" aria-label="Close checkout" id="checkoutClose">×</button>
      <div class="eyebrow">ARADHYA • SECURE ORDER REQUEST</div>
      <h2 id="checkoutTitle">Delivery Details</h2>
      <p class="checkout-intro">Enter your details to place your Aradhya order. Online payment is not enabled yet.</p>
      <form id="checkoutForm" class="checkout-form">
        <label>Full name <input name="name" id="checkoutName" autocomplete="name" maxlength="100" required placeholder="Your full name"></label>
        <label>Mobile number <input name="phone" id="checkoutPhone" type="tel" inputmode="numeric" autocomplete="tel" maxlength="10" pattern="[6-9][0-9]{9}" required placeholder="10-digit Indian mobile number"></label>
        <label>Email address (optional) <input name="email" id="checkoutEmail" type="email" autocomplete="email" maxlength="150" placeholder="you@example.com"></label>
        <label>Full delivery address <textarea name="address" id="checkoutAddress" autocomplete="street-address" maxlength="600" required placeholder="House / street / area / city / state / PIN code"></textarea></label>
        <div class="checkout-summary" id="checkoutSummary"></div>
        <div class="checkout-payment-note">Payment: <strong>Cash on Delivery / confirm manually</strong><br>Online payments are intentionally disabled for now. Please wait for the order confirmation screen after submitting.</div>
        <button class="btn checkout-submit" id="placeOrderBtn" type="submit">PLACE ORDER →</button>
        <p style="color:#9e8e67;font:11px/1.5 Arial,sans-serif;text-align:center">Your order total is verified by Aradhya's order server before the order is saved.</p>
      </form>
    </section>`;
  document.body.appendChild(layer);
  layer.querySelector('#checkoutSummary').innerHTML = buildCartSummaryHTML();
  layer.querySelector('#checkoutClose').addEventListener('click', closeCheckout);
  layer.addEventListener('click', e => { if (e.target === layer) closeCheckout(); });
  layer.querySelector('#checkoutForm').addEventListener('submit', submitOrder);
  document.getElementById('checkoutName').focus();
}

function buildCartSummaryHTML() {
  const lines = cart.map(item => `<div class="checkout-summary-line"><span>${escapeHTML(item.name)} × ${item.qty}</span><span>₹${(item.price * item.qty).toLocaleString('en-IN')}</span></div>`).join('');
  return `<div style="font:12px Arial,sans-serif;letter-spacing:1.2px;color:#c7a85f;margin-bottom:6px">YOUR ORDER</div>${lines}<div class="checkout-summary-total"><span>Estimated total</span><strong>₹${getCartTotal().toLocaleString('en-IN')}</strong></div>`;
}

function closeCheckout() {
  const layer = document.getElementById('checkoutLayer');
  if (layer && !checkoutSubmitting) layer.remove();
}

async function submitOrder(event) {
  event.preventDefault();
  if (checkoutSubmitting || !cart.length) return;
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const name = document.getElementById('checkoutName').value.trim();
  const phone = document.getElementById('checkoutPhone').value.trim();
  const email = document.getElementById('checkoutEmail').value.trim();
  const address = document.getElementById('checkoutAddress').value.trim();
  if (!/^[6-9][0-9]{9}$/.test(phone)) {
    document.getElementById('checkoutPhone').setCustomValidity('Enter a valid 10-digit Indian mobile number.');
    document.getElementById('checkoutPhone').reportValidity();
    document.getElementById('checkoutPhone').setCustomValidity('');
    return;
  }
  const submittedCart = cart.map(item => ({...item}));
  const estimatedTotal = submittedCart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const button = document.getElementById('placeOrderBtn');
  checkoutSubmitting = true;
  button.disabled = true;
  button.textContent = 'SUBMITTING ORDER…';
  const requestController = new AbortController();
  const requestTimeout = setTimeout(() => requestController.abort(), 20000);
  try {
    const response = await fetch(ARADHYA_API_BASE + '/create-order', {
      method: 'POST',
      headers: {'Content-Type':'application/json', 'Accept':'application/json'},
      signal: requestController.signal,
      body: JSON.stringify({
        customer: {name, phone, email, address},
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        customer_address: address,
        payment_method: 'cod',
        currency: 'INR',
        items: submittedCart.map(item => ({product_id:item.id, id:item.id, quantity:item.qty}))
      })
    });
    let data = {};
    try { data = await response.json(); } catch (_) { data = {}; }
    if (!response.ok || data.success === false || data.error) {
      throw new Error(data.message || data.error || 'We could not save your order. Please check your details and try again.');
    }
    const order = data.order || data.data || {};
    const orderId = data.order_id || data.orderId || order.order_id || order.id || data.id || '';
    if (data.success !== true && !orderId) {
      throw new Error(data.message || 'The server did not confirm that the order was saved. Please try again.');
    }
    const confirmedTotal = Number(data.total ?? data.total_amount ?? order.total ?? order.total_amount);
    const finalTotal = Number.isFinite(confirmedTotal) && confirmedTotal >= 0 ? confirmedTotal : estimatedTotal;
    cart = [];
    renderCart();
    const layer = document.getElementById('checkoutLayer');
    if (layer) layer.remove();
    checkoutSubmitting = false;
    showOrderConfirmation({orderId, name, phone, address, items:submittedCart, total:finalTotal});
  } catch (error) {
    console.error('Aradhya order submission error:', error);
    const message = error && error.name === 'AbortError'
      ? 'The order server took too long to respond. Please check your order status before submitting again.'
      : (error && error.message ? error.message : 'Unable to connect to the order server. Please try again.');
    const errorBox = document.getElementById('checkoutError');
    if (errorBox) errorBox.textContent = message;
    else {
      const box = document.createElement('p');
      box.id = 'checkoutError';
      box.setAttribute('role','alert');
      box.style.cssText = 'color:#ffb8a8;font:13px/1.5 Arial,sans-serif;margin-top:8px';
      box.textContent = message;
      const formEl = document.getElementById('checkoutForm');
      if (formEl) formEl.insertBefore(box, formEl.querySelector('.checkout-submit'));
    }
  } finally {
    clearTimeout(requestTimeout);
    checkoutSubmitting = false;
    const currentButton = document.getElementById('placeOrderBtn');
    if (currentButton) { currentButton.disabled = false; currentButton.textContent = 'PLACE ORDER →'; }
  }
}

function showOrderConfirmation(order) {
  const layer = document.createElement('div');
  layer.className = 'checkout-layer';
  layer.id = 'orderConfirmationLayer';
  const reference = order.orderId ? escapeHTML(order.orderId) : 'Order received';
  const lines = order.items.map(item => `<div class="checkout-summary-line"><span>${escapeHTML(item.name)} × ${item.qty}</span><span>₹${(item.price * item.qty).toLocaleString('en-IN')}</span></div>`).join('');
  layer.innerHTML = `
    <section class="checkout-dialog order-success" role="dialog" aria-modal="true" aria-labelledby="orderSuccessTitle">
      <div class="order-success-mark">✓</div>
      <div class="eyebrow">ARADHYA • ORDER REQUEST RECEIVED</div>
      <h2 id="orderSuccessTitle">Thank you, ${escapeHTML(order.name)}.</h2>
      <p class="checkout-intro">Your order request has been saved. Keep your order reference for any follow-up with Aradhya.</p>
      <div class="order-reference">${reference}</div>
      <div class="order-success-items">${lines}<div class="checkout-summary-total"><span>Order total</span><strong>₹${Number(order.total).toLocaleString('en-IN')}</strong></div></div>
      <p class="checkout-payment-note" style="text-align:left">Payment method: Cash on Delivery / manual confirmation.<br>We may contact you on ${escapeHTML(order.phone)} to confirm delivery details. Online payment has not been taken.</p>
      <button class="btn" type="button" id="confirmationDone" style="width:100%;margin-top:18px">CONTINUE SHOPPING</button>
    </section>`;
  document.body.appendChild(layer);
  layer.querySelector('#confirmationDone').addEventListener('click', () => layer.remove());
  layer.addEventListener('click', e => { if (e.target === layer) layer.remove(); });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    document.getElementById('cartPanel').classList.remove('open');
    closeCheckout();
    const confirmation = document.getElementById('orderConfirmationLayer');
    if (confirmation) confirmation.remove();
  }
});


function saveCart() {
  try { localStorage.setItem('aradhyaCart', JSON.stringify(cart)); } catch (_) {}
}
function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('aradhyaCart') || '[]');
    if (Array.isArray(saved)) cart = saved.filter(i => i && Number.isInteger(Number(i.id)) && Number(i.id)>=1 && Number(i.id)<=8).map(i => ({id:Number(i.id),name:String(i.name),price:Number(i.price),qty:Math.max(1,Math.min(99,Number(i.qty)||1))}));
  } catch (_) { cart = []; }
}
const _oldRenderCart = renderCart;
renderCart = function(){ _oldRenderCart(); saveCart(); };

document.addEventListener('DOMContentLoaded', () => {
  loadCart();
  renderCart();
  const home = document.getElementById('home');
  if (home) showPage('home');
  document.querySelectorAll('.shop-product-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', event => {
      if (event.target.closest('button') || event.target.closest('a')) return;
      const title = card.querySelector('h4');
      if (!title) return;
      const slug = Object.keys(PRODUCTS).find(key => PRODUCTS[key].name === title.textContent.trim());
      if (slug) openProductDetail(slug);
    });
  });
});
