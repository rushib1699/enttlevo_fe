import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trash } from "lucide-react";

interface DeleteButtonNodeProps {
  classes: string;
  onClick?: () => void;
  disabled: boolean;
}

export const DeleteButtonNode = ({
  classes,
  onClick,
  disabled,
}: DeleteButtonNodeProps) => {
  return (
    <motion.div
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      className={cn(
        "h-[14px] w-[14px] transition-all invisible border-slate-400 border-[1px] group-hover:visible animate-none  bg-slate-200  rounded-full overflow-hidden absolute opacity-0 group-hover:opacity-100 cursor-pointer p-[1px] flex items-center justify-center",
        classes,
        disabled && "cursor-not-allowed pointer-events-none"
      )}
    >
      <Trash className="text-slate-500 h-fit w-fit" />
    </motion.div>
  );
};
