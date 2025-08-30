import { updateNodes } from "@/api";
import { useActionQuery } from "@/hooks/useActionQuery";
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { useElementsStore } from "@/hooks/useElementsStore";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import { cn } from "@/lib/utils";
import { Element, NodeData } from "@/types";
import { isNode } from "@/utils/helpers";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ActionDetailsBodyProps {
  data: NodeData;
  elements: Element[];
  setElements: React.Dispatch<React.SetStateAction<Element[]>>;
  typeId: string | null;
}

export const ActionDetailsBody = ({
  data,
  elements,
  setElements,
  typeId,
}: ActionDetailsBodyProps) => {
  const [actionDetails, setActionDetails] = useState({
    prompt: data?.prompt || "",
    input: data?.input || "",
    background_prompt: data?.background_prompt || "",
    node_name: data?.title || "Generate Text",
  });
  const { loginResponse } = useApplicationContext();
  const state = useWorkflowStore((state) => state);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { Objects, setObjects } = useElementsStore((state) => state);
  const { onClose, setInteractivity } = useActionQuery((state) => state);
  const [advancedSettingsCollapsed, setAdvancedSettingsCollapsed] =
    useState(true);
  const [selectedModel, setSelectedModel] = useState("gpt-4");

  const tempList = ["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7"];
  const [selectedTemp, setSelectedTemp] = useState("0.7");

  if (!loginResponse) return null;

  const onNodeNameChange = (e: any) => {
    setActionDetails({ ...actionDetails, node_name: e.target.value });
  };

  const onPromptChange = (e: any) => {
    setActionDetails({ ...actionDetails, prompt: e.target.value });
  };
  const onBackgroundPromptChange = (e: any) => {
    setActionDetails({ ...actionDetails, background_prompt: e.target.value });
  };
  const onInputChange = (e: any) => {
    setActionDetails({ ...actionDetails, input: e.target.value });
  };

  const onActionSave = async () => {
    setIsSubmitting(true);
    if (!typeId) return;
    setErrorMessage("");
    if (
      actionDetails.background_prompt === "" &&
      actionDetails.input === "" &&
      actionDetails.prompt === "" &&
      actionDetails.node_name === ""
    ) {
      setErrorMessage("Please fill the fields.");
      return;
    }

    try {
      const response = await updateNodes({
        company_id: loginResponse.company_id,
        user_id: loginResponse.id,
        workflow_id: state.workflowId,
        id: data.id,
        node_name: actionDetails.node_name,
        prompt: actionDetails.prompt,
        input: actionDetails.input,
        background_prompt: actionDetails.background_prompt,
      });
      if (response.status != 200) {
        setErrorMessage("Error updating action details");
        return;
      }
      const updatedElements = elements.map((el) =>
        isNode(el) && el.id === typeId
          ? {
              ...el,
              data: {
                ...el.data,
                title: actionDetails.node_name,
                prompt: actionDetails.prompt,
                input: actionDetails.input,
                background_prompt: actionDetails.background_prompt,
              },
            }
          : el
      );
      setElements((prevElements) =>
        prevElements.map((el) =>
          isNode(el) && el.id === typeId
            ? {
                ...el,
                data: {
                  ...el.data,
                  title: actionDetails.node_name,
                  prompt: actionDetails.prompt,
                  input: actionDetails.input,
                  background_prompt: actionDetails.background_prompt,
                },
              }
            : el
        )
      );
      setObjects(updatedElements);
      setTimeout(() => {
        onClose();
        setInteractivity(true);
        setIsSubmitting(false);
        toast.success("Action details updated successfully");
      }, 1000);
    } catch (error) {
      console.error("Error updating action details:", error);
      setErrorMessage("Error updating action details");
      toast.error("Error updating action details");
    } finally {
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="uppercase text-xs text-gray-800 font-semibold">Name</p>
        <p className="text-xs text-gray-600">
          Provide the name of the action. This will help you identify the
          action.
        </p>
        <input
          disabled={isSubmitting}
          value={actionDetails.node_name}
          onChange={onNodeNameChange}
          placeholder="Enter the name"
          className="w-full outline-none border py-2 px-3 rounded-lg mt-3 border-gray-400 focus:border-gray-500 transition-all text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex flex-col gap-1">
        <p className="uppercase text-xs text-gray-800 font-semibold">Input</p>
        <p className="text-xs text-gray-600">
          Enter the input data or information you want to send to the AI model.
        </p>
        <input
          disabled={isSubmitting}
          value={actionDetails.input}
          onChange={onInputChange}
          placeholder="Enter the input"
          className="w-full outline-none border py-2 px-3 rounded-lg mt-3 border-gray-400 focus:border-gray-500 transition-all text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex flex-col gap-1">
        <p className="uppercase text-xs text-gray-800 font-semibold">Prompt</p>
        <p className="text-xs text-gray-600">
          Enter the main instruction or question you want to send to the AI
          model. Be clear and specific.
        </p>
        <input
          disabled={isSubmitting}
          value={actionDetails.prompt}
          onChange={onPromptChange}
          placeholder="Enter the prompt"
          className="w-full outline-none border py-2 px-3 rounded-lg mt-3 border-gray-400 focus:border-gray-500 transition-all text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex flex-col gap-1">
        <p className="uppercase text-xs font-semibold text-gray-800">
          Background Information
        </p>
        <p className="text-xs text-gray-600">
          Provide any additional context, examples, or guidelines you want the
          AI to consider when responding to the prompt. This can help improve
          the quality and accuracy of the output.
        </p>
        <input
          disabled={isSubmitting}
          value={actionDetails.background_prompt}
          onChange={onBackgroundPromptChange}
          placeholder="Enter the background prompt"
          className="w-full outline-none border py-2 px-3 rounded-lg mt-3 border-gray-400 focus:border-gray-500 transition-all text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>
      <div>
        <div
          className="border-t border-b border-t-gray-500 border-b-gray-500 py-4 px-2 group hover:bg-gray-50 flex items-center justify-between"
          role="button"
          onClick={() => setAdvancedSettingsCollapsed((prev) => !prev)}
        >
          <p className="text-sm !font-semibold text-gray-500 group-hover:text-gray-600">
            Advanced Settings
          </p>
          {advancedSettingsCollapsed ? (
            <ChevronDown className="text-gray-500 group-hover:text-gray-600 h-5 w-5" />
          ) : (
            <ChevronRight className="text-gray-500 group-hover:text-gray-600 h-5 w-5" />
          )}
        </div>
        {!advancedSettingsCollapsed && (
          <div className="px-2 py-1 flex flex-col gap-3 mt-4">
            <div className="flex flex-col gap-1">
              <p className="uppercase text-xs font-semibold text-gray-800">
                AI Model
              </p>
              <p className="text-xs text-gray-600">
                Select the AI model to use for generating the output.{" "}
                <span className="text-indigo-600 hover:underline hover:cursor-pointer">
                  Different models have different capabilities, so choose the
                  one that best fits your task.
                </span>
              </p>
              <Select
                defaultValue="gpt-4"
                value={selectedModel}
                onValueChange={(e) => setSelectedModel(e)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full mt-2 border-gray-400">
                  <SelectValue placeholder="Select any model" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <p className="uppercase text-xs font-semibold text-gray-800">
                Creativity Level (Temperature)
              </p>
              <p className="text-xs text-gray-600">
                Adjust how creative or predictable you want the AI's output to
                be. Lower values produce more focused, deterministic results,
                while higher values allow for more randomness and creativity.
                (note: GPT o1 and o1-mini do not support temperature)
              </p>
              <Select
                defaultValue={selectedTemp}
                value={selectedTemp}
                onValueChange={(e) => setSelectedTemp(e)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full mt-2 border-gray-400">
                  <SelectValue placeholder="Select temperature" />
                </SelectTrigger>

                <SelectContent>
                  {tempList.map((item) => (
                    <SelectItem value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="h-[30px] w-full rounded-lg py-2 px-3 flex items-center justify-center bg-red-100">
          <p className="text-red-500">{errorMessage}</p>
        </div>
      )}
      <button
        className={cn(
          "mt-4 w-full bg-indigo-200/80 py-2 px-3 rounded-lg text-indigo-500 font-semibold text-sm hover:text-indigo-700 hover:bg-indigo-200 transition-all disabled:cursor-not-allowed disabled:hover:bg-indigo-200/80 disabled:hover:text-indigo-500",
          errorMessage && "-mt-4"
        )}
        disabled={isSubmitting}
        onClick={onActionSave}
      >
        {isSubmitting ? (
          <div className="flex gap-2 items-center justify-center">
            <p className="text-[16px] font-semibold">Saving</p>
            <div className="w-4 h-4 animate-spin flex justify-center items-center">
              <div className="h-4 w-4 border-2 border-t-indigo-400 border-b-indigo-500 border-r-indigo-500 border-l-gray-400 rounded-full"></div>
            </div>
          </div>
        ) : (
          <p className="font-semibold text-[16px]">Save Action</p>
        )}
      </button>
    </div>
  );
};
