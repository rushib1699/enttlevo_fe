import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useApplicationContext } from '@/hooks/useApplicationContext';
import { getScheduledCampaignsReport } from '@/api';
import CampaignReportChart from '@/components/Graphs/CampaignReportChart/CampaignReportChart';


interface CampaignSummary {
  campaign_id: string;
  campaign_name: string;
  campaign_type: string;
  report: string | null;
  username: string;
  delivery_type: string;
}

interface CampaignReport {
  data: Array<{
    id: string;
    opens_count: number;
    clicks_count: number;
  }>;
  meta: {
    aggregations: {
      all: number;
      opened: number;
      clicked: number;
      unopened: number;
      unsubscribed: number;
      hardbounced: number;
      softbounced: number;
    }
  }
}

const CampaignReports: React.FC = () => {
  const { loginResponse } = useApplicationContext();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<CampaignReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCampaignsReport();
  }, []);

  const fetchCampaignsReport = async () => {
    try {
      setLoading(true);
      const response = await getScheduledCampaignsReport({
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
        role_id: loginResponse?.role_id || 0,
      });
      
      setCampaigns(response || []);
    } catch (error) {
      console.log(error);
      //toast.error('Failed to fetch campaign reports');
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaign(campaignId);
    const campaign = campaigns.find(c => c.campaign_id === campaignId);
    if (campaign?.report) {
      setSelectedReport(JSON.parse(campaign.report));
    } else {
      setSelectedReport(null);
    }
  };

  const calculateMetrics = (report: CampaignReport) => {
    const { aggregations } = report.meta;
    return {
      total_sent: aggregations.all,
      open_rate: (aggregations.opened / aggregations.all) * 100,
      click_rate: (aggregations.clicked / aggregations.all) * 100,
      bounce_rate: ((aggregations.hardbounced + aggregations.softbounced) / aggregations.all) * 100,
      unsubscribe_rate: (aggregations.unsubscribed / aggregations.all) * 100
    };
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Campaign Reports</h2>
        <p className="text-gray-600">View detailed metrics for your email campaigns</p>
      </div>

      <Card className='rounded-lg'>
        <CardHeader>
          <CardTitle>Campaign Analysis</CardTitle>
          <CardDescription>Select a campaign to view performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full max-w-sm">
              <Select value={selectedCampaign} onValueChange={handleCampaignSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                      {campaign.campaign_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedReport && (
              <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const metrics = calculateMetrics(selectedReport);
                  return (
                    <>
                      <Card className='rounded-lg'>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{metrics.total_sent}</div>
                        </CardContent>
                      </Card>

                      <Card className='rounded-lg'>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{formatPercentage(metrics.open_rate)}</div>
                        </CardContent>
                      </Card>

                      <Card className='rounded-lg'>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{formatPercentage(metrics.click_rate)}</div>
                        </CardContent>
                      </Card>

                      <Card className='rounded-lg'>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{formatPercentage(metrics.bounce_rate)}</div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>
              <div className="">
                <CampaignReportChart data={selectedReport.data} />
              </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className='rounded-lg'>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.campaign_id}>
                    <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                    <TableCell>{campaign.campaign_type}</TableCell>
                    <TableCell>{campaign.username}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCampaignSelect(campaign.campaign_id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {campaigns.length === 0 && !loading && (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-gray-600">Create your first campaign to see reports here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignReports;