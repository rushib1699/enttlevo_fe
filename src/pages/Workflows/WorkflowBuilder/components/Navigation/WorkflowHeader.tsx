import { Element, Prompt } from "@/types";
import {
  deleteWorkflow,
  generateOutput,
  publishWorkflow,
  updateWorkflow,
} from "@/api";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import { toast } from "sonner";
import React from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { convertElementsToPromptList } from "@/utils/helpers";
import { useActionQuery } from "@/hooks/useActionQuery";

export const WorkflowHeader = ({ elements }: { elements: Element[] }) => {
  const { loginResponse } = useApplicationContext();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const { setInteractivity } = useActionQuery();
  const workflowId = queryParams.get("workflowId");
  const state = useWorkflowStore((state: any) => state);
  const [isPublishing, setIsPublishing] = React.useState(false);

  if (!loginResponse) return null;

  const generatePrompt = async () => {
    if (state.outputOpen) {
      state.setOutputOpen(false);
    }
    state.setIsRunningWorkflow(true);
    const { promptList }: { promptList: Prompt[] } =
      convertElementsToPromptList(elements);
    const payload = { promptList };
    try {
      const response = await generateOutput(payload);
      const output = response.content;
      state.setWorkflowOutput(output);
      const payload2 = {
        id: parseInt(workflowId!),
        company_id: loginResponse.company_id,
        user_id: loginResponse.id,
        workflow_output: output,
        email: state.workflowType,
      };
      const resp2 = await updateWorkflow({
        id: parseInt(workflowId!),
        company_id: loginResponse.company_id,
        user_id: loginResponse.id,
        workflow_output: output,
        email: state.workflowType,
      });
      toast.success("Workflow executed successfully!");
      setTimeout(() => {
        state.setOutputOpen(true);
        setInteractivity(false);
      }, 500);
    } catch (e) {
      toast.error("Something went wrong!");
    } finally {
      state.setIsRunningWorkflow(false);
    }
  };

  const onCheckOutput = () => {
    state.setOutputOpen(true);
    setInteractivity(false);
  };

  const onPublishToggleWorkflow = async () => {
    setIsPublishing(true);
    const payload = {
      id: parseInt(workflowId!),
      company_id: loginResponse.company_id,
      user_id: loginResponse.id,
      is_published: state.isPublished ? 0 : 1,
    };
    try {
      const resp = await publishWorkflow(payload);
      if (payload.is_published === 1) {
        toast.success("Workflow published successfully");
      } else {
        toast.success("Workflow unpublished!");
      }
      state.setIsPublished(!state.isPublished);
    } catch (e) {
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsPublishing(false);
    }
  };

  const onDeleteWorkflow = async () => {
    if (workflowId) {
      await deleteWorkflow({
        id: parseInt(workflowId!),
        company_id: loginResponse.company_id,
        user_id: loginResponse.id,
      });
    }
    navigate("/integrations/workflows");
  };

  const navigateToHome = () => {
    navigate("/integrations/workflows");
    window.location.reload();
  };

  return (
    <div className="h-[50px] min-h-[50px] border-b border-b-gray-200/75 bg-gray-50 w-full relative">
      {!state.isLoadingWorkflow && (
        <div className="flex items-center justify-center gap-3 absolute left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%]">
          <button
            className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded-md cursor-pointer group transition-all disabled:pointer-events-none disabled:cursor-not-allowed"
            role="button"
            disabled={state.isRunningWorkflow}
            onClick={generatePrompt}
          >
            {!state.isRunningWorkflow ? (
              <p className="text-gray-700 group-hover:text-gray-800">
                Test Workflow
              </p>
            ) : (
              <div className="flex items-center justify-center gap-1">
                <p>Generating</p>
                <div className="w-3 h-3 border-2 border-t-gray-400 border-b-gray-500 border-r-gray-500  border-l-gray-400 rounded-full animate-spin"></div>
              </div>
            )}
          </button>
          {state.workflowOutput && (
            <div
              className="px-2 text-sm py-1 bg-gray-200 hover:bg-gray-300 border border-gray-300 rounded-md cursor-pointer group transition-all disabled:pointer-events-none disabled:cursor-not-allowed"
              role="button"
              onClick={onCheckOutput}
            >
              <p className="text-gray-700 group-hover:text-gray-800">
                Check output
              </p>
            </div>
          )}
        </div>
      )}
      <div className="flex flex-row justify-between items-center h-full px-4 w-full">
        <div className="flex items-center gap-3">
          <div
            role="button"
            onClick={navigateToHome}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="text-gray-700 h-6 w-6" />
            <p className="text-gray-700 font-semibold text-sm">Workflows</p>
          </div>
          <p className="text-gray-700 font-semibold text-sm">/</p>
          <p className="text-gray-700 font-semibold text-sm">
            {params.workflowName}
          </p>
        </div>

        <div className="flex flex-row gap-2">
          <button
            className="px-2 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:cursor-not-allowed"
            onClick={onDeleteWorkflow}
            disabled={isPublishing || state.isRunningWorkflow}
          >
            Delete Workflow
          </button>
          <button
            className={cn(
              "px-2 text-sm py-1  rounded-md disabled:cursor-not-allowed",
              state.isPublished
                ? "bg-gray-950/90 text-white hover:bg-gray-950"
                : "bg-green-500 text-white hover:bg-green-600"
            )}
            onClick={onPublishToggleWorkflow}
            disabled={isPublishing || state.isRunningWorkflow}
          >
            {state.isPublished ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
};
