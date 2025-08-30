//@ts-nocheck
import { Edge, Element, Node, Prompt } from "@/types";
import { Play, Zap } from "lucide-react";

export const isNode = (element: Element): element is Node => {
  return "position" in element && "data" in element;
};

export const isEdge = (element: Element): element is Edge => {
  return "source" in element && "target" in element;
};

export const getLastNode = (elements: Element[]) => {
  const nodes = elements.filter((element) => isNode(element));

  return nodes.length > 0 ? nodes[nodes.length - 1] : undefined;
};

export const convertResponseToElements = (
  data: any[],
  onDeleteNodeCallback?: (id: number, uuid: string) => Promise<void>,
  onAddNodeCallback?: (
    parentNodeId: string,
    cur_elements: Element[],
    type: string
  ) => Promise<void>,
  onNodeTypeChange?: (id: string, newType: string) => void,
  onNodeClickCallback?: (id: string, data: any) => void
) => {
  const nodes: Node[] = data.map((item) => ({
    id: item.uuid,
    type: "action",
    position: { x: 0, y: 0 },
    data: {
      id: item.id,
      sort: item.sort,
      title: item.node_name || "Generate Text",
      input: item.input,
      prompt: item.prompt,
      background_prompt: item.background_prompt,
    },
    style: {},
  }));

  const nodeLookup: Record<string, string> = {};
  data.forEach((item) => {
    nodeLookup[item.uuid] = item.id; // uuid → id mapping
  });

  const edges: Edge[] = data
    .filter((item) => item.use_input && item.use_input != "0")
    .map((item) => ({
      id: `${item.use_input}-${item.uuid}`,
      source: item.use_input,
      target: item.uuid,
    }));
  const elements = [...nodes, ...edges];

  const nodes2 = elements
    .filter((x): x is Node => isNode(x))
    .map((x) => ({
      ...x,
      data: {
        ...x.data,
        onDeleteNodeCallback,
        onNodeClickCallback,
        onAddNodeCallback,
        onNodeTypeChange,
      },
    }));
  const edges2 = elements
    .filter((x): x is Edge => isEdge(x))
    .map((x) => ({
      ...x,
      data: { ...x.data, onAddNodeCallback },
    }));

  return [...nodes2, ...edges2];
};

export const convertElementsToPromptList = (
  elements: Element[]
): { promptList: Prompt[] } => {
  const nodes: Node[] = elements.filter((x): x is Node => isNode(x));
  const edges: Edge[] = elements.filter((x): x is Edge => isEdge(x));

  const childToParentMap: Record<string, string> = {};

  edges.forEach((edge) => {
    childToParentMap[edge.target] = edge.source;
  });

  const promptList: Prompt[] = nodes.map((node) => {
    const parentId = childToParentMap[node.id] || null;
    return {
      id: node.id,
      use_input: parentId ? parentId : "0",
      prompt: node.data.prompt!,
      Input: node.data.input!,
      Background_prompt: node.data.background_prompt!,
    };
  });

  return { promptList };
};

export const getTitle = (type: string) => {
  switch (type) {
    case "source":
      return { title: "Generate Text" };
    case "action":
      return { title: "Generate Text" };
    case "end":
      return { title: "Generate Text" };
    default:
      return { title: "Generate Text" };
  }
};

const InputIcon = Play;
const ActionIcon = Zap;

export const getTypeIcon = (type: string) => {
  switch (type) {
    case "source":
      return InputIcon;
    case "action":
      return ActionIcon;
    default:
      return null;
  }
};
