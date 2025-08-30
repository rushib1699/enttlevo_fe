//@ts-nocheck
import React, { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { v4 as uuidv4 } from "uuid";
import "@xyflow/react/dist/style.css";
import { nodeTypes } from "./components/Nodes";
import { getLayoutedElements } from "@/utils/workflowLayoutUtils";
import { Plus, ArrowRight } from "lucide-react";
import { useActionQuery } from "@/hooks/useActionQuery";
import { cn } from "@/lib/utils";
import { createNode } from "@/api";
import { useLocation } from "react-router-dom";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import { AnimatePresence, motion } from "framer-motion";
import { useApplicationContext } from "@/hooks/useApplicationContext";
import "./index.css";

const Workflow = (props: any) => {
  const {
    elements,
    setElements,
    onAddNodeCallback,
    onDeleteNodeCallback,
    onNodeTypeChange,
    onNodeClickCallback,
  } = props;
  const location = useLocation();
  const { loginResponse } = useApplicationContext();
  const queryParams = new URLSearchParams(location.search);
  const workflowId = queryParams.get("workflowId");
  const { interactivity, setInteractivity } = useActionQuery();
  const state = useWorkflowStore((state) => state);
  const [layoutedElements, setLayoutedElements] = useState([]);
  const { fitView, setViewport, getViewport } = useReactFlow();
  const { isOpen } = useActionQuery();
  if (!loginResponse) return null;

  React.useEffect(() => {
    setLayoutedElements(getLayoutedElements(elements));
  }, [elements, fitView]);

  const layoutNodes = layoutedElements.filter((x) => x.position);
  const layoutEdges = layoutedElements.filter((x) => !x.position);
  const panBounds = {
    xMin: -100,
    xMax: 1000,
    yMin: -4000,
    yMax: 250,
  };
  const onMove = useCallback(
    (_, viewport) => {
      const { x, y, zoom } = viewport;

      const newX = Math.min(Math.max(x, panBounds.xMin), panBounds.xMax);
      const newY = Math.min(Math.max(y, panBounds.yMin), panBounds.yMax);

      setViewport({ x: newX, y: newY, zoom });
    },
    [setViewport]
  );

  const onTriggerClick = async () => {
    const rootNodeId = uuidv4();
    const resp = await createNode({
      uuid: rootNodeId,
      use_input: "0",
      node_name: "Generate Text",
      prompt: "",
      background_prompt: "",
      input: "",
      ai_model: "gpt-4",
      temperature: 7,
      sort: 1,
      workflow_id: parseInt(workflowId!),
      company_id: loginResponse.company_id,
      user_id: loginResponse.id,
    });
    let id = parseInt(resp.data.id);
    const viewport = getViewport();
    const { x, y, zoom } = viewport;
    setViewport({ zoom: 1.5, x: x, y: 100 });
    setElements([
      {
        id: rootNodeId,
        type: "action",
        data: {
          sort: 0,
          id,
          title: "Generate Text",
          input: "",
          prompt: "",
          background_prompt: "",
          onAddNodeCallback,
          onDeleteNodeCallback,
          onNodeTypeChange,
          onNodeClickCallback,
        },
        position: { x: 0, y: 0 },
        style: {},
      },
    ]);
  };
  //- (layoutNodes.length - 1) * 100
  // useEffect(() => {
  //   setViewport({ zoom: 1.5, x: 450, y: 30 });
  // }, [layoutNodes, layoutEdges, setViewport]);
  // useEffect(() => {
  //   if (layoutNodes.length <= 3) {
  //     const viewport = getViewport();
  //     const { x, y, zoom } = viewport;
  //     setViewport({ zoom: 1.5, x: x, y: 30 });
  //   }
  // }, [layoutNodes]);
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        fitView();
      }, 500);
    } else {
      setTimeout(() => {
        fitView();
      }, 75);
    }
  }, [isOpen]);
  useEffect(() => {
    if (!state.outputOpen) {
      setTimeout(() => {
        fitView();
      }, 500);
    } else {
      setTimeout(() => {
        fitView();
      }, 75);
    }
  }, [state.outputOpen]);

  return (
    <div
      style={{ height: `calc(100vh - 50px)` }}
      className={cn(
        "w-full  relative transition-all duration-100",
        isOpen && "w-[50%]"
      )}
    >
      <ReactFlow
        nodes={layoutNodes}
        edges={layoutEdges}
        nodeTypes={nodeTypes}
        panOnScroll={true}
        panOnDrag={false}
        panOnScrollMode={"vertical"}
        zoomOnScroll={false}
        zoomOnPinch={false}
        elementsSelectable={interactivity}
        nodesDraggable={false}
        preventScrolling={false}
        fitView={true}
        style={{ height: "100%" }}
        maxZoom={1.35}
        onMove={onMove}
      >
        {!isOpen && <Controls />}
        <div className="w-full h-full -z-[10] bg-slate-50 opacity-50" />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
      <div
        className={cn(
          "absolute bottom-[2%] bg-white border border-slate-400 h-[55px] w-[55%] left-[50%] -translate-x-[50%] rounded-2xl flex px-4 py-2 items-center",
          isOpen && "w-[90%]"
        )}
      >
        <input
          className="w-full border-none outline-none text-gray-700 placeholder:opacity-[80%]"
          placeholder="Describe your workflow or add a command here."
        />
        <div className="h-8 w-8 p-[1px] bg-black rounded-full flex items-center justify-center cursor-pointer">
          <ArrowRight className="text-white" />
        </div>
      </div>
      <AnimatePresence>
        {state.isLoadingWorkflow && (
          <>
            <motion.div
              initial={{
                opacity: 0,
                x: 0,
                y: -50,
                translateX: "-50%",
                translateY: "-50%",
              }}
              animate={{
                opacity: 1,
                x: 0,
                y: 0,
                translateX: "-50%",
                translateY: "-50%",
              }}
              exit={{
                opacity: 0,
                x: 0,
                y: -50,
                translateX: "-50%",
                translateY: "-50%",
              }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="absolute top-[5%] left-[50%] -translate-x-[50%] -translate-y-[50%] h-auto w-fit bg-white border border-gray-300 rounded-lg py-2 px-3 overflow-hidden"
            >
              <div className="flex justify-between items-center gap-2">
                <p className="text-gray-700 text-clip">
                  Please wait while the workflow is being initialized...
                </p>
                <div className="w-4 h-4 animate-spin flex justify-center items-center">
                  <div className="h-4 w-4 border-2 border-t-gray-400 border-b-gray-500 border-r-gray-500  border-l-gray-400 rounded-full"></div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {elements.length === 0 && (
        <>
          <div className="absolute top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] flex items-center flex-col">
            <p className="font-semibold">Workflows by Enttlevo</p>
            <p className="font-extralight text-gray-600 text-center mt-4">
              Start building your workflows from scratch,
              <br /> or use predefined templates.
            </p>
            <div
              className={cn(
                "mt-4 w-[400px] h-[90px] rounded-2xl border-2 border-dotted border-gray-400 bg-gray-50 transition-all hover:bg-slate-50 p-4 flex items-center justify-center cursor-pointer group bg-opacity-50 hover:bg-opacity-100",
                state.isLoadingWorkflow &&
                  "pointer-events-none cursor-not-allowed"
              )}
              role="button"
              onClick={onTriggerClick}
            >
              <div className="flex flex-col text-center justify-center items-center">
                <div className="flex flex-row gap-1">
                  <Plus className="text-gray-500 h-5 w-5 group-hover:text-gray-600 transition-all" />
                  <p className="text-[14px] text-gray-500 group-hover:text-gray-600 transition-all">
                    Add a Trigger
                  </p>
                </div>
                <div className="text-[12px] text-gray-500 group-hover:text-gray-600 transition-all">
                  Start your Workflow with a Trigger
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const Layout = (props: any) => {
  return (
    <ReactFlowProvider>
      <Workflow {...props} />
    </ReactFlowProvider>
  );
};
