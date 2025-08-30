import React, { useState, useEffect } from 'react'
import { getAllAccounts } from '@/api'
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { useUserPermission } from '@/context/UserPermissionContext';
import { CompaniesListType } from '@/types';
import { Loader2 } from "lucide-react";
import AllOBAccounts from '@/components/Table/OnBoarding/AllOBAccounts';
import ColumnVisibilitySheet from '@/components/Sheet/ColumnVisibilitySheet';


const AllOBAccountsPage: React.FC = () => {
  const [allAccounts, setAllAccounts] = useState<CompaniesListType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { hasAccess, loading: permissionLoading } = useUserPermission();
  const { loginResponse } = useApplicationContext();

  const hasAccountPermission = hasAccess("user_accounts");
  const isSuperAdmin = hasAccess("superadmin");
  const hasAnyPermission = hasAccountPermission || isSuperAdmin;

  const fetchAllAccounts = async () => {
    try {
      setLoading(true);
      const response = await getAllAccounts({
        company_id: loginResponse?.company_id || 0,
      });

      if (response) {
        setAllAccounts(response);
      }
    } catch (error) {
      console.error("Error fetching leads deals:", error);
    } finally {
      setLoading(false);
    }
  };


  // Handle preferences change from ColumnVisibilitySheet
  const handlePreferencesChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (loginResponse && hasAnyPermission) {
      fetchAllAccounts();
    }
  }, [loginResponse, hasAnyPermission]);

  if (permissionLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading permissions...</span>
        </div>
      </div>
    );
  }

  if (!hasAnyPermission) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">
            Access Denied
          </div>
          <p className="text-gray-600">
            You don't have permission to access this page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex justify-between items-center mb-4">

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Column Visibility Management */}
          <ColumnVisibilitySheet 
            currentTableName="onboarding_accounts_table"
            currentTableData={allAccounts}
            currentTableDisplayName="Onboarding Accounts Table"
            onPreferencesChange={handlePreferencesChange}
          />

        </div>
      </div>

      <AllOBAccounts 
        data={allAccounts}
        loading={loading}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

export default AllOBAccountsPage;