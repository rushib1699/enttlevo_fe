import { TypeoW } from "@/types";
import { create } from "zustand";

type WorkflowStore = {
  workflowId: number | null;
  company_id: number | null;
  workflowName: string | null;
  workflowType: TypeoW;
  workflowActive: boolean;
  isLoadingWorkflow: boolean;
  isPublished: boolean;
  workflowOutput: string;
  outputOpen: boolean;
  isRunningWorkflow: boolean;
  setWorkflowActive: (workflowActive: boolean) => void;
  setIsRunningWorkflow: (isRunningWorkflow: boolean) => void;
  setOutputOpen: (isOpen: boolean) => void;
  setWorkflowOutput: (output: string) => void;
  setIsPublished: (isPublished: boolean) => void;
  setIsLoadingWorkflow: (isLoading: boolean) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowType: (type: TypeoW) => void;
  setWorkflowId: (id: number) => void;
  setCompany_id: (id: number) => void;
};

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  workflowId: null,
  company_id: null,
  workflowName: null,
  workflowType: TypeoW.GENERAL,
  isLoadingWorkflow: true,
  workflowOutput: "",
  isPublished: false,
  outputOpen: false,
  isRunningWorkflow: false,
  workflowActive: false,
  setWorkflowActive: (workflowActive) => set({ workflowActive }),
  setIsRunningWorkflow: (isRunningWorkflow) => set({ isRunningWorkflow }),
  setIsPublished: (isPublished: boolean) => set({ isPublished: isPublished }),
  setOutputOpen: (isOpen: boolean) => set({ outputOpen: isOpen }),
  setWorkflowOutput: (output: string) => set({ workflowOutput: output }),
  setIsLoadingWorkflow: (isLoading: boolean) =>
    set({ isLoadingWorkflow: isLoading }),
  setWorkflowName: (name: string) => set({ workflowName: name }),
  setWorkflowType: (type: TypeoW) => set({ workflowType: type }),
  setWorkflowId: (id: number) => set({ workflowId: id }),
  setCompany_id: (id: number) => set({ company_id: id }),
}));
