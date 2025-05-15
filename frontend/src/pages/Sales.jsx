import { useState, useEffect } from "react";
import { FiHome, FiShoppingCart, FiPackage, FiSettings, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/layout/Sidebar";   //  Import Sidebar

export default function Sales() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // State for Sales Data
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);

  // State for Adding Sales
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("");  //  Define price state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  //  Fetch Sales Data from API
  const fetchSales = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/sales");
      console.log("📊 Sales API Response:", response.data);  //  Debugging Log
      
      if (Array.isArray(response.data.sales)) {
        setSales(response.data.sales);
        setFilteredSales(response.data.sales);
      } else {
        console.warn("⚠️ Unexpected sales data format:", response.data);
        setSales([]);
        setFilteredSales([]);
      }
    } catch (error) {
      console.error("❌ Error fetching sales:", error);
      setSales([]);
      setFilteredSales([]);
    }
  };
  

  //  Fetch Products for Sale Selection
  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/products");
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      setProducts([]);
    }
  };

  //  Apply Filters (Date, Brand, Category)
  useEffect(() => {
  
    let filtered = sales;
  
    if (filterDate) {
      console.log("Filter Date:", filterDate);  // Log the raw filterDate
  
      // Ensure filterDate is in YYYY-MM-DD format (it already is, but we'll keep it for clarity)
      const formattedFilterDate = filterDate;
      console.log("Formatted Date:", formattedFilterDate);  // Log the formatted date
  
      // Filter sales based on the formatted date (no need to split or pad)
      filtered = filtered.filter(sale => {
        // Extract the date part (YYYY-MM-DD) from the sale.date
        const saleDate = sale?.date?.split(' ')[0];  // Get the date part (YYYY-MM-DD) before the space
        console.log("Sale Date:", saleDate);  // Log the extracted sale date
        
        // Compare the saleDate (YYYY-MM-DD) with formattedFilterDate
        return saleDate === formattedFilterDate;  // Compare in the same format
      });
    }
  
    // Apply additional filters for brand and category
    if (filterBrand) {
      filtered = filtered.filter(sale => 
        sale?.product?.toLowerCase().includes(filterBrand.toLowerCase()) || 
        sale?.brand?.toLowerCase().includes(filterBrand.toLowerCase())
      );
    }
  
    if (filterCategory) {
      filtered = filtered.filter(sale => sale?.category?.toLowerCase() === filterCategory?.toLowerCase());
    }
  
    console.log("Filtered Sales:", filtered);  // Debugging log for filtered sales
    setFilteredSales(filtered);
  }, [filterDate, filterBrand, filterCategory, sales]);
  
     

  //  Make a Sale (Reduce Stock Automatically)
  const handleMakeSale = async () => {
    if (!selectedProduct || !quantity || Number(quantity) <= 0) {
      alert("⚠️ Please select a product and enter a valid quantity.");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://127.0.0.1:5000/make_sale", 
        { product_id: selectedProduct, quantity: Number(quantity) }, 
        { headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } }
      );
  
      console.log(" Sale Processed:", response.data);
  
      if (response.data.sale) {
        const newSale = response.data.sale;
  
        setSales(prevSales => [newSale, ...prevSales]);  // Add new sale to state
        setFilteredSales(prevSales => [newSale, ...prevSales]);  //  Update filtered list
  
        fetchProducts();  // Update stock levels
        setIsModalOpen(false);
      } else {
        console.warn("⚠️ No sale data returned from API.");
      }
    } catch (error) {
      console.error("❌ Sale Error:", error.response?.data || error.message);
      alert(error.response?.data?.error || "Failed to process sale.");
    }
  };
  

  //  Calculate Total Revenue
  const totalRevenue = (filteredSales?.length > 0) 
  ? filteredSales.reduce((sum, sale) => sum + ((sale?.quantity || 0) * (sale?.price || 0)), 0)
  : 0;


  return (
    <div className="flex min-h-screen bg-gray-100">
    
      {/* Sidebar (Fixed) */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 ml-[250px]">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-blue-700">Sales</h1>
          <button onClick={() => setIsModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded">+ Make Sale</button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap md:flex-nowrap gap-4 mb-4 bg-gray-50 p-4 rounded-lg shadow-md">
          {/* 📅 Date Filter */}
          <input 
            type="date" 
            className="flex-1 p-3 border border-gray-500 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={filterDate} 
            onChange={(e) => setFilterDate(e.target.value)} 
          />

          {/* 🔎 Product Name or Brand Search Input */}
          <input 
            type="text" 
            placeholder="Search by Product Name or Brand..." //  Clearer text
            className="flex-1 p-3 border border-gray-500 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={filterBrand} 
            onChange={(e) => setFilterBrand(e.target.value.toLowerCase())} 
          />

          {/*  Dropdown for Category */}
          <select 
            className="flex-1 p-3 border border-gray-500 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Filter by Category</option>
            {Array.from(new Set(products.map(product => product.category))).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>



        {/* 📌 Sales Table  */}
        <table className="border-collapse border w-full mt-4 bg-white shadow-lg rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-blue-600 text-white text-left">
              <th className="border p-3">Date</th>
              <th className="border p-3">Product</th>
              <th className="border p-3">Quantity</th>
              <th className="border p-3">Price</th>
              <th className="border p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(filteredSales) && filteredSales.length > 0 ? (
              filteredSales.map((sale, index) => (
                sale && sale.id ? (  //  Ensure sale is defined before using sale.id
                  <tr key={sale.id || index} className="text-gray-900 text-left border hover:bg-gray-100">
                    <td className="border p-3">{sale.date || "Unknown"}</td>  
                    <td className="border p-3">{sale.product || "Unknown"}</td>
                    <td className="border p-3">{sale.quantity || 0}</td>
                    <td className="border p-3">${sale.price || 0}</td>
                    <td className="border p-3 font-bold">${(sale.quantity || 0) * (sale.price || 0)}</td>
                  </tr>
                ) : null //  Skip invalid sale records
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 p-4">No sales data available.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* 📌 Make Sale Modal */}
        {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 lg:w-[400px]">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Make a Sale</h2>
              <FiX className="cursor-pointer text-gray-700 hover:text-gray-900 text-2xl" onClick={() => setIsModalOpen(false)} />
            </div>
        
            {/* 🔽 Select Category First */}
            <label className="block text-gray-700 font-semibold">Select Category:</label>
            <select 
              className="w-full p-3 border border-gray-500 rounded-lg text-lg text-gray-900 bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-3"
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">Choose Category</option>
              {Array.from(new Set(products.map(product => product.category))).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
        
            {/* 🔎 Search Brand (Filters Dropdown) */}
            <label className="block text-gray-700 font-semibold">Search Brand:</label>
            <input 
              type="text" 
              placeholder="Search brand..." 
              className="w-full p-3 border border-gray-500 rounded-lg text-lg text-gray-900 bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-3"
              value={filterBrand} 
              onChange={(e) => setFilterBrand(e.target.value.toLowerCase())} 
            />
        
            {/* 🔽 Filtered Product List Based on Brand & Category */}
            <label className="block text-gray-700 font-semibold">Select Product:</label>
            <select 
              className="w-full p-3 border border-gray-500 rounded-lg text-lg text-gray-900 bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-3"
              value={selectedProduct} 
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                const selected = products.find(product => product.id.toString() === e.target.value);
                if (selected) {
                  setPrice(selected.price);  // Auto-fill price
                }
              }}
            >
              <option value="">Choose a Product</option>
              {products
                .filter(product => 
                  (filterCategory ? product.category === filterCategory : true) &&
                  (filterBrand ? product.brand.toLowerCase().includes(filterBrand) : true)
                )
                .map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Stock: {product.stock_quantity})
                  </option>
                ))
              }
            </select>
        
            {/* 🔹 Auto-filled Product Price */}
            <label className="block text-gray-700 font-semibold">Price (per unit):</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-500 rounded-lg text-lg text-gray-700 bg-gray-200 outline-none mb-3" 
              value={price} 
              readOnly 
            />
        
            {/* 🔢 Quantity Input */}
            <label className="block text-gray-700 font-semibold">Quantity:</label>
            <input 
              type="number" 
              className="w-full p-3 border border-gray-500 rounded-lg text-lg text-gray-900 bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-3"
              value={quantity} 
              onChange={(e) => setQuantity(e.target.value)} 
            />
        
            {/* 🟢 Process Sale Button */}
            <button 
              onClick={handleMakeSale} 
              className="w-full bg-blue-600 text-white p-3 mt-3 rounded-lg text-lg hover:bg-blue-700 transition"
            >
              Process Sale
            </button>
          </div>
        </div>
        
        )}

      </main>
    </div>
  );
}


