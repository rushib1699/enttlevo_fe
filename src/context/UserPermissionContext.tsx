import React, { createContext, useContext, useEffect, useState } from 'react';
import { roleWithPermission } from '@/api';
import { useApplicationContext } from '@/hooks/useApplicationContext';
import { USER_PERMISSION_SESSION_KEY, COMPANY_PERMISSION_SESSION_KEY, COMPANY_INTEGRATION_SESSION_KEY } from '@/constants';


interface Permission {
  id: number;
  permission_id?: number;
  permission_name: string;
  is_active: number;
  is_deleted: number;
  role_id?: number;
}

interface RoleWithPermissions {
  id: number;
  role: string;
  created_at: string;
  updated_at: string;
  is_active: number;
  is_deleted: number;
  company_id: number;
  created_by: number;
  updated_by: number;
  permission: Permission[];
  companyPermission: Permission[];
  combinedPermission: Permission[];
  companyIntegrations: Permission[];
}

interface UserPermissionContextType {
  userPermissions: Permission[];
  companyPermissions: Permission[];
  loading: boolean;
  hasAccess: (permissionName: string) => boolean;
  hasCompanyAccess: (permissionName: string) => boolean;
}

const UserPermissionContext = createContext<UserPermissionContextType | undefined>(undefined);

export const UserPermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loginResponse } = useApplicationContext();
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [companyPermissions, setCompanyPermissions] = useState<Permission[]>([]);
  const [companyIntegration, setCompanyIntegration] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAndStorePermissions = async () => {
      setLoading(true);
      
      // Check if permissions exist in session storage
      const storedUserPermissions = sessionStorage.getItem(USER_PERMISSION_SESSION_KEY);
      const storedCompanyPermissions = sessionStorage.getItem(COMPANY_PERMISSION_SESSION_KEY);
      
      if (storedUserPermissions && storedCompanyPermissions && loginResponse) {
        setUserPermissions(JSON.parse(storedUserPermissions));
        setCompanyPermissions(JSON.parse(storedCompanyPermissions));
        setLoading(false);
        return;
      }

      if (loginResponse) {
        try {
          const roleId = loginResponse.role_id;
          const response: RoleWithPermissions = await roleWithPermission({ 
            role_id: roleId, 
            company_id: loginResponse.company_id 
          });
          console.log("response", response);

          // Store CompanyIntegration in session storage
          sessionStorage.setItem(COMPANY_INTEGRATION_SESSION_KEY, JSON.stringify(response.companyIntegrations));
          setCompanyIntegration(response.companyIntegrations);

          // Store user permissions in session storage
          sessionStorage.setItem(USER_PERMISSION_SESSION_KEY, JSON.stringify(response.permission));
          setUserPermissions(response.permission);

          // Store company permissions in session storage
          sessionStorage.setItem(COMPANY_PERMISSION_SESSION_KEY, JSON.stringify(response.companyPermission));
          setCompanyPermissions(response.companyPermission);
        } catch (error) {
          console.error('Failed to fetch permissions:', error);
          setUserPermissions([]);
          setCompanyPermissions([]);
        }
      } else {
        setUserPermissions([]);
        setCompanyPermissions([]);
      }
      setLoading(false);
    };

    fetchAndStorePermissions();
  }, [loginResponse]);

  const hasAccess = (permissionName: string): boolean => {
    if (loading) return false;

    // Check for superadmin first
    const isSuperAdmin = userPermissions.some(
      permission => permission.permission_name === 'superadmin' && permission.is_active === 1
    );
    
    if (isSuperAdmin) return true;

    // Check for specific user permission
    return userPermissions.some(
      permission => permission.permission_name === permissionName && permission.is_active === 1
    );
  };

  const hasCompanyAccess = (permissionName: string): boolean => {
    if (loading) return false;

    // Check for superadmin first
    // const isSuperAdmin = userPermissions.some(
    //   permission => permission.permission_name === 'superadmin' && permission.is_active === 1
    // );
    
    //if (isSuperAdmin) return true;

    // Check for specific company permission
    return companyPermissions.some(
      permission => permission.permission_name === permissionName && permission.is_active === 1
    );
  };

  return (
    <UserPermissionContext.Provider value={{ 
      userPermissions, 
      companyPermissions, 
      loading, 
      hasAccess, 
      hasCompanyAccess 
    }}>
      {children}
    </UserPermissionContext.Provider>
  );
};

export const useUserPermission = () => {
  const context = useContext(UserPermissionContext);
  if (!context) {
    throw new Error('useUserPermission must be used within a UserPermissionProvider');
  }
  return context;
}; 