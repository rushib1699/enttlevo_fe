import React, { useEffect, useState } from 'react'
import { useApplicationContext } from "@/hooks/useApplicationContext";
import CustomEmailPage from './CustomEmailPage';
import GoogleEmailPage from './GoogleEmailPage';
import ZohoEmailPage from './ZohoEmailPage';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail } from "lucide-react";
import { getUserPrefences } from '@/api';
import { Button } from "@/components/ui/button";

const EmailPage: React.FC = () => {
  const { loginResponse } = useApplicationContext();
  const [selectedEmailType, setSelectedEmailType] = useState<string | null>(null);
  const navigate = useNavigate();


  const fetchEmailPreferences = async () => {
    try {
      const userPref = await getUserPrefences({
        user_id: loginResponse?.id || 0
      });

      if (userPref?.preference) {
        // Parse the preferences
        const preferences = JSON.parse(userPref.preference);
        
        // Get email preferences - handle nested structure
        const emailType = preferences?.email_preferences?.columnVisibilityModel
          ?.email_preferences?.columnVisibilityModel?.primary_email_type;

        if (emailType) {
          // Convert email type to interface type
          const typeMap: { [key: string]: string } = {
            'google_email': 'google',
            'zoho_email': 'zoho',
            'custom_email': 'custom'
          };
          
          setSelectedEmailType(typeMap[emailType] || 'custom');
        }
      }
    } catch (error) {
      console.error('Failed to load email preferences:', error);
    }
  };

  useEffect(() => {
    if (loginResponse?.id) {
      fetchEmailPreferences();
    }
  }, [loginResponse?.id]);


  const renderEmailPage = () => {
    if (!selectedEmailType) {
      return (
        <div className="flex flex-col items-center justify-center p-4">
          <Alert className="mb-4">
            <Mail className="h-4 w-4" />
            <AlertDescription>
              To access the email interface, you need to configure your primary email address. Please visit your profile settings to set up your preferred email provider.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/settings/profile')} variant="outline">
            Configure Email Settings
          </Button>
        </div>
      );
    }

    switch (selectedEmailType) {
      case 'google':
        return <GoogleEmailPage />;
      case 'zoho':
        return <ZohoEmailPage />;
      case 'custom':
        return <CustomEmailPage />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
            <Alert className="max-w-lg mb-4">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Invalid email type configuration. Please update your email preferences in settings.
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate('/settings/profile')} variant="outline">
              Go to Settings
            </Button>
          </div>
        );
    }
  };

  return (
    <div>
      {renderEmailPage()}
    </div>
  );
};

export default EmailPage;