/* =========================================================
   ARADHYA WEBSITE - MAIN JAVASCRIPT
   ========================================================= */

const BACKEND_URL =
  "https://aradhyabackend.www-aradhya-co.workers.dev";

let cart = JSON.parse(localStorage.getItem("aradhyaCart") || "[]");

/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function showPage(pageId, button) {
  document.querySelectorAll(".page").forEach(function (page) {
    page.classList.remove("active");
  });

  const page = document.getElementById(pageId);

  if (page) {
    page.classList.add("active");
  }

  document.querySelectorAll("nav button").forEach(function (btn) {
    btn.classList.remove("active");
  });

  if (button) {
    button.classList.add("active");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* =========================================================
   PRODUCT DATA
   ========================================================= */

const products = {
  whiteLily: {
    name: "White Lily",
    price: 299,
    fragrance: "White Lily"
  },

  whiteOudh: {
    name: "White Oudh",
    price: 299,
    fragrance: "White Oudh"
  },

  mysoreChandan: {
    name: "Mysore Chandan",
    price: 299,
    fragrance: "Mysore Chandan"
  },

  lavender: {
    name: "Lavender",
    price: 299,
    fragrance: "Lavender"
  },

  pineapple: {
    name: "Pineapple",
    price: 299,
    fragrance: "Pineapple"
  },

  mysoreKewda: {
    name: "Mysore Kewda",
    price: 299,
    fragrance: "Mysore Kewda"
  },

  mixRoseBelaChandanKewda: {
    name: "Mix – Rose, Bela, Chandan & Kewda",
    price: 499,
    fragrance: "Rose, Bela, Chandan & Kewda",
    mixed: true,
    image: "assets/products/fourCones.webp"
  },

  mixWhiteLilyChandanOudhKewdaPineapple: {
    name:
      "Mix – White Lily, Chandan, White Oudh, Mysore Kewda & Pineapple",
    price: 499,
    fragrance:
      "White Lily, Chandan, White Oudh, Mysore Kewda & Pineapple",
    mixed: true,
    image: "assets/products/fiveCones.webp"
  }
};

/* =========================================================
   PRODUCT DETAIL
   ========================================================= */

function openProduct(productId) {
  const product = products[productId];

  if (!product) {
    console.error("Product not found:", productId);
    return;
  }

  document.querySelectorAll(".page").forEach(function (page) {
    page.classList.remove("active");
  });

  const detail = document.getElementById("product-" + productId);

  if (detail) {
    detail.classList.add("active");
  }

  const nameElements = document.querySelectorAll(
    '[data-product-name="' + productId + '"]'
  );

  nameElements.forEach(function (element) {
    element.textContent = product.name;
  });

  const fragranceElements = document.querySelectorAll(
    '[data-fragrance="' + productId + '"]'
  );

  fragranceElements.forEach(function (element) {
    element.textContent = product.fragrance;
  });

  /*
   * Do not jump the page to the top.
   * Product sections are opened in-place.
   */

  updateProductPrice(productId);
}

/* =========================================================
   PRODUCT PRICE
   ========================================================= */

function updateProductPrice(productId) {
  const product = products[productId];

  if (!product) return;

  document
    .querySelectorAll('[data-price="' + productId + '"]')
    .forEach(function (element) {
      element.textContent = "₹" + product.price;
    });
}

/* =========================================================
   ADD TO CART
   ========================================================= */

function addToCart(productId, quantity) {
  const product = products[productId];

  if (!product) {
    alert("Product not found.");
    return;
  }

  quantity = parseInt(quantity, 10);

  if (!quantity || quantity < 1) {
    quantity = 1;
  }

  const existing = cart.find(function (item) {
    return item.id === productId;
  });

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: productId,
      name: product.name,
      price: product.price,
      quantity: quantity
    });
  }

  saveCart();
  renderCart();

  showCart();

  alert(product.name + " added to cart.");
}

/* =========================================================
   REMOVE FROM CART
   ========================================================= */

function removeFromCart(productId) {
  cart = cart.filter(function (item) {
    return item.id !== productId;
  });

  saveCart();
  renderCart();
}

/* =========================================================
   CHANGE CART QUANTITY
   ========================================================= */

function changeCartQuantity(productId, change) {
  const item = cart.find(function (product) {
    return product.id === productId;
  });

  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart();
  renderCart();
}

/* =========================================================
   SAVE CART
   ========================================================= */

function saveCart() {
  localStorage.setItem("aradhyaCart", JSON.stringify(cart));
}

/* =========================================================
   CART TOTAL
   ========================================================= */

function getCartTotal() {
  return cart.reduce(function (total, item) {
    return total + item.price * item.quantity;
  }, 0);
}

/* =========================================================
   CART COUNT
   ========================================================= */

function getCartCount() {
  return cart.reduce(function (total, item) {
    return total + item.quantity;
  }, 0);
}

/* =========================================================
   RENDER CART
   ========================================================= */

function renderCart() {
  const cartContainer = document.getElementById("cartItems");

  if (!cartContainer) return;

  if (cart.length === 0) {
    cartContainer.innerHTML =
      '<div class="cart-empty">Your cart is empty.</div>';
  } else {
    cartContainer.innerHTML = cart
      .map(function (item) {
        return `
          <div class="cart-item">
            <div class="cart-item-info">
              <strong>${escapeHtml(item.name)}</strong>
              <span>₹${item.price} × ${item.quantity}</span>
            </div>

            <div class="cart-item-actions">
              <button onclick="changeCartQuantity('${item.id}', -1)">−</button>
              <span>${item.quantity}</span>
              <button onclick="changeCartQuantity('${item.id}', 1)">+</button>
              <button onclick="removeFromCart('${item.id}')">×</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  const total = getCartTotal();

  const totalElement = document.getElementById("cartTotal");

  if (totalElement) {
    totalElement.textContent = "₹" + total;
  }

  const countElement = document.getElementById("cartCount");

  if (countElement) {
    countElement.textContent = getCartCount();
  }
}

/* =========================================================
   SHOW CART
   ========================================================= */

function showCart() {
  const cartPanel = document.getElementById("cartPanel");

  if (!cartPanel) return;

  cartPanel.classList.add("open");
}

/* =========================================================
   HIDE CART
   ========================================================= */

function hideCart() {
  const cartPanel = document.getElementById("cartPanel");

  if (!cartPanel) return;

  cartPanel.classList.remove("open");
}

/* =========================================================
   CHECKOUT
   ========================================================= */

function openCheckout() {
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  hideCart();

  const checkout = document.getElementById("checkoutOverlay");

  if (checkout) {
    checkout.classList.add("open");
  }

  renderCheckoutSummary();
}

/* =========================================================
   CLOSE CHECKOUT
   ========================================================= */

function closeCheckout() {
  const checkout = document.getElementById("checkoutOverlay");

  if (checkout) {
    checkout.classList.remove("open");
  }
}

/* =========================================================
   CHECKOUT SUMMARY
   ========================================================= */

function renderCheckoutSummary() {
  const summary = document.getElementById("checkoutSummary");

  if (!summary) return;

  if (cart.length === 0) {
    summary.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  summary.innerHTML = `
    ${cart
      .map(function (item) {
        return `
          <div class="checkout-item">
            <span>
              ${escapeHtml(item.name)}
              × ${item.quantity}
            </span>

            <strong>
              ₹${item.price * item.quantity}
            </strong>
          </div>
        `;
      })
      .join("")}

    <div class="checkout-total">
      <span>Total</span>
      <strong>₹${getCartTotal()}</strong>
    </div>
  `;
}

/* =========================================================
   SUBMIT ORDER
   ========================================================= */

async function submitOrder(event) {
  if (event) {
    event.preventDefault();
  }

  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const form = document.getElementById("checkoutForm");

  if (!form) {
    alert("Checkout form not found.");
    return;
  }

  const submitButton = form.querySelector(
    'button[type="submit"]'
  );

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Placing Order...";
  }

  const formData = new FormData(form);

  const customer = {
    name: formData.get("name") || "",
    phone: formData.get("phone") || "",
    email: formData.get("email") || "",
    address: formData.get("address") || "",
    city: formData.get("city") || "",
    state: formData.get("state") || "",
    pincode: formData.get("pincode") || ""
  };

  if (
    !customer.name ||
    !customer.phone ||
    !customer.address ||
    !customer.city ||
    !customer.state ||
    !customer.pincode
  ) {
    alert("Please fill all required details.");

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Place Order";
    }

    return;
  }

  const orderItems = cart.map(function (item) {
    return {
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity
    };
  });

  const orderPayload = {
    customer: customer,
    items: orderItems,
    total: getCartTotal()
  };

  try {
    const response = await fetch(
      BACKEND_URL + "/orders",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(orderPayload)
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to place order."
      );
    }

    /*
     * Order successfully created.
     */

    const orderId =
      data.order_id ||
      data.orderId ||
      data.id ||
      "";

    localStorage.removeItem("aradhyaCart");

    cart = [];

    renderCart();

    closeCheckout();

    showOrderSuccess(orderId);

    form.reset();

  } catch (error) {
    console.error("Order submission error:", error);

    alert(
      "Sorry, your order could not be placed right now.\n\n" +
      error.message
    );
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Place Order";
    }
  }
}

/* =========================================================
   ORDER SUCCESS
   ========================================================= */

function showOrderSuccess(orderId) {
  const message = orderId
    ? "Your order has been placed successfully!\n\nOrder ID: " +
      orderId
    : "Your order has been placed successfully!";

  alert(message);

  const successSection =
    document.getElementById("orderSuccess");

  if (successSection) {
    successSection.classList.add("show");

    const idElement =
      document.getElementById("successOrderId");

    if (idElement) {
      idElement.textContent = orderId || "Confirmed";
    }
  }
}

/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================================================
   PRODUCT IMAGE SLIDER
   ========================================================= */

function changeProductImage(sliderId, direction) {
  const slider =
    document.getElementById(sliderId);

  if (!slider) return;

  const images =
    slider.querySelectorAll("img");

  if (!images.length) return;

  let current =
    parseInt(
      slider.dataset.current || "0",
      10
    );

  images[current].classList.remove("active");

  current += direction;

  if (current < 0) {
    current = images.length - 1;
  }

  if (current >= images.length) {
    current = 0;
  }

  images[current].classList.add("active");

  slider.dataset.current = current;
}

/* =========================================================
   TOUCH / SWIPE SUPPORT
   ========================================================= */

function enableSwipe(slider) {
  if (!slider) return;

  let startX = 0;
  let endX = 0;

  slider.addEventListener(
    "touchstart",
    function (event) {
      startX = event.changedTouches[0].screenX;
    },
    { passive: true }
  );

  slider.addEventListener(
    "touchend",
    function (event) {
      endX = event.changedTouches[0].screenX;

      const difference = endX - startX;

      if (Math.abs(difference) < 40) {
        return;
      }

      if (difference < 0) {
        changeProductImage(
          slider.id,
          1
        );
      } else {
        changeProductImage(
          slider.id,
          -1
        );
      }
    },
    { passive: true }
  );
}

/* =========================================================
   MODAL CLOSE ON OUTSIDE CLICK
   ========================================================= */

document.addEventListener(
  "click",
  function (event) {
    const checkout =
      document.getElementById("checkoutOverlay");

    if (
      checkout &&
      event.target === checkout
    ) {
      closeCheckout();
    }
  }
);

/* =========================================================
   ESC KEY
   ========================================================= */

document.addEventListener(
  "keydown",
  function (event) {
    if (event.key === "Escape") {
      closeCheckout();
      hideCart();
    }
  }
);

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {
    renderCart();

    document
      .querySelectorAll(
        ".product-slider"
      )
      .forEach(function (slider) {
        enableSwipe(slider);
      });

    /*
     * Checkout form
     */

    const checkoutForm =
      document.getElementById(
        "checkoutForm"
      );

    if (checkoutForm) {
      checkoutForm.addEventListener(
        "submit",
        submitOrder
      );
    }

    /*
     * Close cart button
     */

    const closeCartButton =
      document.getElementById(
        "closeCart"
      );

    if (closeCartButton) {
      closeCartButton.addEventListener(
        "click",
        hideCart
      );
    }

    /*
     * Open cart button
     */

    const cartButton =
      document.getElementById(
        "cartButton"
      );

    if (cartButton) {
      cartButton.addEventListener(
        "click",
        showCart
      );
    }

    /*
     * Checkout button
     */

    const checkoutButton =
      document.getElementById(
        "checkoutButton"
      );

    if (checkoutButton) {
      checkoutButton.addEventListener(
        "click",
        openCheckout
      );
    }

    /*
     * Close checkout button
     */

    const closeCheckoutButton =
      document.getElementById(
        "closeCheckout"
      );

    if (closeCheckoutButton) {
      closeCheckoutButton.addEventListener(
        "click",
        closeCheckout
      );
    }

    /*
     * Make sure cart is displayed correctly
     */

    renderCart();
  }
);
