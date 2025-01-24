import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

const AuthenticatorWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Authenticator.Provider>
      <>{children}</>
    </Authenticator.Provider>
  );
};

export default AuthenticatorWrapper;