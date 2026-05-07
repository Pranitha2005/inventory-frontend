import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { ref, onValue, push, remove, update } from "firebase/database";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", category: "", quantity: "", price: "" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const alertedIds = useRef({});

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

  useEffect(() => {
    if (products.length === 0) return;

    const newLowStock = products.filter(
      p => Number(p.quantity) < 10 && !alertedIds.current[p.id]
    );

    if (newLowStock.length === 0) return;

    newLowStock.forEach(p => alertedIds.current[p.id] = true);

    const productDetails = newLowStock
      .map(p => `- ${p.name} (Category: ${p.category || "N/A"}, Quantity: ${p.quantity})`)
      .join("\n");

    fetch("http://localhost:8081/api/email/low-stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: productDetails })
    }).then(res => {
      if (res.ok) console.log("✅ Email sent successfully!");
      else console.error("❌ Failed to send email:", res.status);
    }).catch(err => console.error("❌ Error:", err));

  }, [products]);
  const addProduct = async () => {
    if (!form.name || !form.quantity) return alert("Name and Quantity are required!");
    const productsRef = ref(db, "products");
    await push(productsRef, form);
    setForm({ name: "", category: "", quantity: "", price: "" });
  };

  const deleteProduct = async (id) => {
    await remove(ref(db, `products/${id}`));
  };

  const saveEdit = async (id) => {
    await update(ref(db, `products/${id}`), editForm);
    setEditId(null);
  };

  const lowStock = products.filter(p => Number(p.quantity) < 10);
  const totalValue = products.reduce((sum, p) => sum + (Number(p.price) * Number(p.quantity) || 0), 0);

  return (
    <div style={{ fontFamily: "Arial", padding: "30px", maxWidth: "1000px", margin: "0 auto" }}>

      <h1 style={{ color: "#1F4E79", borderBottom: "3px solid #1F4E79", paddingBottom: "10px" }}>
        📦 Inventory Monitoring System
      </h1>

      {/* Dashboard Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "25px" }}>
        <div style={statCard("#1F4E79")}>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>{products.length}</div>
          <div>Total Products</div>
        </div>
        <div style={statCard("#cc0000")}>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>{lowStock.length}</div>
          <div>Low Stock Items</div>
        </div>
        <div style={statCard("#006600")}>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>₹{totalValue.toLocaleString()}</div>
          <div>Total Inventory Value</div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div style={{ background: "#fff3cd", border: "1px solid #ffc107", padding: "10px 20px", borderRadius: "8px", marginBottom: "20px" }}>
          ⚠️ <strong>Low Stock Alert!</strong> {lowStock.map(p => p.name).join(", ")} {lowStock.length === 1 ? "is" : "are"} running low!
        </div>
      )}

      {/* Add Product Form */}
      <div style={{ background: "#f0f4f8", padding: "20px", borderRadius: "10px", marginBottom: "30px" }}>
        <h2 style={{ color: "#1F4E79", marginTop: 0 }}>Add New Product</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <input placeholder="Product Name *" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <input placeholder="Category" value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle} />
          <input placeholder="Quantity *" type="number" value={form.quantity}
            onChange={e => setForm({ ...form, quantity: e.target.value })} style={inputStyle} />
          <input placeholder="Price (₹)" type="number" value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })} style={inputStyle} />
        </div>
        <button onClick={addProduct} style={btnStyle}>➕ Add Product</button>
      </div>

      {/* Stock Chart */}
      {products.length > 0 && (
        <div style={{ background: "#f0f4f8", padding: "20px", borderRadius: "10px", marginBottom: "30px" }}>
          <h2 style={{ color: "#1F4E79", marginTop: 0 }}>📈 Stock Level Chart</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={products.map(p => ({ name: p.name, quantity: Number(p.quantity) }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" fill="#1F4E79" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Products Table */}
      <h2 style={{ color: "#1F4E79" }}>📋 Inventory List ({products.length} items)</h2>
      {products.length === 0 ? (
        <p style={{ color: "#888" }}>No products added yet!</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#1F4E79", color: "white" }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Quantity</th>
              <th style={thStyle}>Price (₹)</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} style={{ background: i % 2 === 0 ? "#f9f9f9" : "white" }}>
                {editId === p.id ? (
                  <>
                    <td style={tdStyle}><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ width: "100%", padding: "4px" }} /></td>
                    <td style={tdStyle}><input value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} style={{ width: "100%", padding: "4px" }} /></td>
                    <td style={tdStyle}><input type="number" value={editForm.quantity} onChange={e => setEditForm({ ...editForm, quantity: e.target.value })} style={{ width: "100%", padding: "4px" }} /></td>
                    <td style={tdStyle}><input type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} style={{ width: "100%", padding: "4px" }} /></td>
                    <td style={tdStyle}>—</td>
                    <td style={tdStyle}>
                      <button onClick={() => saveEdit(p.id)} style={{ ...actionBtn, background: "#006600" }}>💾 Save</button>
                      <button onClick={() => setEditId(null)} style={{ ...actionBtn, background: "#888", marginLeft: "5px" }}>✕ Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={tdStyle}>{p.name}</td>
                    <td style={tdStyle}>{p.category || "—"}</td>
                    <td style={tdStyle}>{p.quantity}</td>
                    <td style={tdStyle}>{p.price ? `₹${p.price}` : "—"}</td>
                    <td style={tdStyle}>
                      <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "12px", background: Number(p.quantity) < 10 ? "#ffe0e0" : "#e0ffe0", color: Number(p.quantity) < 10 ? "#cc0000" : "#006600" }}>
                        {Number(p.quantity) < 10 ? "⚠️ Low Stock" : "✅ In Stock"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => { setEditId(p.id); setEditForm(p); }} style={{ ...actionBtn, background: "#1F4E79" }}>✏️ Edit</button>
                      <button onClick={() => deleteProduct(p.id)} style={{ ...actionBtn, background: "#cc0000", marginLeft: "5px" }}>🗑️ Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const statCard = (color) => ({
  background: color, color: "white", padding: "20px",
  borderRadius: "10px", textAlign: "center"
});

const inputStyle = {
  padding: "10px", borderRadius: "6px", border: "1px solid #ccc",
  fontSize: "14px", width: "100%", boxSizing: "border-box"
};

const btnStyle = {
  marginTop: "15px", background: "#1F4E79", color: "white",
  border: "none", padding: "10px 25px", borderRadius: "6px",
  fontSize: "15px", cursor: "pointer"
};

const actionBtn = {
  color: "white", border: "none", padding: "5px 10px",
  borderRadius: "5px", cursor: "pointer", fontSize: "12px"
};

const thStyle = { padding: "12px", textAlign: "left", fontWeight: "bold" };
const tdStyle = { padding: "10px", borderBottom: "1px solid #eee" };

export default App;
