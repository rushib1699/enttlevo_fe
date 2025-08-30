import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { ROUTES } from "@/constants";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { loginResponse } = useApplicationContext();
  const location = useLocation();

  if (!loginResponse) {
    return <Navigate to={ROUTES.HOME} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;