import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import { FiUser, FiLock, FiSave, FiTrash, FiUsers, FiPlus } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function Settings() {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);  
  const [newAdminEmail, setNewAdminEmail] = useState(""); 

  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "staff" });

  useEffect(() => {
    if (user.role === "admin") {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://127.0.0.1:5000/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("❌ Error fetching users:", error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!username || !email) {
      alert("⚠️ Username and email are required!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://127.0.0.1:5000/update_profile",
        { username, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Profile updated successfully!");
    } catch (error) {
      console.error("❌ Error updating profile:", error.response?.data || error.message);
      setMessage("❌ Failed to update profile.");
    }
  };

  const handlePasswordChange = async () => {
    if (!password) {
      alert("⚠️ Please enter a new password!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        "http://127.0.0.1:5000/change_password",
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Password changed successfully!");
      setPassword("");
    } catch (error) {
      console.error("❌ Error changing password:", error.response?.data || error.message);
      setMessage("❌ Failed to change password.");
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      alert("⚠️ All fields are required!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://127.0.0.1:5000/add_user",
        newUser,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(`✅ ${newUser.username} added successfully!`);
      setNewUser({ username: "", email: "", password: "", role: "staff" });
      fetchUsers();
    } catch (error) {
      console.error("❌ Error adding user:", error.response?.data || error.message);
      setMessage("❌ Failed to add user.");
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      alert("⚠️ Please enter a valid email.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const existingUser = users.find(user => user.email === newAdminEmail);
      if (!existingUser) {
        alert("❌ No user found with this email. Please add the user first.");
        return;
      }

      if (existingUser.role === "admin") {
        alert("⚠️ This user is already an admin.");
        return;
      }

      await axios.put(
        `http://127.0.0.1:5000/update_role/${existingUser.id}`,
        { role: "admin" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(`✅ ${existingUser.username} has been promoted to admin.`);
      fetchUsers(); 
      setNewAdminEmail("");
    } catch (error) {
      console.error("❌ Error promoting admin:", error.response?.data || error.message);
      setMessage("❌ Failed to promote user.");
    }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!window.confirm("⚠️ Are you sure you want to remove this admin?")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://127.0.0.1:5000/update_role/${userId}`,
        { role: "staff" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("✅ Admin has been demoted to staff.");
      fetchUsers();
    } catch (error) {
      console.error("❌ Error removing admin:", error.response?.data || error.message);
      setMessage("❌ Failed to remove admin.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 ml-[250px]">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">Settings</h1>

        <div className="flex space-x-6 mb-8">
          {/* Profile Information */}
          <div className="bg-white p-4 rounded-lg shadow-md max-w-3xl w-full mb-6">
            <h2 className="text-xl font-semibold mb-3 text-black">Profile Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-700 font-semibold text-sm">Username</label>
                <input
                  type="text"
                  className="w-full p-2 text-sm border border-gray-400 rounded mt-1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold text-sm">Email</label>
                <input
                  type="email"
                  className="w-full p-2 text-sm border border-gray-400 rounded mt-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <button
              onClick={handleProfileUpdate}
              className="mt-3 bg-green-600 text-white px-5 py-1.5 text-sm rounded-full flex items-center"
            >
              <FiSave className="mr-2" /> Save Changes
            </button>
          </div>

          {/* Change Password */}
          <div className="bg-white p-4 rounded-lg shadow-md max-w-3xl w-full mb-6">
            <h2 className="text-xl font-semibold mb-3 text-black">Change Password</h2>
            <div>
              <label className="block text-gray-700 font-semibold text-sm">New Password</label>
              <input
                type="password"
                className="w-full p-2 text-sm border border-gray-400 rounded mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              onClick={handlePasswordChange}
              className="mt-3 bg-blue-600 text-white px-5 py-1.5 text-sm rounded-full flex items-center"
            >
              <FiLock className="mr-2" /> Change Password
            </button>
          </div>
        </div>

        {/* Add New User */}
        {user.role === "admin" && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6 max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-3 text-black">Add New User</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-700 font-semibold text-sm">Username</label>
                <input
                  type="text"
                  className="w-full p-2 text-sm border border-gray-400 rounded mt-1"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold text-sm">Email</label>
                <input
                  type="email"
                  className="w-full p-2 text-sm border border-gray-400 rounded mt-1"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold text-sm">Password</label>
                <input
                  type="password"
                  className="w-full p-2 text-sm border border-gray-400 rounded mt-1"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold text-sm">Role</label>
                <select
                  className="w-full p-2 text-sm border border-gray-400 rounded mt-1"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                onClick={handleAddUser}
                className="mt-3 bg-blue-600 text-white px-5 py-1.5 text-sm rounded-full flex items-center"
              >
                <FiPlus className="mr-2" /> Add User
              </button>
            </div>
          </div>
        )}

        {/* Admin Management */}
        {user.role === "admin" && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6 max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-3 text-black">Manage Admins</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="email"
                  className="w-full p-2 text-sm border border-gray-400 rounded mt-1"
                  placeholder="Enter staff email..."
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
                <button
                  onClick={handleAddAdmin}
                  className="ml-2 bg-green-600 text-white px-5 py-1.5 text-sm rounded-full"
                >
                  Promote
                </button>
              </div>

              <h3 className="mt-3 font-semibold text-gray-700 text-sm">Current Admins:</h3>
              <ul className="mt-2">
                {users
                  .filter((user) => user.role === "admin")
                  .map((admin) => (
                    <li key={admin.id} className="flex justify-between p-3 border rounded mt-2">
                      {admin.email}
                      <button
                        onClick={() => handleRemoveAdmin(admin.id)}
                        className="bg-red-600 text-white px-4 py-1.5 text-sm rounded-full"
                      >
                        <FiTrash />
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}

        {message && <p className="mt-4 text-center text-gray-800">{message}</p>}
      </main>
    </div>
  );
}
