import React, { useState, useEffect } from 'react'
import { getLeadsDeals, getIndustries, getContractStages } from '@/api'
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { useUserPermission } from '@/context/UserPermissionContext';
import { DealsData, LeadData, industryDetailsList } from '@/types';
import { Loader2, Filter, X, Plus, Table, Kanban } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ColumnVisibilitySheet from '@/components/Sheet/ColumnVisibilitySheet';
import DealsTable from '@/components/Table/Sales/DealsTable';
import DealsKanbanBoard from '@/components/KanbanBoard/DealsKanbanBoard';

interface FilterItem {
  column: string;
  operator: string;
  value: string;
  logicalOperator: string;
}

const tableColumns = [
  { label: 'Company', value: 'account_name' },
  { label: 'Contact', value: 'contact_name' },
  { label: 'Linkedin', value: 'linkedin_url' },
  { label: 'Email', value: 'email' },
  { label: 'Website', value: 'website' },
  { label: 'City', value: 'city' },
  { label: 'State', value: 'state' },
  { label: 'Country', value: 'country' },
  { label: 'Industry', value: 'industry' },
  { label: 'Source', value: 'source' },
  { label: 'Lead Owner', value: 'lead_owner' },
  { label: 'Product Name', value: 'product_name' },
  { label: 'Contract Stage', value: 'contract_stage' },
  { label: 'Proposed ARR', value: 'proposed_arr' },
  { label: 'Contract ARR', value: 'contract_arr' },
  { label: 'Lead Source', value: 'lead_source' },
  { label: 'ICP', value: 'icp' },
  { label: 'Status', value: 'status' },
  { label: 'Label', value: 'label' },
  { label: 'Created By', value: 'created_by' },
  { label: 'Updated By', value: 'updated_by' },
  { label: 'Created At', value: 'created_at' },
  { label: 'Updated At', value: 'updated_at' },
  { label: 'Actions', value: 'actions' }
];

const DealsPage: React.FC = () => {
  const [deals, setDeals] = useState<DealsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterItem[]>([
    { column: "", operator: "", value: "", logicalOperator: "AND" },
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterErrors, setFilterErrors] = useState<{ [key: string]: string }>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [contractStages, setContractStages] = useState<{ id: number; stage: string }[]>([]);
  const [activeTab, setActiveTab] = useState("table");

  const { hasAccess, loading: permissionLoading } = useUserPermission();
  const { loginResponse } = useApplicationContext();

  const hasAccountPermission = hasAccess("user_accounts");
  const isSuperAdmin = hasAccess("superadmin");
  const hasAnyPermission = hasAccountPermission || isSuperAdmin;

  const operators = [
    { label: "Equals", value: "=" },
    { label: "Contains", value: "LIKE" },
    { label: "Greater Than", value: ">" },
    { label: "Less Than", value: "<" }
  ];

  const fetchContractStages = async () => {
    try {
      const response = await getContractStages({ company_id: loginResponse?.company_id || 0 });
      setContractStages(response || []);
    } catch (error) {
      console.error("Error fetching contract stages:", error);
    }
  };

  const fetchLeadsDeals = async (filters: FilterItem[]) => {
    try {
      setLoading(true);
      const response = await getLeadsDeals({
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
        role_id: loginResponse?.role_id || 0,
        type: 'deals',
        filters,
      });

      if (response) {
        setDeals(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching leads deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFilter = () => {
    setFilters([...filters, { column: "", operator: "", value: "", logicalOperator: "AND" }]);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    setFilters(newFilters);
  };

  const handleFilterChange = (index: number, field: string, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  const validateFilters = () => {
    const errors: { [key: string]: string } = {};
    filters.forEach((filter, index) => {
      if (!filter.column) errors[`${index}-column`] = "Column is required";
      if (!filter.operator) errors[`${index}-operator`] = "Operator is required";
      if (!filter.value) errors[`${index}-value`] = "Value is required";
    });
    setFilterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApplyFilters = () => {
    if (validateFilters()) {
      fetchLeadsDeals(filters);
      setIsDialogOpen(false);
    }
  };

  const handleResetFilters = () => {
    const resetFilters = [{ column: "", operator: "", value: "", logicalOperator: "AND" }];
    setFilters(resetFilters);
    setFilterErrors({});
    fetchLeadsDeals(resetFilters);
  };

  const getActiveFiltersCount = () => {
    return filters.filter(f => f.column && f.operator && f.value).length;
  };

  // Handle preferences change from ColumnVisibilitySheet
  const handlePreferencesChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (loginResponse && hasAnyPermission) {
      fetchLeadsDeals([{ column: "", operator: "", value: "", logicalOperator: "AND" }]);
      fetchContractStages();
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
        {/* Advanced Filters */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 bg-white hover:bg-gray-50 relative">
              <Filter className="h-4 w-4" />
              Advanced Filters
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Advanced Filters</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-6 max-h-[500px] overflow-y-auto">
              {filters.map((filter, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Column</label>
                      <Select
                        value={filter.column}
                        onValueChange={(value) => handleFilterChange(index, "column", value)}
                      >
                        <SelectTrigger className={`w-full bg-white ${filterErrors[`${index}-column`] ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Select Column" />
                        </SelectTrigger>
                        <SelectContent>
                          {tableColumns.map((column) => (
                            <SelectItem key={column.value} value={column.value}>
                              {column.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {filterErrors[`${index}-column`] && (
                        <span className="text-xs text-red-500 mt-1">{filterErrors[`${index}-column`]}</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                      <Select
                        value={filter.operator}
                        onValueChange={(value) => handleFilterChange(index, "operator", value)}
                      >
                        <SelectTrigger className={`w-full bg-white ${filterErrors[`${index}-operator`] ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((operator) => (
                            <SelectItem key={operator.value} value={operator.value}>
                              {operator.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {filterErrors[`${index}-operator`] && (
                        <span className="text-xs text-red-500 mt-1">{filterErrors[`${index}-operator`]}</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                      <Input
                        placeholder="Enter Value"
                        value={filter.value}
                        onChange={(e) => handleFilterChange(index, "value", e.target.value)}
                        className={`w-full bg-white ${filterErrors[`${index}-value`] ? 'border-red-500' : ''}`}
                      />
                      {filterErrors[`${index}-value`] && (
                        <span className="text-xs text-red-500 mt-1">{filterErrors[`${index}-value`]}</span>
                      )}
                    </div>

                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 mt-6 hover:bg-red-50 hover:text-red-500"
                        onClick={() => handleRemoveFilter(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={handleAddFilter}
                className="w-full mt-4 border-dashed border-2 hover:border-blue-500 hover:text-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Filter
              </Button>
            </div>
            <DialogFooter className="sm:justify-between border-t pt-4">
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleResetFilters} className="gap-2">
                  <X className="h-4 w-4" />
                  Reset All
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApplyFilters} className="">
                  Apply Filters
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Column Visibility Management */}
          <ColumnVisibilitySheet 
            currentTableName="deals_table"
            currentTableData={deals}
            currentTableDisplayName="Deals Table"
            onPreferencesChange={handlePreferencesChange}
          />
        </div>
      </div>

      {/* Custom Professional Tab Design */}
      <div className="border-b border-gray-200">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setActiveTab('table')}
            className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'table'
                ? 'text-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Table className="w-4 h-4" />
            Table View
            {activeTab === 'table' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('kanban')}
            className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'kanban'
                ? 'text-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Kanban className="w-4 h-4" />
            Kanban View
            {activeTab === 'kanban' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-2">
        {activeTab === 'table' && (
          <DealsTable 
            data={deals}
            loading={loading}
            companyId={loginResponse?.company_id || 0}
            userId={loginResponse?.id || 0}
            onRefresh={() => fetchLeadsDeals(filters)}
            refreshTrigger={refreshTrigger}
          />
        )}
        
        {activeTab === 'kanban' && (
          <DealsKanbanBoard
            data={deals}
            contractStages={contractStages}
            onRefresh={() => fetchLeadsDeals(filters)}
            userId={loginResponse?.id || 0}
            companyId={loginResponse?.company_id || 0}
          />
        )}
      </div>
    </div>
  );
};

export default DealsPage;