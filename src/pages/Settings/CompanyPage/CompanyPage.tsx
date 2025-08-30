import { useCallback, useEffect, useState } from 'react';
import { getCbdCompanyDetails } from '@/api';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CompanyDetails } from '@/types';
import { Building2, Mail, MapPin, Phone, Settings, Link } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useApplicationContext } from '@/hooks/useApplicationContext';
import CompanyIntegrations from '../Integrations/CompanyIntegrations';

const CompanyPage = () => {
  const { loginResponse } = useApplicationContext();
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchCompanyDetails = useCallback(async () => {
    try {
      const response = await getCbdCompanyDetails(
        { company_id: loginResponse?.company_id || 0 }
      );
      setCompanyDetails(response);
    } catch (error) {
      toast.error('Failed to fetch company details');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanyDetails();
  }, [fetchCompanyDetails]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-4">
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <Settings className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
        </div>
      </div>

      <div className="w-full">
        <div className="border-b border-gray-200 mb-6">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'overview'
                  ? 'text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Company Overview
              {activeTab === 'overview' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('integrations')}
              className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'integrations'
                  ? 'text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Link className="w-4 h-4" />
              Integrations
              {activeTab === 'integrations' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
              )}
            </button>
          </div>
        </div>

        <div className="mt-2">
          {activeTab === 'overview' && (
            <Card className="overflow-hidden rounded-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                  Company Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-4">Basic Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Company Name</p>
                          <p className="font-medium">{companyDetails?.name || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{companyDetails?.support_email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{companyDetails?.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-4">Address</h3>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium">
                            {companyDetails?.address?.street || 'N/A'}<br />
                            {companyDetails?.address?.city && `${companyDetails.address.city}, `}
                            {companyDetails?.address?.state && `${companyDetails.address.state} `}
                            {companyDetails?.address?.zip || ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-4">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Industry</p>
                      <p className="font-medium">{companyDetails?.industry || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Company ID</p>
                      <p className="font-medium">{companyDetails?.id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created At</p>
                      <p className="font-medium">{new Date(companyDetails?.created_at || '').toLocaleDateString() || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'integrations' && (
            <CompanyIntegrations />
          )}
        </div>
      </div>
    </div>
  );
}

export default CompanyPage