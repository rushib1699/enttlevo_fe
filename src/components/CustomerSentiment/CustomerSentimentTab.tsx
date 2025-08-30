import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { updateHealth, getSentimentFields } from "@/api";
import { useUserPermission } from "@/context/UserPermissionContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Heart, Info, AlertTriangle, XCircle, HelpCircle } from "lucide-react";

interface CustomerSentimentProps {
  customerId: number;
  companyId: number;
  userId: number;
  initialHealthId?: number;
}

interface SentimentField {
  id: number;
  health: string;
  is_active: number;
}

const CustomerSentimentTab: React.FC<CustomerSentimentProps> = ({ 
  customerId, 
  companyId, 
  userId, 
  initialHealthId 
}) => {
  const [selectedSentiment, setSelectedSentiment] = useState<number>(initialHealthId || 0);
  const [sentiments, setSentiments] = useState<SentimentField[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { hasAccess } = useUserPermission();

  const hasWritePermission = hasAccess('write');
  const isSuperAdmin = hasAccess("superadmin");

  useEffect(() => {
    const fetchSentiments = async () => {
      try {
        setLoading(true);
        const data = await getSentimentFields({ company_id: companyId, user_id: userId });
        setSentiments(data.filter(sentiment => sentiment.is_active === 1));
      } catch (error) {
        console.error("Failed to fetch sentiments:", error);
        toast.error("Failed to load sentiments");
      } finally {
        setLoading(false);
      }
    };
    fetchSentiments();
  }, [companyId, userId]);

  useEffect(() => {
    if (initialHealthId) {
      setSelectedSentiment(initialHealthId);
    }
  }, [initialHealthId]);

  const handleClick = async (sentiment: number) => {
    // Check for write or superadmin permission
    if (!(hasWritePermission || isSuperAdmin)) {
      toast.error("You do not have permission to update sentiment.");
      return;
    }

    if (updating) return; // Prevent multiple clicks

    setUpdating(true);
    const previousSentiment = selectedSentiment;
    setSelectedSentiment(sentiment); // Optimistic update

    try {
      await updateHealth({ 
        customer_company_id: Number(customerId), 
        health_id: sentiment
      });
      toast.success("Customer sentiment updated successfully!");
    } catch (error) {
      console.error("Failed to update sentiment:", error);
      setSelectedSentiment(previousSentiment); // Revert on error
      toast.error("Failed to update sentiment.");
    } finally {
      setUpdating(false);
    }
  };

  const getColorForCondition = (health: string): string => {
    const colorMap: Record<string, string> = {
      'Good': 'bg-green-500 hover:bg-green-600',
      'Average': 'bg-blue-500 hover:bg-blue-600',
      'Below Average': 'bg-yellow-500 hover:bg-yellow-600',
      'Poor': 'bg-red-500 hover:bg-red-600',
      'Dropped': 'bg-red-600 hover:bg-red-700',
      'Unknown': 'bg-gray-500 hover:bg-gray-600'
    };
    return colorMap[health] || 'bg-gray-500 hover:bg-gray-600';
  };

  const getIconForCondition = (health: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Good': <Heart className="h-5 w-5" />,
      'Average': <Info className="h-5 w-5" />,
      'Below Average': <AlertTriangle className="h-5 w-5" />,
      'Poor': <XCircle className="h-5 w-5" />,
      'Dropped': <XCircle className="h-5 w-5" />,
      'Unknown': <HelpCircle className="h-5 w-5" />
    };
    return iconMap[health] || <HelpCircle className="h-5 w-5" />;
  };

  const getSelectedSentimentName = () => {
    const selected = sentiments.find(s => s.id === selectedSentiment);
    return selected?.health || 'Not selected';
  };

  if (loading) {
    return (
      <Card className="rounded-lg">
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading sentiment options...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sentiments.length) {
    return (
      <Card className="rounded-lg">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sentiment Options</h3>
            <p className="text-gray-600">No customer sentiment options are currently available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Customer Sentiment</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Select the current health status of this customer
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Current: {getSelectedSentimentName()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!(hasWritePermission || isSuperAdmin) && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You do not have permission to update customer sentiment.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {sentiments.map((sentiment) => (
            <div
              key={sentiment.id}
              className={`
                relative flex flex-col items-center justify-center p-4 rounded-xl cursor-pointer 
                transition-all duration-200 transform hover:scale-105 hover:shadow-lg
                ${getColorForCondition(sentiment.health)}
                ${selectedSentiment === sentiment.id 
                  ? 'ring-4 ring-white shadow-xl scale-105' 
                  : 'shadow-md'
                }
                ${!(hasWritePermission || isSuperAdmin) 
                  ? 'cursor-not-allowed opacity-70' 
                  : ''
                }
                ${updating ? 'pointer-events-none' : ''}
              `}
              onClick={() => handleClick(sentiment.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick(sentiment.id);
                }
              }}
            >
              {/* Selection indicator */}
              {selectedSentiment === sentiment.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              )}
              
              {/* Icon */}
              <div className="text-white mb-2">
                {getIconForCondition(sentiment.health)}
              </div>
              
              {/* Text */}
              <span className="text-white text-sm font-medium text-center leading-tight">
                {sentiment.health.split(' ').map((word, index, array) => (
                  <span key={index} className="block">
                    {word}
                  </span>
                ))}
              </span>
              
              {/* Loading overlay */}
              {updating && selectedSentiment === sentiment.id && (
                <div className="absolute inset-0 bg-black bg-opacity-30 rounded-xl flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-sm text-gray-500 text-center">
          Click on a sentiment to update the customer's health status
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerSentimentTab;