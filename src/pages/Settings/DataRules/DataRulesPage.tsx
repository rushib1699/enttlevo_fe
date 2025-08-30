import React, { useState } from 'react'
import { Building, Users } from 'lucide-react'
import OnBoardingDataRules from './OnBoardingDataRules'
import SalesDataRule from './SalesDataRule'
import AMDataRulesPage from './AMDataRulesPage'
import { useUserPermission } from '@/context/UserPermissionContext';

const DataRulesPage:React.FC = () => {
  const [activeTab, setActiveTab] = useState("sales")
  const { hasAccess, hasCompanyAccess } = useUserPermission();

  const isSuperAdmin = hasAccess('superadmin');
  const hasOBPermission = hasCompanyAccess("onboarding");
  const hasSalesPermission = hasCompanyAccess("sales");
  const hasAMPermission = hasCompanyAccess("account_management");

  if (isSuperAdmin) {
    return (
      <div className="">
        <div className="w-full">
          {/* Custom Professional Tab Design */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => setActiveTab('sales')}
                className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'sales'
                    ? 'text-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="h-4 w-4" />
                Sales Rules
                {activeTab === 'sales' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('onboarding')}
                className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'onboarding'
                    ? 'text-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Building className="h-4 w-4" />
                Onboarding Rules
                {activeTab === 'onboarding' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                )}
              </button>

              <button
                onClick={() => setActiveTab('am')}
                className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'am'
                    ? 'text-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="h-4 w-4" />
                AM Rules
                {activeTab === 'am' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-2">
            {activeTab === 'sales' && (
              <div className="h-full">
                <SalesDataRule />
              </div>
            )}
            
            {activeTab === 'onboarding' && (
              <div className="h-full">
                <OnBoardingDataRules />
              </div>
            )}

            {activeTab === 'am' && (
              <div className="h-full">
                <AMDataRulesPage />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!hasSalesPermission && !hasOBPermission && !hasAMPermission) {
    return (
      <div className="w-full h-[calc(100vh-200px)] flex items-center justify-center">
        <p className="text-gray-500 text-lg">You don't have permission to access Sales or Onboarding rules</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Custom Professional Tab Design */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex items-center space-x-8">
          {hasSalesPermission && (
            <button
              onClick={() => setActiveTab('sales')}
              className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'sales'
                  ? 'text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="h-4 w-4" />
              Sales Rules
              {activeTab === 'sales' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
              )}
            </button>
          )}
          
          {hasOBPermission && (
            <button
              onClick={() => setActiveTab('onboarding')}
              className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'onboarding'
                  ? 'text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building className="h-4 w-4" />
              Onboarding Rules
              {activeTab === 'onboarding' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
              )}
            </button>
          )}

          {hasAMPermission && (
            <button
              onClick={() => setActiveTab('am')}
              className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'am'
                  ? 'text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="h-4 w-4" />
              AM Rules
              {activeTab === 'am' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-2">
        {activeTab === 'sales' && (
          <div className="h-full">
            <SalesDataRule />
          </div>
        )}
        
        {activeTab === 'onboarding' && (
          <div className="h-full">
            <OnBoardingDataRules />
          </div>
        )}

        {activeTab === 'am' && (
          <div className="h-full">
            <AMDataRulesPage />
          </div>
        )}

      </div>
    </div>
  )
}

export default DataRulesPage