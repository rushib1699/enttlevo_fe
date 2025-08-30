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
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  getLeadDetails,
  updateLead,
  getContractStages,
  getLeadLable,
  getLeadStatus,
  addCustomer,
  uploadDocuments,
  getTimezones,
  getContractType,
  getAccountStatus,
  sendToOb,
  sendToAMCustomer,
  addLeadContact,
  deleteCustomer,
  getIndustries,
  getCustomersAndTeamByUserId,
} from '@/api';
import { useParams, useNavigate } from 'react-router-dom';
import { LeadsData } from '@/types';
import SalesNotesTab from '@/components/Notes/SalesNotesTab';
import SalesAccountHistory from '@/components/AccountHistory/SalesAccountHistory';
import SalesTasksTab from '@/components/Tasks/SalesTasksTab';
import AccountEmail from '@/components/AccountEmail/AccountEmail';
import SalesDocumnets from '@/components/AccountDocuments/SalesDocumnets';
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { useUserPermission } from '@/context/UserPermissionContext';
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
  DollarSign,
  Info,
  Upload,
  Send,
  Plus,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ContactDetails {
  id?: number;
  poc_name?: string;
  poc_email?: string;
  poc_contact?: string;
  poc_linkedin?: string;
}

interface TimezoneType {
  id: number;
  code: string;
}

interface ContractType {
  id: number;
  contract_type_name: string;
}

interface AccountStatusType {
  id: number;
  status_name: string;
}

interface IndustryType {
  id: number;
  industry: string;
}

const SalesDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loginResponse } = useApplicationContext();
  const { hasAccess, hasCompanyAccess } = useUserPermission();
  const [activeTab, setActiveTab] = useState('email');

  // States
  const [isEditing, setIsEditing] = useState(false);
  const [leadData, setLeadData] = useState<LeadsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Dropdown data
  const [contractStages, setContractStages] = useState([]);
  const [leadLabels, setLeadLabels] = useState([]);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [timezones, setTimezones] = useState<TimezoneType[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [accountStatuses, setAccountStatuses] = useState<AccountStatusType[]>([]);
  const [industries, setIndustries] = useState<IndustryType[]>([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // Modal states
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [skipDocumentUpload, setSkipDocumentUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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

  // Processing states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isSendingToAM, setIsSendingToAM] = useState(false);

  // Collapsible states
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false);
  const [isDealInfoOpen, setIsDealInfoOpen] = useState(false);

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

  // Helper functions for getting IDs
  const getStageId = (stage: string | undefined) => {
    const stageObj = contractStages.find((s: any) => s.stage === stage);
    return stageObj ? stageObj.id : undefined;
  };

  const getStatusId = (status: string | undefined) => {
    const statusObj = leadStatuses.find((s: any) => s.status === status);
    return statusObj ? statusObj.id : undefined;
  };

  const getLabelId = (label: string | undefined) => {
    const labelObj = leadLabels.find((l: any) => l.lable === label);
    return labelObj ? labelObj.id : undefined;
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
  const fetchLeadDetails = useCallback(async () => {
    if (!id || !loginResponse) return;

    try {
      setLoading(true);
      const [
        leadDetailsResponse,
        stagesResponse,
        labelsResponse,
        statusesResponse,
        timezonesResponse,
        contractTypesResponse,
        accountStatusesResponse,
        industriesResponse,
        teamResponse
      ] = await Promise.all([
        getLeadDetails({ id: Number(id) }),
        getContractStages({ company_id: loginResponse.company_id }),
        getLeadLable({ company_id: loginResponse.company_id }),
        getLeadStatus({ company_id: loginResponse.company_id }),
        getTimezones({ company_id: loginResponse.company_id }),
        getContractType({ company_id: loginResponse.company_id }),
        getAccountStatus({ company_id: loginResponse.company_id }),
        getIndustries({ company_id: loginResponse.company_id }),
        getCustomersAndTeamByUserId({
          user_id: loginResponse.id,
          company_id: loginResponse.company_id,
          lead_id: Number(id)
        })
      ]);

      if (leadDetailsResponse) setLeadData(leadDetailsResponse);
      if (stagesResponse) setContractStages(stagesResponse);
      if (labelsResponse) setLeadLabels(labelsResponse);
      if (statusesResponse) setLeadStatuses(statusesResponse);
      if (timezonesResponse) setTimezones(timezonesResponse);
      if (contractTypesResponse) setContractTypes(contractTypesResponse);
      if (accountStatusesResponse) setAccountStatuses(accountStatusesResponse);
      if (industriesResponse) setIndustries(industriesResponse);
      if (teamResponse) {
        const allTeamMembers = [
          ...(teamResponse.team || []),
          ...(teamResponse.managers || []),
          ...(teamResponse.users || [])
        ].filter(Boolean);
        setTeamMembers(allTeamMembers);
      }
    } catch (error) {
      console.error('Error fetching lead details:', error);
    } finally {
      setLoading(false);
    }
  }, [id, loginResponse]);

  useEffect(() => {
    fetchLeadDetails();
  }, [fetchLeadDetails]);

  // Input change handler
  const handleInputChange = (field: keyof LeadsData, value: string | number) => {
    if (isLeadInOnboarding) return; // Prevent changes if lead is in onboarding

    setValidationErrors(prev => ({ ...prev, [field]: undefined }));

    if (typeof value === 'string') {
      if (field === 'email' && value && !isValidEmail(value)) {
        setValidationErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      }
    }

    setLeadData(prev => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  // Contact change handler
  const handleContactChange = (index: number, field: string, value: string) => {
    if (isLeadInOnboarding) return; // Prevent changes if lead is in onboarding

    setLeadData(prev => {
      if (!prev || !prev.contacts) return prev;
      const updatedContacts = [...prev.contacts];
      updatedContacts[index] = { ...updatedContacts[index], [field]: value };
      return { ...prev, contacts: updatedContacts };
    });
  };

  // Save handler
  const handleSave = async () => {
    if (isLeadInOnboarding) return; // Prevent saving if lead is in onboarding

    const errors: typeof validationErrors = {};

    if (leadData?.email && !isValidEmail(leadData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        account_name: leadData?.account_name,
        account_owner_id: leadData?.account_owner_id || loginResponse?.id,
        user_id: loginResponse?.id,
        contract_stage_id: getStageId(leadData?.contract_stage),
        status_id: getStatusId(leadData?.status),
        label_id: getLabelId(leadData?.lable),
        funnel_stage_id: getStatusId(leadData?.funnel_stage),
        lead_id: Number(id),
        address: leadData?.address,
        country: leadData?.country,
        state: leadData?.state,
        city: leadData?.city,
        linkedin: leadData?.linkedin,
        website: leadData?.website,
        email: leadData?.email,
        contact_name: leadData?.contact_name,
        contract_value: leadData?.contract_value || 0,
        contract_duration: leadData?.contract_duration || 0,
        timezone_id: getTimeId(leadData?.timezone),
        contract_type_id: getContractTypeId(leadData?.contract_type),
        account_status_type_id: getAccountStatusId(leadData?.account_status),
        mib: leadData?.mib || 0,
        proposed_arr: leadData?.proposed_arr || 0,
      };

      const response = await updateLead(payload);
      if (response) {
        setLeadData(response);
        setIsEditing(false);
        await fetchLeadDetails();
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Add contact handler
  const handleAddContact = async () => {
    if (isLeadInOnboarding) return; // Prevent adding contacts if lead is in onboarding

    setIsAddingContact(true);
    try {
      const payload = {
        name: newContact.contact_name,
        email: newContact.contact_email,
        contact: newContact.contact_number,
        linkedin: newContact.contact_linkedin,
        lead_id: leadData?.id,
        user_id: loginResponse?.id,
      };

      await addLeadContact(payload);
      await fetchLeadDetails();
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

  // Send to onboarding handler
  const handleSendToOnboarding = async () => {
    if (isLeadInOnboarding) return; // Prevent sending to onboarding if already in onboarding

    setIsSubmitting(true);
    try {
      const payload = {
        name: leadData?.account_name || "",
        support_email: leadData?.email || "",
        contract_value: leadData?.contract_value || 0,
        contract_duration: leadData?.contract_duration || 1,
        company_id: loginResponse?.company_id,
        user_id: loginResponse?.id,
        timezone_id: getTimeId(leadData?.timezone) || 1,
        contract_type_id: getContractTypeId(leadData?.contract_type) || 1,
        mib: leadData?.mib || 0,
        address: leadData?.address || "",
        website: leadData?.website || "",
        linkedin: leadData?.linkedin || "",
        industry_id: getIndustryId(leadData?.industry) ?? 0,
        account_status_type_id: getAccountStatusId(leadData?.account_status) ?? 0
      };

      const addCustomerResponse = await addCustomer(payload);

      if (!skipDocumentUpload && selectedFiles.length > 0) {
        await uploadDocuments({
          file: selectedFiles[0],
          company_customer_id: Number(addCustomerResponse.company_customer_id),
          user_id: loginResponse?.id || 0,
          company_id: loginResponse?.company_id
        });
      }

      await sendToOb({
        lead_id: Number(id),
        industry_id: leadData?.industry_id ?? 0,
        account_status_type_id: leadData?.account_status_id ?? 0,
      });

      setIsOnboardingModalOpen(false);
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send to AM handler
  const handleSendToAM = async () => {
    if (isLeadInOnboarding) return; // Prevent sending to AM if lead is in onboarding

    setIsSendingToAM(true);
    try {
      const payload = {
        name: leadData?.account_name || "",
        support_email: leadData?.email || "",
        contract_value: leadData?.contract_value || 0,
        contract_duration: leadData?.contract_duration || 1,
        user_id: loginResponse?.id || 0,
        timezone_id: getTimeId(leadData?.timezone) || 1,
        contract_type_id: getContractTypeId(leadData?.contract_type) || 1,
        mib: leadData?.mib || 0,
        company_id: loginResponse?.company_id,
        industry_id: getIndustryId(leadData?.industry) ?? 0,
        account_status_type_id: getAccountStatusId(leadData?.account_status) ?? 0
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
    if (isLeadInOnboarding) return; // Prevent deletion if lead is in onboarding

    setIsDeleting(true);
    try {
      await deleteCustomer({
        user_id: loginResponse?.id,
        lead_id: Number(id),
        is_active: 0,
        is_deleted: 1,
        company_id: loginResponse?.company_id
      });
      navigate('/sales/leads');
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


  // Check if lead is in onboarding
  const isLeadInOnboarding = (leadData as any)?.sent_to_ob === 1 ? true : false;


  const isSendToOnboardingDisabled = useMemo(() => {
    return leadData?.status?.toLowerCase() !== "won" || isLeadInOnboarding;
  }, [leadData?.status, isLeadInOnboarding]);



  // get the list of contract_stages and chech the if status before demo the false else true
  const isStageBeforeDemo = useMemo(() => {
    // Get the list of contract stages
    const stages = contractStages;

    // Find the index of the "Demo" stage
    const demoIndex = stages.findIndex(stage => stage.stage === "Demo");

    // If Demo stage not found, return false
    if (demoIndex === -1) return false;

    // Get current stage from lead details
    const currentStage = leadData?.contract_stage;

    // Find index of current stage
    const currentIndex = stages.findIndex(stage => stage.stage === currentStage);

    // If current stage not found, return false
    if (currentIndex === -1) return false;

    // Check if current stage is before or equal to Demo stage
    // Return true if before/equal to Demo, false if after Demo
    return currentIndex < demoIndex;

  }, [contractStages, leadData?.contract_stage]);

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

  if (!leadData) {
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
              <h1 className="text-2xl font-bold text-gray-900">{leadData.account_name}</h1>
              <p className="text-gray-600">Account Details & Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLeadInOnboarding && (
              <Badge variant="destructive" className="flex items-center gap-1 p-2">
                <Info className="h-3 w-3" />
                Account locked - Transferred to Onboarding
              </Badge>
            )}
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
                <Button onClick={handleSave} size="sm" disabled={isSaving || isLeadInOnboarding}>
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
                {(hasWritePermission || isSuperAdmin) && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    disabled={!(hasWritePermission || isSuperAdmin) || isLeadInOnboarding}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}

                {/* Send to Onboarding */}
                {hasOBPermission && !isStageBeforeDemo && !isLeadInOnboarding && (
                  <Dialog open={isOnboardingModalOpen} onOpenChange={setIsOnboardingModalOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        disabled={isSendToOnboardingDisabled || (!hasWritePermission && !isSuperAdmin) || isLeadInOnboarding}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send to Onboarding
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Send to Onboarding</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <input
                            type="file"
                            multiple
                            onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                            className="hidden"
                            id="file-upload"
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('file-upload')?.click()}
                          >
                            Select Files
                          </Button>
                          <p className="text-sm text-gray-500 mt-2">Upload required documents</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="skip-upload"
                            checked={skipDocumentUpload}
                            onCheckedChange={setSkipDocumentUpload}
                          />
                          <Label htmlFor="skip-upload">Skip document upload</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOnboardingModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSendToOnboarding}
                          disabled={isSubmitting || isLeadInOnboarding}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Send to Onboarding
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Send to AM */}
                {hasAMPermission && !hasOBPermission && isStageBeforeDemo && (
                  <Button
                    onClick={handleSendToAM}
                    size="sm"
                    disabled={leadData.status?.toLowerCase() !== "won" || isSendingToAM || isLeadInOnboarding}
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
                      <Button variant="destructive" size="sm" disabled={isLeadInOnboarding}>
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
                          disabled={isDeleting || isLeadInOnboarding}
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
            <Card>
              <CardHeader className="bg-slate-600 text-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Details
                  </CardTitle>

                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                        <X className="h-4 w-4 bg-white text-black" />
                      </Button>
                      <Button onClick={handleSave} size="sm" disabled={isSaving || isLeadInOnboarding}>
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <>
                      {(hasWritePermission || isSuperAdmin) && (
                        <Button
                          onClick={() => setIsEditing(true)}
                          variant="outline"
                          size="sm"
                          disabled={!(hasWritePermission || isSuperAdmin) || isLeadInOnboarding}
                        >
                          <Edit className="h-4 w-4 mr-2 bg-white text-black" />
                        </Button>
                      )}
                    </>
                  )}


                </div>
              </CardHeader>

              <CardContent className="p-2 space-y-2">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Company Name</Label>
                  <Input
                    value={leadData.account_name || ''}
                    onChange={(e) => handleInputChange('account_name', e.target.value)}
                    disabled={!isEditing || isLeadInOnboarding}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Account Owner</Label>
                  {isEditing && !isLeadInOnboarding ? (
                    <Select
                      value={leadData.account_owner_id ? leadData.account_owner_id.toString() : ''}
                      onValueChange={(value) => handleInputChange('account_owner_id', Number(value))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member: any) => (
                          <SelectItem key={member.id} value={member.id.toString()}>
                            {member.first_name} {member.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={leadData.account_owner || leadData.created_by || ''}
                      disabled
                      className="mt-1"
                    />
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Contact Name</Label>
                  <Input
                    value={leadData.contact_name || ''}
                    onChange={(e) => handleInputChange('contact_name', e.target.value)}
                    disabled={!isEditing || isLeadInOnboarding}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    type="email"
                    value={leadData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing || isLeadInOnboarding}
                    className={`mt-1 ${validationErrors.email ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Address</Label>
                  <Textarea
                    value={leadData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">City</Label>
                    <Input
                      value={leadData.city || ''}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">State</Label>
                    <Input
                      value={leadData.state || ''}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Country</Label>
                    <Input
                      value={leadData.country || ''}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">LinkedIn</Label>
                  <Input
                    value={leadData.linkedin || ''}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Website</Label>
                  <Input
                    value={leadData.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Details Card */}
            <Card>
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
                <CollapsibleContent >
                  <CardContent className="p-2">
                    <div className="space-y-2">
                      {leadData.contacts && leadData.contacts.length > 0 ? (
                        leadData.contacts.map((contact, index) => (
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
            <Card>
              <Collapsible open={isDealInfoOpen} onOpenChange={setIsDealInfoOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="bg-slate-600 text-white cursor-pointer hover:bg-slate-700 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
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
                  <CardContent className="p-2 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Contract Stage</Label>
                        {isEditing ? (
                          <Select
                            value={leadData.contract_stage || ''}
                            onValueChange={(value) => handleInputChange('contract_stage', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                            <SelectContent>
                              {contractStages.map((stage: any) => (
                                <SelectItem key={stage.id} value={stage.stage}>
                                  {stage.stage}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={leadData.contract_stage || ''}
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                        {isEditing ? (
                          <Select
                            value={leadData.status || ''}
                            onValueChange={(value) => handleInputChange('status', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {leadStatuses.map((status: any) => (
                                <SelectItem key={status.id} value={status.status}>
                                  {status.status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={leadData.status || ''}
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Label</Label>
                        {isEditing ? (
                          <Select
                            value={leadData.lable || ''}
                            onValueChange={(value) => handleInputChange('lable', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select label" />
                            </SelectTrigger>
                            <SelectContent>
                              {leadLabels.map((label: any) => (
                                <SelectItem key={label.id} value={label.lable}>
                                  {label.lable}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={leadData.lable || ''}
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Contract Type</Label>
                        {isEditing ? (
                          <Select
                            value={leadData.contract_type || ''}
                            onValueChange={(value) => handleInputChange('contract_type', value)}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select type" />
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
                            value={leadData.contract_type || ''}
                            disabled
                            className="mt-1"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Proposed ARR</Label>
                        <Input
                          type="number"
                          value={leadData.proposed_arr || ''}
                          onChange={(e) => handleInputChange('proposed_arr', Number(e.target.value))}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Contract Value</Label>
                        <Input
                          type="number"
                          value={leadData.contract_value || ''}
                          onChange={(e) => handleInputChange('contract_value', Number(e.target.value))}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Money in Bank</Label>
                        <Input
                          type="number"
                          value={leadData.mib || ''}
                          onChange={(e) => handleInputChange('mib', Number(e.target.value))}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Duration (Years)</Label>
                        <Input
                          type="number"
                          value={leadData.contract_duration || ''}
                          onChange={(e) => handleInputChange('contract_duration', Number(e.target.value))}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Timezone</Label>
                      {isEditing ? (
                        <Select
                          value={leadData.timezone || ''}
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
                          value={leadData.timezone || ''}
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
                  {isLeadInOnboarding && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-orange-50 rounded-lg px-4 py-2">
                        <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                        <div>
                          <h3 className="text-orange-800 text-sm font-medium">Account Locked</h3>
                          <p className="text-orange-700 text-xs">
                            Transferred to onboarding. Modifications disabled.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-2">
                {/* Custom Professional Tab Design */}
                <div className="border-b border-gray-200 mb-6">
                  <div className="flex items-center space-x-8">
                    <button
                      onClick={() => setActiveTab('email')}
                      className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${activeTab === 'email'
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
                      className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${activeTab === 'notes'
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
                      className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${activeTab === 'tasks'
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
                      className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${activeTab === 'documents'
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
                      className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${activeTab === 'history'
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
                  </div>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                  {activeTab === 'email' && (
                    <AccountEmail
                      accountEmail={leadData.email || ''}
                      accountOwner={leadData?.account_owner_id || ''}
                      isLeadInOnboarding={isLeadInOnboarding}
                    />
                  )}

                  {activeTab === 'notes' && (
                    <SalesNotesTab
                      accountId={id}
                      user_id={loginResponse?.id || ''}
                      isLeadInOnboarding={isLeadInOnboarding}
                    />
                  )}

                  {activeTab === 'tasks' && (
                    <SalesTasksTab
                      accountId={id}
                      companyId={loginResponse?.company_id || ''}
                      user_id={loginResponse?.id || ''}
                      isLeadInOnboarding={isLeadInOnboarding}
                    />
                  )}

                  {activeTab === 'documents' && (
                    <SalesDocumnets
                      accountId={id}
                      isLeadInOnboarding={isLeadInOnboarding}
                    />
                  )}

                  {activeTab === 'history' && (
                    <SalesAccountHistory
                      accountId={id}
                      userId={loginResponse?.id || ''}
                      isLeadInOnboarding={isLeadInOnboarding}
                    />
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

export default SalesDetailsPage;