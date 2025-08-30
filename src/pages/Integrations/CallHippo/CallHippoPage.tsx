import { useApplicationContext } from "@/hooks/useApplicationContext";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import dayjs from "dayjs";
import { DataGrid } from '@mui/x-data-grid';

import { 
  Phone, 
  PhoneCall, 
  Calendar,
  Plus,
  Eye,
  RotateCcw,
  Captions 
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CALL_HIPPO_API_KEY, CALL_HIPPO_ACCOUNT_ID, COMPANY_INTEGRATION_SESSION_KEY } from "@/constants";
// import SummarizeModal from "@/components/Model/SummarizeModal";

// Add interface for CallHippo widget
declare global {
  interface Window {
    TOKEN: string;
    EMAIL: string;
    chCall: (phoneNumber: string, customParams?: string) => void;
  }
}

interface CallRecord {
  id: string;
  caller: string;
  recipient: string;
  callType: string;
  duration: string;
  status: string;
  timestamp: string;
  originalData: any;
  recordingUrl?: string;
}

interface CallHippoConfig {
  apiKey: string;
  accountId: string;
}

interface CallLog {
  _id: string;
  callSid: string;
  callType: string;
  from: string;
  to: string;
  date: string;
  time: string;
  callDuration: string;
  callStatus: string;
  caller: string;
  recordingUrl: string;
  totalCallDuration: number;
  ringingDuration: string;
  callCost: number;
  lastUpdatedCredits: number;
  callerEmail: string;
  dateToShow: string;
  callNotes: string;
  callAnswerTime: string;
  callHangupTime: string;
  callSms: string;
  callTags: string[];
  fromName: string;
}

interface CallLogsResponse {
  success: boolean;
  data: {
    callLogs: CallLog[];
    hasNext: boolean;
  };
}

// Date Range Picker Component
const DateRangePicker = ({ startDate, endDate, onDateRangeChange }: {
  startDate: Date | null;
  endDate: Date | null;
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(endDate);

  const handleApply = () => {
    onDateRangeChange(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return "Select date range";
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
          <Calendar className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Start Date</h4>
              <CalendarComponent
                mode="single"
                selected={tempStartDate || undefined}
                onSelect={(date) => setTempStartDate(date || null)}
                className="rounded-md border"
              />
            </div>
            <div>
              <h4 className="font-medium mb-2">End Date</h4>
              <CalendarComponent
                mode="single"
                selected={tempEndDate || undefined}
                onSelect={(date) => setTempEndDate(date || null)}
                className="rounded-md border"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Form schemas
const addContactSchema = z.object({
  number: z.string()
    .min(1, "Phone number is required")
    .regex(/^\+[1-9]\d{10,14}$/, "Please enter a valid phone number with country code (e.g., +1234567890)"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
});

const CallHippo = () => {
  const navigate = useNavigate();
  const { loginResponse } = useApplicationContext();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [config] = useState<CallHippoConfig>({
    apiKey: CALL_HIPPO_API_KEY,
    accountId: CALL_HIPPO_ACCOUNT_ID
  });
  
  const [startDate, setStartDate] = useState<Date | null>(dayjs().startOf('month').toDate());
  const [endDate, setEndDate] = useState<Date | null>(dayjs().endOf('month').toDate());
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [addContactSheetOpen, setAddContactSheetOpen] = useState(false);
  const [addContactLoading, setAddContactLoading] = useState(false);
  const [isSummarizeModalVisible, setIsSummarizeModalVisible] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<any>(null);
  const [workflowGeneratedOutput, setWorkflowGeneratedOutput] = useState<{
    transcriptId: null | string;
    output: string;
  }>({
    transcriptId: null,
    output: "",
  });

  const addContactForm = useForm<z.infer<typeof addContactSchema>>({
    resolver: zodResolver(addContactSchema),
    defaultValues: {
      number: "",
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  // Initialize CallHippo widget
  useEffect(() => {
    if (config?.apiKey && loginResponse?.email) {
      const chWidgetDiv = document.createElement('div');
      chWidgetDiv.id = 'ch-dialer-container';
      document.body.appendChild(chWidgetDiv);

      window.TOKEN = config.apiKey;
      window.EMAIL = config.accountId;

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = 'https://d1x9dsge91xf6g.cloudfront.net/callhippo/files/ch-dialer.js';

      document.head.appendChild(script);

      return () => {
        document.body.removeChild(chWidgetDiv);
        document.head.removeChild(script);
      };
    }
  }, [config, loginResponse]);

  const handleClickToCall = (phoneNumber: string) => {
    if (window.chCall) {
      window.chCall(phoneNumber, `userId=${loginResponse?.id}`);
    } else {
      toast.error("CallHippo dialer is not initialized");
    }
  };

  const fetchCallLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://web.callhippo.com/v1/activityfeed', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'apiToken': config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skip: 0,
          limit: 20,
          startDate: startDate ? dayjs(startDate).format('YYYY/MM/DD') : '',
          endDate: endDate ? dayjs(endDate).format('YYYY/MM/DD') : '',
          crmUniqueId: '',
          callSid: ''
        })
      });

      const data: CallLogsResponse = await response.json();
      if (data.success) {
        const formattedCalls: CallRecord[] = data.data.callLogs.map(log => ({
          id: log._id,
          caller: log.from,
          recipient: log.to,
          callType: log.callType,
          duration: log.callDuration,
          status: log.callStatus.toLowerCase(),
          timestamp: `${log.date} ${log.time}`,
          originalData: log,
          recordingUrl: log.recordingUrl
        }));
        setCalls(formattedCalls);
      }
    } catch (error) {
      console.log("Failed to fetch call logs", error);
      //toast.error('Failed to fetch call logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallLogs();
  }, [startDate, endDate]);

  const handleAddContact = async (values: z.infer<typeof addContactSchema>) => {
    setAddContactLoading(true);
    try {
      const response = await fetch('https://web.callhippo.com/contact/add', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'apiToken': config.apiKey,
        },
        body: JSON.stringify(values)
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Contact added successfully!");
        setAddContactSheetOpen(false);
        addContactForm.reset();
      } else {
        toast.error("Failed to add contact");
      }
    } catch (error) {
      console.log("Error adding contact", error);
      toast.error("Error adding contact");
    } finally {
      setAddContactLoading(false);
    }
  };

  const columns = [
    {
      field: "caller",
      headerName: "Caller",
      flex: 1,
      headerClassName: "table-header",
    },
    {
      field: "recipient",
      headerName: "Recipient",
      flex: 1,
      headerClassName: "table-header",
    },
    {
      field: "callType",
      headerName: "CallType",
      flex: 1,
      headerClassName: "table-header",
      renderCell: (params: any) => (
        <span className={`px-2 py-1 rounded-full text-sm ${params.value === 'Outgoing' ? 'bg-blue-100 text-blue-800' :
          params.value === 'Incoming' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
          {params.value}
        </span>
      ),
    },
    {
      field: "duration",
      headerName: "Duration",
      flex: 1,
      headerClassName: "table-header",
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      headerClassName: "table-header",
      renderCell: (params: any) => (
        <span className={`px-2 py-1 rounded-full text-sm ${params.value === 'completed' ? 'bg-green-100 text-green-800' :
          params.value === 'missed' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
          {params.value}
        </span>
      ),
    },
    {
      field: "timestamp",
      headerName: "Timestamp",
      flex: 1,
      headerClassName: "table-header",
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      headerClassName: "table-header",
      renderCell: (params: any) => (
        <div className="flex gap-2 items-center mt-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              setSelectedCall(params.row.originalData);
              setViewSheetOpen(true);
            }}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleClickToCall(params.row.recipient)}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Call Again
          </Button>
        </div>
      ),
    },
  ];

  const companyIntegrations = JSON.parse(sessionStorage.getItem(COMPANY_INTEGRATION_SESSION_KEY) || '[]');
  const hasCallHippoIntegration = companyIntegrations.some(
    (integration: { integration: string; is_active: string }) =>
      integration.integration.toLowerCase() === 'callhippo' &&
      integration.is_active === 'Yes'
  );

  if (!hasCallHippoIntegration) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <div className="w-full max-w-lg rounded-lg">
          <CardContent className="p-8 text-center">
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-full inline-block">
                <Phone size={48} className="text-blue-500" />
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">CallHippo Integration Not Configured</h3>
                <p className="text-gray-600 mb-6">
                  You haven't configured your CallHippo integration yet. Connect your CallHippo account to make and manage calls directly from the platform.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="font-semibold mb-2">Benefits of CallHippo Integration:</p>
                <ul className="text-left text-gray-600 space-y-1">
                  <li>• Make calls directly from the platform</li>
                  <li>• Track call history and performance</li>
                  <li>• Record and analyze customer conversations</li>
                  <li>• Manage your call center operations efficiently</li>
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
    <div className="gap-4 flex flex-col min-h-screen">
      <Card className="rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-2xl">Call Hippo Integration</CardTitle>
            </div>
            <div className="flex gap-4">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onDateRangeChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                }}
              />
              <Button
                onClick={() => setAddContactSheetOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <DataGrid
            className="w-full h-full"
            rows={calls}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            pageSizeOptions={[5, 10, 25, 50]}
            sx={{
              width: '100%',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#1976d2',
                color: 'black',
                fontSize: '15px',
                fontWeight: 'bold',
              },
              '& .table-header': {
                backgroundColor: '#424758',
                color: 'white',
                fontSize: '15px',
                fontWeight: 'bold',
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Add Contact Sheet */}
      <Sheet open={addContactSheetOpen} onOpenChange={setAddContactSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Contact</SheetTitle>
          </SheetHeader>
          
          <Form {...addContactForm}>
            <form onSubmit={addContactForm.handleSubmit(handleAddContact)} className="space-y-4 mt-4">
              <FormField
                control={addContactForm.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addContactForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addContactForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addContactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="abc@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <SheetFooter>
                <Button type="submit" disabled={addContactLoading}>
                  {addContactLoading ? "Adding..." : "Add Contact"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* View Call Details Sheet */}
      <Sheet open={viewSheetOpen} onOpenChange={setViewSheetOpen}>
        <SheetContent className="w-[600px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Call Details</SheetTitle>
          </SheetHeader>
          
          {selectedCall && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Call Type</h4>
                  <p className="text-sm text-gray-600">{selectedCall.callType}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Status</h4>
                  <p className="text-sm text-gray-600">{selectedCall.callStatus}</p>
                </div>
                <div>
                  <h4 className="font-semibold">From</h4>
                  <p className="text-sm text-gray-600">{selectedCall.from} ({selectedCall.fromName})</p>
                </div>
                <div>
                  <h4 className="font-semibold">To</h4>
                  <p className="text-sm text-gray-600">{selectedCall.to}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Date & Time</h4>
                  <p className="text-sm text-gray-600">{selectedCall.date} {selectedCall.time}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Duration</h4>
                  <p className="text-sm text-gray-600">{selectedCall.callDuration} (Ring: {selectedCall.ringingDuration})</p>
                </div>
                <div>
                  <h4 className="font-semibold">Cost</h4>
                  <p className="text-sm text-gray-600">${selectedCall.callCost.toFixed(3)}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Caller</h4>
                  <p className="text-sm text-gray-600">{selectedCall.caller}</p>
                </div>
              </div>

              {selectedCall.recordingUrl && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Recording</h4>
                  <div className="space-y-2">
                    <audio controls className="w-full">
                      <source src={selectedCall.recordingUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                    <Button
                      size="sm"
                      className="w-60"
                      disabled={!selectedCall.recordingUrl}
                      onClick={() => {
                        setSelectedTranscript(null);
                        setIsSummarizeModalVisible(true);
                      }}
                    >
                      <Captions className="w-4 h-4 mr-2" />
                      Summarize Recording
                    </Button>
                  </div>
                </div>
              )}

              {selectedCall.callNotes && (
                <div className="mt-4">
                  <h4 className="font-semibold">Notes</h4>
                  <p className="text-sm text-gray-600">{selectedCall.callNotes}</p>
                </div>
              )}

              {selectedCall.callTags.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold">Tags</h4>
                  <div className="flex gap-2 mt-1">
                    {selectedCall.callTags.map((tag, index) => (
                      <span key={index} className="bg-gray-100 px-2 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* SummarizeModal */}
      {/* <SummarizeModal
        visible={isSummarizeModalVisible}
        onCancel={() => setIsSummarizeModalVisible(false)}
        loadingSummary={false}
        transcript={selectedTranscript}
        workflowGeneratedOutput={workflowGeneratedOutput}
        setWorkflowGeneratedOutput={setWorkflowGeneratedOutput}
        recordingUrl={selectedCall?.recordingUrl}
      /> */}
    </div>
  );
};

export default CallHippo;