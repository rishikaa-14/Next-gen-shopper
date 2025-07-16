document.addEventListener('DOMContentLoaded', () => {
  const user_id = localStorage.getItem('user_id');
  if (!user_id) return (window.location.href = 'login.html');

  loadProducts();
  loadRecommendations(user_id);
  updateCartCount(user_id);
  populateProductDropdown();

  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const product_id = document.getElementById('reviewProductId').value;
      const rating = document.getElementById('rating').value;
      const sentiment = document.getElementById('sentiment').value;
      const comment = document.getElementById('comment').value;

      try {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id, product_id, rating, sentiment, comment })
        });

        const data = await res.json();
        if (data.success) {
          showToast('✅ Review submitted!');
          reviewForm.reset();
        } else {
          showToast('❌ Failed to submit review', 'error');
        }
      } catch (err) {
        showToast('❌ Server error', 'error');
      }
    });
  }
});

// ⭐️ Populate dropdown for review form
async function populateProductDropdown() {
  try {
    const res = await fetch('/api/products');
    const products = await res.json();
    const select = document.getElementById('reviewProductId');
    if (!select) return;
    products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.product_id;
      opt.textContent = p.name;
      select.appendChild(opt);
    });
  } catch {
    showToast("Error loading products for review", "error");
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.innerText = message;
  toast.style.background = type === 'success' ? '#4caf50' : '#f44336';
  toast.style.color = '#fff';
  toast.style.padding = '10px';
  toast.style.marginTop = '5px';
  toast.style.borderRadius = '5px';
  toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    const products = await res.json();
    const container = document.getElementById('productList');
    if (!container) return;

    container.innerHTML = products.map(p => {
      const image = p.product_id <= 10 ? `${p.product_id}.jpg` : 'placeholder.jpg';
      return `
        <div class="product-card">
          <img src="images/${image}" alt="${p.name}" class="product-img" />
          <h4>${p.name}</h4>
          <p>₹${p.price}</p>
          <button onclick="addToCart('${p.product_id}')">Add to Cart</button>
        </div>
      `;
    }).join('');
  } catch {
    showToast('Error loading products', 'error');
  }
}

async function addToCart(productId) {
  const user_id = localStorage.getItem('user_id');
  try {
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, product_id: productId, quantity: 1 })
    });
    const data = await res.json();
    if (data.success) {
      updateCartCount(user_id);
      showToast("Item added to cart!");
    } else {
      showToast("Failed to add to cart", 'error');
    }
  } catch {
    showToast("Error adding to cart", 'error');
  }
}

async function loadRecommendations(user_id) {
  try {
    const res = await fetch(`/api/recommendations/${user_id}`);
    const recommended = await res.json();
    const container = document.getElementById('recommendations');
    if (!container) return;

    container.innerHTML = recommended.length
      ? recommended.map(p => {
          const image = p.product_id <= 10 ? `${p.product_id}.jpg` : 'placeholder.jpg';
          return `
            <div class="product-card">
              <img src="images/${image}" alt="${p.name}" class="product-img" />
              <h4>${p.name}</h4>
              <p>₹${p.price}</p>
              <button onclick="addToCart('${p.product_id}')">Add to Cart</button>
            </div>
          `;
        }).join('')
      : `<p>No recommendations available right now.</p>`;
  } catch {
    showToast('Error loading recommendations', 'error');
  }
}

async function updateCartCount(user_id) {
  try {
    const res = await fetch(`/api/cart/${user_id}`);
    const items = await res.json();
    const count = items.reduce((total, item) => total + item.quantity, 0);
    const countSpan = document.getElementById('cartCount');
    if (countSpan) countSpan.textContent = count;
  } catch (err) {
    console.error("Cart count update failed:", err);
  }
}

function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// --- 🤖 Chatbot ---
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

chatInput?.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    const userMsg = chatInput.value.trim();
    appendChat('You', userMsg);
    chatInput.value = '';
    const botReply = getBotRecommendation(userMsg);
    setTimeout(() => appendChat('NeoBot', botReply), 600);
  }
});

function appendChat(sender, message) {
  const msg = document.createElement('div');
  msg.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getBotRecommendation(input) {
  input = input.toLowerCase();
  if (input.includes('gaming')) return 'Looking for gaming gear? Try the Laptop (#1) and Keyboard (#7)! 🎮';
  if (input.includes('laptop')) return 'Try our high-performance Laptop (#1)! 💻';
  if (input.includes('phone') || input.includes('smartphone')) return 'Check out the Smartphone (#2)! 📱';
  if (input.includes('headphone')) return 'Try our noise-cancelling Headphones (#3)! 🎧';
  if (input.includes('camera')) return 'Explore the digital Camera (#6) for amazing shots 📸';
  if (input.includes('monitor')) return 'The 4K Monitor (#9) offers stunning visuals 🖥️';
  return "Try asking for 'laptop', 'camera', or 'gaming gear'.";
}
