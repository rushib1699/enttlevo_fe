import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Edit,
  Plus,
  Trash,
  Info,
  Clock,
  GitCompare,
  History,
  Loader2
} from "lucide-react";
import { format } from 'date-fns';
import { getLogsByLeadId } from '@/api';

interface AccountHistoryData {
  id: number;
  table_name: string;
  record_id: number;
  operation: string;
  changed_by: number;
  changed_at: string;
  identifying_data: string;
  before_data: string | null;
  after_data: string;
  lead_id: number;
}

interface AccountHistoryProps {
  accountId: number;
  userId: number;
}

const SalesAccountHistory: React.FC<AccountHistoryProps> = ({ accountId, userId }) => {
  
  const [logs, setLogs] = useState<AccountHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLogsByLeadId({ lead_id: Number(accountId), user_id: Number(userId) });
      setLogs(response);
    } catch (error) {
      console.error('Error fetching history:', error);
      setError('Failed to load account history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [accountId, userId]);

  // Helper function to get operation color and icon
  const getOperationDetails = (operation: string) => {
    switch (operation.toLowerCase()) {
      case 'update':
        return { color: 'blue', icon: <Edit className="h-4 w-4" />, label: 'Updated' };
      case 'insert':
      case 'create':
        return { color: 'green', icon: <Plus className="h-4 w-4" />, label: 'Created' };
      case 'delete':
        return { color: 'red', icon: <Trash className="h-4 w-4" />, label: 'Deleted' };
      default:
        return { color: 'default', icon: <Info className="h-4 w-4" />, label: operation };
    }
  };

  // Helper function to parse JSON safely
  const parseJSON = (jsonString: string | null) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      return null;
    }
  };

  // Helper function to get changed fields
  const getChangedFields = (beforeData: string | null, afterData: string) => {
    const before = parseJSON(beforeData);
    const after = parseJSON(afterData);

    if (!after) return [];

    const changes: Array<{
      field: string;
      before: any;
      after: any;
    }> = [];

    // If this is a new record (INSERT), show all non-null after values
    if (!before) {
      Object.entries(after).forEach(([key, value]) => {
        if (value !== null &&
          key !== 'date' &&
          key !== 'created_at' &&
          key !== 'updated_at' &&
          key !== 'time' &&
          key !== 'is_active' &&
          key !== 'is_deleted' &&
          key !== 'id' &&
          key !== 'leads_id' &&
          key !== 'lead_id' &&
          key !== 'created_at' &&
          key !== 'updated_at' &&
          key !== 'created_by' &&
          key !== 'updated_by' &&
          key !== 'is_complete' &&
          key !== 'sent_to_ob' &&
          key !== 'industry_id' &&
          key !== 'lead_source' &&
          key !== 'company_basic_details_id' &&
          key !== 'company_id' &&
          key !== 'account_owner' &&
          key !== 'time' &&
          key !== 'is_active' &&
          key !== 'is_deleted'
        ) {
          changes.push({
            field: key,
            before: null,
            after: value
          });
        }
      });
      return changes;
    }

    // Compare all fields in after data
    Object.keys(after).forEach(key => {
      if (before[key] !== after[key] &&
        key !== 'date' &&
        key !== 'created_at' &&
        key !== 'updated_at' &&
        key !== 'time' &&
        key !== 'is_active' &&
        key !== 'is_deleted' &&
        key !== 'id' &&
        key !== 'leads_id' &&
        key !== 'lead_id' &&
        key !== 'created_at' &&
        key !== 'updated_at' &&
        key !== 'created_by' &&
        key !== 'updated_by' &&
        key !== 'is_complete' &&
        key !== 'sent_to_ob' &&
        key !== 'industry_id' &&
        key !== 'lead_source' &&
        key !== 'company_basic_details_id' &&
        key !== 'company_id' &&
        key !== 'account_owner' &&
        key !== 'time' &&
        key !== 'is_active' &&
        key !== 'is_deleted') {
        changes.push({
          field: key,
          before: before[key],
          after: after[key]
        });
      }
    });

    return changes;
  };

  // Helper function to format field names for display
  const formatFieldName = (fieldName: string) => {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper function to format field values
  const formatFieldValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">Not set</span>;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Create timeline items from logs
  const timelineItems = [...logs].reverse().map((log) => {
    const operationDetails = getOperationDetails(log.operation);
    const changes = getChangedFields(log.before_data, log.after_data);

    return (
      <div key={log.id} className="mb-4">
        <Card className="p-4 rounded-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Badge variant={operationDetails.color === 'blue' ? 'default' :
                operationDetails.color === 'green' ? 'default' :
                  operationDetails.color === 'red' ? 'destructive' : 'secondary'}>
                {operationDetails.label}
              </Badge>
              <span className="font-medium">{formatFieldName(log.table_name.replace('_table', ''))}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {format(new Date(log.changed_at), 'PPp')}
              </span>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>User #{log.changed_by}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Record ID: {log.record_id}</span>
          </div>

          {changes.length > 0 && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full">
                  <GitCompare className="h-4 w-4 mr-2" />
                  View Changes ({changes.length} field{changes.length !== 1 ? 's' : ''})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-4">
                {changes.map((change, index) => (
                  <div key={index} className="border-l-4 border-primary pl-4 py-2 rounded">
                    <div className="mb-2 font-medium text-foreground">
                      {formatFieldName(change.field)}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-2 bg-destructive/10 rounded">
                        <div className="text-xs text-muted-foreground mb-1">BEFORE</div>
                        <div className="text-destructive">
                          {formatFieldValue(change.before)}
                        </div>
                      </div>
                      <div className="p-2 bg-green-100 rounded">
                        <div className="text-xs text-muted-foreground mb-1">AFTER</div>
                        <div className="text-green-700">
                          {formatFieldValue(change.after)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {changes.length === 0 && log.operation.toLowerCase() !== 'delete' && (
            <div className="text-center py-2 text-muted-foreground italic">
              No field changes detected
            </div>
          )}
        </Card>
      </div>
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h3 className="text-lg font-medium">Loading Account History...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-destructive mb-4">
          <History className="h-12 w-12 mx-auto mb-2" />
          <h3 className="text-lg font-medium">Error Loading History</h3>
        </div>
        <p className="text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => fetchHistory()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <History className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Account History Available</h3>
        <p className="text-muted-foreground">Changes to this account will appear here</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <History className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Account Activity Timeline</h2>
        </div>
      </div>
      {timelineItems}
    </div>
  );
};

export default SalesAccountHistory;