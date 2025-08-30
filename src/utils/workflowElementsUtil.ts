//@ts-nocheck
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
import { getTitle, isEdge, isNode } from "./helpers";
import { Node, Edge, Element, NodeData } from "@/types";
import { createNode, deleteNode } from "@/api";

const getNextSortValue = (elements: Element[]): number => {
  const nodeElements = elements.filter((el) => isNode(el));
  const maxSort = nodeElements.reduce((max, node) => {
    return node.data.sort && node.data.sort > max ? node.data.sort : max;
  }, 1);

  return maxSort + 1;
};

export const getUpdatedElementsAfterNodeAddition = async ({
  elements,
  parentNodeId,
  type,
  onAddNodeCallback,
  onDeleteNodeCallback,
  onNodeClickCallback,
  onNodeTypeChange,
  companyId,
  workflowId,
  userId,
}: {
  elements: Element[];
  parentNodeId: string;
  type: string;
  onAddNodeCallback: (
    parentNodeId: string,
    cur_elements: Element[],
    type: string
  ) => void;
  onDeleteNodeCallback: (id: number, uuid: string) => void;
  onNodeClickCallback: (id: string, data: NodeData) => void;
  onNodeTypeChange: (id: string, newType: string) => void;
  companyId: number;
  workflowId: number;
  userId: number;
}): Promise<Element[]> => {
  const newNodeId = uuidv4();
  const parentNode = elements.find((el) => el.id === parentNodeId);
  if (!parentNode) return elements;
  const { title } = getTitle(type);

  const existingEdge = elements.find(
    (el) => isEdge(el) && el.source === parentNodeId
  ) as Edge | undefined;

  const existingChildId = existingEdge ? existingEdge.target : null;
  const nextSortValue = getNextSortValue(elements);
  const payload = {
    uuid: newNodeId,
    use_input: parentNodeId,
    prompt: "",
    input: "",
    background_prompt: "",
    node_name: "Generate Text",
    ai_model: "gpt-4",
    temperature: 7,
    sort: nextSortValue,
    company_id: companyId,
    workflow_id: workflowId,
    user_id: userId,
  };

  const resp = await createNode(payload);
  let id = parseInt(resp.data.id);

  const newNode: Node = {
    id: newNodeId,
    type,
    data: {
      id,
      title,
      prompt: "",
      background_prompt: "",
      input: "",
      onAddNodeCallback,
      onDeleteNodeCallback,
      onNodeClickCallback,
      onNodeTypeChange,
      sort: nextSortValue,
    },
    position: {
      x: parentNode.position.x + 200,
      y: parentNode.position.y + 100,
    },
  };

  let updatedElements = elements.filter(
    (el) => !(isEdge(el) && el.source === parentNodeId)
  );

  updatedElements = [...updatedElements, newNode];

  const newEdge: Edge = {
    id: `e${parentNodeId}-${newNodeId}`,
    source: parentNodeId,
    target: newNodeId,
  };

  updatedElements = [...updatedElements, newEdge];

  if (existingChildId) {
    const newEdgeToOldChild: Edge = {
      id: `e${newNodeId}-${existingChildId}`,
      source: newNodeId,
      target: existingChildId,
    };
    updatedElements = [...updatedElements, newEdgeToOldChild];
  }

  // updatedElements = updatedElements.sort((a, b) => {
  //   if (isNode(a) && isNode(b)) {
  //     return (a.data.sort ?? 0) - (b.data.sort ?? 0);
  //   }
  //   return 0;
  // });

  return updatedElements;
};

export const getUpdatedElementsAfterNodeDeletion = ({
  elements,
  nodeIdToDelete,
}: {
  elements: Element[];
  nodeIdToDelete: string;
}): Element[] => {
  const incomingEdges = elements.filter(
    (el): el is Edge => isEdge(el) && el.target === nodeIdToDelete
  );
  const outgoingEdges = elements.filter(
    (el): el is Edge => isEdge(el) && el.source === nodeIdToDelete
  );

  const filteredElements = elements.filter(
    (el) =>
      el.id !== nodeIdToDelete &&
      (!isEdge(el) ||
        (el.source !== nodeIdToDelete && el.target !== nodeIdToDelete))
  );

  if (incomingEdges.length > 0 && outgoingEdges.length > 0) {
    const updatedIncomingEdges = incomingEdges.map((edge) => ({
      ...edge,
      target: outgoingEdges[0].target,
    }));
    return [...filteredElements, ...updatedIncomingEdges];
  }

  return filteredElements;
};
