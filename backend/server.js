const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static('public'));

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'online_store',
  typeCast: function (field, next) {
    if (field.type === 'NEWDECIMAL') {
      const value = field.string();
      return value === null ? null : Number(value);
    }
    return next();
  }
});


db.connect(err => {
  if (err) throw err;
  console.log('✅ Connected to MySQL');
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// 🔐 Register
app.post('/api/register', async (req, res) => {
  const { first_name, last_name, email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user_id = uuidv4();

  const sql = `
    INSERT INTO user (user_id, first_name, last_name, email, password, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [user_id, first_name, last_name, email, hashedPassword, role], (err) => {
    if (err) return res.status(500).json({ error: 'Registration failed' });
    res.json({ success: true });
  });
});

// 🔐 Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM user WHERE email = ?", [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    res.json({ role: user.role, user_id: user.user_id });
  });
});

// 📦 Get all products
// 📦 Get all products (for admin)
app.get('/api/products', (req, res) => {
  db.query("SELECT * FROM product", (err, results) => {
    if (err) {
      console.error("Failed to fetch products:", err);
      return res.status(500).json({ error: "Failed to retrieve products" });
    }
    res.json(results);
  });
});
// Add product
app.post('/api/products', (req, res) => {
  const { name, price } = req.body;
  if (!name || isNaN(price)) return res.status(400).json({ success: false });
  db.query("INSERT INTO product (name, price) VALUES (?, ?)", [name, price], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

// ❌ Delete product by ID
app.delete('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  db.query("DELETE FROM product WHERE product_id = ?", [productId], (err) => {
    if (err) {
      console.error("Failed to delete product:", err);
      return res.status(500).json({ error: "Failed to delete product" });
    }
    res.json({ success: true });
  });
});


// 📥 Add to cart
app.post('/api/cart', (req, res) => {
  const { user_id, product_id, quantity } = req.body;
  const sql = `
    INSERT INTO cart (user_id, product_id, quantity)
    VALUES (?, ?, ?)
  `;
  db.query(sql, [user_id, product_id, quantity], (err) => {
    if (err) {
      console.error('Error adding to cart:', err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true });
  });
});

// 🛒 Get cart items
app.get('/api/cart/:user_id', (req, res) => {
  const { user_id } = req.params;
  const sql = `
    SELECT c.cart_id, p.product_id, p.name, p.price, c.quantity
    FROM cart c
    JOIN product p ON c.product_id = p.product_id
    WHERE c.user_id = ?
  `;
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Cart fetch error' });
    res.json(results);
  });
});

// ❌ Remove cart item
app.delete('/api/cart/:cart_id', (req, res) => {
  const { cart_id } = req.params;
  db.query("DELETE FROM cart WHERE cart_id = ?", [cart_id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});
// 🔁 Update cart item quantity
app.put('/api/cart/:cart_id', (req, res) => {
  const { cart_id } = req.params;
  const { quantity } = req.body;

  if (quantity <= 0) {
    // Auto-remove item if quantity set to 0 or negative
    db.query("DELETE FROM cart WHERE cart_id = ?", [cart_id], (err) => {
      if (err) return res.status(500).json({ success: false });
      return res.json({ success: true, message: 'Item removed due to zero quantity' });
    });
  } else {
    const sql = "UPDATE cart SET quantity = ? WHERE cart_id = ?";
    db.query(sql, [quantity, cart_id], (err) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true });
    });
  }
});

// 🤖 Recommendations
app.get('/api/recommendations/:user_id', (req, res) => {
  const { user_id } = req.params;
  const sql = `
    SELECT p.*
    FROM recommendation r
    JOIN product p ON r.product_id = p.product_id
    WHERE r.user_id = ?
  `;
  db.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error('Error fetching recommendations:', err);
      return res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
    res.json(results);
  });
});
// Submit a review
app.post('/api/reviews', (req, res) => {
  const { user_id, product_id, rating, sentiment, comment } = req.body;
  const sql = `
    INSERT INTO review (user_id, product_id, rating, sentiment, comment)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [user_id, product_id, rating, sentiment, comment], (err, result) => {
    if (err) {
      console.error("Review Insert Error:", err);
      return res.status(500).json({ error: 'Failed to add review' });
    }
    res.json({ success: true, message: 'Review added successfully!' });
  });
});

// 🧾 Get all orders for a user
app.get('/api/orders/:user_id', (req, res) => {
  const { user_id } = req.params;
  const sql = `SELECT order_id, order_date, total_amount FROM order_table WHERE user_id = ? ORDER BY order_date DESC`;
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch orders' });
    res.json(results);
  });
});
// ✅ Confirm & place order
// ✅ Confirm Order - Creates an entry in order_table and clears the cart
// ✅ Confirm and create new order
app.post('/api/orders/confirm', (req, res) => {
  const { user_id } = req.body;

  const getCartItemsQuery = `
    SELECT p.price, c.quantity
    FROM cart c
    JOIN product p ON c.product_id = p.product_id
    WHERE c.user_id = ?
  `;

  db.query(getCartItemsQuery, [user_id], (err, cartItems) => {
    if (err) {
      console.error("🛑 Failed to fetch cart:", err);
      return res.status(500).json({ success: false, message: "Failed to fetch cart" });
    }

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const insertOrderQuery = `
      INSERT INTO order_table (user_id, total_amount)
      VALUES (?, ?)
    `;

    db.query(insertOrderQuery, [user_id, totalAmount.toFixed(2)], (err) => {
      if (err) {
        console.error("🛑 Order insert failed:", err);
        return res.status(500).json({ success: false, message: "Failed to confirm order" });
      }

      // Clear cart after order is placed
      db.query("DELETE FROM cart WHERE user_id = ?", [user_id], (err) => {
        if (err) {
          console.error("🛑 Failed to clear cart:", err);
          return res.status(500).json({ success: false, message: "Order placed but cart not cleared" });
        }

        res.json({ success: true, message: "Order placed successfully!" });
      });
    });
  });
});


// 👤 Get all users
// 🔐 Get all users
app.get('/api/users', (req, res) => {
  db.query("SELECT first_name, last_name, email, role FROM user", (err, results) => {
    if (err) {
      console.error("Failed to fetch users:", err);
      return res.status(500).json({ error: "Failed to retrieve users" });
    }
    res.json(results);
  });
});


// 📊 Get order analytics (orders per month)
app.get('/api/analytics', (req, res) => {
  const sql = `
    SELECT 
      MONTH(order_date) AS month, 
      COUNT(*) AS order_count 
    FROM order_table 
    WHERE YEAR(order_date) = YEAR(CURDATE())
    GROUP BY MONTH(order_date)
    ORDER BY MONTH(order_date)
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Analytics fetch failed:", err);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = Array(12).fill(0);

    results.forEach(row => {
      data[row.month - 1] = row.order_count;
    });

    res.json({ labels, data, year: new Date().getFullYear() });
  });
});


// Start server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
