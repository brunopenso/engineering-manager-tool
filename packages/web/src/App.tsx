import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './auth/ProtectedRoute.js';
import LoginPage from './pages/LoginPage.js';
import WelcomePage from './pages/WelcomePage.js';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/welcome"
        element={
          <ProtectedRoute>
            <WelcomePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}
