import { Routes, Route } from "react-router-dom";
import PublicSite from "./PublicSite.jsx";
import AdminLogin from "./admin/AdminLogin.jsx";
import AdminDashboard from "./admin/AdminDashboard.jsx";
import RequireAuth from "./admin/RequireAuth.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<PublicSite />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
