import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Users, FileText, BarChart3 } from 'lucide-react';
import GroupManagement from './EmailCampaignTab/GroupManagement';
import SubscriberManagement from './EmailCampaignTab/SubscriberManagement';
import TemplateManagement from './EmailCampaignTab/TemplateManagement';
import CampaignCreation from './EmailCampaignTab/CampaignCreation';
import CampaignReports from './EmailCampaignTab/CampaignReports';
import { COMPANY_INTEGRATION_SESSION_KEY } from '@/constants';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const EmailCampaignsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('groups');
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const navigate = useNavigate();

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup any lingering states when component unmounts
      setActiveTab('groups');
      setIsTabSwitching(false);
    };
  }, []);

  const handleTabChange = (tabId: string) => {
    if (isTabSwitching) return; // Prevent rapid tab switching
    setIsTabSwitching(true);
    setActiveTab(tabId);
    // Add small delay to prevent rapid switching
    setTimeout(() => {
      setIsTabSwitching(false);
    }, 100);
  };

  const sidebarItems = [
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'subscribers', label: 'Subscribers', icon: Users },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'campaigns', label: 'Campaigns', icon: Mail },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'groups':
        return <GroupManagement />;
      case 'subscribers':
        return <SubscriberManagement />;
      case 'templates':
        return <TemplateManagement />;
      case 'campaigns':
        return <CampaignCreation />;
      case 'reports':
        return <CampaignReports />;
      default:
        return null;
    }
  };

  const companyIntegrations = JSON.parse(sessionStorage.getItem(COMPANY_INTEGRATION_SESSION_KEY) || '[]');
  const hasMailerliteIntegration = companyIntegrations.some(
    (integration: { integration: string; is_active: string }) =>
      integration.integration.toLowerCase() === 'mailerlite' &&
      integration.is_active === 'Yes'
  );

  if (!hasMailerliteIntegration) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <div className="w-full max-w-lg rounded-lg">
          <CardContent className="p-8 text-center">
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-full inline-block">
                <Mail size={48} className="text-blue-500" />
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">Mailerlite Integration Not Configured</h3>
                <p className="text-gray-600 mb-6">
                  You haven't configured your Mailerlite integration yet. Connect your Mailerlite account to create and manage email campaigns directly from the platform.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="font-semibold mb-2">Benefits of Mailerlite Integration:</p>
                <ul className="text-left text-gray-600 space-y-1">
                  <li>• Create and manage email campaigns</li>
                  <li>• Track subscriber engagement</li>
                  <li>• Design beautiful email templates</li>
                  <li>• Access detailed campaign analytics</li>
                  <li>• Automate your email marketing</li>
                </ul>
              </div>

              <Button
                onClick={() => navigate('/settings/company')}
                className="w-full"
              >
                Configure Integration
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
    );
  }

  return (
    <div className="">
        {/* Main Content */}
        <Card className="shadow-lg rounded-lg min-h-[80vh]">
          <CardHeader className="border-b bg-white">
            <div className="flex items-center space-x-2">
              <Mail className="h-6 w-6 text-orange-600" />
              <CardTitle>Lead Campaign Management</CardTitle>
            </div>
            <CardDescription>
              Create and manage your email marketing campaigns with Mailerlite
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-0 h-full">
            <div className="flex">
              {/* Sidebar */}
              <div className="w-48 border-r bg-gray-50 h-full">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleTabChange(item.id);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors cursor-pointer select-none
                        ${activeTab === item.id 
                          ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-600' 
                          : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </div>
                  );
                })}
              </div>

              {/* Content Area */}
              <div className="flex-1 p-2">
                {!isTabSwitching && renderContent()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
};

export default EmailCampaignsPage;