import { useState, useEffect } from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut, getCurrentUser } from "aws-amplify/auth";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      await getCurrentUser();
      setIsSignedIn(true);
    } catch (error) {
      setIsSignedIn(false);
    } finally {
      setIsAuthChecked(true);
    }
  };

  async function handleSignOut() {
    try {
      await signOut();
      setIsSignedIn(false);
      navigate("/");
    } catch (error) {
      console.log("error signing out: ", error);
    }
  }

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const renderButtons = () => {
    if (!isAuthChecked) {
      return null;
    }

    if (location.pathname === "/login") {
      return (
        <Button color="inherit" onClick={() => handleNavigation("/")}>
          Home
        </Button>
      );
    }

    if (location.pathname === "/admin") {
      return (
        <>
          <Button color="inherit" onClick={() => handleNavigation("/")}>
            Home
          </Button>
          <Button color="inherit" onClick={handleSignOut}>
            Logout
          </Button>
        </>
      );
    }

    if (location.pathname === "/" && isSignedIn) {
      return (
        <>
          <Button color="inherit" onClick={() => handleNavigation("/admin")}>
            Admin
          </Button>
          <Button color="inherit" onClick={handleSignOut}>
            Logout
          </Button>
        </>
      );
    }

    return (
      <Button color="inherit" onClick={() => handleNavigation("/login")}>
        Login
      </Button>
    );
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Chapter 7 - Meety the Chatbot
        </Typography>
        {renderButtons()}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
