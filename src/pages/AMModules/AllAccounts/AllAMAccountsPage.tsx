import React, { useState, useEffect } from 'react'
import { getAllAMAccounts } from '@/api'
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { useUserPermission } from '@/context/UserPermissionContext';
import { CompaniesListType } from '@/types';
import { Loader2 } from "lucide-react";
import AllAMAccounts from '@/components/Table/AM/AllAMAccounts';
import ColumnVisibilitySheet from '@/components/Sheet/ColumnVisibilitySheet';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Filter, X, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface FilterItem {
  column: string;
  operator: string;
  value: string;
  logicalOperator: string;
}

const tableColumns = [
  { label: 'Name', value: 'name' },
  { label: 'AM', value: 'am' },
  { label: 'OM', value: 'om' },
  { label: 'Support Email', value: 'support_email' },
  { label: 'Status', value: 'status' },
  { label: 'Contract Type', value: 'contract_type' },
  { label: 'Contract Value', value: 'contract_value' },
  { label: 'Contract Duration', value: 'contract_duration' },
  { label: 'Contract Start Date', value: 'contract_start_date' },
  { label: 'Contract Close Date', value: 'contract_close_date' },
  { label: 'Handoff Date', value: 'handoff_date' },
  { label: 'Live Date', value: 'live_date' },
  { label: 'Transfer Date', value: 'transfer_date' },
  { label: 'Timezone', value: 'timezone' },
  { label: 'ARR', value: 'arr' },
  { label: 'MRR', value: 'mrr' },
  { label: 'Balance', value: 'balance' },
  { label: 'Licenses/Units Sold', value: 'licenses_or_units_sold' },
  { label: 'Previous Platform', value: 'previous_platform' },
  { label: 'Accounting Software', value: 'accounting_software' },
];

const AllAMAccountsPage: React.FC = () => {
  const [allAccounts, setAllAccounts] = useState<CompaniesListType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filters, setFilters] = useState<FilterItem[]>([
    { column: "", operator: "", value: "", logicalOperator: "AND" },
  ]);
  const [filterErrors, setFilterErrors] = useState<{ [key: string]: string }>({});

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

  const fetchAllAccounts = async (filters: FilterItem[]) => {
    try {
      setLoading(true);
      const response = await getAllAMAccounts({
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
        role_id: loginResponse?.role_id || 0,
        filters: filters,
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
      fetchAllAccounts(filters);
      setIsDialogOpen(false);
    }
  };

  const handleResetFilters = () => {
    const resetFilters = [{ column: "", operator: "", value: "", logicalOperator: "AND" }];
    setFilters(resetFilters);
    setFilterErrors({});
    fetchAllAccounts(resetFilters);
  };

  const getActiveFiltersCount = () => {
    return filters.filter(f => f.column && f.operator && f.value).length;
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


  // Handle preferences change from ColumnVisibilitySheet
  const handlePreferencesChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (loginResponse && hasAnyPermission) {
      fetchAllAccounts(filters);
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
            currentTableName="all_am_accounts_table"
            currentTableData={allAccounts}
            currentTableDisplayName="All AM Accounts Table"
            onPreferencesChange={handlePreferencesChange}
          />

        </div>
      </div>

      <AllAMAccounts 
        data={allAccounts}
        loading={loading}
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

export default AllAMAccountsPage;