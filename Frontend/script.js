const API = CONFIG.API_URL;

// State
let products = [];
let cart = {}; // { productId: quantity }
let authMode = 'login'; // 'login', 'register', 'verify'
let currentIdentifier = '';

// DOM Elements
// DOM Elements
const productsGrid = document.getElementById("products-grid");
const productsLoader = document.getElementById("products-loader");
const floatingCart = document.getElementById("floating-cart");
const cartBadge = document.getElementById("cart-badge");
const cartOverlay = document.getElementById("cart-overlay");
const cartPanel = document.getElementById("cart-panel");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotalPrice = document.getElementById("cart-total-price");
const checkoutBtn = document.getElementById("checkout-btn");
const btnText = document.querySelector("#checkout-btn .btn-text");
const btnLoader = document.querySelector("#checkout-btn .btn-loader");
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toast-msg");
const appContent = document.getElementById("app-content");

/* ----- INITIALIZATION ----- */

function initApp() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = "login.html";
        return;
    }
    
    // User is logged in
    appContent.classList.remove('hidden');
    loadProducts();
}

/* ----- MAIN APP LOGIC ----- */

async function loadProducts() {
    productsLoader.classList.remove("hidden");
    productsGrid.innerHTML = "";
    
    try {
        const res = await fetch(`${API}/products`);
        if (!res.ok) throw new Error("Failed to fetch products");
        
        products = await res.json();
        renderProducts();
    } catch (error) {
        console.error("Error loading products:", error);
        productsGrid.innerHTML = `<p style="color: #ef4444; grid-column: 1/-1;">Error loading products.</p>`;
    } finally {
        productsLoader.classList.add("hidden");
    }
}

function renderProducts() {
    if (products.length === 0) {
        productsGrid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1;">No products found.</p>`;
        return;
    }

    productsGrid.innerHTML = products.map((p, index) => {
        const qty = cart[p.id] || 0;
        return `
            <div class="product-card" onclick="handleCardClick(event, ${p.id})" style="animation: scaleIn 0.5s ease-out ${index * 0.05}s forwards; opacity: 0;">
                <div class="product-image" style="background-image: url('${p.imageUrl}')"></div>
                <div class="product-info">
                    <h3 class="product-name">${p.name}</h3>
                    <div class="product-price">₹${p.price.toLocaleString('en-IN')}</div>
                    
                    <div class="quantity-controls" onclick="event.stopPropagation()">
                        <button class="qty-btn minus" onclick="updateCart(${p.id}, -1)">-</button>
                        <span class="qty-value">${qty}</span>
                        <button class="qty-btn plus" onclick="updateCart(${p.id}, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function handleCardClick(event, productId) {
    // If the click didn't originate from a button inside controls
    if (!event.target.classList.contains('qty-btn')) {
        const qty = cart[productId] || 0;
        if (qty === 0) {
            updateCart(productId, 1);
        }
    }
}

function updateCart(productId, delta) {
    const currentQty = cart[productId] || 0;
    const newQty = Math.max(0, currentQty + delta);
    
    if (newQty === 0) {
        delete cart[productId];
    } else {
        cart[productId] = newQty;
    }
    
    updateCartUI();
    renderProducts(); // Re-render to update quantities on cards
}

function updateCartUI() {
    const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    cartBadge.textContent = totalItems;
    
    // Animate badge
    cartBadge.classList.add('pop');
    setTimeout(() => cartBadge.classList.remove('pop'), 300);

    renderCartPanel();
}

function renderCartPanel() {
    if (Object.keys(cart).length === 0) {
        cartItemsContainer.innerHTML = `<p class="empty-cart-msg">Your cart is empty.</p>`;
        cartTotalPrice.textContent = '₹0';
        return;
    }

    let total = 0;
    cartItemsContainer.innerHTML = Object.entries(cart).map(([id, qty]) => {
        const product = products.find(p => p.id == id);
        if (!product) return '';
        
        const itemTotal = product.price * qty;
        total += itemTotal;

        return `
            <div class="cart-item">
                <div class="cart-item-img" style="background-image: url('${product.imageUrl}')"></div>
                <div class="cart-item-details">
                    <h4>${product.name}</h4>
                    <div class="cart-item-price">₹${product.price.toLocaleString('en-IN')}</div>
                    <div class="quantity-controls">
                        <button class="qty-btn minus" onclick="updateCart(${product.id}, -1)">-</button>
                        <span class="qty-value">${qty}</span>
                        <button class="qty-btn plus" onclick="updateCart(${product.id}, 1)">+</button>
                    </div>
                </div>
                <div class="cart-item-total">₹${itemTotal.toLocaleString('en-IN')}</div>
            </div>
        `;
    }).join("");

    cartTotalPrice.textContent = `₹${total.toLocaleString('en-IN')}`;
}

function toggleCart() {
    cartOverlay.classList.toggle('active');
    cartPanel.classList.toggle('active');
}

async function checkout() {
    const items = Object.entries(cart).map(([productId, quantity]) => ({
        productId: parseInt(productId, 10),
        quantity
    }));

    if (items.length === 0) {
        showToast("Cart is empty!", "error");
        return;
    }

    checkoutBtn.disabled = true;
    btnText.textContent = "Processing...";
    btnLoader.classList.remove("hidden");

    try {
        const res = await fetch(`${API}/order`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ items })
        });

        if (!res.ok) throw new Error("Failed to place order");

        showToast("Order Placed Successfully 🎉");
        cart = {}; // clear cart
        updateCartUI();
        renderProducts();
        toggleCart(); // Close cart
        
    } catch (error) {
        console.error("Order error:", error);
        showToast("Error placing order", "error");
    } finally {
        checkoutBtn.disabled = false;
        btnText.textContent = "Checkout";
        btnLoader.classList.add("hidden");
    }
}

function showToast(message, type = "success") {
    toastMsg.textContent = message;
    toast.className = `toast show ${type === 'error' ? 'error' : ''}`;
    setTimeout(() => toast.classList.remove("show"), 3000);
}

function toggleOrders() {
    document.getElementById('orders-overlay').classList.toggle('active');
    document.getElementById('orders-panel').classList.toggle('active');
    if (document.getElementById('orders-panel').classList.contains('active')) {
        loadOrders();
    }
}

async function loadOrders() {
    const ordersItems = document.getElementById('orders-items');
    ordersItems.innerHTML = '<div class="loader"></div>';
    
    try {
        const res = await fetch(`${API}/order`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!res.ok) throw new Error("Failed to fetch orders");
        const orders = await res.json();
        
        if (orders.length === 0) {
            ordersItems.innerHTML = '<p class="empty-cart-msg">No orders placed yet.</p>';
            return;
        }

        ordersItems.innerHTML = orders.map(o => `
            <div class="cart-item">
                <div class="cart-item-details">
                    <h4>📦 ${o.productName}</h4>
                    <p class="price">₹${o.price.toLocaleString('en-IN')} × ${o.quantity}</p>
                    <p class="total">Total Paid: <strong>₹${o.total.toLocaleString('en-IN')}</strong></p>
                    <small style="color: var(--text-muted)">Order Date: ${new Date(o.createdAt).toLocaleDateString()}</small>
                </div>
            </div>
        `).join("");
    } catch (error) {
        console.error("Orders error:", error);
        ordersItems.innerHTML = '<p class="empty-cart-msg error">Failed to load orders.</p>';
    }
}

document.addEventListener('DOMContentLoaded', initApp);