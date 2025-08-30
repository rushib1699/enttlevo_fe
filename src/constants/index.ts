export const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;
export const SESSION_COOKIE_NAME = import.meta.env.VITE_SESSION_COOKIE_NAME

export const ROUTES = {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    DASHBOARD: "/dashboard",
    PROFILE: "/profile",
    SETTINGS: "/settings",
    NOT_FOUND: "/not-found",
    RESET_PASSWORD: "/reset-password",
    SALES: "/sales",
    ON_BOARDING: "/onboarding",
};
  
export const USER_SESSION_KEY = import.meta.env.VITE_USER_SESSION_KEY;
  
export const USER_PERMISSION_SESSION_KEY = import.meta.env.VITE_USER_PERMISSION_SESSION_KEY;
export const COMPANY_PERMISSION_SESSION_KEY = import.meta.env.VITE_COMPANY_PERMISSION_SESSION_KEY;
export const COMPANY_INTEGRATION_SESSION_KEY = import.meta.env.VITE_COMPANY_INTEGRATION_SESSION_KEY;

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  
export const CALL_HIPPO_API_KEY = import.meta.env.VITE_CALL_HIPPO_API_KEY;
export const CALL_HIPPO_ACCOUNT_ID = import.meta.env.VITE_CALL_HIPPO_ACCOUNT_ID;
export const CALL_HIPPO_USER_ID = import.meta.env.VITE_CALL_HIPPO_USER_ID;

export const ZOHO_CLIENT_ID = import.meta.env.VITE_ZOHO_CLIENT_ID;
export const ZOHO_REDIRECT_URI = import.meta.env.VITE_ZOHO_REDIRECT_URI;