import React, { useCallback, useEffect, useState } from 'react';
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { useUserPermission } from "@/context/UserPermissionContext";
import { PhasesList, Step } from "@/types";
import { 
  addCBDPhase, 
  getCBDPhases, 
  addCBDPhaseStep, 
  deleteCbdPhase, 
  renameCbdPhase,
  renameCbdPhaseStep,
  deleteCbdPhaseStep
} from "@/api";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Save, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface PhaseBoxProps {
  cbdPhaseData: {
    id: number;
    phase: string;
    status: string;
    company_name: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
    steps: Step[];
  };
  boxNumber: number;
  fetchCBDPhases: () => Promise<void>;
}

interface PhaseStepsProps {
  phaseSteps: Step[] | undefined;
  addStep: boolean;
  setAddStep: React.Dispatch<React.SetStateAction<boolean>>;
  fetchCBDPhases: () => Promise<void>;
  cbdPhaseData: {
    id: number;
    phase: string;
    status: string;
    company_name: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
    steps: Step[];
  };
}

type TableStep = {
  id: number;
  status: string;
  step: string;
};

// PhaseSteps Component
const PhaseSteps: React.FC<PhaseStepsProps> = ({
  phaseSteps,
  addStep,
  cbdPhaseData,
  setAddStep,
  fetchCBDPhases,
}) => {
  const { loginResponse } = useApplicationContext();
  const [stepText, setStepText] = useState<string>("");
  const [tableData, setTableData] = useState<TableStep[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);
  const [editingStepId, setEditingStepId] = useState<number | null>(null);
  const [editingStepText, setEditingStepText] = useState<string>("");
  const [stepError, setStepError] = useState<string>("");
  const [isAddingStep, setIsAddingStep] = useState<boolean>(false);
  const [isUpdatingStep, setIsUpdatingStep] = useState<boolean>(false);
  const { hasAccess } = useUserPermission();

  const canAddOrUpdate = hasAccess('data_field_addition');

  useEffect(() => {
    var tData: TableStep[] = [];
    if (phaseSteps) {
      for (let i = 0; i < phaseSteps?.length; i++) {
        tData.push({
          id: phaseSteps[i]?.id,
          status: phaseSteps[i]?.status,
          step: phaseSteps[i]?.step,
        });
      }
    }
    setTableData(tData);
  }, [phaseSteps]);

  const handleDeleteStep = useCallback(async (stepId: number) => {
    if (loginResponse) {
      try {
        const payload = {
          step_id: stepId,
          company_id: Number(loginResponse?.company_id),
          user_id: Number(loginResponse?.id),
          phase_id: cbdPhaseData.id,
        };
        await deleteCbdPhaseStep(payload);
        setTableData(prev => prev.filter(step => step.id !== stepId));
        await fetchCBDPhases();
        toast.success("Step deleted successfully");
      } catch (e) {
        console.log("[HANDLE_STEP_DELETE]: ", e);
        toast.error("Failed to delete step");
      }
    }
  }, [loginResponse, fetchCBDPhases, cbdPhaseData]);

  const handleStepUpdate = useCallback(async (stepId: number, newStepText: string) => {
    if (loginResponse) {
      setIsUpdatingStep(true);
      try {
        const payload = {
          step_id: stepId,
          step: newStepText,
          company_id: Number(loginResponse?.company_id),
          user_id: Number(loginResponse?.id),
          phase_id: cbdPhaseData.id,
        };
        await renameCbdPhaseStep(payload);
        setTableData(prev => prev.map(step => 
          step.id === stepId ? { ...step, step: newStepText } : step
        ));
        await fetchCBDPhases();
        setEditingStepId(null);
        setEditingStepText("");
        toast.success("Step updated successfully");
      } catch (e) {
        console.log("[HANDLE_STEP_UPDATE]: ", e);
        toast.error("Failed to update step");
      } finally {
        setIsUpdatingStep(false);
      }
    }
  }, [loginResponse, fetchCBDPhases, cbdPhaseData]);

  const handleModalConfirm = useCallback(async () => {
    if (selectedStepId) {
      await handleDeleteStep(selectedStepId);
      setIsDeleteModalOpen(false);
      setSelectedStepId(null);
    }
  }, [selectedStepId, handleDeleteStep]);

  const handleStepAdd = useCallback(async () => {
    setStepError("");
    
    if (!stepText.trim()) {
      setStepError("Step cannot be empty");
      return;
    }

    if (loginResponse) {
      setIsAddingStep(true);
      try {
        const payload = {
          user_id: loginResponse.id,
          step: stepText.trim(),
          phase_id: cbdPhaseData.id,
          company_id: Number(loginResponse?.company_id),
        };
        const response = await addCBDPhaseStep(payload);
        if (response?.data && typeof response.data === 'object' && 'id' in response.data) {
          setTableData(prev => [...prev, {
            id: (response.data as any).id,
            step: stepText.trim(),
            status: 'pending'
          }]);
        }
        setAddStep(false);
        setStepText("");
        await fetchCBDPhases();
        toast.success("Step added successfully");
      } catch (e) {
        console.log("[HANDLE_STEP_ADD]: ", e);
        toast.error("Failed to add step");
      } finally {
        setIsAddingStep(false);
      }
    }
  }, [loginResponse, stepText, cbdPhaseData]);

  return (
    <>
      <div className="flex justify-center flex-col">
        {addStep && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 mt-2">
              <Input
                className={`w-full ${stepError ? 'border-red-500' : ''}`}
                value={stepText}
                onChange={(e) => setStepText(e.target.value)}
                placeholder="Enter step description"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isAddingStep) {
                    handleStepAdd();
                  } else if (e.key === 'Escape') {
                    setAddStep(false);
                    setStepText('');
                    setStepError('');
                  }
                }}
              />
              <Button onClick={handleStepAdd} disabled={isAddingStep}>
                {isAddingStep ? "Adding..." : "Add"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setAddStep(false);
                  setStepText('');
                  setStepError('');
                }}
                disabled={isAddingStep}
              >
                Cancel
              </Button>
            </div>
            {stepError && <p className="text-red-500 text-sm">{stepError}</p>}
          </div>
        )}
        
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>Step</TableHead>
              <TableHead className="w-[140px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  {editingStepId === record.id ? (
                    <div className="flex gap-2 w-full">
                      <Input
                        value={editingStepText}
                        onChange={(e) => setEditingStepText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleStepUpdate(record.id, editingStepText);
                          } else if (e.key === 'Escape') {
                            setEditingStepId(null);
                            setEditingStepText("");
                          }
                        }}
                        autoFocus
                      />
                      <Button 
                        size="sm"
                        onClick={() => handleStepUpdate(record.id, editingStepText)}
                        disabled={isUpdatingStep}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingStepId(null);
                          setEditingStepText("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm">{record?.step}</p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canAddOrUpdate}
                      onClick={() => {
                        setEditingStepId(record.id);
                        setEditingStepText(record.step);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!canAddOrUpdate}
                      onClick={() => {
                        setSelectedStepId(record.id);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Step</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this step?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteModalOpen(false);
              setSelectedStepId(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleModalConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// PhaseBox Component
const PhaseBox: React.FC<PhaseBoxProps> = ({ cbdPhaseData, fetchCBDPhases }) => {
  const { loginResponse } = useApplicationContext();
  const [addStep, setAddStep] = useState(false);
  const [phaseSteps, setPhaseSteps] = useState<Step[]>();
  const { hasAccess } = useUserPermission();
  const canAddOrUpdate = hasAccess('data_field_addition');

  useEffect(() => {
    if (loginResponse) {
      setPhaseSteps(cbdPhaseData?.steps);
    }
  }, [loginResponse, cbdPhaseData]);

  return (
    <Card className="w-full rounded-lg">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-8">
            <CardTitle className="text-lg text-gray-700">
              Phase {cbdPhaseData?.phase}
            </CardTitle>
            <Button
              disabled={!canAddOrUpdate}
              onClick={() => setAddStep(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Step
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <PhaseSteps
          cbdPhaseData={cbdPhaseData}
          fetchCBDPhases={fetchCBDPhases}
          phaseSteps={phaseSteps}
          setAddStep={setAddStep}
          addStep={addStep}
        />
      </CardContent>
    </Card>
  );
};

// Main OnBoardingDataRules Component
const OnBoardingDataRules = () => {
  const { loginResponse } = useApplicationContext();
  const [cbdPhases, setCbdPhases] = useState<PhasesList>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [steps, setSteps] = useState<string[]>(['']);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [phaseToDelete, setPhaseToDelete] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<{ id: number, name: string } | null>(null);
  const [stepError, setStepError] = useState<string>('');
  const [phaseName, setPhaseName] = useState<string>('');
  const { hasAccess } = useUserPermission();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const canAddOrUpdate = hasAccess('data_field_addition');

  const fetchCBDPhases = useCallback(async () => {
    if (loginResponse && loginResponse.company_id) {
      setIsLoading(true);
      try {
        const response = await getCBDPhases({
          company_id: loginResponse.company_id,
        });
        console.log(response.length);
        setCbdPhases(response);
      } catch (e) {
        console.log(e);
      } finally {
        setIsLoading(false);
      }
    }
  }, [loginResponse]);

  useEffect(() => {
    fetchCBDPhases();
  }, [fetchCBDPhases]);

  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
  };

  const handleSavePhase = async () => {
    if (steps.some(step => !step.trim())) {
      setStepError('Please fill in all steps or remove empty ones');
      return;
    }
    setStepError('');

    if (loginResponse && loginResponse.company_id) {
      try {
        const phasePayload = {
          user_id: Number(loginResponse?.id),
          phase: phaseName || (cbdPhases.length + 1).toString(),
          company_id: loginResponse.company_id,
        };
        const phaseResponse = await addCBDPhase(phasePayload);
        console.log("Phase id",phaseResponse.data);
        
        if (!phaseResponse?.data || typeof phaseResponse.data !== 'object' || !('phase_id' in phaseResponse.data)) {
          throw new Error('Failed to get phase ID from response');
        }
        const phaseId = Number((phaseResponse.data as any).phase_id);
        
        const stepPromises = steps.map(step => 
          addCBDPhaseStep({
            user_id: Number(loginResponse?.id),
            step: step,
            phase_id: phaseId,
            company_id: loginResponse.company_id,
          })
        );

        await Promise.all(stepPromises);
        toast.success('Phase and steps added successfully');
        setIsModalOpen(false);
        setSteps(['']);
        setPhaseName('');
        fetchCBDPhases();
      } catch (e) {
        toast.error('Failed to add phase and steps');
        console.log(e);
      }
    }
  };

  const handleDeletePhase = async (phaseId: number) => {
    if (loginResponse && loginResponse.company_id) {
      try {
        await deleteCbdPhase({
          phase_id: phaseId,
          company_id: loginResponse.company_id,
          user_id: Number(loginResponse?.id)
        });
        toast.success('Phase deleted successfully');
        fetchCBDPhases();
      } catch (e) {
        toast.error('Failed to delete phase');
        console.log(e);
      }
    }
  };

  const handleUpdatePhase = async (phaseId: number, newName: string) => {
    if (loginResponse && loginResponse.company_id) {
      try {
        await renameCbdPhase({
          phase_id: phaseId,
          company_id: loginResponse.company_id,
          user_id: Number(loginResponse?.id),
          phase: newName
        });
        toast.success('Phase updated successfully');
        fetchCBDPhases();
        setEditModalOpen(false);
        setEditingPhase(null);
      } catch (e) {
        toast.error('Failed to update phase');
        console.log(e);
      }
    }
  }

  const showDeleteModal = (phaseId: number) => {
    setPhaseToDelete(phaseId);
    setDeleteModalOpen(true);
  };

  const showEditModal = (phaseId: number, currentName: string) => {
    setEditingPhase({ id: phaseId, name: currentName });
    setEditModalOpen(true);
  };

  return (
    <div className="">
      <div className="mb-6">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canAddOrUpdate} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Phase
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Create New Phase
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Add a new phase to your onboarding process with multiple steps to guide your workflow.
              </p>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Phase Name Section */}
              <div className="space-y-2">
                <Label htmlFor="phase-name" className="text-sm font-medium">
                  Phase Name
                </Label>
                <Input
                  id="phase-name"
                  value={phaseName}
                  onChange={(e) => setPhaseName(e.target.value)}
                  placeholder={`Phase ${cbdPhases.length + 1}`}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Give your phase a descriptive name (e.g., "Initial Setup", "Configuration", "Testing")
                </p>
              </div>
              
              <Separator />
              
              {/* Steps Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Phase Steps</Label>
                  <span className="text-xs text-muted-foreground">
                    ({steps.length} step{steps.length !== 1 ? 's' : ''})
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {steps.map((step, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex gap-3 items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                          <span className="text-xs font-medium text-primary">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label htmlFor={`step-${index}`} className="text-sm font-medium">
                            Step {index + 1}
                          </Label>
                          <Input
                            id={`step-${index}`}
                            value={step}
                            onChange={(e) => {
                              const newSteps = [...steps];
                              newSteps[index] = e.target.value;
                              setSteps(newSteps);
                              setStepError('');
                            }}
                            placeholder={`Enter step ${index + 1} description...`}
                            className={`h-10 ${stepError && index === steps.length - 1 ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {steps.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveStep(index)}
                            className="mt-6 h-8 w-8 p-0 border-red-200 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                      {index === steps.length - 1 && stepError && (
                        <p className="text-red-500 text-sm ml-11">{stepError}</p>
                      )}
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={handleAddStep} 
                  className="w-full h-10 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Step
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Add multiple steps to break down complex processes into manageable tasks
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-muted-foreground">
                {steps.filter(step => step.trim()).length} of {steps.length} steps completed
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsModalOpen(false);
                    setSteps(['']);
                    setPhaseName('');
                    setStepError('');
                  }}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSavePhase}
                  className="px-6 bg-primary hover:bg-primary/90"
                  disabled={!phaseName.trim() && steps.every(step => !step.trim())}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Phase
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Phase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this phase and all its steps?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (phaseToDelete) handleDeletePhase(phaseToDelete);
                setDeleteModalOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Phase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-phase-name">Phase Name</Label>
              <Input
                id="edit-phase-name"
                value={editingPhase?.name || ''}
                onChange={(e) => setEditingPhase(prev => prev ? {...prev, name: e.target.value} : null)}
                placeholder="Enter phase name"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditModalOpen(false);
                setEditingPhase(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingPhase) {
                handleUpdatePhase(editingPhase.id, editingPhase.name);
              }
            }}>
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-6 w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading phases...</p>
            </div>
          </div>
        ) : cbdPhases.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No phases found</p>
              <p className="text-sm text-muted-foreground">Click "Add New Phase" to create your first phase</p>
            </div>
          </div>
        ) : (
          cbdPhases.map((cbdPhase, i) => (
            <div key={i} className="w-full relative">
              <PhaseBox
                boxNumber={i}
                cbdPhaseData={cbdPhase}
                fetchCBDPhases={fetchCBDPhases}
              />
              <div className="absolute top-6 right-6 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!canAddOrUpdate}
                  onClick={() => showEditModal(cbdPhase.id, cbdPhase.phase || `Phase ${i + 1}`)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm"
                  variant="destructive"
                  disabled={!canAddOrUpdate}
                  onClick={() => showDeleteModal(cbdPhase.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OnBoardingDataRules;