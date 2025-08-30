import { Edge, isNode, Node, Position } from "@xyflow/react";
import dagre from "dagre";
import _ from "lodash";

const nodeWidth = 250;
const nodeHeight = 80;

type FlowElement = Node | Edge;

const getLayoutedElements = (elements: FlowElement[]): FlowElement[] => {
  const layoutedElements = _.cloneDeep(elements);
  const dagreGraph = new dagre.graphlib.Graph();

  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB" });

  layoutedElements.forEach((el) => {
    if (isNode(el)) {
      dagreGraph.setNode(el.id, {
        width: el.width || nodeWidth,
        height: el.height || nodeHeight,
      });
    } else {
      dagreGraph.setEdge(el.source, el.target);
    }
  });

  dagre.layout(dagreGraph);

  return layoutedElements.map((el) => {
    if (isNode(el)) {
      const nodeWithPosition = dagreGraph.node(el.id);
      el.targetPosition = Position.Top;
      el.sourcePosition = Position.Bottom;
      el.position = {
        x:
          nodeWithPosition.x -
          (el.width || nodeWidth) / 2 +
          Math.random() / 1000,
        y: nodeWithPosition.y - (el.height || nodeHeight) / 2,
      };
    }
    return el;
  });
};

export { getLayoutedElements };
