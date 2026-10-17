/* =========================================================
   ARADHYA - STORE / CART / CHECKOUT SCRIPT
   ========================================================= */

const ARADHYA_API_BASE =
  "https://aradhyabackend.www-aradhya-co.workers.dev";

let cart = [];
let checkoutSubmitting = false;


/* =========================================================
   PRODUCT DATA
   ========================================================= */

const PRODUCTS = {
  "white-lily": {
    id: 1,
    name: "White Lily",
    price: 299,
    weight: "650 g"
  },

  "white-oudh": {
    id: 2,
    name: "White Oudh",
    price: 299,
    weight: "650 g"
  },

  "mysore-chandan": {
    id: 3,
    name: "Mysore Chandan",
    price: 299,
    weight: "650 g"
  },

  "lavender": {
    id: 4,
    name: "Lavender",
    price: 299,
    weight: "650 g"
  },

  "pineapple": {
    id: 5,
    name: "Pineapple",
    price: 299,
    weight: "650 g"
  },

  "mysore-kewda": {
    id: 6,
    name: "Mysore Kewda",
    price: 299,
    weight: "650 g"
  },

  "mix-rose-bela-chandan-kewda": {
    id: 7,
    name: "Mix – Rose, Bela, Chandan & Kewda",
    price: 499,
    weight: "650 g"
  },

  "mix-white-lily-chandan-white-oudh-mysore-kewda-pineapple": {
    id: 8,
    name: "Mix – White Lily, Chandan, White Oudh, Mysore Kewda & Pineapple",
    price: 499,
    weight: "650 g"
  }
};


/* =========================================================
   CART STORAGE
   ========================================================= */

function loadCart() {
  try {
    const saved = localStorage.getItem("aradhyaCart");

    if (!saved) {
      cart = [];
      return;
    }

    const parsed = JSON.parse(saved);

    if (Array.isArray(parsed)) {
      cart = parsed;
    } else {
      cart = [];
    }
  } catch (error) {
    console.error("Could not load Aradhya cart:", error);
    cart = [];
  }
}


function saveCart() {
  try {
    localStorage.setItem("aradhyaCart", JSON.stringify(cart));
  } catch (error) {
    console.error("Could not save Aradhya cart:", error);
  }
}


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function getCartTotal() {
  return cart.reduce(function (total, item) {
    return total + (Number(item.price) * Number(item.qty || 0));
  }, 0);
}


function getCartQuantity() {
  return cart.reduce(function (total, item) {
    return total + Number(item.qty || 0);
  }, 0);
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {
  let toast = document.getElementById("aradhyaToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "aradhyaToast";

    toast.style.cssText = `
      position:fixed;
      left:50%;
      bottom:30px;
      transform:translateX(-50%) translateY(20px);
      background:#111;
      color:#d4af37;
      border:1px solid rgba(212,175,55,.55);
      padding:13px 20px;
      border-radius:8px;
      font:600 14px/1.4 Arial,sans-serif;
      box-shadow:0 12px 35px rgba(0,0,0,.35);
      z-index:100000;
      opacity:0;
      pointer-events:none;
      transition:all .25s ease;
      max-width:90vw;
      text-align:center;
    `;

    document.body.appendChild(toast);
  }

  toast.textContent = message;

  requestAnimationFrame(function () {
    toast.style.opacity = "1";
    toast.style.transform =
      "translateX(-50%) translateY(0)";
  });

  clearTimeout(window.aradhyaToastTimer);

  window.aradhyaToastTimer = setTimeout(function () {
    toast.style.opacity = "0";
    toast.style.transform =
      "translateX(-50%) translateY(20px)";
  }, 2200);
}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(pageId) {
  const pages = document.querySelectorAll(".page");

  pages.forEach(function (page) {
    page.classList.remove("active");
  });

  const target = document.getElementById(pageId);

  if (target) {
    target.classList.add("active");
  }

  const navButtons = document.querySelectorAll("nav button");

  navButtons.forEach(function (button) {
    button.classList.remove("active");
  });

  const pageMap = {
    home: 0,
    products: 1,
    gallery: 2,
    mission: 3,
    about: 4,
    support: 5
  };

  if (
    Object.prototype.hasOwnProperty.call(pageMap, pageId) &&
    navButtons[pageMap[pageId]]
  ) {
    navButtons[pageMap[pageId]].classList.add("active");
  }

  /*
    Important:
    We intentionally do NOT force window.scrollTo(0, 0)
    here. This prevents product/detail navigation from
    jumping the visitor back to the top.
  */
}


/* =========================================================
   PRODUCT DETAIL
   ========================================================= */

function openProductDetail(productKey) {
  const detailId = "product-detail-" + productKey;

  const detail = document.getElementById(detailId);

  if (detail) {
    /*
      Hide other product details if they exist.
    */
    document.querySelectorAll(".product-detail").forEach(function (item) {
      item.classList.remove("active");
    });

    detail.classList.add("active");

    /*
      Keep the visitor at the product area rather than
      jumping to the website top.
    */
    detail.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    return;
  }

  /*
    Fallback:
    If the HTML does not contain a dedicated detail section,
    show a small message instead of breaking the page.
  */
  const product = PRODUCTS[productKey];

  if (product) {
    showToast(product.name + " details are available below.");
  }
}


/* =========================================================
   SHOP QUANTITY
   ========================================================= */

function adjustShopQty(button, delta) {
  if (!button) return;

  const row = button.parentElement;

  if (!row) return;

  const value = row.querySelector("span");

  if (!value) return;

  let current = parseInt(value.textContent || "1", 10);

  if (Number.isNaN(current)) {
    current = 1;
  }

  const next = Math.max(
    1,
    Math.min(99, current + Number(delta || 0))
  );

  value.textContent = String(next);
}


/* =========================================================
   ADD TO CART
   ========================================================= */

function addToCart(name, price, quantity, button) {
  const numericPrice = Number(price);
  const numericQuantity = Math.max(
    1,
    Number(quantity) || 1
  );

  if (!name || !Number.isFinite(numericPrice)) {
    showToast("Product information is missing.");
    return;
  }

  /*
    Try to find the product ID from our catalogue.
  */
  let productId = null;

  Object.keys(PRODUCTS).forEach(function (key) {
    if (PRODUCTS[key].name === name) {
      productId = PRODUCTS[key].id;
    }
  });

  const existing = cart.find(function (item) {
    return item.name === name;
  });

  if (existing) {
    existing.qty = Math.min(
      99,
      Number(existing.qty || 0) + numericQuantity
    );
  } else {
    cart.push({
      id: productId,
      name: name,
      price: numericPrice,
      qty: numericQuantity,
      weight: "650 g"
    });
  }

  saveCart();
  renderCart();

  showToast(name + " added to cart ✓");

  /*
    Small visual feedback on the clicked button.
  */
  if (button) {
    const originalText = button.innerHTML;

    button.innerHTML = "✓ Added";

    setTimeout(function () {
      if (button) {
        button.innerHTML = originalText;
      }
    }, 1000);
  }
}


/* =========================================================
   REMOVE / CHANGE CART QUANTITY
   ========================================================= */

function changeQty(index, delta) {
  if (!cart[index]) return;

  const next = Number(cart[index].qty || 0) + Number(delta || 0);

  if (next <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].qty = Math.min(99, next);
  }

  saveCart();
  renderCart();
}


function removeFromCart(index) {
  if (!cart[index]) return;

  cart.splice(index, 1);

  saveCart();
  renderCart();
}


/* =========================================================
   RENDER CART
   ========================================================= */

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  const cartCount = document.getElementById("cartCount");

  if (cartCount) {
    cartCount.textContent = String(getCartQuantity());
  }

  if (cartTotal) {
    cartTotal.textContent = String(getCartTotal());
  }

  if (!cartItems) return;

  if (cart.length === 0) {
    cartItems.innerHTML =
      '<div class="cart-empty">Your cart is empty.</div>';

    return;
  }

  cartItems.innerHTML = cart.map(function (item, index) {
    const lineTotal =
      Number(item.price) * Number(item.qty || 0);

    return `
      <div class="cart-item">

        <div class="cart-item-info">

          <div>
            <strong>${escapeHTML(item.name)}</strong>

            <div style="
              font-size:12px;
              opacity:.7;
              margin-top:4px;
            ">
              ${escapeHTML(item.weight || "650 g")}
            </div>
          </div>

          <span>
            ₹${lineTotal}
          </span>

        </div>

        <div class="cart-item-actions">

          <button
            type="button"
            onclick="changeQty(${index},-1)"
            aria-label="Decrease quantity"
          >
            −
          </button>

          <span>
            ${Number(item.qty || 0)}
          </span>

          <button
            type="button"
            onclick="changeQty(${index},1)"
            aria-label="Increase quantity"
          >
            +
          </button>

          <button
            type="button"
            onclick="removeFromCart(${index})"
          >
            Remove
          </button>

        </div>

      </div>
    `;
  }).join("");
}


/* =========================================================
   CART OPEN / CLOSE
   ========================================================= */

function toggleCart() {
  const panel = document.getElementById("cartPanel");

  if (!panel) return;

  panel.classList.toggle("open");

  renderCart();
}


/* =========================================================
   CHECKOUT
   ========================================================= */

function openCheckout() {
  if (cart.length === 0) {
    showToast("Your cart is empty.");
    return;
  }

  if (document.getElementById("checkoutLayer")) {
    return;
  }

  const estimatedTotal = getCartTotal();

  const layer = document.createElement("div");

  layer.className = "checkout-layer";
  layer.id = "checkoutLayer";

  layer.innerHTML = `
    <div
      class="checkout-overlay"
      id="checkoutOverlay"
    ></div>

    <div class="checkout-modal">

      <button
        type="button"
        class="checkout-close"
        id="checkoutClose"
        aria-label="Close checkout"
      >
        ×
      </button>

      <div class="eyebrow">
        ARADHYA CHECKOUT
      </div>

      <h2>
        PLACE YOUR ORDER
      </h2>

      <p>
        Order total:
        <strong>₹${estimatedTotal}</strong>
      </p>

      <form id="checkoutForm">

        <label>
          Name
          <input
            id="customerName"
            type="text"
            required
            autocomplete="name"
            placeholder="Your full name"
          >
        </label>

        <label>
          Phone
          <input
            id="customerPhone"
            type="tel"
            required
            inputmode="numeric"
            maxlength="10"
            autocomplete="tel"
            placeholder="10-digit mobile number"
          >
        </label>

        <label>
          Email
          <span style="
            font-size:11px;
            opacity:.65;
            font-weight:400;
          ">
            (optional)
          </span>

          <input
            id="customerEmail"
            type="email"
            autocomplete="email"
            placeholder="your@email.com"
          >
        </label>

        <label>
          Delivery Address

          <textarea
            id="customerAddress"
            required
            autocomplete="street-address"
            placeholder="House / street / area / city / pincode"
          ></textarea>
        </label>

        <label>
          Order Notes
          <span style="
            font-size:11px;
            opacity:.65;
            font-weight:400;
          ">
            (optional)
          </span>

          <textarea
            id="customerNotes"
            placeholder="Any delivery instructions?"
            style="min-height:70px"
          ></textarea>
        </label>

        <div
          id="checkoutError"
          role="alert"
          style="
            display:none;
            color:#ffb8a8;
            font:13px/1.5 Arial,sans-serif;
            margin:10px 0;
          "
        ></div>

        <button
          class="btn checkout-submit"
          id="placeOrderBtn"
          type="submit"
          style="width:100%"
        >
          PLACE ORDER →
        </button>

        <p class="checkout-help">
          Currently accepting order requests with
          Cash on Delivery / manual confirmation.
          Online payment can be added later.
        </p>

      </form>

    </div>
  `;

  document.body.appendChild(layer);

  const closeButton =
    document.getElementById("checkoutClose");

  const overlay =
    document.getElementById("checkoutOverlay");

  if (closeButton) {
    closeButton.addEventListener("click", closeCheckout);
  }

  if (overlay) {
    overlay.addEventListener("click", closeCheckout);
  }

  const form =
    document.getElementById("checkoutForm");

  if (form) {
    form.addEventListener("submit", submitOrder);
  }

  /*
    Close cart behind checkout.
  */
  const cartPanel =
    document.getElementById("cartPanel");

  if (cartPanel) {
    cartPanel.classList.remove("open");
  }
}


/* =========================================================
   CLOSE CHECKOUT
   ========================================================= */

function closeCheckout() {
  const layer =
    document.getElementById("checkoutLayer");

  if (layer) {
    layer.remove();
  }

  checkoutSubmitting = false;
}


/* =========================================================
   SUBMIT ORDER TO CLOUDFLARE WORKER
   ========================================================= */

async function submitOrder(event) {
  event.preventDefault();

  if (checkoutSubmitting) {
    return;
  }

  if (cart.length === 0) {
    showToast("Your cart is empty.");
    closeCheckout();
    return;
  }

  const name =
    document.getElementById("customerName")?.value.trim() || "";

  const phone =
    document.getElementById("customerPhone")?.value.trim() || "";

  const email =
    document.getElementById("customerEmail")?.value.trim() || "";

  const address =
    document.getElementById("customerAddress")?.value.trim() || "";

  const notes =
    document.getElementById("customerNotes")?.value.trim() || "";

  const errorBox =
    document.getElementById("checkoutError");

  const submitButton =
    document.getElementById("placeOrderBtn");

  /*
    Basic validation
  */

  if (name.length < 2) {
    showCheckoutError(
      "Please enter your full name."
    );
    return;
  }

  const cleanPhone = phone.replace(/\D/g, "");

  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    showCheckoutError(
      "Please enter a valid 10-digit Indian mobile number."
    );
    return;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showCheckoutError(
      "Please enter a valid email address."
    );
    return;
  }

  if (address.length < 10) {
    showCheckoutError(
      "Please enter your complete delivery address."
    );
    return;
  }

  checkoutSubmitting = true;

  if (errorBox) {
    errorBox.style.display = "none";
    errorBox.textContent = "";
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "SUBMITTING ORDER…";
  }

  /*
    Make a snapshot so the cart cannot change while
    the request is being submitted.
  */
  const submittedCart = cart.map(function (item) {
    return {
      id: Number(item.id),
      product_id: Number(item.id),
      name: item.name,
      price: Number(item.price),
      qty: Number(item.qty),
      quantity: Number(item.qty)
    };
  });

  const estimatedTotal = getCartTotal();

  const requestController =
    new AbortController();

  const requestTimeout =
    setTimeout(function () {
      requestController.abort();
    }, 20000);

  try {

    const response = await fetch(
      ARADHYA_API_BASE + "/create-order",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },

        signal: requestController.signal,

        body: JSON.stringify({

          customer: {
            name: name,
            phone: cleanPhone,
            email: email,
            address: address
          },

          customer_name: name,
          customer_phone: cleanPhone,
          customer_email: email,
          customer_address: address,

          customer_notes: notes,

          payment_method: "cod",

          currency: "INR",

          items: submittedCart.map(function (item) {
            return {
              product_id: item.product_id,
              id: item.id,
              quantity: item.quantity
            };
          })
        })
      }
    );

    let data = {};

    try {
      data = await response.json();
    } catch (jsonError) {
      data = {};
    }

    if (
      !response.ok ||
      data.success === false ||
      data.error
    ) {
      throw new Error(
        data.message ||
        data.error ||
        "We could not save your order. Please try again."
      );
    }

    const order =
      data.order ||
      data.data ||
      {};

    const orderId =
      data.order_id ||
      data.orderId ||
      order.order_id ||
      order.id ||
      data.id ||
      "";

    /*
      Do not tell the customer the order succeeded
      unless the server actually confirmed it.
    */
    if (data.success !== true && !orderId) {
      throw new Error(
        data.message ||
        "The server did not confirm that the order was saved."
      );
    }

    const confirmedTotal =
      Number(
        data.total ??
        data.total_amount ??
        order.total ??
        order.total_amount
      );

    const finalTotal =
      Number.isFinite(confirmedTotal) &&
      confirmedTotal >= 0
        ? confirmedTotal
        : estimatedTotal;

    /*
      Clear cart only AFTER successful backend response.
    */
    cart = [];

    saveCart();
    renderCart();

    closeCheckout();

    showOrderConfirmation({
      orderId: orderId,
      name: name,
      phone: cleanPhone,
      address: address,
      items: submittedCart,
      total: finalTotal
    });

  } catch (error) {

    console.error(
      "Aradhya order submission error:",
      error
    );

    let message =
      "Unable to connect to the order server. Please try again.";

    if (error && error.name === "AbortError") {
      message =
        "The order server took too long to respond. Please check your order status before submitting again.";
    } else if (error && error.message) {
      message = error.message;
    }

    showCheckoutError(message);

  } finally {

    clearTimeout(requestTimeout);

    checkoutSubmitting = false;

    const currentButton =
      document.getElementById("placeOrderBtn");

    if (currentButton) {
      currentButton.disabled = false;
      currentButton.textContent =
        "PLACE ORDER →";
    }
  }
}


/* =========================================================
   CHECKOUT ERROR
   ========================================================= */

function showCheckoutError(message) {
  const errorBox =
    document.getElementById("checkoutError");

  if (!errorBox) {
    showToast(message);
    return;
  }

  errorBox.textContent = message;
  errorBox.style.display = "block";
}


/* =========================================================
   ORDER CONFIRMATION
   ========================================================= */

function showOrderConfirmation(order) {
  const layer =
    document.createElement("div");

  layer.className = "checkout-layer";
  layer.id = "orderConfirmationLayer";

  const reference =
    order.orderId ||
    "Received";

  const itemHTML =
    (order.items || []).map(function (item) {
      return `
        <div style="
          display:flex;
          justify-content:space-between;
          gap:15px;
          padding:8px 0;
          border-bottom:1px solid rgba(212,175,55,.15);
        ">
          <span>
            ${escapeHTML(item.name)}
            × ${Number(item.quantity || item.qty || 0)}
          </span>

          <strong>
            ₹${Number(item.price || 0) *
              Number(item.quantity || item.qty || 0)}
          </strong>
        </div>
      `;
    }).join("");

  layer.innerHTML = `
    <div
      class="checkout-overlay"
      id="confirmationOverlay"
    ></div>

    <div class="checkout-modal">

      <button
        type="button"
        class="checkout-close"
        id="confirmationClose"
        aria-label="Close confirmation"
      >
        ×
      </button>

      <div class="eyebrow">
        ARADHYA
      </div>

      <h2>
        ORDER RECEIVED ✓
      </h2>

      <p>
        Thank you, ${escapeHTML(order.name)}.
        Your order request has been received.
      </p>

      <div style="
        margin:20px 0;
        padding:15px;
        border:1px solid rgba(212,175,55,.35);
        border-radius:8px;
      ">

        <div style="margin-bottom:8px">
          <strong>Order Reference</strong>
        </div>

        <div style="
          font-size:18px;
          color:#d4af37;
          word-break:break-word;
        ">
          ${escapeHTML(reference)}
        </div>

      </div>

      <div style="
        margin:15px 0;
      ">
        ${itemHTML}
      </div>

      <div style="
        display:flex;
        justify-content:space-between;
        margin-top:15px;
        padding-top:12px;
        border-top:1px solid rgba(212,175,55,.35);
        font-size:17px;
      ">
        <strong>Total</strong>
        <strong>₹${Number(order.total || 0)}</strong>
      </div>

      <p style="
        margin-top:18px;
        font-size:13px;
        opacity:.75;
        line-height:1.6;
      ">
        We will review your order and contact you for
        confirmation and delivery arrangements.
      </p>

      <button
        type="button"
        class="btn"
        id="confirmationDone"
        style="width:100%;margin-top:12px"
      >
        CONTINUE SHOPPING
      </button>

    </div>
  `;

  document.body.appendChild(layer);

  function closeConfirmation() {
    layer.remove();
  }

  const closeButton =
    document.getElementById("confirmationClose");

  const overlay =
    document.getElementById("confirmationOverlay");

  const doneButton =
    document.getElementById("confirmationDone");

  if (closeButton) {
    closeButton.addEventListener(
      "click",
      closeConfirmation
    );
  }

  if (overlay) {
    overlay.addEventListener(
      "click",
      closeConfirmation
    );
  }

  if (doneButton) {
    doneButton.addEventListener(
      "click",
      closeConfirmation
    );
  }
}


/* =========================================================
   IMAGE MODAL / GALLERY
   ========================================================= */

function openModal(src) {
  const modal =
    document.getElementById("imageModal");

  const image =
    document.getElementById("modalImage");

  if (!modal || !image) return;

  image.src = src;

  modal.classList.add("open");

  /*
    Some existing CSS versions use display instead
    of the open class.
  */
  modal.style.display = "flex";
}


function closeModal() {
  const modal =
    document.getElementById("imageModal");

  const image =
    document.getElementById("modalImage");

  if (!modal) return;

  modal.classList.remove("open");

  modal.style.display = "none";

  if (image) {
    image.src = "";
  }
}


/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
  "keydown",
  function (event) {

    if (event.key !== "Escape") {
      return;
    }

    closeModal();
    closeCheckout();

    const confirmation =
      document.getElementById(
        "orderConfirmationLayer"
      );

    if (confirmation) {
      confirmation.remove();
    }

    const cartPanel =
      document.getElementById("cartPanel");

    if (cartPanel) {
      cartPanel.classList.remove("open");
    }
  }
);


/* =========================================================
   INITIALISE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    loadCart();

    renderCart();

    /*
      Make sure the image modal starts hidden.
    */
    const modal =
      document.getElementById("imageModal");

    if (modal) {
      modal.style.display = "none";
    }

    console.log(
      "ARADHYA STORE SCRIPT LOADED ✓"
    );
  }
);
