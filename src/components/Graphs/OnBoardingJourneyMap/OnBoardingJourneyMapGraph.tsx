import React from "react";
import { ResponsiveSankey, SankeyNodeDatum } from "@nivo/sankey";
import NoDataMessage from "@/components/Graphs/NoDataMessage";

interface CustomSankeyNode {
  id: string;
  nodeColor: string;
}

interface CustomSankeyLink {
  source: string;
  target: string;
  value: number;
}

interface OnBoardingJourneyMapGraphProps {
  data: {
    nodes: CustomSankeyNode[];
    links: CustomSankeyLink[];
  };
}

const CustomLinkTooltip: React.FC<{ link: any }> = ({ link }) => {
  if (!link || !link.link.source || !link.link.target) {
    return <NoDataMessage />;
  }

  link = link.link;

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
        {link.name} {'->'} {link.mrr}
      </strong>
      <br />
      <span>MRR: {link.mrr}</span>
    </div>
  );
};

export const OnBoardingJourneyMapGraph: React.FC<OnBoardingJourneyMapGraphProps> = ({ data }) => {

  if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.links) || data.nodes.length === 0 || data.links.length === 0) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <NoDataMessage />
      </div>
    );
  }

  const getNodeColor = (
    node: Omit<SankeyNodeDatum<CustomSankeyNode, CustomSankeyLink>, "label" | "color">
  ) => {
    const customNode = data.nodes.find((n) => n.id === node.id);
    return customNode ? customNode.nodeColor : "#000";
  };

  const theme = {
    labels: {
      text: {
        fontSize: 14,
        fontWeight: "500",
      },
    },
  };

  // Ensure all nodes referenced in links exist
  const validLinks = data.links.filter(link => 
    data.nodes.some(node => node.id === link.source) && 
    data.nodes.some(node => node.id === link.target)
  );

  const sanitizedData = {
    nodes: data.nodes,
    links: validLinks
  };

  return (
    <ResponsiveSankey
      data={sanitizedData}
      margin={{ top: 40, right: 80, bottom: 40, left: 50 }}
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
      colors={getNodeColor}
      linkTooltip={(link) => {
        return <CustomLinkTooltip link={link as any} />;
      }}
      theme={theme}
    />
  );
};
