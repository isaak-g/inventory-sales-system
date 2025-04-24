import { FiHome, FiShoppingCart, FiPackage, FiSettings, FiLogOut, FiMenu, FiFilter, FiTrendingUp } from "react-icons/fi";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.aside
      animate={{ width: isSidebarOpen ? 250 : 80 }}
      className="bg-blue-600 text-white flex flex-col p-4 space-y-4 shadow-lg h-screen fixed left-0 top-0 overflow-y-auto"
    >
      {/* 🔹 Sidebar Top - Navigation */}
      <div>
        <button className="text-xl flex items-center justify-center mb-4" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <FiMenu />
        </button>
        
        <nav className="flex flex-col space-y-4">
          <NavItem icon={FiHome} label="Dashboard" isOpen={isSidebarOpen} onClick={() => navigate("/")} />
          <NavItem icon={FiShoppingCart} label="Sales" isOpen={isSidebarOpen} onClick={() => navigate("/sales")} />
          <NavItem icon={FiPackage} label="Products" isOpen={isSidebarOpen} onClick={() => navigate("/products")} />
          <NavItem icon={FiTrendingUp} label="AI Insights" isOpen={isSidebarOpen} onClick={() => navigate("/ai-insights")} />
          <NavItem icon={FiSettings} label="Settings" isOpen={isSidebarOpen} onClick={() => navigate("/settings")} />
        </nav>

        {/* 🔹 Logout Button - Below Navigation, Easy to Find */}
        <button
          className="w-full mt-4 p-2 bg-red-500 hover:bg-red-700 rounded-lg"
          onClick={() => { logout(); navigate("/login"); }}
        >
          <FiLogOut className="inline mr-2" /> Logout
        </button>
      </div>


    </motion.aside>
  );
}

function NavItem({ icon: Icon, label, isOpen, onClick }) {
  return (
    <div className="flex items-center space-x-3 p-2 hover:bg-blue-500 rounded cursor-pointer" onClick={onClick}>
      <Icon size={20} />
      {isOpen && <span>{label}</span>}
    </div>
  );
}
