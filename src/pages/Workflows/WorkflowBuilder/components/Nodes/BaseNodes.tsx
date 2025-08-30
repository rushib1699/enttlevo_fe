import React from "react";
import { NodeProps } from "@xyflow/react";
import { getLastNode, getTypeIcon } from "@/utils/helpers";
import { cn } from "@/lib/utils";
import { AddNodeButton } from "../../Buttons/AddNodeButton";
import { DeleteButtonNode } from "../../Buttons/DeleteNodeButton";
import { Element, Node } from "@/types";
import { useElementsStore } from "@/hooks/useElementsStore";
import { useActionQuery } from "@/hooks/useActionQuery";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";

interface BaseNodeProps extends NodeProps {
  type: string;
  selected?: boolean;
  disabled?: boolean;
  onNodeClick?: (type: string, data: any) => void;
  onCloseIconClick?: (id: number, uuid: string) => void;
  additionalClassName?: string;
  onAddNodeCallback?: (
    parentId: string,
    cur_elements: Element[],
    type: string
  ) => void;
}

export const BaseNode = ({
  type,
  id,
  data,
  selected,
  disabled,
  onNodeClick,
  onCloseIconClick,
  additionalClassName = "",
  onAddNodeCallback,
}: BaseNodeProps) => {
  const { Objects, isAddingAction, isDeletingAction } = useElementsStore(
    (state) => state
  );
  const { isRunningWorkflow } = useWorkflowStore((state) => state);
  const { setInteractivity } = useActionQuery((state) => state);
  const Icon = getTypeIcon(type!);
  const content = (
    <>
      <div className="flex flex-row gap-2 items-center">
        <Icon />
        <div className="flex flex-col">
          <div className="text-[12px] text-slate-700">
            {data.title as React.ReactNode}
          </div>
        </div>
      </div>
    </>
  );
  //@ts-ignore
  const lastNode: Node | undefined = getLastNode(Objects);

  return (
    <div
      data-selected={selected}
      aria-disabled={disabled}
      className={cn(
        "h-auto w-[220px] min-h-[50px] relative group cursor-pointer",
        additionalClassName
      )}
      {...(onNodeClick && {
        onClick: () => {
          onNodeClick(type, data);
          setInteractivity(false);
        },
      })}
    >
      <div
        className={cn(
          "custom-node",
          type == "action" ? "border-yellow-700" : "border-green-700"
        )}
      >
        {content}
        <div
          className={cn(
            "absolute right-[0px] top-[0px] h-[7px] w-[7px] rounded-full",
            type == "action" ? "bg-yellow-700" : "bg-green-700"
          )}
        />
        <div
          className={cn(
            "absolute right-[-1px] top-[-1px] h-[9px] w-[9px] rounded-full animate-scaleup-pulse",
            type == "action" ? "bg-yellow-700" : "bg-green-700"
          )}
        />
      </div>
      {lastNode && lastNode.id === id ? (
        <>
          <AddNodeButton
            disabled={isAddingAction || isDeletingAction || isRunningWorkflow}
            classes="-bottom-[5px] left-[50%] -translate-x-[50%] group-hover:-bottom-[20px]"
            onClick={() => {
              if (onAddNodeCallback) {
                onAddNodeCallback(id, Objects, "placeholder");
              }
            }}
          />
          <DeleteButtonNode
            classes="-right-[5px] top-[50%] -translate-y-[50%] group-hover:-right-[20px]"
            disabled={isAddingAction || isDeletingAction || isRunningWorkflow}
            onClick={() => {
              if (onCloseIconClick) {
                //@ts-ignore
                onCloseIconClick(data.id, id);
              }
            }}
          />
        </>
      ) : null}
    </div>
  );
};

export const EmptyBaseNode = () => {
  return <div className="h-[1px] w-[1px]"></div>;
};
