import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthenticatorWrapper from "./auth/AuthenticatorWrapper";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/home";
import Admin from "./pages/admin";
import Login from "./pages/login";
import Header from "./components/Header";

const App: React.FC = () => {
  return (
    <AuthenticatorWrapper>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <Admin />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthenticatorWrapper>
  );
};

export default App;
