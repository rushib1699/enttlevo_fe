import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { generateOutput, getNodes, getWorkflowsByType } from "@/api";
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { formatDistanceToNow } from "date-fns";
import {
  convertElementsToPromptList,
  convertResponseToElements,
} from "@/utils/helpers";
import { Prompt, TypeoW } from "@/types";
import { toast } from "sonner";
import { Copy, Loader2 } from "lucide-react";
import { parseMathContent, renderMathContent } from "@/utils/Formatting";

const formatText = (text: string) => {
  const sections = parseMathContent(text);
  return renderMathContent(sections);
};

interface SummarizeModalProps {
  visible: boolean;
  loadingSummary: string | null;
  onCancel: () => void;
  email: any;
  workflowGeneratedOutput: {
    emailId: null | string;
    output: string;
  };
  setWorkflowGeneratedOutput: React.Dispatch<
    React.SetStateAction<{
      emailId: null | string;
      output: string;
    }>
  >;
}

const SummarizeModal: React.FC<SummarizeModalProps> = ({
  visible,
  onCancel,
  loadingSummary,
  email,
  workflowGeneratedOutput,
  setWorkflowGeneratedOutput,
}) => {
  const [workflows, setWorkflows] = useState([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true);
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState("");
  const { loginResponse } = useApplicationContext();

  if (!loginResponse) return null;

  const getWorkflows = useCallback(async () => {
    try {
      setIsLoadingWorkflows(true);
      const resp = await getWorkflowsByType({
        company_id: loginResponse.company_id,
        type: TypeoW.EMAIL,
      });
      const updatedResponse = resp.map((workflow: any) => ({
        id: workflow.id,
        name: workflow.name,
        workflow_type: workflow.workflow_type,
        is_published: workflow.is_published,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at,
        created_relative: formatDistanceToNow(new Date(workflow.created_at), {
          addSuffix: true,
        }),
        updated_relative: formatDistanceToNow(new Date(workflow.updated_at), {
          addSuffix: true,
        }),
      }));
      const filteredUpdatedResponse = updatedResponse.filter(
        (workflow: any) => workflow.is_published
      );
      setWorkflows(filteredUpdatedResponse);
      if (filteredUpdatedResponse.length > 0) {
        setSelectedWorkflow(filteredUpdatedResponse[0].id);
      }
    } catch (error) {
      console.error("Error loading workflows:", error);
      toast.error("Failed to load workflows");
    } finally {
      setIsLoadingWorkflows(false);
    }
  }, [loginResponse?.company_id]);

  useEffect(() => {
    if (visible) {
      getWorkflows();
    }
  }, [getWorkflows, visible]);

  const handleCopyToClipboard = async () => {
    if (workflowGeneratedOutput?.output?.length) {
      try {
        await navigator.clipboard.writeText(workflowGeneratedOutput.output);
        toast.success("Summary copied to clipboard!");
      } catch (error) {
        console.error("Failed to copy summary:", error);
        toast.error("Failed to copy summary");
      }
    }
  };

  const onRunWorkflowClick = async () => {
    setIsExecutingWorkflow(true);
    try {
      const response = await getNodes({
        company_id: loginResponse.company_id!,
        workflow_id: parseInt(selectedWorkflow!),
        is_template: 0,
      });
      const elements: any[] = convertResponseToElements(response);
      const { promptList }: { promptList: Prompt[] } =
        convertElementsToPromptList(elements);

      const promptListWithoutRoot = promptList.filter(
        (prompt) => prompt.use_input !== "0"
      );
      const rootNode = promptList.find((prompt) => prompt.use_input === "0");
      if (!rootNode) {
        toast.error("Something went wrong. Please try again later.");
        return;
      }
      rootNode.Input = email.body;
      const updatedPromptList = [...promptListWithoutRoot, rootNode];

      const payload = { promptList: updatedPromptList };
      try {
        const response = await generateOutput(payload);
        const output = response.content;
        setWorkflowGeneratedOutput({
          emailId: email.id,
          output,
        });
      } catch (error) {
        toast.error("Failed to generate summary");
      }
    } catch (error) {
      toast.error("An error occurred while executing the workflow");
    } finally {
      setIsExecutingWorkflow(false);
    }
  };

  return (
    <Dialog open={visible} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Automate Email Summary</DialogTitle>
        </DialogHeader>

        {loadingSummary ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
            <span className="ml-2">Loading summary...</span>
          </div>
        ) : (
          <>
            {isLoadingWorkflows ? (
              <div className="flex justify-center items-center min-h-[100px]">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : workflows.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <p className="text-lg font-medium text-blue-700 mb-2">
                      Select a Workflow
                    </p>
                    <Select
                      value={selectedWorkflow}
                      onValueChange={(value) => setSelectedWorkflow(value)}
                      disabled={isExecutingWorkflow}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a workflow" />
                      </SelectTrigger>
                      <SelectContent>
                        {workflows.map((workflow: any) => (
                          <SelectItem key={workflow.id} value={workflow.id}>
                            {workflow.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={onRunWorkflowClick}
                      disabled={isExecutingWorkflow}
                    >
                      {isExecutingWorkflow ? (
                        <>
                          <span>Running</span>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        </>
                      ) : workflowGeneratedOutput.output.length === 0 ? (
                        "Execute"
                      ) : (
                        "Run Again"
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                {isExecutingWorkflow ? (
                  <div className="flex flex-col justify-center items-center min-h-[200px]">
                    <h4 className="text-xl font-semibold text-blue-700 mb-4">
                      Generating Summary...
                    </h4>
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <>
                    {workflowGeneratedOutput.output.length > 0 ? (
                      <Card className="rounded-lg">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <h3 className="text-lg font-semibold">Workflow Summary</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyToClipboard}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <p className="text-base text-blue-800">
                            {formatText(workflowGeneratedOutput.output)}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="flex justify-center items-center min-h-[200px]">
                        <p className="text-gray-500">No summary generated.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="p-4">
                <p className="text-red-500">
                  No workflows found for this company.
                </p>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SummarizeModal;
