import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  Eye, 
  EyeOff, 
  Columns, 
  RefreshCw,
  Save,
  RotateCcw,
  Search,
  X
} from "lucide-react";
import { toast } from 'sonner';
import { getUserPrefences, updateUserPreferences } from '@/api';
import { useApplicationContext } from '@/hooks/useApplicationContext';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface ColumnVisibilitySheetProps {
  currentTableName?: string;
  currentTableData?: any[];
  currentTableDisplayName?: string;
  onPreferencesChange?: () => void;
}

// Define column display names mapping
const COLUMN_DISPLAY_NAMES: { [key: string]: string } = {
  id: "ID",
  account_name: "Company",
  contact_name: "Contact Name", 
  email: "Email",
  phone: "Phone",
  linkedin: "LinkedIn",
  website: "Website",
  city: "City",
  state: "State",
  country: "Country",
  industry: "Industry",
  lead_owner: "Lead Owner",
  product_name: "Product Name",
  contract_stage: "Contract Stage",
  proposed_arr: "Proposed ARR",
  contract_arr: "Contract ARR",
  lead_source: "Lead Source",
  is_icp: "ICP",
  status: "Status",
  lable: "Label",
  created_by: "Created By",
  updated_by: "Updated By",
  created_at: "Created At",
  updated_at: "Updated At",
  actions: "Actions",
  mib: "Money in Bank",
  address: "Address",
  timezone: "Timezone",
  funnel_stage: "Funnel Stage",
  contract_type: "Contract Type",
  account_status: "Account Status",
  contract_value: "Contract Value",
  account_status_id: "Account Status ID",
  contract_duration: "Contract Duration",
  lead_owner_id: "Lead Owner ID",
  product_name_id: "Product Name ID",
  contract_stage_id: "Contract Stage ID",
  lead_source_id: "Lead Source ID",
  is_icp_id: "ICP ID",
  status_id: "Status ID",
  lable_id: "Label ID",
  live_date: "Live Date"
};

// Generate display name for column
const getColumnDisplayName = (columnKey: string): string => {
  return COLUMN_DISPLAY_NAMES[columnKey] || columnKey
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Extract columns from table data
const extractColumnsFromData = (data: any[]): { [key: string]: string } => {
  if (!data || data.length === 0) return {};
  
  const sampleRow = data[0];
  const columns: { [key: string]: string } = {};
  
  Object.keys(sampleRow).forEach(key => {
    if (key !== 'id') { // Skip the id column
      columns[key] = getColumnDisplayName(key);
    }
  });
  
  return columns;
};

// Helper function to safely extract column visibility model
const extractColumnVisibilityModel = (tablePrefs: any): { [key: string]: boolean } => {
  if (!tablePrefs) return {};
  
  let columnModel = tablePrefs.columnVisibilityModel;
  
  if (columnModel && typeof columnModel === 'object' && columnModel.columnVisibilityModel) {
    columnModel = columnModel.columnVisibilityModel;
  }
  
  return columnModel || {};
};

const ColumnVisibilitySheet: React.FC<ColumnVisibilitySheetProps> = ({
  currentTableName = 'leads_table',
  currentTableData = [],
  currentTableDisplayName = 'Current Table',
  onPreferencesChange
}) => {
  const { loginResponse } = useApplicationContext();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<{ [key: string]: boolean }>({});
  const [originalVisibility, setOriginalVisibility] = useState<{ [key: string]: boolean }>({});
  const [availableColumns, setAvailableColumns] = useState<{ [key: string]: string }>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentTableData && currentTableData.length > 0) {
      const extractedColumns = extractColumnsFromData(currentTableData);
      setAvailableColumns(extractedColumns);
    }
  }, [currentTableData]);

  const fetchPreferences = async () => {
    if (!loginResponse?.id) return;
    
    try {
      setLoading(true);
      const userPref = await getUserPrefences({
        user_id: loginResponse.id
      });

      const parsedPreferences = JSON.parse(userPref.preference || '{}');
      const tablePrefs = parsedPreferences[currentTableName];
      const columnModel = extractColumnVisibilityModel(tablePrefs);
      
      const visibilityState: { [key: string]: boolean } = {};
      Object.keys(availableColumns).forEach(columnKey => {
        visibilityState[columnKey] = columnModel.hasOwnProperty(columnKey) ? columnModel[columnKey] : true;
      });
      
      setColumnVisibility(visibilityState);
      setOriginalVisibility({ ...visibilityState });
      
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      toast.error('Failed to load column preferences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!loginResponse?.id) return;

    try {
      setSaving(true);
      
      const cleanColumnVisibilityModel: { [key: string]: boolean } = {};
      Object.keys(columnVisibility).forEach(columnKey => {
        cleanColumnVisibilityModel[columnKey] = columnVisibility[columnKey];
      });
      
      await updateUserPreferences({
        user_id: loginResponse.id,
        table_name: currentTableName,
        preferences: {
          columnVisibilityModel: cleanColumnVisibilityModel
        },
      });

      setOriginalVisibility({ ...columnVisibility });
      toast.success('Column preferences saved successfully');
      
      if (onPreferencesChange) {
        onPreferencesChange();
      }
      
      setTimeout(() => {
        setIsOpen(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save column preferences');
    } finally {
      setSaving(false);
    }
  };

  const resetTablePreferences = async () => {
    try {
      const resetVisibility: { [key: string]: boolean } = {};
      Object.keys(availableColumns).forEach(columnKey => {
        resetVisibility[columnKey] = true;
      });
      setColumnVisibility(resetVisibility);

      // Save the reset preferences immediately
      await updateUserPreferences({
        user_id: loginResponse?.id || 0,
        table_name: currentTableName,
        preferences: {
          columnVisibilityModel: resetVisibility
        },
      });

      setOriginalVisibility(resetVisibility);
      
      if (onPreferencesChange) {
        onPreferencesChange();
      }

      //close the sheet
      setIsOpen(false);

      toast.success('Column preferences reset successfully');
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      toast.error('Failed to reset column preferences');
    }
  };

  const toggleColumnVisibility = (columnName: string, visible: boolean) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnName]: visible
    }));
  };

  const getVisibleColumnsCount = (): number => {
    return Object.values(columnVisibility).filter(visible => visible).length;
  };

  const getTotalColumnsCount = (): number => {
    return Object.keys(availableColumns).length;
  };

  const hasChanges = (): boolean => {
    return JSON.stringify(columnVisibility) !== JSON.stringify(originalVisibility);
  };

  useEffect(() => {
    if (isOpen && Object.keys(availableColumns).length > 0) {
      fetchPreferences();
    }
  }, [isOpen, availableColumns, loginResponse?.id]);

  const filteredColumns = Object.entries(availableColumns).filter(([key, name]) => 
    name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Columns className="h-4 w-4" />
          Manage Columns
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="max-w-[600px] sm:max-w-[600px] p-0">
        <div className="flex h-full flex-col">
          <div className="p-6 pb-2">
            <SheetHeader>
              <SheetTitle className="text-xl font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {currentTableDisplayName} Column Settings
              </SheetTitle>
            </SheetHeader>

            <div className="flex items-center gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search columns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetTablePreferences}
                className="whitespace-nowrap"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                {getVisibleColumnsCount()} of {getTotalColumnsCount()} columns visible
              </div>
              <Badge variant="secondary">
                {getVisibleColumnsCount()}/{getTotalColumnsCount()}
              </Badge>
            </div>
          </div>
          <Separator />

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 py-6">
                {filteredColumns.map(([columnKey, columnName]) => {
                  const isVisible = columnVisibility[columnKey] !== false;
                  return (
                    <div
                      key={columnKey}
                      className={`
                        flex items-center justify-between p-3 
                        rounded-xl transition-all duration-200
                        ${isVisible ? 'bg-primary/5' : 'bg-muted/30'} 
                        hover:bg-primary/10 hover:shadow-sm
                        border border-transparent hover:border-primary/20
                      `}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className={`
                          p-2 rounded-lg
                          ${isVisible ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                        `}>
                          {isVisible ? (
                            <Eye className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <EyeOff className="h-4 w-4 flex-shrink-0" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Label className="font-semibold text-base truncate block">{columnName}</Label>
                          <p className="text-xs text-muted-foreground/80 truncate font-mono">{columnKey}</p>
                        </div>
                      </div>
                      <Switch
                        checked={isVisible}
                        onCheckedChange={(checked) => toggleColumnVisibility(columnKey, checked)}
                        className="ml-4"
                      />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          <div className="p-6 pt-2">
            <Separator className="mb-4" />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={savePreferences}
                disabled={saving || !hasChanges()}
                className="min-w-[100px]"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ColumnVisibilitySheet;