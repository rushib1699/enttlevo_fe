import { LoginResponse } from "@/types";

interface Permission {
  permission_name: string;
  is_active: number;
}

interface RoleWithPermissions {
  id: number;
  role: string;
  permission: Permission[];
}

export const checkModuleAccess = (
  loginResponse: LoginResponse | null,
  roleWithPermissions: RoleWithPermissions | null,
  moduleName: string
): boolean => {
  if (!loginResponse || !roleWithPermissions) {
    return false;
  }

  // Check if user has superadmin permission
  const isSuperAdmin = roleWithPermissions.permission.some(
    (perm) => perm.permission_name === 'superadmin' && perm.is_active === 1
  );

  if (isSuperAdmin) {
    return true;
  }

  // Check if user has specific module permission
  return roleWithPermissions.permission.some(
    (perm) => perm.permission_name === moduleName && perm.is_active === 1
  );
};

export const getAccessibleModules = (
  loginResponse: LoginResponse | null,
  roleWithPermissions: RoleWithPermissions | null
): string[] => {
  if (!loginResponse || !roleWithPermissions) {
    return [];
  }

  // Check if user has superadmin permission
  const isSuperAdmin = roleWithPermissions.permission.some(
    (perm) => perm.permission_name === 'superadmin' && perm.is_active === 1
  );

  if (isSuperAdmin) {
    return ['sales', 'onboarding', 'account_management', 'integrations'];
  }

  // Get all active module permissions
  return roleWithPermissions.permission
    .filter((perm) => perm.is_active === 1)
    .map((perm) => perm.permission_name)
    .filter((permName) => 
      ['sales', 'onboarding', 'account_management', 'integrations'].includes(permName)
    );
}; 