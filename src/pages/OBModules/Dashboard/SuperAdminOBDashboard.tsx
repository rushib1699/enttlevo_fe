import React, { useCallback, useEffect, useState } from 'react'
import { 
    getOnboardingSankeyGraph, 
    getUnassignedAccounts, 
    getOBCustomersAndTeamByUserId 
} from '@/api';
import { CustomSankeyNode, CustomSankeyLink } from '@/types';
import ManagerOBTable from '@/components/Table/OnBoarding/ManagerOBTable'
import UserOBTable from '@/components/Table/OnBoarding/UserOBTable'
import TeamOBTable from '@/components/Table/OnBoarding/TeamOBTable'
import UnassignedOBTable from '@/components/Table/OnBoarding/UnassignedOBTable'
import { useApplicationContext } from '@/hooks/useApplicationContext'
import { useUserPermission } from '@/context/UserPermissionContext';
import moment from 'moment';
import { OnBoardingJourneyMapGraph } from '@/components/Graphs/OnBoardingJourneyMap/OnBoardingJourneyMapGraph';
import { BarChart3, Users2, UserPlus, User, UsersRound, RefreshCcw } from 'lucide-react';
import DatePicker from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SuperAdminOBDashboard: React.FC = () => {

    const { loginResponse } = useApplicationContext();
    const [unassignedAccounts, setUnassignedAccounts] = useState<any[]>([]);
    const [teamAccounts, setTeamAccounts] = useState<any[]>([]);
    const [startDate, setStartDate] = useState<Date | null>(moment().subtract(180, "days").toDate());
    const [endDate, setEndDate] = useState<Date | null>(moment().toDate());
    const [selectedPeriod, setSelectedPeriod] = useState('quarterly');
    const [sankeyGraphData, setSankeyGraphData] = useState<{
        nodes: CustomSankeyNode[];
        links: CustomSankeyLink[];
    }>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(false);
    const { hasAccess } = useUserPermission();
    const [activeTab, setActiveTab] = useState('graph');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const hasGraphPermission = hasAccess('graph');
    const hasAccountsPermission = hasAccess('user_accounts');
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

    const fetchOnboardingSankeyGraph = useCallback(async () => {
        if (!loginResponse?.id || !loginResponse?.company_id || !startDate || !endDate) return;

        try {
            setLoading(true);
            const response = await getOnboardingSankeyGraph({
                user_id: loginResponse.id,
                role: loginResponse.role_id,
                company_id: loginResponse.company_id,
                start_date: moment(startDate).format('YYYY-MM-DD'),
                end_date: moment(endDate).format('YYYY-MM-DD')
            });
            setSankeyGraphData({
                nodes: response.nodes,
                links: response.links,
            });
        } catch (e) {
            console.error('Error fetching Sankey graph:', e);
        } finally {
            setLoading(false);
        }
    }, [loginResponse?.id, loginResponse?.company_id, loginResponse?.role_id, startDate, endDate]);

    const fetchTeamData = useCallback(async () => {
        if (!loginResponse?.company_id || !loginResponse?.id) return;

        try {
            setLoading(true);
            const response = await getOBCustomersAndTeamByUserId({
                company_id: Number(loginResponse.company_id),
                user_id: Number(loginResponse.id),
                role_id: Number(loginResponse.role_id)
            });
            setTeamAccounts(response);
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
        if (hasGraphPermission || isSuperAdmin) {
            fetchOnboardingSankeyGraph();
        }
    }, [hasGraphPermission, isSuperAdmin, fetchOnboardingSankeyGraph]);

    useEffect(() => {
        if (hasManagerPermission || hasUserAccountPermission || isSuperAdmin) {
            fetchTeamData();
        }
    }, [hasManagerPermission, hasUserAccountPermission, isSuperAdmin, fetchTeamData]);

    const handlePeriodChange = (value: string) => {
        setSelectedPeriod(value);
        switch (value) {
            case 'quarterly':
                setStartDate(moment().subtract(3, 'months').toDate());
                setEndDate(moment().toDate());
                break;
            case 'half_yearly':
                setStartDate(moment().subtract(6, 'months').toDate());
                setEndDate(moment().toDate());
                break;
            case 'yearly':
                setStartDate(moment().subtract(12, 'months').toDate());
                setEndDate(moment().toDate());
                break;
        }
    };


    if(loading) {
        return <div className="flex items-center justify-center h-[80vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
    }

    return (
        <div className='w-full h-full'>
            <div className="w-full">
                {/* Custom Professional Tab Design */}
                <div className="border-b border-gray-200 mb-2">
                    <div className="flex items-center space-x-8">
                        {hasGraphPermission && (
                            <button
                                onClick={() => setActiveTab('graph')}
                                className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                                    activeTab === 'graph'
                                        ? 'text-orange-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <BarChart3 className="w-4 h-4" />
                                Graph
                                {activeTab === 'graph' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                                )}
                            </button>
                        )}

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
                                Manager ({teamAccounts?.manager?.length})
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
                                User ({teamAccounts?.user?.length})
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
                                Team ({teamAccounts?.team?.length})
                                {activeTab === 'team' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-2">
                    {activeTab === 'graph' && (
                        <div className='flex flex-col gap-2 h-full w-full'>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <DatePicker
                                        date={startDate}
                                        setDate={setStartDate}
                                        placeholder="Start Date"
                                    />
                                    <DatePicker
                                        date={endDate}
                                        setDate={setEndDate}
                                        placeholder="End Date"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                            <SelectItem value="half_yearly">Half Yearly</SelectItem>
                                            <SelectItem value="yearly">Yearly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" onClick={() => setRefreshTrigger(prev => prev + 1)}>
                                        <RefreshCcw className="w-4 h-4 mr-2" />
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                            <div className='h-[90vh] border border-slate-200 rounded-lg p-2'>
                                <h3 className="text-lg font-medium mb-4">Customer Success Pathway</h3>
                                <OnBoardingJourneyMapGraph data={sankeyGraphData} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'unassigned' && (
                        <UnassignedOBTable 
                            data={unassignedAccounts} 
                            loading={loading} 
                            roleId={loginResponse?.role_id || 0} 
                            companyId={loginResponse?.company_id || 0} 
                            userId={loginResponse?.id || 0} 
                            onRefresh={fetchUnassignedAccounts}
                        />
                    )}

                    {activeTab === 'manager' && (
                        <ManagerOBTable 
                            data={teamAccounts}
                            loading={loading}
                        />
                    )}

                    {activeTab === 'user' && (
                        <UserOBTable 
                            data={teamAccounts}
                            loading={loading}
                        />
                    )}

                    {activeTab === 'team' && (
                        <TeamOBTable 
                            data={teamAccounts}
                            loading={loading}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default SuperAdminOBDashboard