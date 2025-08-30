import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export const AddNodeButton = ({
  classes,
  onClick,
  disabled,
}: {
  classes: string;
  onClick: () => void;
  disabled: boolean;
}) => {
  return (
    <motion.div
      role="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "h-[14px] w-[14px] transition-all invisible border-indigo-400 border-[1px] group-hover:visible animate-none bg-indigo-200 rounded-full overflow-hidden absolute opacity-0 group-hover:opacity-100 p-[1px] flex items-center justify-center",
        classes,
        disabled && "cursor-not-allowed pointer-events-none"
      )}
    >
      <Plus className="text-indigo-500 h-fit w-fit" />
    </motion.div>
  );
};
