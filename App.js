import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, onValue, push, remove } from "firebase/database";

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", category: "", quantity: "", price: "" });

  // Load products from Firebase in real time
  useEffect(() => {
    const productsRef = ref(db, "products");
    onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setProducts(list);
      } else {
        setProducts([]);
      }
    });
  }, []);

  const addProduct = async () => {
    if (!form.name || !form.quantity) return alert("Name and Quantity are required!");
    const productsRef = ref(db, "products");
    await push(productsRef, form);
    setForm({ name: "", category: "", quantity: "", price: "" });
  };

  const deleteProduct = async (id) => {
    const productRef = ref(db, `products/${id}`);
    await remove(productRef);
  };

  const lowStock = products.filter(p => Number(p.quantity) < 10);

  return (
    <div style={{ fontFamily: "Arial", padding: "30px", maxWidth: "900px", margin: "0 auto" }}>

      <h1 style={{ color: "#1F4E79", borderBottom: "3px solid #1F4E79", paddingBottom: "10px" }}>
        📦 Inventory Monitoring System
      </h1>

      {lowStock.length > 0 && (
        <div style={{ background: "#fff3cd", border: "1px solid #ffc107", padding: "10px 20px", borderRadius: "8px", marginBottom: "20px" }}>
          ⚠️ <strong>Low Stock Alert!</strong> {lowStock.map(p => p.name).join(", ")} {lowStock.length === 1 ? "is" : "are"} running low (less than 10 units)
        </div>
      )}

      <div style={{ background: "#f0f4f8", padding: "20px", borderRadius: "10px", marginBottom: "30px" }}>
        <h2 style={{ color: "#1F4E79", marginTop: 0 }}>Add New Product</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <input placeholder="Product Name *" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={inputStyle} />
          <input placeholder="Category (e.g. Electronics)" value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            style={inputStyle} />
          <input placeholder="Quantity *" type="number" value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })}
            style={inputStyle} />
          <input placeholder="Price (₹)" type="number" value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            style={inputStyle} />
        </div>
        <button onClick={addProduct} style={btnStyle}>
          ➕ Add Product
        </button>
      </div>

      <h2 style={{ color: "#1F4E79" }}>📋 Inventory List ({products.length} items)</h2>
      {products.length === 0 ? (
        <p style={{ color: "#888" }}>No products added yet. Add your first product above!</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1F4E79", color: "white" }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Quantity</th>
              <th style={thStyle}>Price (₹)</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 === 0 ? "#f9f9f9" : "white" }}>
                <td style={tdStyle}>{p.name}</td>
                <td style={tdStyle}>{p.category || "—"}</td>
                <td style={tdStyle}>{p.quantity}</td>
                <td style={tdStyle}>{p.price ? `₹${p.price}` : "—"}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: "3px 10px", borderRadius: "20px", fontSize: "12px",
                    background: Number(p.quantity) < 10 ? "#ffe0e0" : "#e0ffe0",
                    color: Number(p.quantity) < 10 ? "#cc0000" : "#006600"
                  }}>
                    {Number(p.quantity) < 10 ? "⚠️ Low Stock" : "✅ In Stock"}
                  </span>
                </td>
                <td style={tdStyle}>
                  <button onClick={() => deleteProduct(p.id)}
                    style={{ background: "#cc0000", color: "white", border: "none", padding: "5px 12px", borderRadius: "5px", cursor: "pointer" }}>
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const inputStyle = {
  padding: "10px", borderRadius: "6px", border: "1px solid #ccc",
  fontSize: "14px", width: "100%", boxSizing: "border-box"
};

const btnStyle = {
  marginTop: "15px", background: "#1F4E79", color: "white",
  border: "none", padding: "10px 25px", borderRadius: "6px",
  fontSize: "15px", cursor: "pointer"
};

const thStyle = { padding: "12px", textAlign: "left", fontWeight: "bold" };
const tdStyle = { padding: "10px", borderBottom: "1px solid #eee" };

export default App;