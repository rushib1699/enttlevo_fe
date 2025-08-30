import { memo } from "react";
import { Handle, NodeProps, Position } from "@xyflow/react";

import "./index.css";
import { BaseNode } from "./BaseNodes";
import { useActionQuery } from "@/hooks/useActionQuery";

interface PlaceholderProps extends NodeProps {
  data: {
    onNodeTypeChange: (id: string, newType: string) => void;
  };
}

const handleNodeClick = (props: any) => {
  const { data, id } = props;
  data.onNodeClickCallback(id, data);
};

export const Source = (props: any) => {
  return (
    <div className="flex flex-col h-auto w-[220px] min-h-[50px]">
      <BaseNode
        {...props}
        onAddNodeCallback={props.data.onAddNodeCallback}
        onNodeClick={() => handleNodeClick(props)}
        onCloseIconClick={props.data.onDeleteNodeCallback}
      />
      <Handle type="source" position={Position.Bottom} className="NodePort" />
    </div>
  );
};

export const Action = (props: any) => (
  <div className="flex flex-col h-auto w-[220px] min-h-[50px]">
    <Handle type="target" position={Position.Top} className="NodePort" />
    <BaseNode
      {...props}
      onAddNodeCallback={props.data.onAddNodeCallback}
      onNodeClick={() => handleNodeClick(props)}
      onCloseIconClick={props.data.onDeleteNodeCallback}
    />
    <Handle type="source" position={Position.Bottom} className="NodePort" />
  </div>
);

export const Placeholder = memo(({ id, data }: PlaceholderProps) => {
  const { onOpen, setInteractivity } = useActionQuery((state) => state);
  const handleClick = () => {
    if (data.onNodeTypeChange) {
      data.onNodeTypeChange(id, "action");
      onOpen(id, data);
      setInteractivity(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="h-auto w-[220px] min-h-[50px] px-3 py-4 border-dotted border-2 border-gray-400 bg-gray-50 flex items-center justify-center text-sm text-gray-500 hover:text-gray-600 transition-all duration-100 rounded-xl cursor-pointer"
    >
      <Handle type="target" position={Position.Top} />
      <p className="font-semibold text-[10px]">
        {"New action will be added here."}
      </p>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});
