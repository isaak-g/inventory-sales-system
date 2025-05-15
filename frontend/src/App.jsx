import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider
import PrivateRoute from "./components/PrivateRoute"; // Only use PrivateRoute
import Login from "./pages/Login";
import ForgotPassword from "./components/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Products from "./pages/Products";
import Settings  from "./pages/Settings";
import AIInsights from "./pages/AIInsights";

const App = () => {
  return (
    <AuthProvider> {/* Wrap the app with AuthProvider */}
      <Router>
        <Routes>
          {/* Default Route Redirects to Login */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Authentication Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          

          {/* Protected Routes (Now using PrivateRoute) */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/products" element={<Products />} />
            <Route path="/ai-insights" element={<AIInsights />} />
            <Route path="/settings" element={<Settings/>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
