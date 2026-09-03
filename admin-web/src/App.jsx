import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { AdminLayout } from "./components/layout/AdminLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { UsersPage } from "./pages/UsersPage";
import { TripsPage } from "./pages/TripsPage";
import { GroupsPage } from "./pages/GroupsPage";
import { EventLogsPage } from "./pages/EventLogsPage";
import { SchoolsPage } from "./pages/SchoolsPage";
import { AddSchoolPage } from "./pages/AddSchoolPage";
import { DestinationsPage } from "./pages/DestinationsPage";
import { PickupLocationsPage } from "./pages/PickupLocationsPage";
import { BreakCalendarPage } from "./pages/BreakCalendarPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
const App = () => {
  return <BrowserRouter basename="/api/admin-panel">
      <AppProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {
    /* Admin Applet with Layout (matching Wireframe v1.0 specifications) */
  }
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/trips" element={<TripsPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/events" element={<EventLogsPage />} />
              <Route path="/schools" element={<SchoolsPage />} />
              <Route path="/schools/add" element={<AddSchoolPage />} />
              <Route path="/destinations" element={<DestinationsPage />} />
              <Route path="/pickups" element={<PickupLocationsPage />} />
              <Route path="/calendar" element={<BreakCalendarPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>;
};
var stdin_default = App;
export {
  App,
  stdin_default as default
};
