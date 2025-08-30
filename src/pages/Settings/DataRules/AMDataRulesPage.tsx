import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  Settings, 
  Plus, 
  Edit,
  ChevronRight, 
  Loader2,
  Filter,
  Search,
} from 'lucide-react';

import { addProduct, updateProduct, getProducts } from "@/api";
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { useUserPermission } from '@/context/UserPermissionContext';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  product?: string;
  price?: number;
  type?: string;
  is_active?: number;
  is_default?: number;
}

const AMDataRulesPage = () => {
  const [products, setProducts] = useState<DropdownData[]>([]);
  const { hasAccess } = useUserPermission();
  const { loginResponse } = useApplicationContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedSectionKey, setSelectedSectionKey] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemToEdit, setSelectedItemToEdit] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Create form schema
  const createFormSchema = () => {
    return z.object({
      name: z.string().min(1, 'Product name is required').refine((val) => val.trim().length > 0, 'Product name cannot be empty'),
      type: z.string().min(1, 'Type is required'),
      price: z.number().min(0, 'Price must be greater than or equal to 0'),
    });
  };

  const form = useForm({
    resolver: zodResolver(createFormSchema()),
    defaultValues: {
      name: '',
      type: '',
      price: 0,
    },
  });

  const canAddOrUpdate = hasAccess('data_field_addition') || hasAccess('superadmin');

  const handleAddItem = (sectionTitle: string, sectionkey: string) => {
    setSelectedSection(sectionTitle);
    setSelectedSectionKey(sectionkey);
    setIsEditing(false);
    setSelectedItemToEdit(null);
    form.reset({
      name: '',
      type: '',
      price: 0,
    });
    setIsSheetOpen(true);
  };

  const handleEditItem = (item: any, sectionTitle: string, sectionkey: string) => {
    setSelectedSection(sectionTitle);
    setSelectedSectionKey(sectionkey);
    setSelectedItemToEdit(item);
    setIsEditing(true);
    form.reset({
      name: item.product || '',
      type: item.type || '',
      price: item.price || 0,
    });
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedSection('');
    setSelectedItemToEdit(null);
    setIsEditing(false);
    form.reset();
  };

  const getSingularLabel = (section: string): string => {
    const map: Record<string, string> = {
      'Products': 'Product'
    };
    return map[section] || section;
  };

  const handleSubmitNewItem = async (values: any) => {
    try {
      setIsSubmitting(true);

      const cleanValues = {
        name: values.name.replace(/\s+/g, ' ').trim(),
        type: values.type,
        price: values.price
      };

      if (isEditing) {
        const response = await updateProduct({
          id: selectedItemToEdit.id,
          product_name: cleanValues.name,
          type: cleanValues.type,
          price: cleanValues.price,
          is_active: selectedItemToEdit.is_active,
          is_deleted: 0,
          company_id: loginResponse?.company_id || 0,
          user_id: loginResponse?.id || 0
        });

        if (response) {
          toast.success('Product updated successfully');
          await fetchDetails();
          handleSheetClose();
        }
      } else {
        const response = await addProduct({
          product_name: cleanValues.name,
          type: cleanValues.type,
          price: cleanValues.price,
          company_id: loginResponse?.company_id || 0,
          user_id: loginResponse?.id || 0
        });

        if (response) {
          toast.success('Product added successfully');
          await fetchDetails();
          handleSheetClose();
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error === "Duplicate record exists."
        ? `This ${getSingularLabel(selectedSection).toLowerCase()} already exists`
        : error.response?.data?.message || `Error ${isEditing ? 'updating' : 'adding'} product`;
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      const productsResponse = await getProducts({
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0
      });
      if (productsResponse) {
        setProducts(productsResponse);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDetails();
  }, []);



  const sectionConfigs = [
    { title: 'Products', data: products, key: 'product' }
  ];

  const [selectedSidebarSection, setSelectedSidebarSection] = useState(sectionConfigs[0].title);

  const handleToggleActive = async (sectionTitle: string, item: any) => {
    try {
      if (item.is_default && item.is_active === 1) {
        toast.error("Default items cannot be disabled");
        return;
      }
      
      setIsUpdating(true);
      const response = await updateProduct({
        id: item.id,
        product_name: item.product,
        type: item.type,
        price: item.price,
        is_active: item.is_active === 1 ? 0 : 1,
        is_deleted: 0,
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0
      });

      if (response) {
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
            <h3 className="text-lg font-semibold text-gray-900">Loading Products</h3>
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
                  <h1 className="text-xl font-bold text-gray-900">Products</h1>
                  <p className="text-sm text-gray-600">Manage your product </p>
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
                                  Default: {defaultItem.product}
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
                                placeholder="Search products..."
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
                              {section.data.length === 0 ? 'No products found' : 'No products match your filter'}
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
                                            {item.product}
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
                                        <div className="flex items-center space-x-4 mt-2">
                                          <Badge variant="secondary">
                                            Type: {item.type}
                                          </Badge>
                                          <Badge variant="outline">
                                            Price: ${item.price}
                                          </Badge>
                                        </div>
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

                                      {canAddOrUpdate && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleEditItem(item, section.title, section.key)}
                                              className="text-blue-600 border-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>Edit this product</TooltipContent>
                                        </Tooltip>
                                      )}
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
              <SheetTitle>{isEditing ? 'Edit' : 'Add New'} {getSingularLabel(selectedSection)}</SheetTitle>
            </SheetHeader>

            <div className="mt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmitNewItem)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
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

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Enter price"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                          {isEditing ? 'Updating...' : 'Adding...'}
                        </>
                      ) : (
                        <>
                          {isEditing ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                          {isEditing ? 'Update' : 'Add'} {getSingularLabel(selectedSection)}
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

export default AMDataRulesPage;