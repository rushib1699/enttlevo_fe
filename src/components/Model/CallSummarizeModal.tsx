import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateOutput, getNodes, getWorkflowsByType, uploadAudioWithUrl } from "@/api";
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { formatDistanceToNow } from "date-fns";
import {
  convertElementsToPromptList,
  convertResponseToElements,
} from "@/utils/helpers";
import { Prompt, TypeoW } from "@/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { parseMathContent, renderMathContent } from "@/utils/Formatting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Copy, Loader2, Mic } from "lucide-react";

const formatText = (text: string) => {
  // parse and bold the text
  const sections = parseMathContent(text);
  return renderMathContent(sections);
};

interface SummarizeModalProps {
  visible: boolean;
  loadingSummary: boolean;
  onCancel: () => void;
  transcript: any;
  workflowGeneratedOutput: {
    transcriptId: null | string;
    output: string;
  };
  setWorkflowGeneratedOutput: React.Dispatch<
    React.SetStateAction<{
      transcriptId: null | string;
      output: string;
    }>
  >;
  recordingUrl?: string;
}

const CallSummarizeModal: React.FC<SummarizeModalProps> = ({
  visible,
  onCancel,
  loadingSummary,
  transcript,
  workflowGeneratedOutput,
  setWorkflowGeneratedOutput,
  recordingUrl,
}) => {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(true);
  const [isExecutingWorkflow, setIsExecutingWorkflow] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState("");
  const { loginResponse } = useApplicationContext();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<string>("");

  if (!loginResponse) return null;

  const getWorkflows = useCallback(async () => {
    try {
      setIsLoadingWorkflows(true);
      const resp = await getWorkflowsByType({
        company_id: loginResponse.company_id,
        type: TypeoW.GENERAL,
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
      toast.error("Failed to load workflows.");
    } finally {
      setIsLoadingWorkflows(false);
    }
  }, [loginResponse?.company_id]);

  useEffect(() => {
    if (visible) {
      getWorkflows();
    }
  }, [getWorkflows, visible]);

  const onWorkflowChange = (value: string) => {
    setSelectedWorkflow(value);
  };

  const onRunWorkflowClick = async () => {
    setIsExecutingWorkflow(true);
    try {
      const response = await getNodes({
        company_id: loginResponse.company_id!,
        workflow_id: parseInt(selectedWorkflow, 10),
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
      rootNode.Input = transcript.transcript;
      const updatedPromptList = [...promptListWithoutRoot, rootNode];
      const payload = { promptList: updatedPromptList };

      try {
        const outputResponse = await generateOutput(payload);
        const output = outputResponse.content;
        setWorkflowGeneratedOutput({
          transcriptId: transcript.id,
          output,
        });
      } catch (generateError) {
        console.error("Error generating summary:", generateError);
        toast.error("Failed to generate summary.");
      }
    } catch (error) {
      console.error("Error executing workflow:", error);
      toast.error("An error occurred while executing the workflow.");
    } finally {
      setIsExecutingWorkflow(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (workflowGeneratedOutput?.output?.length) {
      try {
        await navigator.clipboard.writeText(workflowGeneratedOutput.output);
        toast.success("Summary copied to clipboard!");
      } catch (error) {
        console.error("Failed to copy summary:", error);
        toast.error("Failed to copy summary.");
      }
    }
  };

  const handleTranscribeAudio = async () => {
    if (!recordingUrl) {
      toast.error("No recording URL available");
      return;
    }

    setIsTranscribing(true);
    try {
      const response = await uploadAudioWithUrl({ url: recordingUrl });
      if (response?.transcript) {
        setTranscriptionResult(response.transcript);
        toast.success("Audio transcribed successfully!");
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast.error("Failed to transcribe audio");
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <Dialog open={visible} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Automate Audio Transcript Summary</DialogTitle>
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
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : workflows.length > 0 ? (
              <div className="space-y-6">
                {recordingUrl && (
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={handleTranscribeAudio}
                      disabled={isTranscribing}
                    >
                      {isTranscribing ? (
                        <>
                          <span>Transcribing</span>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-2" />
                          Transcribe Recording
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {transcriptionResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Transcription</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-base">{transcriptionResult}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-lg font-medium text-blue-700 mb-2">
                      Select a Workflow
                    </p>
                    <Select
                      value={selectedWorkflow}
                      onValueChange={onWorkflowChange}
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
                  <Button
                    onClick={onRunWorkflowClick}
                    disabled={isExecutingWorkflow}
                  >
                    {isExecutingWorkflow ? (
                      <>
                        <span>Running</span>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      </>
                    ) : (workflowGeneratedOutput?.output?.length ?? 0) === 0 ? (
                      "Execute"
                    ) : (
                      "Run Again"
                    )}
                  </Button>
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
                    {(workflowGeneratedOutput?.output?.length ?? 0) > 0 ? (
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle>Workflow Summary</CardTitle>
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
                            {formatText(workflowGeneratedOutput?.output ?? "")}
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

export default CallSummarizeModal;
