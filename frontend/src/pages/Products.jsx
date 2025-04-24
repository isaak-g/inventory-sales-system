import { useState, useEffect } from "react";

import { FiList, FiGrid, FiPlus, FiX, FiHome, FiShoppingCart, FiPackage, FiSettings, FiLogOut, FiMenu, FiEdit, FiTrash, FiSearch } from "react-icons/fi";

import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/layout/Sidebar";   // ✅ Import Sidebar
import { useNavigate } from "react-router-dom";
import axios from "axios";  

export default function Products() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid");
  const [products, setProducts] = useState([]);  
  //const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", image: "", category: "", brand: "", stock_quantity: "" });
  const [editingProduct, setEditingProduct] = useState(null);
  const [productData, setProductData] = useState([]);
  const [stockUpdateType, setStockUpdateType] = useState(""); 
  const [searchQuery, setSearchQuery] = useState("");  // 🔍 For typing search (name & brand)
  const [selectedCategory, setSelectedCategory] = useState(""); // 🔽 Dropdown category filter


  if (!user) {
    navigate("/login");
    return null;
  }

  // Fetch products from Flask API
/*useEffect(() => {
  axios.get("http://127.0.0.1:5000/products")
    .then(response => {
      console.log("API Response:", response.data); // Debugging
      setProducts(Array.isArray(response.data.products) ? response.data.products : []);

    })
    .catch(error => console.error("Error fetching products:", error));
}, []);*/

const fetchProducts = async () => {
  try {
    const response = await axios.get("http://127.0.0.1:5000/products");
    console.log("API Response:", response.data);
    setProducts(Array.isArray(response.data) ? response.data : response.data.products || []);
  } catch (error) {
    console.error("Error fetching products:", error);
  }
};

useEffect(() => {
  fetchProducts();
}, []); // Still runs once, but we can call fetchProducts manually later


useEffect(() => {
  axios.get("http://127.0.0.1:5000/products")
    .then(response => {
      console.log("API Response:", response.data); // Check structure
      setProducts(Array.isArray(response.data) ? response.data : response.data.products || []);
    })
    .catch(error => console.error("Error fetching products:", error));
}, []);

// 🔍 Filter products based on search and category
const filteredProducts = products.filter((product) => {
  const matchesSearch =
    searchQuery === "" ||
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase());

  const matchesCategory =
    selectedCategory === "" || // Show all if no category is selected
    product.category.toLowerCase() === selectedCategory.toLowerCase();

  return matchesSearch && matchesCategory;
});

const handleSearchChange = (e) => {
  setSearchQuery(e.target.value);
  console.log("🔍 Search Query:", e.target.value); // Debugging
};

const handleCategoryChange = (e) => {
  setSelectedCategory(e.target.value);
  console.log("📂 Selected Category:", e.target.value); // Debugging
};




  
// Handle adding new product
const handleAddProduct = async () => {
  if (!newProduct.name || !newProduct.brand || !newProduct.category || !newProduct.price) {
    alert("❌ Please fill in all required fields.");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    const payload = {
      name: newProduct.name.trim(),
      brand: newProduct.brand.trim(),
      category: newProduct.category.trim(),
      price: Number(newProduct.price),
      stock_quantity: Number(newProduct.stock_quantity),
      image: newProduct.image.trim(),
    };

    console.log("📩 Sending Payload:", JSON.stringify(payload, null, 2));

    const response = await axios.post("http://127.0.0.1:5000/add_product", payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    console.log("✅ Product added/stock updated:", response.data);

    const updatedProduct = response.data.product;

    setProducts((prevProducts) => {
      const existingIndex = prevProducts.findIndex(p => p.id === updatedProduct.id);
      
      if (existingIndex !== -1) {
        // If the product exists, update stock without duplicating
        const updatedProducts = [...prevProducts];
        updatedProducts[existingIndex] = {
          ...updatedProducts[existingIndex],
          stock_quantity: updatedProduct.stock_quantity
        };
        return updatedProducts;
      }
      
      // If it's a new product, add it to the list
      return [...prevProducts, updatedProduct];
    });

    setNewProduct({ name: "", price: "", image: "", category: "", brand: "", stock_quantity: "" });

  } catch (error) {
    console.error("❌ Error adding product:", error.response?.data || error.message);
  }
};

 // Handle refreshing token
 const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    const response = await axios.post("http://127.0.0.1:5000/refresh", {}, {
      headers: { "Authorization": `Bearer ${refreshToken}` },
    });

    const newAccessToken = response.data.access_token;
    localStorage.setItem("token", newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error("Failed to refresh token. Redirecting to login.");
    localStorage.removeItem("token");
    window.location.href = "/login";
    return null;
  }
};

 // Handle deleting product
 const handleDelete = async (productId) => {
  if (!window.confirm("Are you sure you want to delete this product?")) return;

  try {
    let token = localStorage.getItem("token");

    let response = await axios.delete(`http://127.0.0.1:5000/products/${productId}`, {
      headers: { "Authorization": `Bearer ${token}` },
    });

    console.log(response.data.message);
    setProducts(products.filter(product => product.id !== productId));
  } catch (error) {
    if (error.response?.status === 401 && error.response.data?.error === "Token has expired") {
      console.warn("Token expired. Refreshing...");

      const newToken = await refreshAccessToken();
      if (newToken) {
        return handleDelete(productId); // Retry with new token
      }
    }
    console.error("Error deleting product:", error.response?.data || error.message);
  }
};


// Open Modal for Editing
const openEditModal = (product) => {
  setEditingProduct(product); // Set current product being edited
  setProductData(product); // Pre-fill form with product data
  setIsEditModalOpen(true);
};

// Handle Update Product
const handleUpdateProduct = async () => {
  if (!editingProduct) return;

  if (!productData.name.trim() || !productData.category.trim() || !productData.price) {
    console.error("⚠️ Name, Category, and Price are required!");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    let updatedStockQuantity = Math.max(0, Number(productData.stock_quantity) || 0);
    if (stockUpdateType === "increment") {
      updatedStockQuantity = Math.max(0, editingProduct.stock_quantity + Number(productData.stock_quantity));
    }

    const payload = {
      name: productData.name.trim(),
      brand: productData.brand?.trim() || "Unknown",
      category: productData.category.trim(),
      price: Number(productData.price) || 0,
      stock_quantity: updatedStockQuantity, // Correct stock update
      image: productData.image.trim() || null,
    };

    console.log("🔄 Updating Product:", JSON.stringify(payload, null, 2));

    const response = await axios.put(
      `http://127.0.0.1:5000/products/${editingProduct.id}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    console.log("✅ Product updated:", response.data);

    setIsEditModalOpen(false);
    setEditingProduct(null);
    setProductData({ name: "", price: "", image: "", category: "", brand: "", stock_quantity: "" });

    // Refresh products
    fetchProducts();
  } catch (error) {
    console.error("❌ Error updating product:", error.response?.data || error.message);
    alert("Failed to update product. Please try again.");
  }
};



const closeEditModal = () => {
  setIsEditModalOpen(false);
  setEditingProduct(null);
  setProductData({ name: "", price: "", image: "", category: "", brand: "", stock_quantity: "" });
};

  

return (
  <div className="flex min-h-screen  bg-gray-100">

    {/* Sidebar (Fixed) */}
    <Sidebar />

    {/* Main Content */}
    <main className="flex-1 p-6 ml-[250px]">
      {/* Header: Title & Toggle Button */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-blue-600">Products</h1>
        {/* Toggle Button at Top Right */}
          <button onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center">
            {viewMode === "grid" ? <FiList size={20} /> : <FiGrid size={20} />}
            <span className="ml-2">Switch to {viewMode === "grid" ? "Table" : "Grid"}</span>
          </button>
      </div>

      {/* Add Product Button Below the Title */}
      <div className="mb-4">
      {user.role === "admin" && (
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center"
          >
            <FiPlus size={20} />
            <span className="ml-2">Add Product</span>
          </button>
        )}
      </div>

      {/* Search & Filter Section */}
      {/* Search & Filter Section */}
      <div className="flex gap-4 mt-4 mb-6">  {/* Added mb-6 for spacing */}
        
        {/* 🔍 Search Input */}
        <div className="relative w-72">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-800 text-xl z-10" />
          <input 
            type="text"
            placeholder="Search by name or brand..."
            className="pl-12 pr-4 py-2 border border-gray-400 rounded w-full bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        {/* 🔽 Category Dropdown */}
        <select
          className="px-4 py-2 border border-gray-400 rounded bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={selectedCategory}
          onChange={handleCategoryChange}
        >
          <option value="">All Categories</option>
          <option value="Laptop">Laptop</option>
          <option value="Phone">Phone</option>
          <option value="TV">TV</option>
          <option value="Accessories">Accessories</option>
        </select>
      </div>


      {/* Grid or Table View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div key={product.id} className="bg-white p-4 rounded-lg shadow-lg text-gray-900">
                <img src={product.image && product.image.trim() !== "" ? product.image : "https://picsum.photos/100"} 
                    alt={product.name} className="w-full h-32 object-cover rounded" />
                <h2 className="text-lg font-semibold mt-2">{product.name}</h2>
                <p className="text-gray-600">{product.category}</p>  
                <p className="text-blue-600 font-bold">${product.price}</p>
                <p className="text-blue-600 font-bold">Stock: {product.stock_quantity}</p>
                
                {user.role === "admin" && (
                  <div className="flex space-x-2 mt-2">
                    <button onClick={() => openEditModal(product)} className="bg-yellow-500 text-white px-4 py-2 rounded">
                      <FiEdit /> Edit
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="bg-red-600 text-white px-4 py-2 rounded">
                      <FiTrash /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No matching products found.</p>
          )}
        </div>
      ) : (
        <table className="border-collapse border w-full mt-4 text-gray-900">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border p-2">Image</th>
              <th className="border p-2">Product Name</th>
              <th className="border p-2">Category</th>
              <th className="border p-2">Price</th>
              <th className="border p-2">Stock Levels</th>
              <th className="px-4 py-2">Action</th>                                      
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product.id} className="text-center bg-white text-gray-900">
                  <td className="border p-2">
                    <img src={product.image && product.image.trim() !== "" ? product.image : "https://picsum.photos/100"} 
                        alt={product.name} className="w-full h-32 object-cover rounded" />
                  </td>
                  <td className="border p-2">{product.name}</td>
                  <td className="border p-2">{product.category}</td>
                  <td className="border p-2 text-blue-600 font-bold">${product.price}</td>
                  <td className="border p-2 text-blue-600 font-bold">{product.stock_quantity}</td>
                  <td className="px-4 py-2">
                    {user.role === "admin" ? (
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="bg-yellow-500 text-white px-4 py-2 rounded"
                        >
                          <FiEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded"
                        >
                          <FiTrash /> Delete
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500">Restricted</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-gray-500 p-4">No matching products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}


      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96 border border-gray-300">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-black dark:text-white">Add New Product</h2>
              <FiX 
                className="cursor-pointer text-gray-700 hover:text-gray-900 text-2xl" 
                onClick={() => setIsAddModalOpen(false)} 
              />
            </div>

            {/* Product Form */}
            <input 
              type="text" 
              placeholder="Product Name" 
              className="w-full p-2 border border-gray-300 rounded mt-2 text-black dark:text-white bg-white dark:bg-gray-700"
              value={newProduct.name} 
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} 
            />

            <input 
              type="text" 
              placeholder="Product Brand" 
              className="w-full p-2 border border-gray-300 rounded mt-2 text-black dark:text-white bg-white dark:bg-gray-700"
              value={newProduct.brand} 
              onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })} 
            />

            <input 
              type="number" 
              placeholder="Price" 
              className="w-full p-2 border border-gray-300 rounded mt-2 text-black dark:text-white bg-white dark:bg-gray-700"
              value={newProduct.price} 
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} 
            />

            <select 
              className="w-full p-2 border border-gray-300 rounded mt-2 text-black dark:text-white bg-white dark:bg-gray-700"
              value={newProduct.category} 
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
            >
              <option value="">Select Category</option>
              <option value="Laptop">Laptop</option>
              <option value="Phone">Phone</option>
              <option value="TV">TV</option>
              <option value="Accessories">Accessories</option>
            </select>

            <input 
              type="number" 
              placeholder="Stock Quantity" 
              className="w-full p-2 border rounded mt-2 text-black bg-gray-100"
              value={newProduct.stock_quantity} 
              onChange={(e) => {
                const value = Math.max(0, e.target.value); // Prevents negative numbers
                setNewProduct({ ...newProduct, stock_quantity: value });
              }} 
            />

            <input 
              type="text" 
              placeholder="Image URL" 
              className="w-full p-2 border border-gray-300 rounded mt-2 text-black dark:text-white bg-white dark:bg-gray-700"
              value={newProduct.image} 
              onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} 
            />

            <button className="w-full bg-green-600 text-white p-2 mt-4 rounded hover:bg-green-700" onClick={handleAddProduct}>
              Add Product
            </button>
          </div>
        </div>
      )}

        {/* Edit Product Modal */}
      {isEditModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-black">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Edit Product</h2>
            <FiX onClick={closeEditModal} className="cursor-pointer text-gray-700 hover:text-gray-900 text-2xl" />
          </div>

          <input type="text" placeholder="Product Name" className="w-full p-2 border rounded mt-2 text-black bg-gray-100"
            value={productData.name} onChange={(e) => setProductData({ ...productData, name: e.target.value })} />

          <input type="text" placeholder="brand " className="w-full p-2 border rounded mt-2 text-black bg-gray-100"
                      value={productData.brand} onChange={(e) => setProductData({ ...productData, brand: e.target.value })} />

          <input type="number" placeholder="Price" className="w-full p-2 border rounded mt-2 text-black bg-gray-100"
            value={productData.price} onChange={(e) => setProductData({ ...productData, price: e.target.value })} />

          <input type="text" placeholder="Image URL" className="w-full p-2 border rounded mt-2 text-black bg-gray-100"
            value={productData.image} onChange={(e) => setProductData({ ...productData, image: e.target.value })} />

          <select className="w-full p-2 border rounded mt-2 text-black bg-gray-100"
            value={productData.category} onChange={(e) => setProductData({ ...productData, category: e.target.value })}>
            <option value="">Select Category</option>
            <option value="Laptop">Laptop</option>
            <option value="Phone">Phone</option>
            <option value="TV">TV</option>
            <option value="Accessories">Accessories</option>
          </select>

          {/* Stock Update Options */}
          <div className="mt-4">
            <label className="font-semibold">Stock Update Method:</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2">
                <input type="radio" name="stockUpdate" value="set"
                  checked={stockUpdateType === "set"}
                  onChange={() => setStockUpdateType("set")}
                />
                Set Stock
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="stockUpdate" value="increment"
                  checked={stockUpdateType === "increment"}
                  onChange={() => setStockUpdateType("increment")}
                />
                Increment Stock
              </label>
            </div>
          </div>

          {/* Conditionally Show Stock Input */}
          {stockUpdateType && (
            <input 
              type="number" 
              placeholder="Stock Quantity" 
              className="w-full p-2 border rounded mt-2 text-black bg-gray-100"
              value={productData.stock_quantity} 
              onChange={(e) => {
                const value = Math.max(0, Number(e.target.value)); // Prevents negative stock values
                setProductData({ ...productData, stock_quantity: value });
              }} 
            />
          )}

          <button className="w-full bg-blue-600 text-white p-2 mt-4 rounded hover:bg-blue-700" onClick={handleUpdateProduct}>
            Update Product
          </button>
        </div>
      </div>
    )}

    </main>
  </div>
);
}


