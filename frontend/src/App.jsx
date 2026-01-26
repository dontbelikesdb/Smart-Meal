import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import ProfileForm from "./pages/ProfileForm";
import GeneratePlan from "./pages/GeneratePlan";
import PlanResult from "./pages/PlanResult";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import { getToken } from "./utils/auth";

/* Protect private routes */
const Private = ({ children }) => {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
};

/* Subtle page transition wrapper */
const PageWrapper = ({ children }) => {
  const location = useLocation();
  return (
    <div
      key={location.pathname}
      className="animate-fadeIn"
    >
      {children}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 pb-24">
        <Routes>
          {/* Public */}
          <Route
            path="/"
            element={
              <PageWrapper>
                <Home />
              </PageWrapper>
            }
          />

          <Route
            path="/login"
            element={
              <PageWrapper>
                <Login />
              </PageWrapper>
            }
          />

          <Route
            path="/signup"
            element={
              <PageWrapper>
                <Signup />
              </PageWrapper>
            }
          />

          {/* Private */}
          <Route
            path="/profile"
            element={
              <Private>
                <PageWrapper>
                  <ProfileForm />
                </PageWrapper>
              </Private>
            }
          />

          <Route
            path="/generate"
            element={
              <Private>
                <PageWrapper>
                  <GeneratePlan />
                </PageWrapper>
              </Private>
            }
          />

          <Route
            path="/plan"
            element={
              <Private>
                <PageWrapper>
                  <PlanResult />
                </PageWrapper>
              </Private>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Navbar />
      </div>
    </BrowserRouter>
  );
}
