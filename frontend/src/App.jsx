import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import PublicLayout from "./layout/PublicLayout.jsx";
import Home from "./pages/Home.jsx";
import EventsPage from "./pages/EventsPage.jsx";
import SermonsPage from "./pages/SermonsPage.jsx";
import SermonDetailPage from "./pages/SermonDetailPage.jsx";
import LivePage from "./pages/LivePage.jsx";
import LocationsPage from "./pages/LocationsPage.jsx";
import BranchDetailPage from "./pages/BranchDetailPage.jsx";
import NotFound from "./pages/NotFound.jsx";
import AdminLogin from "./admin/AdminLogin.jsx";
import AdminLayout from "./admin/AdminLayout.jsx";
import AdminOverviewPage from "./admin/pages/AdminOverviewPage.jsx";
import AdminChurchInfoPage from "./admin/pages/AdminChurchInfoPage.jsx";
import AdminMinistriesPage from "./admin/pages/AdminMinistriesPage.jsx";
import AdminEventsPage from "./admin/pages/AdminEventsPage.jsx";
import AdminSermonsPage from "./admin/pages/AdminSermonsPage.jsx";
import AdminBranchesPage from "./admin/pages/AdminBranchesPage.jsx";
import AdminLivestreamPage from "./admin/pages/AdminLivestreamPage.jsx";
import AdminMessagesPage from "./admin/pages/AdminMessagesPage.jsx";
import AdminAccountPage from "./admin/pages/AdminAccountPage.jsx";
import RequireAuth from "./admin/RequireAuth.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";

// Scrolls to the top on a plain route change, or to the matching section
// when navigating to a link like "/#about" from elsewhere. Retries briefly
// since the target page's data (and so the section) may still be loading.
function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
      return;
    }

    const id = location.hash.slice(1);
    let attempts = 0;
    let frame;

    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      attempts += 1;
      if (attempts < 30) frame = requestAnimationFrame(tryScroll);
    };

    tryScroll();
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <ScrollManager />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/sermons" element={<SermonsPage />} />
          <Route path="/sermons/:id" element={<SermonDetailPage />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/locations/:slug" element={<BranchDetailPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route path="/admin" element={<AdminOverviewPage />} />
          <Route path="/admin/church-info" element={<AdminChurchInfoPage />} />
          <Route path="/admin/ministries" element={<AdminMinistriesPage />} />
          <Route path="/admin/events" element={<AdminEventsPage />} />
          <Route path="/admin/sermons" element={<AdminSermonsPage />} />
          <Route path="/admin/branches" element={<AdminBranchesPage />} />
          <Route path="/admin/livestream" element={<AdminLivestreamPage />} />
          <Route path="/admin/messages" element={<AdminMessagesPage />} />
          <Route path="/admin/account" element={<AdminAccountPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
