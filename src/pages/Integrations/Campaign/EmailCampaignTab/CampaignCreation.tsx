import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Mail, Clock, Send, MoreVertical, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useApplicationContext } from '@/hooks/useApplicationContext';
import { createEmailCampaign, scheduleCampaignDelivery, fetchEcCampaigns, getECGroups, getActiveTemplates } from '@/api';

interface Campaign {
  id: string;
  campaign_id: string;
  campaign_name: string;
  campaign_type: string;
}

interface Group {
  group_id: string;
  group_name: string;
  is_active: number;
  is_deleted: number;
  created_by: string;
}

interface Template {
  id: number;
  template_name: string;
  template: string;
  company_basic_details_id: number;
  created_by: string;
  updated_by: string;
}

const CampaignCreation: React.FC = () => {
  const { loginResponse } = useApplicationContext();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isScheduleSheetOpen, setIsScheduleSheetOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  // Campaign form state
  const [campaignName, setCampaignName] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailFromName, setEmailFromName] = useState('');
  const [emailFromEmail, setEmailFromEmail] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [scheduleTime, setScheduleTime] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchCampaigns(),
      fetchGroups(),
      fetchTemplates()
    ]);
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await fetchEcCampaigns({
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
      });
      setCampaigns(response || []);
    } catch (error) {
      console.log(error);
      //toast.error('Failed to fetch campaigns');
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
      console.log(error);
      //toast.error('Failed to fetch groups');
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await getActiveTemplates({
        company_id: loginResponse?.company_id || 0,
      });
      setTemplates(response || []);
    } catch (error) {
      toast.error('Failed to fetch templates');
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id.toString() === templateId);
    if (template) {
      setEmailContent(template.template);
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }

    if (!emailSubject.trim()) {
      toast.error('Please enter an email subject');
      return;
    }

    if (!emailContent.trim()) {
      toast.error('Please enter email content');
      return;
    }

    if (selectedGroups.length === 0) {
      toast.error('Please select at least one group');
      return;
    }

    try {
      const campaignPayload = {
        type: 'regular',
        emails: [{
          subject: emailSubject,
          from_name: emailFromName,
          content: emailContent,
          from: emailFromEmail,
        }],
        name: campaignName,
        groups: selectedGroups,
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
      };

      await createEmailCampaign(campaignPayload);
      toast.success('Campaign created successfully');
      resetForm();
      setIsCreateSheetOpen(false);
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to create campaign');
    }
  };

  const handleScheduleCampaign = async (type: 'instant' | 'scheduled') => {
    try {
      if (type === 'scheduled' && scheduleDate && scheduleTime) {
        const [hours, minutes] = scheduleTime.split(':');
        await scheduleCampaignDelivery({
          campaign_id: selectedCampaignId,
          company_id: loginResponse?.company_id || 0,
          delivery: 'scheduled',
          user_id: loginResponse?.id || 0,
          schedule: {
            date: format(scheduleDate, 'yyyy-MM-dd'),
            hours,
            minutes,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        });
      } else {
        await scheduleCampaignDelivery({
          campaign_id: selectedCampaignId,
          company_id: loginResponse?.company_id || 0,
          delivery: 'instant',
          user_id: loginResponse?.id || 0,
        });
      }

      toast.success('Campaign scheduled successfully');
      setIsScheduleSheetOpen(false);
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to schedule campaign');
    }
  };

  const resetForm = () => {
    setCampaignName('');
    setSelectedGroups([]);
    setSelectedTemplate('');
    setEmailSubject('');
    setEmailFromName('');
    setEmailFromEmail('');
    setEmailContent('');
    setScheduleDate(undefined);
    setScheduleTime('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Campaign Creation</h2>
          <p className="text-gray-600">Create and manage your email campaigns</p>
        </div>
        <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[90vw] sm:max-w-[80vw] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Create New Campaign</SheetTitle>
              <SheetDescription>
                Set up your email campaign with content and recipients.
              </SheetDescription>
            </SheetHeader>
            
            <div className="grid grid-cols-2 gap-6 mt-6">
              {/* Left Column - Campaign Inputs */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaignName">Campaign Name</Label>
                    <Input
                      id="campaignName"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="Enter campaign name..."
                    />
                  </div>
                
                  <div className="space-y-2">
                    <Label htmlFor="emailSubject">Subject Line</Label>
                    <Input
                      id="emailSubject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Enter email subject..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Use Template</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.template_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Groups <span className="text-red-500">* (Required)</span></Label>
                    <p className="text-xs text-gray-500">Select at least one group to create a campaign</p>
                    <div className="grid grid-cols-2 gap-2">
                      {groups.map((group) => (
                        <button
                          key={group.group_id}
                          className={`
                            flex items-center justify-between p-3 rounded-lg border transition-colors
                            ${selectedGroups.includes(group.group_id) 
                              ? 'bg-primary text-white border-primary hover:bg-primary/90' 
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}
                          `}
                          onClick={() => {
                            setSelectedGroups(prev => 
                              prev.includes(group.group_id) 
                                ? prev.filter(id => id !== group.group_id)
                                : [...prev, group.group_id]
                            );
                          }}
                        >
                          <span className="text-sm">{group.group_name}</span>
                          {selectedGroups.includes(group.group_id) && (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Template Preview */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Template Preview</h3>
                {emailContent ? (
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: emailContent }} />
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    Please select a template to preview
                  </div>
                )}
              </div>
            </div>

            <SheetFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsCreateSheetOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCampaign} disabled={selectedGroups.length === 0}>
                Create Campaign
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Schedule Sheet */}
        <Sheet open={isScheduleSheetOpen} onOpenChange={setIsScheduleSheetOpen}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Schedule Campaign</SheetTitle>
              <SheetDescription>
                Choose when to send your campaign
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-4 mt-6">
              <Button 
                className="w-full" 
                onClick={() => handleScheduleCampaign('instant')}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Immediately
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Schedule Date</Label>
                <Input
                  type="date"
                  value={scheduleDate ? format(scheduleDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setScheduleDate(e.target.value ? new Date(e.target.value) : undefined)}
                  placeholder="Pick a date"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Schedule Time</Label>
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>

              <Button 
                className="w-full"
                onClick={() => handleScheduleCampaign('scheduled')}
                disabled={!scheduleDate || !scheduleTime}
              >
                <Clock className="h-4 w-4 mr-2" />
                Schedule for Later
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Campaigns Table */}
      <Card className='rounded-lg'>
        <CardContent className='p-2'>
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
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{campaign.campaign_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedCampaignId(campaign.id);
                          setIsScheduleSheetOpen(true);
                        }}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {campaigns.length === 0 && !loading && (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-gray-600 mb-4">Create your first email campaign to get started</p>
              <Button onClick={() => setIsCreateSheetOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignCreation;