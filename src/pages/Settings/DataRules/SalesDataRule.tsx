import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  Settings, 
  Plus, 
  ChevronRight, 
  Loader2,
  Filter,
  Search,
} from 'lucide-react';

import {
  getContractStages,
  getLeadLable,
  getLeadStatus,
  getTimezones,
  getContractType,
  getAccountStatus,
  getIndustries,
  dataDefinitions,
  getMrrTiers
} from "@/api";
import { AccountStatusType, ContractType, TimezoneType } from '@/types';
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { useUserPermission } from '@/context/UserPermissionContext';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DropdownData {
  id: number;
  name?: string;
  stage?: string;
  lable?: string;
  status?: string;
  industry?: string;
  code?: string;
  is_default?: boolean;
  is_active?: number;
  contract_type_name?: string;
  status_name?: string;
  mrr_tier?: string;
  greater_than?: number;
  less_than?: number;
  contract_days?: number;
  offset?: string;
}

const SalesDataRule = () => {
  const [contractStages, setContractStages] = useState<DropdownData[]>([]);
  const { hasAccess } = useUserPermission();
  const { loginResponse } = useApplicationContext();
  const [leadLabels, setLeadLabels] = useState<DropdownData[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<DropdownData[]>([]);
  const [timezones, setTimezone] = useState<TimezoneType[]>([]);
  const [contractType, setContractType] = useState<ContractType[]>([]);
  const [accountStatus, setAccountStatus] = useState<AccountStatusType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedSectionKey, setSelectedSectionKey] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [industries, setIndustries] = useState<DropdownData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mrrTiers, setMrrTiers] = useState<DropdownData[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Create form schema dynamically based on selected section
  const createFormSchema = () => {
    const baseSchema = z.object({
      [selectedSectionKey]: z.string().min(1, 'Field is required').refine((val) => val.trim().length > 0, 'Field cannot be empty'),
    });

    let additionalFields = {};

    if (selectedSection === 'Contract Types') {
      additionalFields = {
        contract_days: z.number().min(1, 'Duration must be at least 1 day'),
      };
    }

    if (selectedSection === 'Timezones') {
      additionalFields = {
        code: z.string().min(1, 'Code is required'),
        offset: z.string().optional(),
      };
    }

    if (selectedSection === 'Mrr Tiers') {
      additionalFields = {
        less_than: z.number().min(0, 'Value must be positive'),
        greater_than: z.number().min(0, 'Value must be positive'),
      };
    }

    return baseSchema.extend(additionalFields);
  };

  const form = useForm({
    resolver: zodResolver(createFormSchema()),
    defaultValues: {
      [selectedSectionKey]: '',
    },
  });

  // Reset form when section changes
  useEffect(() => {
    if (selectedSectionKey) {
      form.reset({
        [selectedSectionKey]: '',
      });
    }
  }, [selectedSectionKey, form]);

  const canAddOrUpdate = hasAccess('data_field_addition') || hasAccess('superadmin');

  const handleAddItem = (sectionTitle: string, sectionkey: string) => {
    setSelectedSection(sectionTitle);
    setSelectedSectionKey(sectionkey);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedSection('');
    form.reset();
  };

  const getSingularLabel = (section: string): string => {
    const map: Record<string, string> = {
      'Industries': 'Industry',
      'Contract Types': 'Contract Type',
      'Contract Stages': 'Contract Stage',
      'Lead Labels': 'Lead Label',
      'Lead Status': 'Lead Status',
      'Timezones': 'Timezone',
      'Account Status': 'Account Status',
      'Mrr Tiers': 'MRR Tier',
    };
    return map[section] || section;
  };

  const handleSubmitNewItem = async (values: any) => {
    try {
      setIsSubmitting(true);

      const cleanValues = Object.entries(values).reduce((acc, [key, value]) => {
        if (typeof value === 'string') {
          acc[key] = value.replace(/\s+/g, ' ').trim();
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const mainField = cleanValues[selectedSectionKey];
      if (typeof mainField === 'string' && !mainField) {
        toast.error(`${getSingularLabel(selectedSection)} name cannot be empty`);
        return;
      }

      const payload = {
        tableName: selectedSection.toLowerCase().replace(/ /g, '_'),
        reqType: "add",
        record_id: "",
        fieldData: cleanValues,
        company_id: loginResponse?.company_id,
        user_id: loginResponse?.id
      };

      const response = await dataDefinitions(payload);

      if (response.status === 200) {
        toast.success('Item added successfully');
        await fetchDetails();
        handleSheetClose();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error === "Duplicate record exists."
        ? `This ${getSingularLabel(selectedSection).toLowerCase()} already exists`
        : error.response?.data?.message || 'Error adding new item';
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      const [
        stagesResponse,
        labelsResponse,
        statusesResponse,
        timezoneResponse,
        contracttypeResponse,
        accountStatusResponse,
        industriesResponse,
        mrrTiersResponse
      ] = await Promise.all([
        getContractStages({ company_id: loginResponse?.company_id }),
        getLeadLable({ company_id: loginResponse?.company_id }),
        getLeadStatus({ company_id: loginResponse?.company_id }),
        getTimezones({ company_id: loginResponse?.company_id }),
        getContractType({ company_id: loginResponse?.company_id }),
        getAccountStatus({ company_id: loginResponse?.company_id }),
        getIndustries({ company_id: loginResponse?.company_id }),
        getMrrTiers({ company_id: loginResponse?.company_id })
      ]);

      if (stagesResponse) setContractStages(stagesResponse);
      if (labelsResponse) setLeadLabels(labelsResponse);
      if (statusesResponse) setLeadStatuses(statusesResponse);
      if (timezoneResponse) setTimezone(timezoneResponse);
      if (contracttypeResponse) setContractType(contracttypeResponse);
      if (accountStatusResponse) setAccountStatus(accountStatusResponse);
      if (industriesResponse) setIndustries(industriesResponse);
      if (mrrTiersResponse) setMrrTiers(mrrTiersResponse);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleSetDefault = async (sectionTitle: string, itemId: number) => {
    try {
      setIsUpdating(true);
      
      switch (sectionTitle) {
        case 'Contract Stages':
          setContractStages(prev => prev.map(item => ({
            ...item,
            is_default: item.id === itemId
          })));
          break;
        case 'Lead Labels':
          setLeadLabels(prev => prev.map(item => ({
            ...item,
            is_default: item.id === itemId
          })));
          break;
        case 'Lead Statuses':
          setLeadStatuses(prev => prev.map(item => ({
            ...item,
            is_default: item.id === itemId
          })));
          break;
        case 'Timezones':
          setTimezone(prev => prev.map(item => ({
            ...item,
            is_default: item.id === itemId
          })));
          break;
        case 'Contract Types':
          setContractType(prev => prev.map(item => ({
            ...item,
            is_default: item.id === itemId
          })));
          break;
        case 'Account Statuses':
          setAccountStatus(prev => prev.map(item => ({
            ...item,
            is_default: item.id === itemId
          })));
          break;
        case 'Industries':
          setIndustries(prev => prev.map(item => ({
            ...item,
            is_default: item.id === itemId
          })));
          break;
        case 'Mrr Tiers':
          setMrrTiers(prev => prev.map(item => ({
            ...item,
            is_default: item.id === itemId
          })));
          break;
      }

      const payload = {
        tableName: sectionTitle.toLowerCase().replace(/ /g, '_'),
        reqType: "set",
        record_id: itemId,
        fieldData: {},
        company_id: loginResponse?.company_id,
        user_id: loginResponse?.id
      };

      const response = await dataDefinitions(payload);
      if (response.status === 200) {
        toast.success('Default set successfully');
        await fetchDetails();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error setting default');
      console.error('Error setting default:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const sectionConfigs = [
    { title: 'Contract Stages', data: contractStages, key: 'stage' },
    { title: 'Lead Labels', data: leadLabels, key: 'lable' },
    { title: 'Lead Status', data: leadStatuses, key: 'status' },
    { title: 'Timezones', data: timezones, key: 'name', render: (item: TimezoneType) => `${item.name} (${item.code})` },
    { title: 'Contract Types', data: contractType, key: 'contract_type_name' },
    { title: 'Account Status', data: accountStatus, key: 'status_name' },
    { title: 'Industries', data: industries, key: 'industry' },
    { title: 'Mrr Tiers', data: mrrTiers, key: 'mrr_tier' },
  ];

  const [selectedSidebarSection, setSelectedSidebarSection] = useState(sectionConfigs[0].title);

  const handleToggleActive = async (sectionTitle: string, item: any) => {
    try {
      if (item.is_default && item.is_active === 1) {
        toast.error("Default items cannot be disabled");
        return;
      }
      
      setIsUpdating(true);
      const payload = {
        tableName: sectionTitle.toLowerCase().replace(/ /g, '_'),
        reqType: item.is_active === 1 ? "delete" : "active",
        record_id: "",
        fieldData: {},
        company_id: loginResponse?.company_id,
        user_id: loginResponse?.id,
        delete_ids: [item.id]
      };

      const response = await dataDefinitions(payload);
      if (response.status === 200) {
        toast.success(`Item ${item.is_active === 1 ? 'disabled' : 'enabled'} successfully`);
        await fetchDetails();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating item');
    } finally {
      setIsUpdating(false);
    }
  };

  const getFilteredData = (data: any[]) => {
    let filtered = data;
    
    // Filter by status
    if (filterStatus === 'enabled') filtered = filtered.filter(item => item.is_active === 1);
    if (filterStatus === 'disabled') filtered = filtered.filter(item => item.is_active === 0);
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchableText = Object.values(item).join(' ').toLowerCase();
        return searchableText.includes(searchTerm.toLowerCase());
      });
    }
    
    return filtered;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Loading Sales Rules</h3>
            <p className="text-gray-600">Please wait while we fetch your data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r border-gray-200 shadow-sm flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Sales Rules</h1>
                  <p className="text-sm text-gray-600">Manage your sales configurations</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-4">
              <nav className="space-y-2">
                {sectionConfigs.map((section) => {
                  const isActive = selectedSidebarSection === section.title;
                  const itemCount = section.data.length;
                  const enabledCount = section.data.filter(item => item.is_active === 1).length;
                  
                  return (
                    <button
                      key={section.title}
                      onClick={() => setSelectedSidebarSection(section.title)}
                      className={`
                        w-full text-left p-4 rounded-lg transition-all duration-200 group
                        ${isActive 
                          ? 'bg-blue-50 border-blue-200 shadow-sm' 
                          : 'hover:bg-gray-50 border-transparent'
                        }
                        border
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-md ${isActive ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                            <Settings className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                          </div>
                          <div>
                            <h3 className={`font-medium ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                              {section.title}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {enabledCount} of {itemCount} enabled
                            </p>
                          </div>
                        </div>
                        {isActive && (
                          <ChevronRight className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {sectionConfigs
              .filter(section => section.title === selectedSidebarSection)
              .map(section => {
                const filteredData = getFilteredData(section.data);
                const totalCount = section.data.length;
                const enabledCount = section.data.filter(item => item.is_active === 1).length;
                const defaultItem = section.data.find(item => item.is_default);
                
                return (
                  <div key={section.title} className="flex-1 flex flex-col h-full">
                    {/* Header */}
                    <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="space-y-1">
                          <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{totalCount} total items</span>
                            <span>•</span>
                            <span>{enabledCount} enabled</span>
                            {defaultItem && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600">
                                  Default: {section.render ? section.render(defaultItem) : defaultItem[section.key]}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Search items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-64"
                              />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                              <SelectTrigger className="w-40">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Items</SelectItem>
                                <SelectItem value="enabled">Enabled Only</SelectItem>
                                <SelectItem value="disabled">Disabled Only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {canAddOrUpdate && (
                            <Button
                              onClick={() => handleAddItem(section.title, section.key)}
                              className=" text-white"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add New {getSingularLabel(section.title)}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-6">
                        {filteredData.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center bg-white rounded-lg border border-gray-200 p-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                              <Settings className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {section.data.length === 0 ? 'No items found' : 'No items match your filter'}
                            </h3>
                            <p className="text-gray-600 mb-6 max-w-md">
                              {section.data.length === 0 
                                ? `Get started by adding your first ${getSingularLabel(section.title).toLowerCase()}.`
                                : 'Try adjusting your search or filter criteria.'
                              }
                            </p>
                            {canAddOrUpdate && section.data.length === 0 && (
                              <Button
                                onClick={() => handleAddItem(section.title, section.key)}
                                className=" text-white"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add First {getSingularLabel(section.title)}
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4 pb-6">
                            {filteredData.map((item: any) => (
                              <Card key={item.id} className={`
                                transition-all duration-200 hover:shadow-md rounded-lg
                                ${item.is_default ? 'ring-1 ring-blue-200 bg-blue-50' : 'hover:bg-gray-50'}
                              `}>
                                <CardContent className="p-6">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-3">
                                          <h3 className="font-semibold text-gray-900 truncate">
                                            {section.render ? section.render(item) : item[section.key]}
                                          </h3>
                                          {item.is_default && (
                                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                              Default
                                            </Badge>
                                          )}
                                          <Badge variant={item.is_active === 1 ? "default" : "secondary"}>
                                            {item.is_active === 1 ? 'Active' : 'Inactive'}
                                          </Badge>
                                        </div>
                                        {section.title === 'Mrr Tiers' && (
                                          <p className="text-sm text-gray-600 mt-1">
                                            Range: {item.greater_than && `≥ ${item.greater_than}`}
                                            {item.greater_than && item.less_than && ' and '}
                                            {item.less_than && `≤ ${item.less_than}`}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-6">
                                      <div className="flex items-center space-x-2">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center space-x-2">
                                              <Switch
                                                checked={item.is_active === 1}
                                                onCheckedChange={() => handleToggleActive(section.title, item)}
                                                disabled={!canAddOrUpdate || item.is_default || isUpdating}
                                              />
                                              <span className="text-sm text-gray-600">
                                                {item.is_active === 1 ? 'Enabled' : 'Disabled'}
                                              </span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {item.is_default 
                                              ? "Default items cannot be disabled" 
                                              : (item.is_active === 1 ? "Click to disable" : "Click to enable")
                                            }
                                          </TooltipContent>
                                        </Tooltip>
                                      </div>

                                      <Separator orientation="vertical" className="h-6" />

                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={item.is_default}
                                          onCheckedChange={() => handleSetDefault(section.title, item.id)}
                                          disabled={!canAddOrUpdate || item.is_active !== 1}
                                        />
                                        <Label className="text-sm text-gray-600">
                                          Set as default
                                        </Label>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Sheet for adding new items */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Add New {getSingularLabel(selectedSection)}</SheetTitle>
            </SheetHeader>

            <div className="mt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmitNewItem)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name={selectedSectionKey}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{getSingularLabel(selectedSection)} Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={`Enter ${getSingularLabel(selectedSection).toLowerCase()} name`}
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\s+/g, ' ');
                              field.onChange(value);
                            }}
                            onBlur={(e) => {
                              const value = e.target.value.replace(/\s+/g, ' ').trim();
                              field.onChange(value);
                              field.onBlur();
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedSection === 'Contract Types' && (
                    <FormField
                      control={form.control}
                      name="contract_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract Duration (Days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Enter duration in days"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {selectedSection === 'Timezones' && (
                    <>
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timezone Code</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter Code"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\s+/g, '');
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="offset"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Offset (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., +05:30" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {selectedSection === 'Mrr Tiers' && (
                    <>
                      <FormField
                        control={form.control}
                        name="greater_than"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Value</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Enter minimum value"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="less_than"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Value</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                placeholder="Enter maximum value"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <SheetFooter className="gap-3 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSheetClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add {getSingularLabel(selectedSection)}
                        </>
                      )}
                    </Button>
                  </SheetFooter>
                </form>
              </Form>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
};

export default SalesDataRule;