import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute.js';
import LoginPage from './pages/LoginPage.js';
import WelcomePage from './pages/WelcomePage.js';
import AppShellLayout from './components/shell/AppShellLayout.js';
import OptionUnavailablePage from './pages/OptionUnavailablePage.js';
import ProfilePage from './pages/ProfilePage.js';
import AdminUsersPage from './pages/AdminUsersPage.js';
import AdminTagsPage from './pages/AdminTagsPage.js';
import AdminGithubIntegrationsPage from './pages/AdminGithubIntegrationsPage.js';
import DeliverablesPage from './pages/DeliverablesPage.js';
import DeliverableFormPage from './pages/DeliverableFormPage.js';
import DeliverablesViewPage from './pages/DeliverablesViewPage.js';
import { AdminRoute } from './auth/AdminRoute.js';
import { LeaderRoute } from './auth/LeaderRoute.js';
import { DEFAULT_APP_ROUTE, LOGIN_ROUTE } from './routes/shellOptions.js';
import { useAuth } from './auth/AuthProvider.js';
import AuthThemeSync from './auth/AuthThemeSync.js';
import AuthLocaleSync from './auth/AuthLocaleSync.js';
import LeaderHierarchyManagementPage from './pages/LeaderHierarchyManagementPage.js';
import LeaderTeamDeliverablesPage from './pages/LeaderTeamDeliverablesPage.js';
import LeaderTeamAnalyticsPage from './pages/LeaderTeamAnalyticsPage.js';
import MyPullRequestsPage from './pages/MyPullRequestsPage.js';

function DefaultRouteRedirect() {
  const { accessToken, user, sessionStatus } = useAuth();
  const canAccessApp = Boolean(accessToken && user?.email);

  if (sessionStatus === 'loading') {
    return null;
  }

  if (canAccessApp) {
    return <Navigate to={DEFAULT_APP_ROUTE} replace />;
  }

  return <Navigate to={LOGIN_ROUTE} replace />;
}

export default function App() {
  return (
    <>
      <AuthThemeSync />
      <AuthLocaleSync />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShellLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<WelcomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="deliverables" element={<DeliverablesPage />} />
          <Route path="deliverables/new" element={<DeliverableFormPage mode="create" />} />
          <Route
            path="deliverables/:deliverableId/edit"
            element={<DeliverableFormPage mode="edit" />}
          />
          <Route path="deliverables/view/:userId" element={<DeliverablesViewPage />} />
          <Route path="my-pull-requests" element={<MyPullRequestsPage />} />
          <Route
            path="leader/team-deliverables"
            element={
              <LeaderRoute>
                <LeaderTeamDeliverablesPage />
              </LeaderRoute>
            }
          />
          <Route
            path="leader/team-analytics"
            element={
              <LeaderRoute>
                <LeaderTeamAnalyticsPage />
              </LeaderRoute>
            }
          />
          <Route
            path="leader/hierarchy"
            element={
              <LeaderRoute>
                <LeaderHierarchyManagementPage />
              </LeaderRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="admin/tags"
            element={
              <AdminRoute>
                <AdminTagsPage />
              </AdminRoute>
            }
          />
          <Route
            path="admin/github"
            element={
              <AdminRoute>
                <AdminGithubIntegrationsPage />
              </AdminRoute>
            }
          />
          <Route path="unavailable" element={<OptionUnavailablePage />} />
          <Route path="*" element={<Navigate to={DEFAULT_APP_ROUTE} replace />} />
        </Route>
        <Route path="*" element={<DefaultRouteRedirect />} />
      </Routes>
    </>
  );
}
