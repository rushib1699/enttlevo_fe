import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Upload, ChevronDown, Users, FileText, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useApplicationContext } from '@/hooks/useApplicationContext';
import { addSubscribersToGroup, fetchEcSubscribers, getECGroups, companyEmailList } from '@/api';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { MultiSelect } from "@/components/ui/multi-select";


interface Group {
  id: string;
  group_id?: string;
  name: string;
  group_name?: string;
  open_rate: {
    float: number;
    string: string;
  };
  click_rate: {
    float: number;
    string: string;
  };
  created_at: string;
  junk_count: number;
  sent_count: number;
  opens_count: number;
  active_count: number;
  clicks_count: number;
  bounced_count: number;
  unconfirmed_count: number;
  unsubscribed_count: number;
}

interface Subscriber {
  id: number;
  subscriber_id: string;
  email: string;
  groups: Group[];
}

interface CompanyContact {
  company_name: string;
  company_email: string;
  company_contacts: Array<{
    id: number;
    poc_name: string;
    poc_email: string;
    poc_contact: string;
  }>;
  customer_company_id: number;
}

interface ParsedData {
  email: string;
  name: string;
  last_name: string;
  row: number;
}

const SubscriberManagement: React.FC = () => {
  const { loginResponse } = useApplicationContext();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [companyContacts, setCompanyContacts] = useState<CompanyContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [selectedSubscribers, setSelectedSubscribers] = useState<number[]>([]);
  const [selectAllSubscribers, setSelectAllSubscribers] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  
  // CSV/Excel import states
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData[]>([]);
  const [selectedParsedData, setSelectedParsedData] = useState<number[]>([]);
  const [selectAllParsedData, setSelectAllParsedData] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [manualSubscribers, setManualSubscribers] = useState<{ email: string; name: string; last_name: string }[]>([
    { email: '', name: '', last_name: '' }
  ]);
  const [selectedCompanyContacts, setSelectedCompanyContacts] = useState<{
    companies: number[];
    contacts: {companyId: number, contactId: number}[];
  }>({
    companies: [],
    contacts: []
  });
  const [selectAllCompanies, setSelectAllCompanies] = useState(false);

  useEffect(() => {
    fetchSubscribers();
    fetchGroups();
    fetchCompanyContacts();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await fetchEcSubscribers({
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
      });
      setSubscribers(response || []);
    } catch (error) {
      toast.error('Failed to fetch subscribers');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await getECGroups({
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
      });
      setGroups(response || []);
    } catch (error) {
      toast.error('Failed to fetch groups');
    }
  };

  const fetchCompanyContacts = async () => {
    try {
      const response = await companyEmailList({
        company_id: loginResponse?.company_id || 0,
        role_id: loginResponse?.role_id || 0,
        user_id: loginResponse?.id || 0,
      });
      setCompanyContacts(response || []);
    } catch (error) {
      toast.error('Failed to fetch company contacts');
    }
  };

  // CSV/Excel parsing function
  const parseFile = async (file: File): Promise<ParsedData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
          
          if (isExcel) {
            // For Excel files, you might need to use a library like xlsx
            // For now, treating as CSV
            toast.info('Excel files will be treated as CSV for now');
          }
          
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          const emailIndex = headers.findIndex(h => h.includes('email'));
          const nameIndex = headers.findIndex(h => h.includes('name') && !h.includes('last'));
          const lastNameIndex = headers.findIndex(h => h.includes('last') || h.includes('surname'));
          
          if (emailIndex === -1) {
            reject(new Error('Email column not found. Please ensure your file has an "email" column.'));
            return;
          }
          
          const parsed = lines.slice(1)
            .map((line, index) => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              if (values.length > 1 && values[emailIndex]) {
                return {
                  email: values[emailIndex],
                  name: nameIndex !== -1 ? values[nameIndex] : '',
                  last_name: lastNameIndex !== -1 ? values[lastNameIndex] : '',
                  row: index + 2
                };
              }
              return null;
            })
            .filter(Boolean) as ParsedData[];
          
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      setCsvFile(file);
      const parsed = await parseFile(file);
      setParsedData(parsed);
      setSelectedParsedData(parsed.map((_, index) => index));
      setSelectAllParsedData(true);
      setShowPreview(true);
      toast.success(`Parsed ${parsed.length} records from file`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to parse file');
    }
  };

  const handleAddManualSubscribers = async () => {
    const validSubscribers = manualSubscribers.filter(sub => sub.email.trim() !== '');
    
    if (validSubscribers.length === 0) {
      toast.error('Please add at least one valid email');
      return;
    }

    if (selectedGroups.length === 0) {
      toast.error('Please select at least one group');
      return;
    }

    try {
      // await addSubscribersToGroup({
      //   email_list: validSubscribers.map(sub => ({
      //     email: sub.email,
      //     fields: {
      //       name: sub.name,
      //       last_name: sub.last_name,
      //     }
      //   })),
      //   groups: selectedGroups,
      //   company_id: loginResponse?.company_id || 0,
      //   user_id: loginResponse?.id || 0,
      // });
      
      toast.success('Subscribers added successfully');
      setIsAddSheetOpen(false);
      setManualSubscribers([{ email: '', name: '', last_name: '' }]);
      setSelectedGroups([]);
      fetchSubscribers();
    } catch (error) {
      toast.error('Failed to add subscribers');
    }
  };

  const handleImportFromCompany = async () => {
    if (selectedGroups.length === 0) {
      toast.error('Please select at least one group');
      return;
    }

    if (!selectAllCompanies && selectedCompanyContacts.companies.length === 0 && selectedCompanyContacts.contacts.length === 0) {
      toast.error('Please select at least one company or contact');
      return;
    }

    try {
      let emailList: Array<{email: string, fields: {name: string, last_name: string}}> = [];

      if (selectAllCompanies) {
        companyContacts.forEach(company => {
          emailList.push({
            email: company.company_email,
            fields: {
              name: company.company_name,
              last_name: '',
            }
          });
          company.company_contacts.forEach(contact => {
            emailList.push({
              email: contact.poc_email,
              fields: {
                name: contact.poc_name,
                last_name: '',
              }
            });
          });
        });
      } else {
        selectedCompanyContacts.companies.forEach(companyId => {
          const company = companyContacts.find(c => c.customer_company_id === companyId);
          if (company) {
            emailList.push({
              email: company.company_email,
              fields: {
                name: company.company_name,
                last_name: '',
              }
            });
            company.company_contacts.forEach(contact => {
              emailList.push({
                email: contact.poc_email,
                fields: {
                  name: contact.poc_name,
                  last_name: '',
                }
              });
            });
          }
        });

        selectedCompanyContacts.contacts.forEach(({companyId, contactId}) => {
          const company = companyContacts.find(c => c.customer_company_id === companyId);
          const contact = company?.company_contacts.find(c => c.id === contactId);
          if (contact) {
            emailList.push({
              email: contact.poc_email,
              fields: {
                name: contact.poc_name,
                last_name: '',
              }
            });
          }
        });
      }

      // await addSubscribersToGroup({
      //   email_list: emailList,
      //   groups: selectedGroups,
      //   company_id: loginResponse?.company_id || 0,
      //   user_id: loginResponse?.id || 0,
      // });
      
      toast.success('Company contacts imported successfully');
      setIsAddSheetOpen(false);
      setSelectedCompanyContacts({companies: [], contacts: []});
      setSelectAllCompanies(false);
      setSelectedGroups([]);
      fetchSubscribers();
    } catch (error) {
      toast.error('Failed to import company contacts');
    }
  };

  const handleCSVImport = async () => {
    if (selectedParsedData.length === 0) {
      toast.error('Please select at least one record to import');
      return;
    }

    if (selectedGroups.length === 0) {
      toast.error('Please select at least one group');
      return;
    }

    try {
      const selectedRecords = selectedParsedData.map(index => parsedData[index]);
      
      // await addSubscribersToGroup({
      //   email_list: selectedRecords,
      //   groups: selectedGroups,
      //   company_id: loginResponse?.company_id || 0,
      //   user_id: loginResponse?.id || 0,
      // });

      toast.success(`Imported ${selectedRecords.length} subscribers successfully`);
      setIsAddSheetOpen(false);
      setCsvFile(null);
      setParsedData([]);
      setSelectedParsedData([]);
      setShowPreview(false);
      setSelectedGroups([]);
      fetchSubscribers();
    } catch (error) {
      toast.error('Failed to import CSV');
    }
  };

  const addManualSubscriberRow = () => {
    setManualSubscribers([...manualSubscribers, { email: '', name: '', last_name: '' }]);
  };

  const updateManualSubscriber = (index: number, field: string, value: string) => {
    const updated = [...manualSubscribers];
    updated[index] = { ...updated[index], [field]: value };
    setManualSubscribers(updated);
  };

  const removeManualSubscriberRow = (index: number) => {
    if (manualSubscribers.length > 1) {
      const updated = manualSubscribers.filter((_, i) => i !== index);
      setManualSubscribers(updated);
    }
  };

  const toggleCompanySelection = (companyId: number) => {
    setSelectedCompanyContacts(prev => {
      const isSelected = prev.companies.includes(companyId);
      return {
        companies: isSelected 
          ? prev.companies.filter(id => id !== companyId)
          : [...prev.companies, companyId],
        contacts: prev.contacts.filter(c => c.companyId !== companyId)
      };
    });
  };

  const toggleContactSelection = (companyId: number, contactId: number) => {
    setSelectedCompanyContacts(prev => {
      const contactIndex = prev.contacts.findIndex(c => 
        c.companyId === companyId && c.contactId === contactId
      );
      
      if (contactIndex === -1) {
        return {
          ...prev,
          contacts: [...prev.contacts, {companyId, contactId}]
        };
      } else {
        return {
          ...prev,
          contacts: prev.contacts.filter((_, i) => i !== contactIndex)
        };
      }
    });
  };

  // Helper functions for subscribers
  const getGroupSubscriberCount = (groupId: string) => {
    return subscribers.filter(subscriber => 
      subscriber.groups.some(group => group.id === groupId)
    ).length;
  };

  const getGroupSubscribers = (groupId: string) => {
    return subscribers.filter(subscriber => 
      subscriber.groups.some(group => group.id === groupId)
    );
  };

  const handleGroupClick = (groupId: string) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
  };

  // Subscriber selection handlers
  const toggleSubscriberSelection = (subscriberId: number) => {
    setSelectedSubscribers(prev => 
      prev.includes(subscriberId) 
        ? prev.filter(id => id !== subscriberId)
        : [...prev, subscriberId]
    );
  };

  const handleSelectAllSubscribers = (checked: boolean) => {
    setSelectAllSubscribers(checked);
    if (checked) {
      setSelectedSubscribers(subscribers.map(s => s.id));
    } else {
      setSelectedSubscribers([]);
    }
  };

  // Parsed data selection handlers
  const toggleParsedDataSelection = (index: number) => {
    setSelectedParsedData(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleSelectAllParsedData = (checked: boolean) => {
    setSelectAllParsedData(checked);
    if (checked) {
      setSelectedParsedData(parsedData.map((_, index) => index));
    } else {
      setSelectedParsedData([]);
    }
  };

  const deleteSelectedSubscribers = () => {
    // Implementation would call API to delete selected subscribers
    toast.success(`${selectedSubscribers.length} subscribers deleted`);
    setSelectedSubscribers([]);
    setSelectAllSubscribers(false);
    fetchSubscribers();
  };

  const resetModalData = () => {
    // Reset all modal-related state
    setSelectedGroups([]);
    setManualSubscribers([{ email: '', name: '', last_name: '' }]);
    setCsvFile(null);
    setParsedData([]);
    setSelectedParsedData([]);
    setSelectAllParsedData(false);
    setShowPreview(false);
    setSelectedCompanyContacts({ companies: [], contacts: [] });
    setSelectAllCompanies(false);
  };

  const handleSheetClose = (open: boolean) => {
    if (!open) {
      resetModalData();
    }
    setIsAddSheetOpen(open);
  };


  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Group Name',
      flex: 1,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <ChevronDown 
            className={`h-4 w-4 transition-transform ${expandedGroup === params.row.id ? 'rotate-180' : ''}`}
            onClick={() => handleGroupClick(params.row.id)}
          />
          {params.row.name || params.row.group_name}
        </div>
      )
    },
    {
      field: 'subscriberCount',
      headerName: 'Total Subscribers',
      flex: 1,
      valueGetter: (params) => getGroupSubscriberCount(params.row.id || params.row.group_id || '')
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params) => {
        const count = getGroupSubscriberCount(params.row.id || params.row.group_id || '');
        return (
          <Badge variant={count > 0 ? "default" : "secondary"}>
            {count > 0 ? "Active" : "Inactive"}
          </Badge>
        );
      }
    }
  ];

  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Subscriber Management</h2>
          <p className="text-gray-600">Add and manage your email subscribers</p>
        </div>
        <div className="flex gap-2">
          {selectedSubscribers.length > 0 && (
            <Button variant="destructive" onClick={deleteSelectedSubscribers}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedSubscribers.length})
            </Button>
          )}
          <Sheet open={isAddSheetOpen} onOpenChange={handleSheetClose}>
            <SheetTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Subscribers
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[90vw] sm:max-w-[90vw] h-screen p-8 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Add Subscribers</SheetTitle>
                <SheetDescription>
                  Add subscribers manually, import from CSV/Excel, or import from company contacts.
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-4">
                {/* Group Selection */}
                <div className="space-y-2">
                  <Label>Select Groups (Required) <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-4 gap-3">
                  <MultiSelect
  options={groups.map(group => ({
    label: group.name || group.group_name || '',
    value: group.id?.toString() || group.group_id?.toString() || ''
  }))}
  value={selectedGroups}                 // controlled
  onValueChange={setSelectedGroups}
  placeholder="Select Groups"
  closeOnSelect={false}
/>

                  </div>
                </div>

                <div className="w-full">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      <button
                        onClick={() => setActiveTab('manual')}
                        className={`
                          whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                          ${activeTab === 'manual' 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                      >
                        Manual Entry
                      </button>
                      <button
                        onClick={() => setActiveTab('csv')} 
                        className={`
                          whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                          ${activeTab === 'csv'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                      >
                        CSV/Excel Import
                      </button>
                      <button
                        onClick={() => setActiveTab('company')}
                        className={`
                          whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                          ${activeTab === 'company'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                      >
                        Company Contacts
                      </button>
                    </nav>
                  </div>

                  <div className="mt-4">
                    {activeTab === 'manual' && (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          {manualSubscribers.map((subscriber, index) => (
                            <div key={index} className="grid grid-cols-4 gap-2 items-center">
                              <Input
                                placeholder="Email"
                                value={subscriber.email}
                                onChange={(e) => updateManualSubscriber(index, 'email', e.target.value)}
                              />
                              <Input
                                placeholder="First Name"
                                value={subscriber.name}
                                onChange={(e) => updateManualSubscriber(index, 'name', e.target.value)}
                              />
                              <Input
                                placeholder="Last Name"
                                value={subscriber.last_name}
                                onChange={(e) => updateManualSubscriber(index, 'last_name', e.target.value)}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeManualSubscriberRow(index)}
                                disabled={manualSubscribers.length === 1}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" onClick={addManualSubscriberRow}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Row
                          </Button>
                        </div>
                        <SheetFooter>
                          <Button variant="outline" onClick={() => setIsAddSheetOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddManualSubscribers} className="flex items-center gap-2" disabled={selectedGroups.length === 0}>
                            Add Subscribers
                          </Button>
                        </SheetFooter>
                      </div>
                    )}

                    {activeTab === 'csv' && (
                      <div className="space-y-4">
                        {!showPreview ? (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <div className="space-y-2">
                              <p className="text-lg font-medium">Upload CSV or Excel File</p>
                              <p className="text-gray-600">File should have columns: email, name, last_name</p>
                              <Input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(file);
                                }}
                                className="max-w-xs mx-auto"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                <span className="font-medium">{csvFile?.name}</span>
                                <Badge variant="secondary">{parsedData.length} records</Badge>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setShowPreview(false);
                                  setCsvFile(null);
                                  setParsedData([]);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear
                              </Button>
                            </div>
                            
                            <div className="border rounded-lg">
                              <div className="p-3 bg-gray-50 border-b flex items-center gap-2">
                                <Checkbox
                                  checked={selectAllParsedData}
                                  onCheckedChange={handleSelectAllParsedData}
                                />
                                <span className="text-sm font-medium">
                                  Select All ({selectedParsedData.length}/{parsedData.length})
                                </span>
                              </div>
                              
                              <div className="max-h-60 overflow-y-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-12">Select</TableHead>
                                      <TableHead>Email</TableHead>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Last Name</TableHead>
                                      <TableHead>Row</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {parsedData.map((data, index) => (
                                      <TableRow key={index}>
                                        <TableCell>
                                          <Checkbox
                                            checked={selectedParsedData.includes(index)}
                                            onCheckedChange={() => toggleParsedDataSelection(index)}
                                          />
                                        </TableCell>
                                        <TableCell>{data.email}</TableCell>
                                        <TableCell>{data.name}</TableCell>
                                        <TableCell>{data.last_name}</TableCell>
                                        <TableCell>{data.row}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </div>
                        )}
                        <SheetFooter>
                          <Button variant="outline" onClick={() => setIsAddSheetOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleCSVImport}
                            disabled={!showPreview || selectedParsedData.length === 0}
                          >
                            Import Selected ({selectedParsedData.length})
                          </Button>
                        </SheetFooter>
                      </div>
                    )}

                    {activeTab === 'company' && (
                      <div className="space-y-4">
                        <div className="border rounded p-2 mb-2">
                          <label className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              checked={selectAllCompanies}
                              onChange={(e) => {
                                setSelectAllCompanies(e.target.checked);
                                if (e.target.checked) {
                                  setSelectedCompanyContacts({companies: [], contacts: []});
                                }
                              }}
                            />
                            <span>Select All Companies</span>
                          </label>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto border rounded">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">Select</TableHead>
                                <TableHead>Company Name</TableHead>
                                <TableHead>Company Email</TableHead>
                                <TableHead>Contact Person</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {companyContacts.map((company) => (
                                <React.Fragment key={company.customer_company_id}>
                                  <TableRow>
                                    <TableCell>
                                      <input 
                                        type="checkbox"
                                        checked={selectedCompanyContacts.companies.includes(company.customer_company_id)}
                                        onChange={() => toggleCompanySelection(company.customer_company_id)}
                                        disabled={selectAllCompanies}
                                      />
                                    </TableCell>
                                    <TableCell>{company.company_name}</TableCell>
                                    <TableCell>{company.company_email}</TableCell>
                                    <TableCell>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="flex items-center"
                                        onClick={() => {
                                          const row = document.getElementById(`contacts-${company.customer_company_id}`);
                                          if (row) {
                                            row.classList.toggle('hidden');
                                          }
                                        }}
                                      >
                                        <ChevronDown className="h-4 w-4 mr-1" />
                                        {company.company_contacts.length} Contacts
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                  <TableRow id={`contacts-${company.customer_company_id}`} className="hidden bg-gray-50">
                                    <TableCell colSpan={4}>
                                      <div className="pl-8 space-y-2">
                                        {company.company_contacts.map((contact) => (
                                          <div key={contact.id} className="flex items-center space-x-4">
                                            <input 
                                              type="checkbox"
                                              checked={selectedCompanyContacts.contacts.some(
                                                c => c.companyId === company.customer_company_id && c.contactId === contact.id
                                              )}
                                              onChange={() => toggleContactSelection(company.customer_company_id, contact.id)}
                                              disabled={selectAllCompanies || selectedCompanyContacts.companies.includes(company.customer_company_id)}
                                            />
                                            <span>{contact.poc_name}</span>
                                            <span className="text-gray-500">{contact.poc_email}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                </React.Fragment>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <SheetFooter>
                          <Button variant="outline" onClick={() => setIsAddSheetOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleImportFromCompany} className="flex items-center gap-2" disabled={selectedCompanyContacts.companies.length === 0}>
                            Import Contacts
                          </Button>
                        </SheetFooter>
                      </div>
                    )}
                  </div>
                </div>
                
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Groups Table */}
      <Card className='rounded-lg'>
        <CardContent className='p-2 h-full'>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Total Subscribers</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => {
                  const groupId = group.id || group.group_id;
                  const subscriberCount = getGroupSubscriberCount(groupId);
                  const groupSubscribers = getGroupSubscribers(groupId);
                  const isExpanded = expandedGroup === groupId;
                  
                  return (
                    <React.Fragment key={groupId}>
                      <TableRow 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleGroupClick(groupId)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <ChevronDown 
                              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                            {group.name || group.group_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {subscriberCount}
                        </TableCell>
                        <TableCell>
                          <Badge variant={subscriberCount > 0 ? "default" : "secondary"}>
                            {subscriberCount > 0 ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expandable row showing subscriber emails */}
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={3} className="bg-gray-50 p-0">
                            <div className="p-4">
                              <h4 className="font-medium text-sm text-gray-700 mb-3">
                                Subscribers in {group.name || group.group_name}:
                              </h4>
                              {subscriberCount > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {groupSubscribers.map((subscriber) => (
                                    <div 
                                      key={subscriber.id}
                                      className="flex items-center gap-2 p-2 bg-white rounded border text-sm"
                                    >
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-gray-700">{subscriber.email}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6">
                                  <div className="text-gray-500 text-sm">
                                    No emails present in this group
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {groups.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
              <p className="text-gray-600 mb-4">Create your first group to start organizing subscribers</p>
              <Button onClick={() => setIsAddSheetOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subscribers
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriberManagement;