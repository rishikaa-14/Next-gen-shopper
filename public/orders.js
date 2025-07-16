document.addEventListener('DOMContentLoaded', () => {
    const user_id = localStorage.getItem('user_id');
    if (!user_id) {
      window.location.href = 'login.html';
      return;
    }
  
    loadOrders(user_id);
  });
  
  async function loadOrders(user_id) {
    try {
      const res = await fetch(`/api/orders/${user_id}`);
      const orders = await res.json();
      const container = document.getElementById('ordersList');
  
      if (orders.length === 0) {
        container.innerHTML = '<p>You have no past orders.</p>';
        return;
      }
  
      container.innerHTML = orders.map(order => `
        <div class="order-card">
          <p><strong>Order ID:</strong> ${order.order_id}</p>
          <p><strong>Date:</strong> ${new Date(order.order_date).toLocaleString()}</p>
          <p><strong>Total:</strong> ₹${order.total_amount.toFixed(2)}</p>
        </div>
      `).join('');
    } catch (err) {
      console.error(err);
      document.getElementById('ordersList').innerHTML = '<p>❌ Failed to load orders.</p>';
    }
  }
  
  function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
  }
  