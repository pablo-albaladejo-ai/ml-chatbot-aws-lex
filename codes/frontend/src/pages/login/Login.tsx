import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuthenticator((context) => [context.user]);

  useEffect(() => {
    if (user) {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="login-container">
      <Authenticator hideSignUp={true} />
    </div>
  );
};

export default Login;
