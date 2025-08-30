import React from "react";
import { ResponsiveSankey } from "@nivo/sankey";
import NoDataMessage from "@/components/Graphs/NoDataMessage";

interface APIResponse {
  nodes: { name: string }[];
  links: { source: string; target: string; value: number; name: string }[];
}

interface SankeyNode {
  id: string;
  nodeColor?: string;
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  name: string;
  linkColor?: string;
}

interface SalesSankeyGraphProps {
  data: APIResponse;
}

const generateRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const transformData = (data: APIResponse) => {
  // Convert nodes' `name` to `id` and assign random colors
  const transformedNodes: SankeyNode[] = data.nodes.map((node) => ({
    id: node.name,
    nodeColor: generateRandomColor(),
  }));

  // Transform links to retain all properties and assign random colors
  const transformedLinks: SankeyLink[] = data.links.map((link) => ({
    source: link.source,
    target: link.target,
    value: link.value,
    name: link.name,
    linkColor: generateRandomColor(),
  }));

  return { nodes: transformedNodes, links: transformedLinks };
};

const CustomLinkTooltip: React.FC<{ link: any }> = ({ link }) => {
  if (!link || !link.source || !link.target || !link.name) {
    return <div style={{ padding: "10px", color: "#fff" }}>Invalid link</div>;
  }

  return (
    <div
      style={{
        padding: "10px",
        background: "rgba(0, 0, 0, 0.8)",
        color: "#fff",
        borderRadius: "3px",
        fontSize: "12px",
      }}
    >
      <strong>
        {link.name}
      </strong>
    </div>
  );
};

const CustomNodeTooltip: React.FC<{ node: any }> = ({ node }) => {
  return (
    <div
      style={{
        padding: "10px",
        background: "rgba(0, 0, 0, 0.8)",
        color: "#fff",
        borderRadius: "3px",
        fontSize: "12px",
      }}
    >
      <strong>Node: {node.id}</strong>
    </div>
  );
};

export const SalesSankeyGraph: React.FC<SalesSankeyGraphProps> = ({ data }) => {
  if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.links)) {
    return <NoDataMessage />;
  }

  const sankeyData = transformData(data);

  if (sankeyData.nodes.length === 0 || sankeyData.links.length === 0) {
    return <div className="h-[80vh] w-full "><NoDataMessage /></div>;
  }

  const theme = {
    labels: {
      text: {
        fontSize: 14,
        fontWeight: "500",
      },
    },
  };

  return (
    <ResponsiveSankey
      data={sankeyData}
      margin={{ top: 40, right: 120, bottom: 40, left: 130 }}
      align="justify"
      nodeOpacity={1}
      nodeHoverOthersOpacity={0.35}
      nodeThickness={18}
      nodeSpacing={32}
      nodeBorderWidth={0}
      nodeBorderRadius={3}
      nodeBorderColor={{ from: "color", modifiers: [["darker", 0.8]] }}
      linkOpacity={0.5}
      linkHoverOpacity={0.75}
      linkHoverOthersOpacity={0.1}
      linkContract={0}
      enableLinkGradient={true}
      labelPosition="outside"
      labelOrientation="horizontal"
      labelPadding={16}
      motionConfig="stiff"
      labelTextColor={{ from: "color", modifiers: [["darker", 1]] }}
      colors={(node) => (node.nodeColor ? node.nodeColor : "#000")}
      linkTooltip={(link) => <CustomLinkTooltip link={link.link as SankeyLink} />}
      linkColor={(link) => (link.data.linkColor ? link.data.linkColor : "#000")}
      nodeTooltip={(node) => <CustomNodeTooltip node={node.node} />}
      theme={theme}
    />
  );
};