import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiHome, FiShoppingCart, FiBox, FiSettings, FiLogOut, FiMenu, FiPackage } from "react-icons/fi";
import { motion } from "framer-motion";
import axios from "axios";
import dayjs from "dayjs"; // ✅ Import for date filtering

import { Card, CardContent } from "@/components/ui/card";
import SalesChart from "../components/charts/SalesChart";
import CategoryPieChart from "../components/charts/CategoryPieChart";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/layout/Sidebar";   // ✅ Import Sidebar



export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768); 
  const { user, logout } = useAuth();  
  const navigate = useNavigate();
  const [totalCount, setTotalCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [totalSales, setTotalSales] = useState(0);
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [filter, setFilter] = useState("monthly"); // ✅ Default filter

  // 🔒 Redirect to login if not authenticated
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // ✅ Handle Sidebar Auto-Collapse on Resize
  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth > 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Fetch Dashboard Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [totalRes, categoryRes, salesRes] = await Promise.all([
          axios.get("http://localhost:5000/products/count-total"),
          axios.get("http://localhost:5000/products/count-by-category"),
          axios.get("http://localhost:5000/sales/total")
        ]);

        setTotalCount(totalRes.data.total_count);
        setCategoryCounts(categoryRes.data);
        setTotalSales(salesRes.data.total_sales);
      } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    axios.get("http://localhost:5000/sales")
      .then(response => {
        console.log("📊 Sales API Response:", response.data); // Debugging log
        const formattedSales = response.data.sales.map(sale => ({
          date: sale.date.split(" ")[0],  // ✅ Keep only "YYYY-MM-DD" for chart
          total: sale.total_price,  // ✅ Keep total price for graph
          fullDate: sale.date // ✅ Store full date for table (optional)
        }));
        setSalesData(formattedSales);
      })
      .catch(error => console.error("❌ Error fetching sales data:", error));
  }, []);

  // ✅ Fetch Sales Data & Filter Based on Selected Interval
  useEffect(() => {
    axios.get("http://localhost:5000/sales")
      .then(response => {
        const allSales = response.data.sales.map(sale => ({
          date: sale.date.split(" ")[0],  // ✅ Keep only "YYYY-MM-DD"
          fullDate: sale.date, // ✅ Full timestamp (for reference)
          total: sale.total_price
        }));

        // ✅ Filter Sales Based on Selected Interval
        const filteredSales = allSales.filter(sale => {
          const saleDate = dayjs(sale.date);
          const now = dayjs();

          if (filter === "24hrs") return saleDate.isAfter(now.subtract(1, "day"));
          if (filter === "weekly") return saleDate.isAfter(now.subtract(7, "days"));
          if (filter === "monthly") return saleDate.isAfter(now.subtract(1, "month"));
          return true; // Default: Show all sales
        });

        setSalesData(filteredSales);
      })
      .catch(error => console.error("❌ Error fetching sales data:", error));
  }, [filter]); // ✅ Refetch when filter changes
  

  useEffect(() => {
    // ✅ Fetch Total Products & Products by Category
    axios.get("http://localhost:5000/products/count-total")
      .then(response => setTotalCount(response.data.total_count))
      .catch(error => console.error("Error fetching total product count:", error));
  
    /*axios.get("http://localhost:5000/products/count-by-category")
      .then(response => setCategoryCounts(response.data)) // ✅ Store product counts separately
      .catch(error => console.error("Error fetching category counts:", error));*/

    axios.get("http://localhost:5000/sales/count-by-category")
      .then(response => {
        console.log("📊 Sales Category API Response:", response.data); // ✅ Debugging log
        const formattedData = Object.entries(response.data).map(([category, count]) => ({
          name: category,
          value: count
        }));
        setCategoryData(formattedData);
      })
      .catch(error => console.error("❌ Error fetching sales category data:", error));
  
    // ✅ Fetch Total Sales
    axios.get("http://localhost:5000/sales/total")
      .then(response => setTotalSales(response.data.total_sales))
      .catch(error => console.error("Error fetching total sales:", error));
  
    // ✅ Fetch Sales Per Category for Pie Chart
    axios.get("http://localhost:5000/sales/count-by-category")
      .then(response => {
        const formattedData = Object.entries(response.data).map(([category, count]) => ({
          name: category,
          value: count
        }));
        setCategoryData(formattedData); // ✅ Use this for Sales Pie Chart
      })
      .catch(error => console.error("Error fetching sales category data:", error));
  }, []);
  
  
  

  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* Sidebar (Fixed) */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 ml-[250px]">
        <h1 className="text-3xl font-bold mb-4 text-blue-600">Welcome, {user?.email || "User"}!</h1>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard title="Total Sales" value={`$${totalSales}`} />
          <DashboardCard title="Total Products" value={totalCount} />
          <DashboardCard title="AI Insights" value="+10% Growth" />
        </div>

        {/* Product Overview */}
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-black">Product Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(categoryCounts).map(([category, count]) => (
              <div key={category} className="bg-white p-4 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-black">{category}</h3>
                <p className="text-gray-900">Total: {count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Time Interval Filter for Sales Chart */}
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold">📅 Select Time Interval:</label>
          <select
            className="p-2 border rounded-lg text-gray-900 bg-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="24hrs">Last 24 Hours</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-blue-600">📊 Sales & Inventory Overview</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <SalesChart salesData={salesData} /> {/* ✅ Updated Chart */}
            <CategoryPieChart categoryData={categoryData} />
          </div>
        </div>
      </main>
    </div>
  );
}


function DashboardCard({ title, value }) {
  return (
    <Card className="bg-white p-6 rounded-lg shadow-md text-gray-900">
      <CardContent>
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        <p className="text-2xl font-bold mt-2 text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}
