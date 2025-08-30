import React, { useState, useEffect } from 'react'
import { getLeadsDeals,
  createLead,
  getIndustries,
  importLeadsFromCSV,
 } from '@/api'
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { useUserPermission } from '@/context/UserPermissionContext';
import { LeadsData, industryDetailsList } from '@/types';
import { Loader2, Filter, X, Plus, Building2, User, Mail, Phone, Globe, Factory, Package, Linkedin, Import ,  Download, AlertCircle, CheckCircle, Trash2, Upload, Save } from "lucide-react";
import LeadsTable from '@/components/Table/Sales/LeadsTable';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose, SheetFooter } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ColumnVisibilitySheet from '@/components/Sheet/ColumnVisibilitySheet';

interface FilterItem {
  column: string;
  operator: string;
  value: string;
  logicalOperator: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ApiResponse {
  data: LeadsData[];
  pagination: PaginationInfo;
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

const AllSalesLeadsPage: React.FC = () => {
  const [leadsDeals, setLeadsDeals] = useState<LeadsData[]>([]);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterItem[]>([
    { column: "", operator: "", value: "", logicalOperator: "AND" },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterErrors, setFilterErrors] = useState<{ [key: string]: string }>({});
  const [newLead, setNewLead] = useState({
    account_name: '',
    contact_name: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    linkedin: '',
    product_interest: '',
  });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [industries, setIndustries] = useState<industryDetailsList[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { hasAccess, loading: permissionLoading } = useUserPermission();
  const { loginResponse } = useApplicationContext();

  const hasAccountPermission = hasAccess("user_accounts");
  const isSuperAdmin = hasAccess("superadmin");
  const hasAccountAdditionalPermission = hasAccess("account_addition");
  const hasAnyPermission = hasAccountPermission || isSuperAdmin || hasAccountAdditionalPermission;

  const operators = [
    { label: "Equals", value: "=" },
    { label: "Contains", value: "LIKE" },
    { label: "Greater Than", value: ">" },
    { label: "Less Than", value: "<" }
  ];

  const fetchLeadsDeals = async (filters: FilterItem[], page: number = 1, pageSize: number = 10) => {
    try {
      setLoading(true);
      const response = await getLeadsDeals({
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
        role_id: loginResponse?.role_id || 0,
        type: 'leads',
        filters,
        page,
        pageSize
      });

      if (response && response.data && response.pagination) {
        setLeadsDeals(response.data);
        setPaginationInfo(response.pagination);
      } else {
        // Fallback for old API response format
        setLeadsDeals(response || []);
        setPaginationInfo({
          total: response?.length || 0,
          page: page,
          pageSize: pageSize,
          totalPages: Math.ceil((response?.length || 0) / pageSize)
        });
      }
    } catch (error) {
      console.error("Error fetching leads deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIndustries = async () => {
    try {
      const response = await getIndustries({ company_id: loginResponse?.company_id || 0 });
      if (response) {
        setIndustries(response);
      }
    } catch (error) {
      console.error("Error fetching industries:", error);
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
      fetchLeadsDeals(filters, 1, paginationInfo.pageSize);
      setIsDialogOpen(false);
    }
  };

  const handleResetFilters = () => {
    const resetFilters = [{ column: "", operator: "", value: "", logicalOperator: "AND" }];
    setFilters(resetFilters);
    setFilterErrors({});
    fetchLeadsDeals(resetFilters, 1, paginationInfo.pageSize);
  };

  const getActiveFiltersCount = () => {
    return filters.filter(f => f.column && f.operator && f.value).length;
  };

  const handleNewLeadChange = (field: string, value: string) => {
    setNewLead(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateLead = async () => {
    try {
      setIsSaving(true);
      await createLead({
        ...newLead,
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0
      });
      
      // Reset form and refresh leads
      setNewLead({
        account_name: '',
        contact_name: '',
        email: '',
        phone: '',
        website: '',
        industry: '',
        linkedin: '',
        product_interest: '',
      });
      
      fetchLeadsDeals(filters, paginationInfo.page, paginationInfo.pageSize);
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Error creating lead:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // File upload handlers
  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      setUploadStatus('idle');
      setUploadMessage('');
    }
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      setUploadStatus('error');
      setUploadMessage('Invalid file type. Please upload CSV, XLS, or XLSX files only.');
      return false;
    }

    if (file.size > maxSize) {
      setUploadStatus('error');
      setUploadMessage('File size too large. Maximum size is 5MB.');
      return false;
    }

    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadMessage('');
    setUploadProgress(0);
  };

  const handleImportCSV = async () => {
    if (!selectedFile) return;

    try {
      setUploadStatus('uploading');
      setUploadProgress(0);
      setUploadMessage('Uploading and processing file...');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('company_id', (loginResponse?.company_id || 0).toString());
      formData.append('user_id', (loginResponse?.id || 0).toString());

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await importLeadsFromCSV(formData);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response) {
        setUploadStatus('success');
        setUploadMessage(`Successfully imported ${response.imported_count || 0} leads. ${response.skipped_count || 0} duplicates were skipped.`);
        
        // Refresh leads data
        fetchLeadsDeals(filters, paginationInfo.page, paginationInfo.pageSize);
        
        // Reset form after a delay
        setTimeout(() => {
          setSelectedFile(null);
          setUploadStatus('idle');
          setUploadMessage('');
          setUploadProgress(0);
          setIsImportSheetOpen(false);
        }, 3000);
      }
    } catch (error: any) {
      setUploadStatus('error');
      setUploadMessage(error.response?.data?.message || 'Error importing leads. Please check your file format and try again.');
      setUploadProgress(0);
    }
  };

  const downloadSampleFile = () => {
    const sampleData = [
      ['Organization Name', 'Contact Person', 'Email', 'Phone Number', 'Website', 'Industry', 'LinkedIn Profile'],
      ['Acme Corp', 'John Smith', 'john@acmecorp.com', '+1234567890', 'https://acmecorp.com', 'Technology', 'https://linkedin.com/in/johnsmith'],
      ['Tech Solutions', 'Jane Doe', 'jane@techsolutions.com', '+1987654321', 'https://techsolutions.com', 'Software', 'https://linkedin.com/in/janedoe']
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_leads_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      // Reset form when sheet is closed
      setNewLead({
        account_name: '',
        contact_name: '',
        email: '',
        phone: '',
        website: '',
        industry: '',
        linkedin: '',
        product_interest: '',
      });
    }
  };

  const handleImportSheetOpenChange = (open: boolean) => {
    setIsImportSheetOpen(open);
    if (!open) {
      // Reset import form when sheet is closed
      setSelectedFile(null);
      setUploadStatus('idle');
      setUploadMessage('');
      setUploadProgress(0);
      setIsDragging(false);
    }
  };

  // Handle preferences change from ColumnVisibilitySheet
  const handlePreferencesChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Handle pagination change from LeadsTable
  const handlePaginationChange = (page: number, pageSize: number) => {
    fetchLeadsDeals(filters, page, pageSize);
  };

  useEffect(() => {
    if (loginResponse && hasAnyPermission) {
      fetchLeadsDeals([{ column: "", operator: "", value: "", logicalOperator: "AND" }], 1, 10);
      fetchIndustries();
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
            currentTableName="leads_table"
            currentTableData={leadsDeals}
            currentTableDisplayName="Leads Table"
            onPreferencesChange={handlePreferencesChange}
          />

          {/* Import Leads Sheet */}
          <Sheet open={isImportSheetOpen} onOpenChange={handleImportSheetOpenChange}>
            <SheetTrigger asChild>
              {hasAccountAdditionalPermission && (
              <Button variant="outline" className="flex items-center gap-2">
                <Import className="h-4 w-4" />
                Import Leads
              </Button>
              )}
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-[900px] w-[100vw] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Leads from CSV/Excel
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 grid grid-cols-2 gap-6">
                {/* Left Section */}
                <div className="space-y-6">
                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Instructions
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• File must be in .csv, .xls, .xlsx format</li>
                      <li>• First row should contain column headers</li>
                      <li>• Required columns: Organization Name, Contact Person, Email, Phone Number</li>
                      <li>• Maximum file size: 5MB</li>
                      <li>• Ensure phone numbers include country code (e.g., +1234567890)</li>
                    </ul>
                  </div>

                  {/* Important Note */}
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Important Note:</strong> All new leads will appear in the "Unassigned" tab under the Sales section.
                    </AlertDescription>
                  </Alert>

                  {/* Sample File */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Sample File</h3>
                    <p className="text-sm text-gray-600">
                      Download our sample template to see the correct format:
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={downloadSampleFile}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Sample Template
                    </Button>
                  </div>
                </div>

                {/* Right Section */}
                <div className="space-y-6">
                  <h3 className="font-semibold text-gray-900">Upload CSV File</h3>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging 
                        ? 'border-blue-400 bg-blue-50' 
                        : uploadStatus === 'error'
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        {uploadStatus === 'uploading' ? (
                          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                        ) : uploadStatus === 'success' ? (
                          <CheckCircle className="h-12 w-12 text-green-500" />
                        ) : uploadStatus === 'error' ? (
                          <AlertCircle className="h-12 w-12 text-red-500" />
                        ) : (
                          <Upload className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      
                      {selectedFile ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <p className="font-medium text-gray-900">{selectedFile.name}</p>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleRemoveFile}
                              className="h-8 w-8 hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-gray-600">
                            Click or drag CSV file to upload
                          </p>
                          <p className="text-sm text-gray-500">
                            CSV, XLS, XLSX format only | Max: 5MB
                          </p>
                        </div>
                      )}

                      {uploadStatus === 'uploading' && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}

                      {uploadMessage && (
                        <div className={`text-sm ${
                          uploadStatus === 'success' ? 'text-green-600' : 
                          uploadStatus === 'error' ? 'text-red-600' : 
                          'text-blue-600'
                        }`}>
                          {uploadMessage}
                        </div>
                      )}

                      {uploadStatus === 'idle' && (
                        <div>
                          <input
                            type="file"
                            accept=".csv,.xls,.xlsx"
                            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                            className="hidden"
                            id="csv-upload"
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('csv-upload')?.click()}
                            className="mt-2"
                          >
                            Select File
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t justify-end">
                <SheetClose asChild>
                  <Button variant="outline" className="w-auto">
                    Cancel
                  </Button>
                </SheetClose>
                <Button 
                  variant="default"
                  onClick={handleImportCSV}
                  disabled={!selectedFile || uploadStatus === 'uploading'}
                  className="w-auto "
                >
                  {uploadStatus === 'uploading' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Import  className="h-4 w-4 mr-2" />
                      Import Leads
                    </>
                  )}
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Add Create Lead Sheet */}
          <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
            <SheetTrigger asChild>
              {hasAccountAdditionalPermission && (
              <Button 
                variant="default"
              >
                <Plus className="h-4 w-4 mr-2" />
                Lead
              </Button>
              )}
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-[900px] w-[100vw] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-xl font-bold">Create New Lead</SheetTitle>
                <p className="text-sm text-gray-500">Fields marked with * are required</p>
              </SheetHeader>
              <div className="mt-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-5">
                      <div className="relative">
                        <Label htmlFor="account_name" className="text-sm font-medium flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Organization Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="account_name"
                          value={newLead.account_name}
                          onChange={(e) => handleNewLeadChange('account_name', e.target.value)}
                          placeholder="Enter organization name"
                          className="mt-1.5"
                          required
                        />
                      </div>

                      <div className="relative">
                        <Label htmlFor="contact_name" className="text-sm font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Contact Person <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="contact_name"
                          value={newLead.contact_name}
                          onChange={(e) => handleNewLeadChange('contact_name', e.target.value)}
                          placeholder="Enter contact person name"
                          className="mt-1.5"
                          required
                        />
                      </div>

                      <div className="relative">
                        <Label htmlFor="industry" className="text-sm font-medium flex items-center gap-2">
                          <Factory className="h-4 w-4" />
                          Industry <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={newLead.industry}
                          onValueChange={(value) => handleNewLeadChange('industry', value)}
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select Industry" />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map((industry) => (
                              <SelectItem key={industry?.id} value={industry?.id?.toString()}>
                                {industry?.industry}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="relative">
                        <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newLead.email}
                          onChange={(e) => handleNewLeadChange('email', e.target.value)}
                          placeholder="Enter email address"
                          className="mt-1.5"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="relative">
                        <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="phone"
                          value={newLead.phone}
                          onChange={(e) => handleNewLeadChange('phone', e.target.value)}
                          placeholder="Enter phone number"
                          className="mt-1.5"
                          required
                        />
                      </div>

                      <div className="relative">
                        <Label htmlFor="website" className="text-sm font-medium flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Website
                        </Label>
                        <Input
                          id="website"
                          value={newLead.website}
                          onChange={(e) => handleNewLeadChange('website', e.target.value)}
                          placeholder="Enter website URL"
                          className="mt-1.5"
                        />
                      </div>

                      <div className="relative">
                        <Label htmlFor="linkedin" className="text-sm font-medium flex items-center gap-2">
                          <Linkedin className="h-4 w-4" />
                          LinkedIn Profile
                        </Label>
                        <Input
                          id="linkedin"
                          value={newLead.linkedin}
                          onChange={(e) => handleNewLeadChange('linkedin', e.target.value)}
                          placeholder="Enter LinkedIn profile URL"
                          className="mt-1.5"
                        />
                      </div>

                      <div className="relative">
                        <Label htmlFor="product_interest" className="text-sm font-medium flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Product Interest <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="product_interest"
                          value={newLead.product_interest}
                          onChange={(e) => handleNewLeadChange('product_interest', e.target.value)}
                          placeholder="Enter product interest"
                          className="mt-1.5"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8 border-t pt-6 justify-end">
                  <SheetFooter>
                    <SheetClose asChild>
                      <Button variant="outline" className="w-auto">
                        <X className="h-4 w-4 mr-2" />  
                        Cancel
                        </Button>
                    </SheetClose>
                      <Button 
                      variant="default"
                      className="w-auto"
                      onClick={handleCreateLead}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Create Lead
                        </>
                      )}
                    </Button>
                  </SheetFooter>
                  </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <LeadsTable 
        data={leadsDeals}
        loading={loading}
        companyId={loginResponse?.company_id || 0}
        userId={loginResponse?.id || 0}
        onRefresh={() => fetchLeadsDeals(filters, paginationInfo.page, paginationInfo.pageSize)}
        refreshTrigger={refreshTrigger}
        paginationInfo={paginationInfo}
        onPaginationChange={handlePaginationChange}
      />
    </div>
  );
};

export default AllSalesLeadsPage;