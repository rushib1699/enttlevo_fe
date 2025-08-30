import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  getCustomerDetailsByCompanyId,
  addCustomerContact,
  updateCustomer,
  getTimezones,
  getContractType,
  getAccountStatus,
  sendToAMCustomer,
  deleteCustomer,
} from '@/api';
import { useParams, useNavigate } from 'react-router-dom';
import { ContractType, LeadsData } from '@/types';
import SalesNotesTab from '@/components/Notes/SalesNotesTab';
import SalesAccountHistory from '@/components/AccountHistory/SalesAccountHistory';
import OBTasksTab from '@/components/Tasks/OBTasksTab';
import AccountEmail from '@/components/AccountEmail/AccountEmail';
import SalesDocumnets from '@/components/AccountDocuments/SalesDocumnets';
import ProductAndService from '@/components/ProductAndService/ProductAndService';
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { useUserPermission } from '@/context/UserPermissionContext';
import PipelinePage from '@/components/Pipeline/PipelinePage';
import DatePicker from "@/components/ui/date-picker";
import {
  Building2,
  User,
  Mail,
  FileText,
  StickyNote,
  CheckSquare,
  FolderOpen,
  AlertCircle,
  ArrowLeft,
  Trash2,
  Edit,
  Save,
  X,
  History,
  Loader2,
  Phone,
  Globe,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Info,
  Upload,
  Send,
  Plus,
  Linkedin,
  Building,
  ChevronDown,
  ChevronUp,
  ChartBar,
  Package
} from "lucide-react";

interface ContactDetails {
  id?: number;
  poc_name?: string;
  poc_contact?: string;
  poc_email?: string;
  poc_linkedin?: string;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: number;
  is_deleted?: number;
  created_by?: number;
  updated_by?: number;
}

interface CompanyDetails {
  id?: number;
  name?: string;
  support_email?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  website?: string | null;
  linkedin?: string | null;
  live_date?: string | null;
  handoff_date?: string | null;
  transfer_date?: string | null;
  contract_start_date?: string | null;
  contract_close_date?: string | null;
  balance?: number;
  contract_value?: number;
  arr?: number;
  contract_duration?: number;
  mrr?: number;
  am?: string;
  om?: string;
  am_id: number;
  health_id?: number;
  health?: string;
  account_status_types_id?: number;
  industry_id?: number;
  status?: string;
  contract_type?: string;
  previous_platform?: string;
  timezone?: string;
  accounting_software?: string;
  licenses_or_units_sold?: number;
  contacts?: ContactDetails[];
}

interface TimezoneType {
  id: number;
  code: string;
}

interface AccountStatusType {
  id: number;
  status_name: string;
}

const OBAccountDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loginResponse } = useApplicationContext();
  const { hasAccess, hasCompanyAccess } = useUserPermission();

  // States
  const [isEditing, setIsEditing] = useState(false);
  const [accountData, setAccountData] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Dropdown data
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [timezones, setTimezones] = useState<TimezoneType[]>([]);
  const [accountStatuses, setAccountStatuses] = useState<AccountStatusType[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);

  // Modal states - removed onboarding modal states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // Contact form data
  const [newContact, setNewContact] = useState({
    contact_name: '',
    contact_email: '',
    contact_number: '',
    contact_linkedin: ''
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    website?: string;
    linkedin?: string;
  }>({});

  // Processing states - removed onboarding submission state
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingToAM, setIsSendingToAM] = useState(false);

  // Collapsible states
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false);
  const [isDealInfoOpen, setIsDealInfoOpen] = useState(false);
  const [isRevenueInfoOpen, setIsRevenueInfoOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("pipeline")

  // Permissions
  const hasWritePermission = hasAccess("write");
  const isSuperAdmin = hasAccess("superadmin");
  const hasDeletePermission = hasAccess("data_delete");
  const hasAMPermission = hasCompanyAccess("account_management");
  const hasOBPermission = hasCompanyAccess("onboarding");

  // Validation functions
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };


  const getStatusId = (status: string | undefined) => {
    const statusObj = leadStatuses.find((s: any) => s.status === status);
    return statusObj ? statusObj.id : undefined;
  };

  const getTimeId = (code: string | undefined) => {
    const timeObj = timezones.find((t) => t.code === code);
    return timeObj ? timeObj.id : undefined;
  };

  const getContractTypeId = (contractTypeName: string | undefined) => {
    const typeObj = contractTypes.find((c) => c.contract_type_name === contractTypeName);
    return typeObj ? typeObj.id : undefined;
  };

  const getIndustryId = (industry: string | undefined) => {
    const industryObj = industries.find((i) => i.industry === industry);
    return industryObj ? industryObj.id : undefined;
  };

  const getAccountStatusId = (statusName: string | undefined) => {
    const statusObj = accountStatuses.find((s) => s.status_name === statusName);
    return statusObj ? statusObj.id : undefined;
  };

  // Fetch data function
  const fetchAccountDetails = useCallback(async () => {
    if (!id || !loginResponse) return;

    try {
      setLoading(true);
      const [
        accountDetailsResponse,
        timezonesResponse,
        contractTypesResponse,
        accountStatusesResponse,
      ] = await Promise.all([
        getCustomerDetailsByCompanyId({ company_id: Number(id) }),
        getTimezones({ company_id: loginResponse.company_id }),
        getContractType({ company_id: loginResponse.company_id }),
        getAccountStatus({ company_id: loginResponse.company_id }),
      ]);

      if (accountDetailsResponse) setAccountData(accountDetailsResponse);
      if (timezonesResponse) setTimezones(timezonesResponse);
      if (contractTypesResponse) setContractTypes(contractTypesResponse);
      if (accountStatusesResponse) setAccountStatuses(accountStatusesResponse);
    } catch (error) {
      console.error('Error fetching account details:', error);
    } finally {
      setLoading(false);
    }
  }, [id, loginResponse]);

  useEffect(() => {
    fetchAccountDetails();
  }, [fetchAccountDetails]);

  // Input change handler
  const handleInputChange = (field: keyof LeadsData, value: string | number) => {
    setValidationErrors(prev => ({ ...prev, [field]: undefined }));

    if (typeof value === 'string') {
      if (field === 'email' && value && !isValidEmail(value)) {
        setValidationErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      }
    }

    setAccountData(prev => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  // Contact change handler
  const handleContactChange = (index: number, field: string, value: string) => {
    setAccountData(prev => {
      if (!prev || !prev.contacts) return prev;
      const updatedContacts = [...prev.contacts];
      updatedContacts[index] = { ...updatedContacts[index], [field]: value };
      return { ...prev, contacts: updatedContacts };
    });
  };

  // Save handler
  const handleSave = async () => {
    const errors: typeof validationErrors = {};

    if (accountData?.email && !isValidEmail(accountData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        id: Number(id),
        user_id: Number(loginResponse?.id),
        company_id: Number(loginResponse?.company_id),
        live_date: accountData?.live_date || null,
        handoff_date: accountData?.handoff_date || null,
        transfer_date: accountData?.transfer_date || null,
        contract_start_date: accountData?.contract_start_date || null,
        contract_close_date: accountData?.contract_close_date || null,
        contract_value: Number(accountData?.contract_value) || 0,
        contract_duration: Number(accountData?.contract_duration) || 0,
        arr: Number(accountData?.arr) || 0,
        mrr: Number(accountData?.mrr) || 0,
        balance: Number(accountData?.balance) || 0,
        //contract_type_id: Number(contract_id) || 0,
        account_status_type_id: Number(accountData?.account_status_types_id) || 1,
        //timezone_id: Number(timezone_id) || 0,
        address: accountData?.address || "",
        website: accountData?.website || "",
        licenses_or_units_sold: Number(accountData?.licenses_or_units_sold) || 0,
      };

      const response = await updateCustomer(payload);
      if (response) {
        setAccountData(response);
        setIsEditing(false);
        await fetchAccountDetails();
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Add contact handler
  const handleAddContact = async () => {
    setIsAddingContact(true);
    try {
      const payload = {
        poc_name: newContact?.contact_name,
        poc_email: newContact?.contact_email,
        poc_contact: newContact?.contact_number,
        poc_linkedin: newContact?.contact_linkedin,
        company_customer_id: accountData?.id,
        user_id: Number(loginResponse?.id),
      };

      await addCustomerContact(payload);
      await fetchAccountDetails();
      setIsContactModalOpen(false);
      setNewContact({
        contact_name: '',
        contact_email: '',
        contact_number: '',
        contact_linkedin: ''
      });
    } catch (error) {
      console.error('Add contact error:', error);
    } finally {
      setIsAddingContact(false);
    }
  };

  // Remove handleSendToOnboarding function entirely

  // Send to AM handler
  const handleSendToAM = async () => {
    setIsSendingToAM(true);
    try {
      const payload = {
        name: accountData?.name || "",
        support_email: accountData?.email || "",
        contract_value: accountData?.contract_value || 0,
        contract_duration: accountData?.contract_duration || 1,
        user_id: loginResponse?.id || 0,
        timezone_id: getTimeId(accountData?.timezone) || 1,
        contract_type_id: getContractTypeId(accountData?.contract_type) || 1,
        mib: accountData?.mib || 0,
        company_id: loginResponse?.company_id,
        industry_id: getIndustryId(accountData?.industry) ?? 0,
        account_status_type_id: getAccountStatusId(accountData?.account_status) ?? 0
      };

      await sendToAMCustomer(payload);
    } catch (error) {
      console.error('Error sending to AM:', error);
    } finally {
      setIsSendingToAM(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCustomer({
        user_id: Number(loginResponse?.id),
        lead_id: Number(id),
        is_active: 0,
        is_deleted: 1,
        company_id: Number(loginResponse?.company_id)
      });
      navigate('/onboarding/accounts');
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading account details...</span>
        </div>
      </div>
    );
  }

  if (!accountData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Account not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button onClick={handleBack} variant="ghost" className="hover:bg-gray-100 bg-white flex items-center gap-2">
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{accountData.name}</h1>
              <p className="text-gray-600">Account Details & Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!hasWritePermission && !isSuperAdmin && (
              <Badge variant="destructive" className="flex items-center gap-1 p-2">
                <Info className="h-3 w-3" />
                No edit permission
              </Badge>
            )}
            {isEditing ? (
              <>
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} size="sm" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  disabled={!(hasWritePermission || isSuperAdmin)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>

                {/* Send to AM */}
                {hasAMPermission && (
                  <Button
                    onClick={handleSendToAM}
                    size="sm"
                    disabled={accountData.status?.toLowerCase() !== "won" || isSendingToAM}
                    className=""
                  >
                    {isSendingToAM ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send to AM
                  </Button>
                )}

                {/* Delete */}
                {hasDeletePermission && isSuperAdmin && (
                  <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Account</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p>Are you sure you want to delete this account?</p>
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This action cannot be undone. All associated data will be permanently deleted.
                          </AlertDescription>
                        </Alert>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete Account
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-2">
          {/* Left Column - Company Details */}
          <div className="lg:col-span-3 space-y-2">
            {/* Company Details Card */}
            <Card className="rounded-lg">
              <CardHeader className="bg-slate-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Company Name</Label>
                  <Input
                    value={accountData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={accountData.email || accountData.support_email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className={`mt-1 ${validationErrors.email ? 'border-red-500' : ''}`}
                    />
                  ) : (
                    <Input
                      value={accountData.email || accountData.support_email || ''}
                      disabled
                      className="mt-1"
                    />
                  )}
                  {validationErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Address</Label>
                  {isEditing ? (
                    <Textarea
                      value={accountData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <Input
                      value={accountData.address || ''}
                      disabled
                      className="mt-1"
                    />
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">LinkedIn</Label>
                  {isEditing ? (
                    <Input
                      value={accountData.linkedin || ''}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  ) : (
                    <Input
                      value={accountData.linkedin || ''}
                      disabled
                      className="mt-1"
                    />
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Website</Label>
                  {isEditing ? (
                    <Input
                      value={accountData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  ) : (
                    <Input
                      value={accountData.website || ''}
                      disabled
                      className="mt-1"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Information Card */}
            <Card className="rounded-lg">
              <Collapsible open={isRevenueInfoOpen} onOpenChange={setIsRevenueInfoOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="bg-slate-600 text-white cursor-pointer hover:bg-slate-700 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Revenue Information
                      </div>
                      {isRevenueInfoOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-2 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Annual Recurring Revenue</Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={accountData.arr || ''}
                            onChange={(e) => handleInputChange('arr', Number(e.target.value))}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        ) : (
                          <Input
                            value={accountData.arr || ''}
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Monthly Recurring Revenue</Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={accountData.mrr || ''}
                            onChange={(e) => handleInputChange('mrr', Number(e.target.value))}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        ) : (
                          <Input
                            value={accountData.mrr || ''}
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Balance</Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={accountData.balance || ''}
                            onChange={(e) => handleInputChange('balance', Number(e.target.value))}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        ) : (
                          <Input
                            value={accountData.balance || ''}
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Contact Details Card */}
            <Card className="rounded-lg">
              <Collapsible open={isContactDetailsOpen} onOpenChange={setIsContactDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="bg-slate-600 text-white cursor-pointer hover:bg-slate-700 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Contact Details
                      </div>
                      {isContactDetailsOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-2">
                    <div className="space-y-2">
                      {accountData.contacts && accountData.contacts.length > 0 ? (
                        accountData.contacts.map((contact, index) => (
                          <div key={index} className="p-4 border rounded-lg space-y-3">
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Name</Label>
                              <Input
                                value={contact.poc_name || ''}
                                onChange={(e) => handleContactChange(index, 'poc_name', e.target.value)}
                                disabled={!isEditing}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Email</Label>
                              <Input
                                type="email"
                                value={contact.poc_email || ''}
                                onChange={(e) => handleContactChange(index, 'poc_email', e.target.value)}
                                disabled={!isEditing}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Phone</Label>
                              <Input
                                value={contact.poc_contact || ''}
                                onChange={(e) => handleContactChange(index, 'poc_contact', e.target.value)}
                                disabled={!isEditing}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-700">LinkedIn</Label>
                              <Input
                                value={contact.poc_linkedin || ''}
                                onChange={(e) => handleContactChange(index, 'poc_linkedin', e.target.value)}
                                disabled={!isEditing}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          No contact details available
                        </div>
                      )}

                      {isEditing && (
                        <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
                          <DialogTrigger asChild>
                            <Button variant="default" className="w-auto">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Contact
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Contact</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2">
                              <div>
                                <Label>Name</Label>
                                <Input
                                  value={newContact.contact_name}
                                  onChange={(e) => setNewContact(prev => ({ ...prev, contact_name: e.target.value }))}
                                  placeholder="Enter contact name"
                                />
                              </div>
                              <div>
                                <Label>Email</Label>
                                <Input
                                  type="email"
                                  value={newContact.contact_email}
                                  onChange={(e) => setNewContact(prev => ({ ...prev, contact_email: e.target.value }))}
                                  placeholder="Enter email address"
                                />
                              </div>
                              <div>
                                <Label>Phone</Label>
                                <Input
                                  value={newContact.contact_number}
                                  onChange={(e) => setNewContact(prev => ({ ...prev, contact_number: e.target.value }))}
                                  placeholder="Enter phone number"
                                />
                              </div>
                              <div>
                                <Label>LinkedIn</Label>
                                <Input
                                  value={newContact.contact_linkedin}
                                  onChange={(e) => setNewContact(prev => ({ ...prev, contact_linkedin: e.target.value }))}
                                  placeholder="Enter LinkedIn profile"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsContactModalOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleAddContact} disabled={isAddingContact}>
                                {isAddingContact ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Plus className="h-4 w-4 mr-2" />
                                )}
                                Add Contact
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Deal Information Card */}
            <Card className="rounded-lg">
              <Collapsible open={isDealInfoOpen} onOpenChange={setIsDealInfoOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="bg-slate-600 text-white cursor-pointer hover:bg-slate-700 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Deal Information
                      </div>
                      {isDealInfoOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Contract Value</Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={accountData.contract_value || ''}
                            onChange={(e) => handleInputChange('contract_value', Number(e.target.value))}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        ) : (
                          <Input
                            value={accountData.contract_value || ''}
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Licenses/Units Sold</Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={accountData.licenses_or_units_sold || ''}
                            onChange={(e) => handleInputChange('licenses_or_units_sold', Number(e.target.value))}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        ) : (
                          <Input
                            value={accountData.licenses_or_units_sold || ''}
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          Contract Duration
                          <Info className="h-4 w-4 text-gray-400" />
                        </Label>
                        {isEditing ? (
                          <Input
                            type="number"
                            value={accountData.contract_duration || ''}
                            onChange={(e) => handleInputChange('contract_duration', Number(e.target.value))}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        ) : (
                          <Input
                            value={accountData.contract_duration || ''}
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Contract Start Date</Label>
                        {isEditing ? (
                          <DatePicker
                          date={accountData.contract_start_date ? new Date(accountData.contract_start_date) : null}
                          setDate={(date) => handleInputChange('contract_start_date', date ? date.toISOString() : null)}
                          />
                        ) : (
                          <Input
                            value={accountData.contract_start_date || ''}
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Contract Close Date</Label>
                        {isEditing ? (
                          <DatePicker
                          date={accountData.contract_close_date ? new Date(accountData.contract_close_date) : null}
                          setDate={(date) => handleInputChange('contract_close_date', date ? date.toISOString() : null)}
                          />
                        ) : (
                          <Input
                            value={accountData.contract_close_date || ''}
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Live Date</Label>
                        {isEditing ? (
                          <DatePicker
                          date={accountData.live_date ? new Date(accountData.live_date) : null}
                          setDate={(date) => handleInputChange('live_date', date ? date.toISOString() : null)}
                          />
                        ) : (
                          <Input
                            value={accountData.live_date || ''}    
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Handoff Date</Label>
                        {isEditing ? (
                          <DatePicker
                          date={accountData.handoff_date ? new Date(accountData.handoff_date) : null}
                          setDate={(date) => handleInputChange('handoff_date', date ? date.toISOString() : null)}
                          />
                        ) : (
                          <Input
                            value={accountData.handoff_date || ''}
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Transfer Date</Label>
                        {isEditing ? (
                          <DatePicker
                          date={accountData.transfer_date ? new Date(accountData.transfer_date) : null}
                          setDate={(date) => handleInputChange('transfer_date', date ? date.toISOString() : null)}
                          />
                        ) : (
                          <Input
                            value={accountData.transfer_date || ''}
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Contract Type</Label>
                        {isEditing ? (
                          <Select
                            value={accountData.contract_type || ''}
                            onValueChange={(value) => handleInputChange('contract_type', value)}
                            disabled={!isEditing}
                            className="mt-1"
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select contract type" />
                            </SelectTrigger>
                            <SelectContent>
                              {contractTypes.map((type) => (
                                <SelectItem key={type.id} value={type.contract_type_name}>
                                  {type.contract_type_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={accountData.contract_type || ''}
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                        {isEditing ? (
                          <Select
                            value={accountData.status || ''}
                            onValueChange={(value) => handleInputChange('status', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {accountStatuses.map((status) => (
                                <SelectItem key={status.id} value={status.status_name}>
                                  {status.status_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={accountData.status || ''} 
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Timezone</Label>
                      {isEditing ? (
                        <Select
                          value={accountData.timezone || ''}
                          onValueChange={(value) => handleInputChange('timezone', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            {timezones.map((timezone) => (
                              <SelectItem key={timezone.id} value={timezone.code}>
                                {timezone.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={accountData.timezone || ''}     
                          disabled
                          className="mt-1"
                        />
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </div>

          {/* Right Column - Account Overview */}
          <div className="lg:col-span-7">
            <Card className="rounded-lg">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <div>
                      <CardTitle className="text-xl">Account Overview</CardTitle>
                      <p className="text-sm text-gray-600">Manage and view account details</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2">
                {/* Custom Professional Tab Design */}
                <div className="border-b border-gray-200 mb-6">
                  <div className="flex items-center space-x-8">
                    <button
                      onClick={() => setActiveTab('pipeline')}
                      className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                        activeTab === 'pipeline'
                          ? 'text-orange-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <ChartBar className="w-4 h-4" />
                      Pipeline
                      {activeTab === 'pipeline' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('email')}
                      className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                        activeTab === 'email'
                          ? 'text-orange-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      Email
                      {activeTab === 'email' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('notes')}
                      className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                        activeTab === 'notes'
                          ? 'text-orange-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <StickyNote className="w-4 h-4" />
                      Notes
                      {activeTab === 'notes' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('tasks')}
                      className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                        activeTab === 'tasks'
                          ? 'text-orange-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <CheckSquare className="w-4 h-4" />
                      Tasks
                      {activeTab === 'tasks' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('documents')}
                      className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                        activeTab === 'documents'
                          ? 'text-orange-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <FolderOpen className="w-4 h-4" />
                      Documents
                      {activeTab === 'documents' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('history')}
                      className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                        activeTab === 'history'
                          ? 'text-orange-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <History className="w-4 h-4" />
                      History
                      {activeTab === 'history' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('product')}
                      className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                        activeTab === 'product'
                          ? 'text-orange-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      Product and Service
                      {activeTab === 'product' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="mt-2">
                  {activeTab === 'pipeline' && (
                    <PipelinePage customerId={id} />
                  )}

                  {activeTab === 'email' && (
                    <AccountEmail accountEmail={accountData?.support_email || ''} accountOwner={accountData?.account_owner || ''} />
                  )}

                  {activeTab === 'notes' && (
                    <SalesNotesTab accountId={id} userId={loginResponse?.id || ''} />
                  )}

                  {activeTab === 'tasks' && (
                    <OBTasksTab accountId={id} companyId={loginResponse?.company_id || ''} userId={loginResponse?.id || ''} />
                  )}

                  {activeTab === 'documents' && (
                    <SalesDocumnets accountId={id} />
                  )}

                  {activeTab === 'history' && (
                    <SalesAccountHistory accountId={id} userId={loginResponse?.id || ''} />
                  )}

                  {activeTab === 'product' && (
                    <ProductAndService companyId={loginResponse?.company_id || ''} customerId={id} userId={loginResponse?.id || ''} />
                  )}
                </div>

                
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OBAccountDetailsPage;