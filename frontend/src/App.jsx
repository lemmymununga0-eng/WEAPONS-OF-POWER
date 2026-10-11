import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import PublicLayout from "./layout/PublicLayout.jsx";
import Home from "./pages/Home.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import MinistriesPage from "./pages/MinistriesPage.jsx";
import ServicesPage from "./pages/ServicesPage.jsx";
import EventDetailPage from "./pages/EventDetailPage.jsx";
import MinistryDetailPage from "./pages/MinistryDetailPage.jsx";
import MediaPage from "./pages/MediaPage.jsx";
import PrayerPage from "./pages/PrayerPage.jsx";
import GivePage from "./pages/GivePage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
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
import AdminLeadersPage from "./admin/pages/AdminLeadersPage.jsx";
import AdminAnnouncementsPage from "./admin/pages/AdminAnnouncementsPage.jsx";
import AdminMediaPage from "./admin/pages/AdminMediaPage.jsx";
import AdminPrayerPage from "./admin/pages/AdminPrayerPage.jsx";
import AdminUsersPage from "./admin/pages/AdminUsersPage.jsx";
import RoleGate from "./admin/RoleGate.jsx";
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
      if (attempts < 150) frame = requestAnimationFrame(tryScroll);
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
          <Route path="/about" element={<AboutPage />} />
          <Route path="/ministries" element={<MinistriesPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/giving" element={<GivePage />} />
          <Route path="/give" element={<Navigate to="/giving" replace />} />
          <Route path="/prayer" element={<PrayerPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/ministries/:id" element={<MinistryDetailPage />} />
          <Route path="/contact" element={<ContactPage />} />
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
          <Route path="/admin/church-info" element={<RoleGate access="admin"><AdminChurchInfoPage /></RoleGate>} />
          <Route path="/admin/ministries" element={<AdminMinistriesPage />} />
          <Route path="/admin/events" element={<AdminEventsPage />} />
          <Route path="/admin/sermons" element={<AdminSermonsPage />} />
          <Route path="/admin/leadership" element={<RoleGate access="admin"><AdminLeadersPage /></RoleGate>} />
          <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
          <Route path="/admin/media" element={<AdminMediaPage />} />
          <Route path="/admin/prayer-requests" element={<RoleGate access="admin"><AdminPrayerPage /></RoleGate>} />
          <Route path="/admin/branches" element={<RoleGate access="admin"><AdminBranchesPage /></RoleGate>} />
          <Route path="/admin/livestream" element={<RoleGate access="admin"><AdminLivestreamPage /></RoleGate>} />
          <Route path="/admin/messages" element={<RoleGate access="admin"><AdminMessagesPage /></RoleGate>} />
          <Route path="/admin/users" element={<RoleGate access="super"><AdminUsersPage /></RoleGate>} />
          <Route path="/admin/account" element={<AdminAccountPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
