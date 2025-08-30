import React, { useEffect, useState, useCallback } from 'react'
import { SalesSankeyGraph } from '@/components/Graphs/SalesSankeyGraph/SalesSankeyGraph'
import {
  salesDashboard,
  getSalesSankeyGraph,
  getSalesDashboardTableData,
  dealConversionReport,
  getCustomersAndTeamByUserId,
} from '@/api';
import {
  SalesDashboardData,
  LeadIndustryData,
  LeadOCData,
  LeadData,
  CustomSankeyLink,
  CustomSankeyNode
} from "@/types";
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { useUserPermission } from '@/context/UserPermissionContext';
import moment from 'moment';
import { BarChart3, Users2, UsersRound, Loader2, UserPlus, RefreshCcw } from "lucide-react";
import UnassignedSalesTable from '@/components/Table/Sales/UnassignedSalesTable';
import DealConversionGraph from '@/components/Graphs/DealConversionGraph/DealConversionGraph';
import LeadsDistributionGraph from '@/components/Graphs/LeadsDistributionGraph/LeadsDistributionGraph';
import PipelineGraph from '@/components/Graphs/PipelineGraph/PipelineGraph';
import LeadLabelGraph from '@/components/Graphs/LeadLabelGraph/LeadLabelGraph';
import SalesTeamsTable from '@/components/Table/Sales/SalesTeamsTable';
import SalesManagerTable from '@/components/Table/Sales/SalesManagerTable';
import ColumnVisibilitySheet from '@/components/Sheet/ColumnVisibilitySheet';
import DatePicker from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const SuperAdminSalesDashboard: React.FC = () => {

  const { hasAccess, loading } = useUserPermission();
  const { loginResponse } = useApplicationContext();
  const [startDate, setStartDate] = useState<Date | null>(moment().subtract(90, "days").toDate());
  const [endDate, setEndDate] = useState<Date | null>(moment().toDate());
  const [isLoadingDashboardData, setIsLoadingDashboardData] = useState(false);
  const [salesDashboardData, setSalesDashboardData] = useState<SalesDashboardData | null>(null);
  const [graphData, setGraphData] = useState<LeadIndustryData[]>([]);
  const [pipelineGraphData, setPipelineGraphData] = useState<LeadOCData[]>([]);
  const [leadsData, setLeadsData] = useState<LeadData[]>([]);
  const [dealConversionData, setDealConversionData] = useState<any[]>([]);
  const [leadLabelGraphData, setLeadLabelGraphData] = useState<any[]>([]);
  const [salestableData, setSalestableData] = useState<any[]>([]);
  const [manager, setManager] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('quarterly');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sankeyGraphData, setSankeyGraphData] = useState<{
    nodes: CustomSankeyNode[];
    links: CustomSankeyLink[];
  }>({ nodes: [], links: [] });
  const [activeTab, setActiveTab] = useState('graph');


  // User Permissions
  const isSuperAdmin = hasAccess('superadmin');
  const hasGraphPermission = hasAccess('graph');
  const hasAccountPermission = hasAccess('user_accounts');
  const hasUnassignedPermission = hasAccess('unassigned_accounts');
  const hasAnyPermission = hasGraphPermission || hasAccountPermission || isSuperAdmin || hasUnassignedPermission;

  const salesDashboardInfo = useCallback(async () => {
    try {
      setIsLoadingDashboardData(true);
      const formattedStartDate = startDate || moment().subtract(90, "days").format("YYYY-MM-DD");
      const formattedEndDate = endDate || moment().format("YYYY-MM-DD");

      const companyId = loginResponse?.company_id;
      if (!companyId) {
        throw new Error("Company ID is required");
      }

      const response = await salesDashboard({
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        company_id: Number(companyId),
        user_id: loginResponse?.id,
        role_id: loginResponse?.role_id
      });

      if (response) {
        setSalesDashboardData(response);
        setGraphData(response.total_leads_industry || []);
        setPipelineGraphData(response.total_leads_OC || []);
        setLeadsData(response.total_leads || []);
        setLeadLabelGraphData(response.total_leads || []);
      }
    } catch (error) {
      console.error("Error fetching sales dashboard:", error);
    } finally {
      setIsLoadingDashboardData(false);
    }
  }, [startDate, endDate, loginResponse?.company_id]);

  const fetchDealConversionData = useCallback(async () => {
    try {
      const formattedStartDate = startDate || moment().subtract(180, "days").format("YYYY-MM-DD");
      const formattedEndDate = endDate || moment().format("YYYY-MM-DD");

      const response = await dealConversionReport({
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        company_id: loginResponse?.company_id || 0,
      });
      console.log("response", response)
      setDealConversionData(response);
    } catch (error) {
      console.error("Error fetching deal conversion data:", error);
    }
  }, [startDate, endDate, loginResponse?.company_id]);

  const fetchSalesSankeyGraphData = useCallback(async () => {
    try {
      const today = new Date();
      const twoMonthsAgo = new Date(
        today.getFullYear(),
        today.getMonth() - 2,
        today.getDate()
      );
      const formattedStartDate =
        startDate || twoMonthsAgo.toISOString().split("T")[0];
      const formattedEndDate = endDate || today.toISOString().split("T")[0];

      const response = await getSalesSankeyGraph({
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        company_id: loginResponse?.company_id || 0,
        role: loginResponse?.role_id || 0,
        user_id: loginResponse?.id || 0,
      });

      if (response && response.nodes && response.links) {
        setSankeyGraphData(
          {
            nodes: response.nodes,
            links: response.links
          }
        );
      } else {
        console.error("Invalid data structure received:", response);
      }
    } catch (error) {
      console.error("Error fetching Sankey graph data:", error);
    }
  }, [startDate, endDate, loginResponse]);

  const fetchSalesTableData = useCallback(async () => {
    try {
      const response = await getSalesDashboardTableData({
        company_id: loginResponse?.company_id || 0,
      });

      setSalestableData(response);

    } catch (error) {
      console.log(error);
    }
  }, [loginResponse?.company_id]);


  const fetchCustomersAndTeamByUserId = async () => {
    try {
      const response = await getCustomersAndTeamByUserId({
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
        role_id: loginResponse?.role_id || 0,
      });

      if (response) {
        setManager(response.managers);
        setTeam(response.team);
        setUsers(response.users);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (hasGraphPermission || isSuperAdmin) {
      fetchSalesSankeyGraphData();
      salesDashboardInfo();
      fetchSalesTableData();
      fetchDealConversionData();
    }
    if (hasAccountPermission || isSuperAdmin) {
      fetchCustomersAndTeamByUserId();
    }
  }, [salesDashboardInfo, fetchSalesTableData, fetchDealConversionData, fetchSalesSankeyGraphData, hasAccess]);


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

    // Handle preferences change from ColumnVisibilitySheet
    const handlePreferencesChange = () => {
      setRefreshTrigger(prev => prev + 1);
    };


  const combinedTeamData = [
    ...team,
    ...manager,
    ...users
  ].filter(item => item);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  if (!hasAnyPermission) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-lg">You do not have access to view this dashboard.</div>
      </div>
    );
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
                Unassigned ({salestableData?.length})
                {activeTab === 'unassigned' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                )}
              </button>
            )}
            
            {hasAccountPermission && (
              <button
                onClick={() => setActiveTab('manager')}
                className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'manager'
                    ? 'text-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users2 className="w-4 h-4" />
                Manager ({manager?.length})
                {activeTab === 'manager' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                )}
              </button>
            )}
            
            {hasAccountPermission && (
              <button
                onClick={() => setActiveTab('team')}
                className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'team'
                    ? 'text-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <UsersRound className="w-4 h-4" />
                Team ({team?.length})
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

              <div className='h-[80vh] w-full border border-gray-200 rounded-lg p-4 shadow-md'>
                <h3 className="text-lg font-medium mb-4">Sales Journey Hub</h3>
                <SalesSankeyGraph data={sankeyGraphData} />
              </div>

              <div className='grid grid-cols-2 gap-2 mb-4'>
                <div className='border border-gray-200 rounded-lg p-4 shadow-md'>
                  <h3 className="text-lg font-medium mb-4">Pipeline Overview</h3>
                  <PipelineGraph graphData={pipelineGraphData} />
                </div>
                <div className='border border-gray-200 rounded-lg p-4 shadow-md'>
                  <h3 className="text-lg font-medium mb-4">Deal Conversion Rate</h3>
                  <DealConversionGraph dealConversionData={dealConversionData} />
                </div>
                <div className='border border-gray-200 rounded-lg p-4 shadow-md'>
                  <h3 className="text-lg font-medium mb-4">Lead Labels</h3>
                  <LeadLabelGraph leadLabelGraphData={leadLabelGraphData} />
                </div>
                <div className='border border-gray-200 rounded-lg p-4 shadow-md'>
                  <h3 className="text-lg font-medium mb-4">Lead Distribution</h3>
                  <LeadsDistributionGraph graphData={graphData} />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'unassigned' && (
            <div className='space-y-2'>
              <div className='flex items-center justify-end'>
                <ColumnVisibilitySheet 
                  currentTableName="unassigned_sales_table"
                  currentTableData={salestableData}
                  currentTableDisplayName="Unassigned Sales Table"
                  onPreferencesChange={handlePreferencesChange}
                />
              </div>
              <UnassignedSalesTable
                team={combinedTeamData}
                roleId={loginResponse?.role_id || 0}
                companyId={loginResponse?.company_id || 0}
                userId={loginResponse?.id || 0}
                refreshTrigger={refreshTrigger}
              />
            </div>
          )}
          
          {activeTab === 'manager' && (
            <div className=''>
              <SalesManagerTable
                manager={manager}
                loading={isLoadingDashboardData}
                roleId={loginResponse?.role_id || 0}
                companyId={loginResponse?.company_id || 0}
                userId={loginResponse?.id || 0}
              />
            </div>
          )}
          
          {activeTab === 'team' && (
            <div className=''>
              <SalesTeamsTable
                team={team}
                loading={isLoadingDashboardData}
                roleId={loginResponse?.role_id || 0}
                companyId={loginResponse?.company_id || 0}
                userId={loginResponse?.id || 0}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SuperAdminSalesDashboard