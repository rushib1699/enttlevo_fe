import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Mail,
  Phone,
  Plug,
  CheckCircle,
  Settings,
  Lock,
  ExternalLink
} from 'lucide-react';

import { getAllIntegrations, addIntegrationAuth } from '@/api';
import { COMPANY_INTEGRATION_SESSION_KEY } from '@/constants';
import { useApplicationContext } from '@/hooks/useApplicationContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface IntegrationCard {
  id: string;
  integration: string;
  created_at: string;
  updated_at: string;
  is_active: number;
  is_deleted: number;
  integration_id?: number;
}

interface CompanyIntegration {
  integration: string;
  is_active: string;
}

const formSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  apiKey: z.string().min(8, 'API key must be at least 8 characters'),
});

const IntegrationLibraryPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationCard[]>([]);
  const [activeIntegrations, setActiveIntegrations] = useState<IntegrationCard[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationCard | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginResponse } = useApplicationContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      apiKey: '',
    },
  });

  const getIntegrationIcon = (integration: string) => {
    switch (integration.toLowerCase()) {
      case 'mailerlite':
        return <Mail className="w-6 h-6" />;
      case 'callhippo':
        return <Phone className="w-6 h-6" />;
      default:
        return <Plug className="w-6 h-6" />;
    }
  };

  const getIntegrationColor = (integration: string) => {
    switch (integration.toLowerCase()) {
      case 'mailerlite':
        return {
          icon: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200'
        };
      case 'callhippo':
        return {
          icon: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200'
        };
      default:
        return {
          icon: 'text-purple-600',
          bg: 'bg-purple-50',
          border: 'border-purple-200'
        };
    }
  };

  const getIntegrationDescription = (integration: string) => {
    switch (integration.toLowerCase()) {
      case 'mailerlite':
        return 'Email marketing automation platform for creating and managing email campaigns';
      case 'callhippo':
        return 'Cloud-based phone system for making and managing business calls';
      default:
        return 'Integration with external service';
    }
  };

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const integrations = await getAllIntegrations();
        setIntegrations(integrations);

        const companyIntegrations: CompanyIntegration[] = JSON.parse(
          sessionStorage.getItem(COMPANY_INTEGRATION_SESSION_KEY) || '[]'
        );

        const active = integrations.filter((integration: IntegrationCard) =>
          companyIntegrations.some((ci) => ci.integration === integration.integration)
        );

        setActiveIntegrations(active);
      } catch (error) {
        console.error('Error fetching integrations:', error);
        toast.error('Failed to fetch integrations');
      }
    };
    fetchIntegrations();
  }, []);

  const isIntegrationActive = (integration: IntegrationCard) => {
    return activeIntegrations.some(active => active.id === integration.id);
  };

  const handleConnect = (integration: IntegrationCard) => {
    setSelectedIntegration(integration);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedIntegration(null);
    form.reset();
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      if (!loginResponse?.company_id || !loginResponse?.id || !selectedIntegration?.integration_id) {
        throw new Error('Missing required data');
      }

      const payload = {
        company_id: loginResponse.company_id,
        user_id: loginResponse.id,
        integration_id: Number(selectedIntegration.integration_id),
        auth_json: {
          api: values.apiKey,
          email: values.email,
        },
      };

      await addIntegrationAuth(payload);
      toast.success('Integration configured successfully!');
      handleModalClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to configure integration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">Integration Library</h2>
          <p className="text-muted-foreground">
            Connect and manage your integrations to streamline your workflow
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeIntegrations.length}</div>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Integrations</CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => {
          const colors = getIntegrationColor(integration.integration);
          const isActive = isIntegrationActive(integration);
          
          return (
            <Card key={integration.id} className="rounded-lg">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    colors.bg
                  )}>
                    <span className={colors.icon}>
                      {getIntegrationIcon(integration.integration)}
                    </span>
                  </div>
                  <div>
                    <CardTitle>{integration.integration}</CardTitle>
                    {isActive && (
                      <div className="flex items-center mt-1 text-sm text-green-600">
                        <div className="w-2 h-2 rounded-full bg-green-600 mr-2" />
                        Connected
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {getIntegrationDescription(integration.integration)}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                {isActive ? (
                  <>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                    <Button variant="destructive" size="sm">Disconnect</Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Lock className="w-4 h-4 mr-2" />
                      Not Connected
                    </div>
                    <Button size="sm" onClick={() => handleConnect(integration)}>
                      Connect
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {selectedIntegration?.integration}</DialogTitle>
            <DialogDescription>
              Enter your credentials to connect with {selectedIntegration?.integration}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your API key" {...field} />
                    </FormControl>
                    <FormDescription>
                      Find your API key in your {selectedIntegration?.integration} dashboard
                      {selectedIntegration?.integration === 'mailerlite' && (
                        <a
                          href="https://app.mailerlite.com/integrations/api/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 text-primary hover:underline"
                        >
                          Get API Key
                          <ExternalLink className="w-3 h-3 ml-1 inline" />
                        </a>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleModalClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Configuring...' : 'Configure'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IntegrationLibraryPage;