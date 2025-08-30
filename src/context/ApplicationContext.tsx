import { FC, createContext, useCallback, useMemo, useState } from 'react';
import { LoginResponse } from '../types';
import { COMPANY_PERMISSION_SESSION_KEY, USER_PERMISSION_SESSION_KEY, USER_SESSION_KEY } from '@/constants';

interface ContextProps {
  loginResponse: LoginResponse | null;
  setLoginResponse: (user: LoginResponse) => void;
  logoutUser: () => void;
}

export const ApplicationContext = createContext<ContextProps>(
  {} as ContextProps
);

export interface ApplicationProviderProps {
  children?: React.ReactNode;
}

export class SessionUtils {
  static setSession(user: LoginResponse) {
    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
  }

  static getSession(): LoginResponse | null {
    const session = sessionStorage.getItem(USER_SESSION_KEY);
    return session ? JSON.parse(session) : null;
  }

  static removeSession() {
    sessionStorage.removeItem(USER_SESSION_KEY);
    sessionStorage.removeItem(USER_PERMISSION_SESSION_KEY);
    sessionStorage.removeItem(COMPANY_PERMISSION_SESSION_KEY);
  }
}

const ApplicationProvider: FC<ApplicationProviderProps> = ({ children }) => {
  const [loginResponse, setLoginResponse] = useState<LoginResponse | null>(
    SessionUtils.getSession()
  );

  const handleSetLoginResponse = useCallback(
    (updatedLoginResponse: LoginResponse) => {
      setLoginResponse(updatedLoginResponse);
      SessionUtils.setSession(updatedLoginResponse);
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      loginResponse,
      setLoginResponse: handleSetLoginResponse,
      logoutUser: SessionUtils.removeSession,
    }),
    [loginResponse, handleSetLoginResponse]
  );

  return (
    <ApplicationContext.Provider value={contextValue}>
      {children}
    </ApplicationContext.Provider>
  );
};

export default ApplicationProvider;