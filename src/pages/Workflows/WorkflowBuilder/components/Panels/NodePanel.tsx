import { useActionQuery } from "@/hooks/useActionQuery";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { X ,Star} from "lucide-react";
import { ActionDetailsBody } from "../../ActionDetailsBody";
import { Element } from "@/types";

interface NodePanelProps {
  elements: Element[];
  setElements: React.Dispatch<React.SetStateAction<Element[]>>;
}

export const NodePanel = ({
  elements,
  setElements,
}: NodePanelProps) => {
  const { isOpen, onClose, data, typeId, setInteractivity } = useActionQuery();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3 }}
            style={{
              transform: "none",
              overflowY: "scroll",
              height: `calc(100vh - 50px)`,
            }}
            className={cn("w-[50%] border border-l-gray-200/75 py-4 px-4")}
          >
            <div className="flex justify-between items-baseline">
              <div className="flex gap-1 items-center justify-start">
                <div className="flex justify-center items-center p-1 h-8 w-8 bg-indigo-200  rounded-full">
                  <Star className="text-indigo-500 h-full w-full" />
                </div>
                <div className="flex flex-col">
                  <p className="text-gray-800 text-lg">Generate Text</p>
                  <p className="font-normal uppercase text-gray-600 text-xs">
                    Text Generation Action
                  </p>
                </div>
              </div>
              <div
                role="button"
                className="flex items-center justify-center gap-[2px] cursor-pointer hover:bg-gray-100 p-1 rounded-lg"
                onClick={() => {
                  onClose();
                  setInteractivity(true);
                }}
              >
                <X className="text-gray-800 h-4 w-4" />
                <p className="text-xs font-light">Close</p>
              </div>
            </div>
            <div className="mt-8">
              <ActionDetailsBody
                data={data}
                elements={elements}
                setElements={setElements}
                typeId={typeId}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
