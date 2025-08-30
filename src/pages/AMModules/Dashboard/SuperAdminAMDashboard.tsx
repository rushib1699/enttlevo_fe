import React, { useCallback, useEffect, useState } from 'react'
import { 
    getUnassignedAccounts, 
    getAMCustomersAndTeamByUserId
} from '@/api';
import ManagerAMTable from '@/components/Table/AM/ManagerAMTable'
import UserAMTable from '@/components/Table/AM/UserAMTable'
import TeamAMTable from '@/components/Table/AM/TeamAMTable'
import UnassignedAMTable from '@/components/Table/AM/UnassignedAMTable'
import { useApplicationContext } from '@/hooks/useApplicationContext'
import { useUserPermission } from '@/context/UserPermissionContext';
import { Users2, UserPlus, User, UsersRound, Loader2 } from 'lucide-react';
import ColumnVisibilitySheet from '@/components/Sheet/ColumnVisibilitySheet';

interface TeamAccountsResponse {
    accounts: any[];
    manager: any[];
    user: any[];
    team: any[];
}

const SuperAdminAMDashboard: React.FC = () => {

    const { loginResponse } = useApplicationContext();
    const [unassignedAccounts, setUnassignedAccounts] = useState<any[]>([]);
    const [teamAccountsData, setTeamAccountsData] = useState<TeamAccountsResponse>({
        accounts: [],
        manager: [],
        user: [],
        team: []
    });
    const [loading, setLoading] = useState(false);
    const { hasAccess } = useUserPermission();
    const [activeTab, setActiveTab] = useState('unassigned');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const hasUnassignedPermission = hasAccess('unassigned_accounts');
    const isSuperAdmin = hasAccess("superadmin");
    const hasManagerPermission = hasAccess('manager');
    const hasUserAccountPermission = hasAccess('user');

    const fetchUnassignedAccounts = useCallback(async () => {
        if (!loginResponse?.company_id) return;

        try {
            setLoading(true);
            const response = await getUnassignedAccounts({
                company_id: loginResponse.company_id,
                role_id: loginResponse.role_id,
            });
            setUnassignedAccounts(response);
        } catch (error) {
            console.error('Error fetching unassigned accounts:', error);
        } finally {
            setLoading(false);
        }
    }, [loginResponse?.company_id, loginResponse?.role_id]);

    const fetchTeamData = useCallback(async () => {
        if (!loginResponse?.company_id || !loginResponse?.id) return;

        try {
            setLoading(true);
            const response = await getAMCustomersAndTeamByUserId({
                company_id: Number(loginResponse.company_id),
                user_id: Number(loginResponse.id),
                role_id: Number(loginResponse.role_id)
            });
            
            // Handle the nested response structure
            setTeamAccountsData({
                accounts: response.accounts || [],
                manager: response.manager || [],
                user: response.user || [],
                team: response.team || []
            });
        } catch (error) {
            console.error('Error fetching team data:', error);
        } finally {
            setLoading(false);
        }
    }, [loginResponse?.company_id, loginResponse?.id, loginResponse?.role_id]);

    useEffect(() => {
        if (hasUnassignedPermission || isSuperAdmin) {
            fetchUnassignedAccounts();
        }
    }, [hasUnassignedPermission, isSuperAdmin, fetchUnassignedAccounts]);

    useEffect(() => {
        if (hasManagerPermission || hasUserAccountPermission || isSuperAdmin) {
            fetchTeamData();
        }
    }, [hasManagerPermission, hasUserAccountPermission, isSuperAdmin, fetchTeamData]);

    // Handle preferences change from ColumnVisibilitySheet
    const handlePreferencesChange = () => {
            setRefreshTrigger(prev => prev + 1);
    };

    if(loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-4 h-4 animate-spin" />
            </div>
        );
    }

    return (
        <div className='w-full h-full'>
            <div className="w-full">
                {/* Custom Professional Tab Design */}
                <div className="border-b border-gray-200 mb-2">
                    <div className="flex items-center space-x-8">
                        {hasUnassignedPermission && (
                            <button
                                onClick={() => setActiveTab('unassigned')}
                                className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                                    activeTab === 'unassigned'
                                        ? 'text-orange-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <UserPlus className="w-4 h-4" />
                                Unassigned ({unassignedAccounts.length})
                                {activeTab === 'unassigned' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                                )}
                            </button>
                        )}
                        
                        {hasManagerPermission && (
                            <button
                                onClick={() => setActiveTab('manager')}
                                className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                                    activeTab === 'manager'
                                        ? 'text-orange-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Users2 className="w-4 h-4" />
                                Manager ({teamAccountsData.manager.length})
                                {activeTab === 'manager' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                                )}
                            </button>
                        )}
                        
                        {hasUserAccountPermission && (
                            <button
                                onClick={() => setActiveTab('user')}
                                className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                                    activeTab === 'user'
                                        ? 'text-orange-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <User className="w-4 h-4" />
                                User ({teamAccountsData.user.length})
                                {activeTab === 'user' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                                )}
                            </button>
                        )}
                        
                        {hasUserAccountPermission && (
                            <button
                                onClick={() => setActiveTab('team')}
                                className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                                    activeTab === 'team'
                                        ? 'text-orange-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <UsersRound className="w-4 h-4" />
                                Team ({teamAccountsData.team.length})
                                {activeTab === 'team' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-2">
                    {activeTab === 'unassigned' && (
                        <div className='space-y-2'>
                            <div className='flex items-center justify-end'>
                                <ColumnVisibilitySheet 
                                    currentTableName="unassigned_am_table"
                                    currentTableData={unassignedAccounts}
                                    currentTableDisplayName="Unassigned AM Table"
                                    onPreferencesChange={handlePreferencesChange}
                                />
                            </div>
                        <UnassignedAMTable 
                            data={unassignedAccounts} 
                            loading={loading} 
                            roleId={loginResponse?.role_id || 0} 
                            companyId={loginResponse?.company_id || 0} 
                            userId={loginResponse?.id || 0} 
                            onRefresh={fetchUnassignedAccounts}
                            refreshTrigger={refreshTrigger}
                        />
                        </div>
                    )}
                    
                    {activeTab === 'manager' && (
                        <ManagerAMTable 
                            data={teamAccountsData.manager}
                            loading={loading}
                        />
                    )}
                    
                    {activeTab === 'user' && (
                        <UserAMTable 
                            data={teamAccountsData.user}
                            loading={loading}
                        />
                    )}
                    
                    {activeTab === 'team' && (
                        <TeamAMTable 
                            data={teamAccountsData.team}
                            loading={loading}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default SuperAdminAMDashboard;