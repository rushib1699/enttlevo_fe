import { useActionQuery } from "@/hooks/useActionQuery";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import { cn } from "@/lib/utils";
import { Element } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";


interface OutputPanelProps {
  elements: Element[];
  setElements: React.Dispatch<React.SetStateAction<Element[]>>;
}

export const OutputPanel = ({
  elements,
  setElements,
}: OutputPanelProps) => {
  const { outputOpen, setOutputOpen, workflowOutput } = useWorkflowStore(
    (state) => state
  );
  const { setInteractivity } = useActionQuery((state) => state);

  return (
    <AnimatePresence>
      {outputOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.3 }}
          className={cn(
            "w-[50%] h-full border border-l-gray-200/75 pt-4 pb-12 px-4 overflow-scroll"
          )}
        >
          <div className="mt-2 flex items-center justify-between">
            <p className="text-gray-800 text-xl">Test Run Output</p>
            <div
              role="button"
              className="flex items-center justify-center gap-[2px] cursor-pointer hover:bg-gray-100 p-1 rounded-lg"
              onClick={() => {
                setOutputOpen(false);
                setInteractivity(true);
              }}
            >
              <X className="text-gray-800 h-4 w-4" />
              <p className="text-xs font-light">Close</p>
            </div>
          </div>
          <div className="mt-4 border px-2 rounded-md py-2 text-gray-700">
            {workflowOutput}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
