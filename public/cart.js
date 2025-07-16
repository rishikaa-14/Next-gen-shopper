document.addEventListener('DOMContentLoaded', () => {
    const user_id = localStorage.getItem('user_id');
    if (!user_id) {
      window.location.href = 'login.html';
      return;
    }
  
    loadCart(user_id);
  });
  
  async function loadCart(user_id) {
    try {
      const res = await fetch(`/api/cart/${user_id}`);
      const cartItems = await res.json();
      const container = document.getElementById('cartItems');
      const totalEl = document.getElementById('cartTotal');
      let total = 0;
  
      if (!cartItems.length) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        totalEl.textContent = 'Total: ₹0.00';
        return;
      }
  
      container.innerHTML = cartItems.map(item => {
        total += item.price * item.quantity;
        return `
          <div class="cart-card">
            <img src="images/${item.product_id}.jpg" alt="${item.name}" class="cart-img" />
            <div class="cart-details">
              <h4>${item.name}</h4>
              <p>₹${item.price}</p>
              <div class="qty-actions">
                <button onclick="updateQuantity(${item.cart_id}, ${item.quantity - 1})">−</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${item.cart_id}, ${item.quantity + 1})">+</button>
              </div>
              <button class="remove-btn" onclick="removeFromCart(${item.cart_id})">Remove</button>
            </div>
          </div>
        `;
      }).join('');
  
      totalEl.textContent = `Total: ₹${total.toFixed(2)}`;
    } catch (err) {
      showToast('❌ Failed to load cart', 'error');
    }
  }
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('checkout-btn')) {
      openModal();
    }
  });
  
  function openModal() {
    const user_id = localStorage.getItem('user_id');
    fetch(`/api/cart/${user_id}`)
      .then(res => res.json())
      .then(items => {
        let summaryHTML = '<ul>';
        let total = 0;
        items.forEach(item => {
          summaryHTML += `<li>${item.name} × ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}</li>`;
          total += item.price * item.quantity;
        });
        summaryHTML += `</ul><p><strong>Total: ₹${total.toFixed(2)}</strong></p>`;
        document.getElementById('orderSummaryContent').innerHTML = summaryHTML;
        document.getElementById('checkoutModal').style.display = 'flex';
      });
  }
  
  
  function closeModal() {
    document.getElementById('checkoutModal').style.display = 'none';
  }
  
  function confirmOrder() {
    const user_id = localStorage.getItem('user_id');
    fetch('/api/orders/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast('✅ Order confirmed!');
          closeModal();
          loadCart(user_id); // Refresh cart view
        } else {
          showToast('❌ ' + data.message, 'error');
        }
      })
      .catch(() => {
        showToast('❌ Server error', 'error');
      });
  }
  
  
  
  async function updateQuantity(cartId, newQty) {
    try {
      const res = await fetch(`/api/cart/${cartId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      });
      const data = await res.json();
      if (data.success) {
        loadCart(localStorage.getItem('user_id'));
      } else {
        showToast('❌ Failed to update quantity', 'error');
      }
    } catch {
      showToast('❌ Server error', 'error');
    }
  }
  
  async function removeFromCart(cartId) {
    try {
      const res = await fetch(`/api/cart/${cartId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadCart(localStorage.getItem('user_id'));
      } else {
        showToast('❌ Failed to remove item', 'error');
      }
    } catch (e) {
      showToast('❌ Error removing item', 'error');
    }
  }
  
  function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
  }
  
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
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
  