import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute.js';
import LoginPage from './pages/LoginPage.js';
import WelcomePage from './pages/WelcomePage.js';
import AppShellLayout from './components/shell/AppShellLayout.js';
import OptionUnavailablePage from './pages/OptionUnavailablePage.js';
import UpdatesPage from './pages/UpdatesPage.js';
import { DEFAULT_APP_ROUTE, LOGIN_ROUTE } from './routes/shellOptions.js';
import { useAuth } from './auth/AuthProvider.js';

function DefaultRouteRedirect() {
  const { accessToken, user } = useAuth();
  const canAccessApp = Boolean(accessToken && user?.email);

  if (canAccessApp) {
    return <Navigate to={DEFAULT_APP_ROUTE} replace />;
  }

  return <Navigate to={LOGIN_ROUTE} replace />;
}

export default function App() {
  return (
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
        <Route path="updates" element={<UpdatesPage />} />
        <Route path="unavailable" element={<OptionUnavailablePage />} />
        <Route path="*" element={<Navigate to={DEFAULT_APP_ROUTE} replace />} />
      </Route>
      <Route path="*" element={<DefaultRouteRedirect />} />
    </Routes>
  );
}
