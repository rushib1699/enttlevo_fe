//@ts-nocheck
import { useLocation, useParams } from "react-router-dom";
import { Element, NodeData } from "@/types";
import { Layout } from "../../Workflow";
import { WorkflowHeader } from "../Navigation/WorkflowHeader";
import { NodePanel } from "../Panels/NodePanel";
import {
  getUpdatedElementsAfterNodeAddition,
  getUpdatedElementsAfterNodeDeletion,
} from "@/utils/workflowElementsUtil";
import { convertResponseToElements } from "@/utils/helpers";
import { useCallback, useEffect } from "react";
import { deleteNode, getNodes, getWorkflow } from "@/api";
import { useElementsStore } from "@/hooks/useElementsStore";
import { useActionQuery } from "@/hooks/useActionQuery";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import { Toaster, toast } from "sonner";
import { OutputPanel } from "../Panels/OutputPanel";
import { useApplicationContext } from "@/hooks/useApplicationContext";
interface WorkspaceProps {
  elements: Element[];
  setElements: React.Dispatch<React.SetStateAction<Element[]>>;
}

export const WorkflowCanvas = ({ elements, setElements }: WorkspaceProps) => {
  const { loginResponse } = useApplicationContext();
  const {
    setWorkflowName,
    setWorkflowType,
    setWorkflowId,
    setCompany_id,
    setWorkflowOutput,
    setIsLoadingWorkflow,
    setIsPublished,
  } = useWorkflowStore((state) => state);
  const {
    Objects,
    setObjects,
    setIsDeletingAction,
    setIsAddingAction,
    isDeletingAction,
    isAddingAction,
  } = useElementsStore();
  const { isOpen, onOpen } = useActionQuery();
  const location = useLocation();
  const { workflowName } = useParams();

  const queryParams = new URLSearchParams(location.search);
  const workflowId = queryParams.get("workflowId");
  const type = queryParams.get("type");

  if (!loginResponse) return null;

  const onAddNodeCallback = async (
    parentNodeId: string,
    cur_elements: Element[],
    type: string
  ) => {
    if (!parentNodeId) {
      toast.error("Something went wrong!");
      return;
    }
    if (isAddingAction) return;
    setIsAddingAction(true);
    try {
      const updatedElements = await getUpdatedElementsAfterNodeAddition({
        elements: cur_elements,
        parentNodeId,
        type,
        onAddNodeCallback,
        onDeleteNodeCallback,
        onNodeClickCallback,
        onNodeTypeChange,
        companyId: loginResponse.company_id!,
        workflowId: parseInt(workflowId!),
        userId: loginResponse.id!,
      });
      setElements(updatedElements);
      toast.success("Action added successfully");
    } catch (error) {
      console.error("Error adding node:", error);
    } finally {
      setIsAddingAction(false);
    }
  };

  const onNodeTypeChange = (nodeId: string, newType: string) => {
    setElements((prevElements) =>
      prevElements.map((el) =>
        el.id === nodeId
          ? {
              ...el,
              type: newType,
              data: {
                ...el.data,
                title: "Generate Text",
              },
            }
          : el
      )
    );
  };

  const onNodeClickCallback = (id: string, data: NodeData) => {
    onOpen(id, data);
  };

  const onDeleteNodeCallback = async (id: number, uuid: string) => {
    if (!id || !uuid) {
      toast.error("Something went wrong!");
      return;
    }
    if (isDeletingAction) return;
    setIsDeletingAction(true);

    const deletePayload = {
      id: Number(id),
      company_id: loginResponse.company_id!,
      workflow_id: workflowId!,
      user_id: loginResponse.id!,
    };

    try {
      const resp = await deleteNode(deletePayload);

      setElements((elements) => {
        return getUpdatedElementsAfterNodeDeletion({
          elements,
          nodeIdToDelete: uuid,
        });
      });
      toast.success("Action deleted successfully");
    } catch (error) {
      console.error("Error deleting node:", error);
    } finally {
      setIsDeletingAction(false);
    }
  };

  const getWorkflowDetails = useCallback(async () => {
    const response = await getWorkflow({
      company_id: loginResponse.company_id!,
      workflow_id: parseInt(workflowId!),
      is_template: 0,
    });
    setWorkflowId(response.id);
    setCompany_id(response.company_basic_details_id);
    setWorkflowName(response.name);
    setWorkflowType(response.workflow_type);
    setIsPublished(response.is_published);
    setWorkflowOutput(response.workflow_output);
  }, []);

  const getNodesDetails = useCallback(async () => {
    const response = await getNodes({
      company_id: loginResponse.company_id!,
      workflow_id: parseInt(workflowId!),
      is_template: 0,
    });
    const elements: any[] = convertResponseToElements(
      response,
      onDeleteNodeCallback,
      onAddNodeCallback,
      onNodeTypeChange,
      onNodeClickCallback
    );
    setTimeout(() => {
      setIsLoadingWorkflow(false);
      setElements(elements);
    }, 1000);
  }, []);

  useEffect(() => {
    getWorkflowDetails();
    getNodesDetails();
  }, [getWorkflowDetails, getNodesDetails]);

  useEffect(() => {
    setObjects(elements);
  }, [elements]);

  return (
    <div className="flex flex-row gap-0 w-full h-full">
      <div className="flex flex-col gap-0 w-full h-[100vh] overflow-hidden">
        <WorkflowHeader elements={elements} />
        <Toaster position="top-center" />
        <div className="w-full h-full flex flex-row items-start gap-0">
          <Layout
            elements={elements}
            setElements={setElements}
            onNodeTypeChange={onNodeTypeChange}
            onNodeClickCallback={onNodeClickCallback}
            onAddNodeCallback={onAddNodeCallback}
            onDeleteNodeCallback={onDeleteNodeCallback}
          />
          <NodePanel elements={elements} setElements={setElements} />
          <OutputPanel elements={elements} setElements={setElements} />
        </div>
      </div>
    </div>
  );
};
