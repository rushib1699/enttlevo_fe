import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { useUserPermission } from "@/context/UserPermissionContext";
import { Step, PhasesList } from "@/types";
import { 
  getPhasesByCompanyId, 
  updatePhaseStatus, 
  addPhaseStep, 
  updatePhaseStepStatus, 
  deletePhaseStepToCompany,
  renamePhaseStepToCompany 
} from "@/api";
import { toast } from "sonner";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

// Icons
import {
  Check,
  Plus,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Save,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface PhaseData {
  id: number;
  phase: string;
  status: string;
  company_name: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  steps: Step[];
}

interface TableStep {
  id: number;
  status: string;
  step: string;
}

// Progress Bar Component
const PhaseProgressBar = ({ 
  phasesList, 
  currentPhaseStep, 
  completed, 
  phasesData 
}: {
  phasesList: string[];
  currentPhaseStep: number;
  completed: boolean;
  phasesData: PhasesList;
}) => {
  const [startIndex, setStartIndex] = useState(0);
  const [currentWindowPhasesList, setCurrentWindowPhasesList] = useState<string[]>([]);
  const visiblePhasesCount = 5;

  useEffect(() => {
    const splicedPhaseList = phasesList.slice(
      startIndex,
      startIndex + visiblePhasesCount
    );
    setCurrentWindowPhasesList(splicedPhaseList);
  }, [startIndex, phasesList]);

  useEffect(() => {
    if (currentPhaseStep > startIndex + visiblePhasesCount) {
      setStartIndex(currentPhaseStep - visiblePhasesCount);
    } else if (currentPhaseStep <= startIndex) {
      setStartIndex(currentPhaseStep - 1);
    }
  }, [currentPhaseStep]);

  const handlePrev = () => {
    setStartIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setStartIndex((prev) =>
      Math.min(prev + 1, Math.max(0, phasesList.length - visiblePhasesCount))
    );
  };

  return (
    <div className="flex items-center justify-center gap-4 my-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePrev}
        disabled={startIndex === 0}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center gap-4">
        {currentWindowPhasesList?.map((step, i) => {
          const actualIndex = startIndex + i;
          const isActive = currentPhaseStep === actualIndex + 1;
          const isComplete = actualIndex + 1 < currentPhaseStep || completed;

          return (
            <div key={actualIndex} className="flex flex-col items-center gap-2">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                  ${isComplete 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isActive 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-500'
                  }
                `}
              >
                {isComplete ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{actualIndex + 1}</span>
                )}
              </div>
              <p className={`text-xs font-medium text-center ${isActive || isComplete ? 'text-gray-900' : 'text-gray-500'}`}>
                {step}
              </p>
              {i < currentWindowPhasesList.length - 1 && (
                <div 
                  className={`absolute h-0.5 w-16 top-5 translate-x-10 ${
                    actualIndex + 1 < currentPhaseStep ? 'bg-green-500' : 'bg-gray-300'
                  }`} 
                />
              )}
            </div>
          );
        })}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleNext}
        disabled={startIndex + visiblePhasesCount >= phasesList.length}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Phase Steps Component
const PhaseSteps = ({
  phaseSteps,
  addStep,
  phaseData,
  setAddStep,
  phaseDisabledState,
  fetchPhasesByCompanyId,
  customerId, // Add this prop
}: {
  phaseSteps: Step[] | undefined;
  addStep: boolean;
  phaseData: PhaseData;
  setAddStep: React.Dispatch<React.SetStateAction<boolean>>;
  phaseDisabledState: boolean;
  fetchPhasesByCompanyId: () => Promise<void>;
  customerId?: string | number; // Add this prop type
}) => {
  const { loginResponse } = useApplicationContext();
  // Remove customerId from useParams
  // const { customerId } = useParams();
  const { hasAccess } = useUserPermission();
  
  const [stepText, setStepText] = useState<string>("");
  const [tableData, setTableData] = useState<TableStep[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>("");
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [stepToDelete, setStepToDelete] = useState<number | null>(null);

  const hasWritePermission = hasAccess('write');
  const isSuperAdmin = hasAccess("superadmin");

  useEffect(() => {
    const tData: TableStep[] = [];
    if (phaseSteps) {
      for (let i = 0; i < phaseSteps.length; i++) {
        tData.push({
          id: phaseSteps[i]?.id,
          status: phaseSteps[i]?.status,
          step: phaseSteps[i]?.step,
        });
      }
    }
    setTableData(tData);
  }, [phaseSteps]);

  const handlePhaseStepStatusChange = useCallback(
    async (value: string, phaseStep: TableStep) => {
      if (loginResponse) {
        try {
          const payload = {
            user_id: Number(loginResponse.id),
            status: value,
            phase_step_id: phaseStep?.id,
            is_active: 1,
            is_deleted: 0,
          };
          await updatePhaseStepStatus(payload);
          toast.success("Step status updated successfully");
          await fetchPhasesByCompanyId();
        } catch (e) {
          toast.error("Failed to update step status");
          console.log("PHASE_STEP_STATUS_UPDATE_ERROR: ", e);
        }
      }
    },
    [loginResponse, fetchPhasesByCompanyId]
  );

  const handleEditStep = useCallback(async (stepId: number, newText: string) => {
    if (loginResponse) {
      try {
        await renamePhaseStepToCompany({ 
          step_id: stepId,
          step: newText,
          user_id: loginResponse.id,
          customer_company_id: Number(customerId),
          phase_id: phaseData.id
        });
        toast.success("Step updated successfully");
        setEditingId(null);
        setEditText("");
        await fetchPhasesByCompanyId();
      } catch (e) {
        toast.error("Failed to update step");
        console.log("PHASE_STEP_UPDATE_ERROR: ", e);
      }
    }
  }, [loginResponse, fetchPhasesByCompanyId, customerId, phaseData.id]);

  const handleStepAdd = useCallback(async () => {
    if (loginResponse) {
      try {
        const payload = {
          user_id: loginResponse.id,
          step: stepText,
          phase_id: phaseData.id,
          company_id: Number(customerId),
        };
        await addPhaseStep(payload);
        setAddStep(false);
        setStepText("");
        toast.success("Step added successfully");
        await fetchPhasesByCompanyId();
      } catch (e) {
        toast.error("Failed to add step");
        console.log("[HANDLE_STEP_ADD]: ", e);
      }
    }
  }, [loginResponse, customerId, stepText, phaseData, fetchPhasesByCompanyId]);

  const handleDeleteStep = useCallback(async (stepId: number) => {
    if (loginResponse) {
      try {
        await deletePhaseStepToCompany({
          step_id: String(stepId),
          user_id: loginResponse.id,
          customer_company_id: Number(customerId),
          phase_id: String(phaseData.id)
        });
        toast.success("Step deleted successfully");
        setDeleteModalVisible(false);
        setStepToDelete(null);
        await fetchPhasesByCompanyId();
      } catch (e) {
        toast.error("Failed to delete step");
        console.log("PHASE_STEP_DELETE_ERROR: ", e);
      }
    }
  }, [loginResponse, fetchPhasesByCompanyId, customerId, phaseData.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500 bg-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500 bg-blue-500" />;
      case 'skipped':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'skipped':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  return (
    <div className="space-y-4">
      {addStep && (
        <Card className="border-dashed rounded-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="shrink-0">
                Pending
              </Badge>
              <Input
                value={stepText}
                onChange={(e) => setStepText(e.target.value)}
                placeholder="Enter step description..."
                className="flex-1"
              />
              <Button onClick={handleStepAdd} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
              <Button 
                onClick={() => setAddStep(false)} 
                variant="outline" 
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {tableData.map((step) => (
          <Card key={step.id} className="transition-all hover:shadow-md rounded-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 min-w-[140px]">
                  {getStatusIcon(step.status)}
                  <Select
                    value={step.status}
                    onValueChange={(value) => handlePhaseStepStatusChange(value, step)}
                    disabled={phaseDisabledState || !(hasWritePermission || isSuperAdmin)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="skipped">Skipped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 flex items-center gap-2">
                  {editingId === step.id ? (
                    <>
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => handleEditStep(step.id, editText)}
                        size="sm"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => {
                          setEditingId(null);
                          setEditText("");
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm flex-1">{step.step}</p>
                      <Button 
                        onClick={() => {
                          setEditingId(step.id);
                          setEditText(step.step);
                        }}
                        variant="ghost"
                        size="sm"
                        disabled={phaseDisabledState || !(hasWritePermission || isSuperAdmin)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => {
                          setStepToDelete(step.id);
                          setDeleteModalVisible(true);
                        }}
                        variant="ghost"
                        size="sm"
                        disabled={phaseDisabledState || !(hasWritePermission || isSuperAdmin)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteModalVisible} onOpenChange={setDeleteModalVisible}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this step? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteModalVisible(false);
              setStepToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => stepToDelete && handleDeleteStep(stepToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Phase Box Component
const PhaseBox = ({
  phaseData,
  currentPhaseStep,
  boxNumber,
  fetchPhasesByCompanyId,
  customerId,
}: {
  phaseData: PhaseData;
  currentPhaseStep: number;
  boxNumber: number;
  fetchPhasesByCompanyId: () => Promise<void>;
  customerId?: string | number;
}) => {
  const { loginResponse } = useApplicationContext();
  const { hasAccess } = useUserPermission();
  
  const [addStep, setAddStep] = useState(false);
  const [phaseSteps, setPhaseSteps] = useState<Step[]>([]);
  const [status, setStatus] = useState(phaseData?.status);
  
  const phaseDisabledState = currentPhaseStep >= boxNumber + 1 ? false : true;
  const hasWritePermission = hasAccess('write');
  const isSuperAdmin = hasAccess("superadmin");

  // Update local state when phaseData changes
  useEffect(() => {
    if (phaseData) {
      setPhaseSteps(phaseData.steps || []);
      setStatus(phaseData.status);
    }
  }, [phaseData]);

  // Remove the automatic status update effect - let the parent handle it
  // This prevents conflicts and ensures the parent component controls the state

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <Check className="h-5 w-5 text-white" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-white" />;
      default:
        return <AlertCircle className="h-5 w-5 text-white" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600">Done</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card className="shadow-md border border-slate-200 rounded-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg">Phase {phaseData?.phase}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              disabled={phaseDisabledState || !(hasWritePermission || isSuperAdmin)}
              onClick={() => setAddStep(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Step
            </Button>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
              status === "completed" ? "bg-green-500" : status === "in_progress" ? "bg-blue-500" : "bg-slate-400"
            }`}>
              {getStatusIcon()}
            </div>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4">
        <PhaseSteps
          phaseData={phaseData}
          phaseDisabledState={phaseDisabledState}
          fetchPhasesByCompanyId={fetchPhasesByCompanyId}
          phaseSteps={phaseSteps}
          setAddStep={setAddStep}
          addStep={addStep}
          customerId={customerId}
        />
      </CardContent>
    </Card>
  );
};

// Main Pipeline Component - Updated to accept customerId as prop
const PipelinePage = ({ customerId }: { customerId?: string | number }) => {
  
  const { loginResponse } = useApplicationContext();
  const [phasesData, setPhasesData] = useState<PhasesList>([]);
  const [phasesList, setPhasesList] = useState<string[]>([]);
  const [currentPhaseStep, setCurrentPhaseStep] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  const fetchPhasesByCompanyId = useCallback(
    async () => {
      if (customerId && loginResponse) {
        try {
          setLoading(true);
          const response = await getPhasesByCompanyId({
            company_id: Number(customerId),
          });
          setPhasesData(response);
          // Remove the updateCheckPhaseStatus call from here
        } catch (e) {
          console.log(e);
          toast.error("Failed to fetch phases");
        } finally {
          setLoading(false);
        }
      }
    },
    [loginResponse, customerId]
  );

  // Separate function to update phase status - remove the useCallback dependency issue
  const updateCheckPhaseStatus = useCallback(async (phases: PhasesList) => {
    if (loginResponse && phases.length > 0) {
      const updates = phases.map(phaseData => {
        let pendingStatusCount = 0;
        let inProgressStatusCount = 0;
        let skippedStatusCount = 0;
        let doneStatusCount = 0;
        const stepsLength = phaseData?.steps?.length;

        phaseData?.steps?.forEach(step => {
          if (step?.status === "completed") doneStatusCount += 1;
          else if (step?.status === "skipped") skippedStatusCount += 1;
          else if (step?.status === "in_progress") inProgressStatusCount += 1;
          else if (step?.status === "pending") pendingStatusCount += 1;
        });

        let status = "pending";
        if (stepsLength > 0) {
          if (doneStatusCount + skippedStatusCount === stepsLength) {
            status = "completed";
          } else if (inProgressStatusCount > 0 || doneStatusCount > 0 || skippedStatusCount > 0) {
            status = "in_progress";
          }
        }

        return {
          user_id: Number(loginResponse.id),
          status,
          phase_id: phaseData?.id,
          is_active: 1,
          is_deleted: 0,
        };
      });

      try {
        await Promise.all(updates.map(payload => updatePhaseStatus(payload)));
        // Fetch fresh data after updating statuses
        await fetchPhasesByCompanyId();
      } catch (e) {
        console.log(e);
      }
    }
  }, [loginResponse, fetchPhasesByCompanyId]);

  // Initial data fetch
  useEffect(() => {
    fetchPhasesByCompanyId();
  }, [fetchPhasesByCompanyId]);

  // Update phase list and current step whenever phasesData changes
  useEffect(() => {
    if (phasesData.length > 0) {
      // Update phases list
      const pList = phasesData.map((phaseData) => `Phase ${phaseData?.phase}`);
      setPhasesList(pList);

      // Calculate current phase step
      let currentStep = 1;
      let foundInProgress = false;
      
      for (let i = 0; i < phasesData.length; i++) {
        if (phasesData[i]?.status === "completed" || phasesData[i]?.status === "skipped") {
          currentStep += 1;
        } else if ((phasesData[i]?.status === "in_progress" || phasesData[i]?.status === "pending") && !foundInProgress) {
          currentStep = i + 1;
          foundInProgress = true;
          break;
        } else if (!foundInProgress) {
          currentStep = i + 1;
          break;
        }
      }
      setCurrentPhaseStep(currentStep);
    }
  }, [phasesData]);

  // Enhanced fetchPhasesByCompanyId that includes status check
  const fetchPhasesWithStatusUpdate = useCallback(async () => {
    if (customerId && loginResponse) {
      try {
        const response = await getPhasesByCompanyId({
          company_id: Number(customerId),
        });
        
        // Update phases data immediately
        setPhasesData(response);
        
        // Then update statuses if needed
        await updateCheckPhaseStatus(response);
      } catch (e) {
        console.log(e);
        toast.error("Failed to fetch phases");
      }
    }
  }, [loginResponse, customerId, updateCheckPhaseStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading pipeline...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full space-y-8">
      {/* Progress Bar */}
      <div className="w-full flex justify-center">
        <PhaseProgressBar
          phasesData={phasesData}
          phasesList={phasesList}
          currentPhaseStep={currentPhaseStep}
          completed={false}
        />
      </div>

      {/* Phase Boxes */}
      <div className="space-y-6">
        {phasesData?.map((phaseData, i) => (
          <PhaseBox
            key={`${phaseData.id}-${phaseData.status}-${i}`} // Enhanced key to force re-render
            boxNumber={i}
            phaseData={phaseData}
            currentPhaseStep={currentPhaseStep}
            fetchPhasesByCompanyId={fetchPhasesWithStatusUpdate} // Use enhanced function
            customerId={customerId}
          />
        ))}
      </div>

      {phasesData.length === 0 && (
        <Card className="text-center py-12 rounded-lg">
          <CardContent>
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Phases Found</h3>
            <p className="text-gray-600">No pipeline phases have been configured for this account.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PipelinePage;