import { NodeData } from "@/types";
import { create } from "zustand";

type ActionQueryState = {
  typeId: string | null;
  isOpen: boolean;
  data: NodeData;
  interactivity: boolean;
  setInteractivity: (value: boolean) => void;
  onOpen: (typeId: string, data?: NodeData) => void;
  onClose: () => void;
};

export const useActionQuery = create<ActionQueryState>((set) => ({
  typeId: null,
  isOpen: false,
  interactivity: true,
  data: {},
  setInteractivity: (value) => set({ interactivity: value }),
  onOpen: (typeId, data = {}) => set({ typeId, isOpen: true, data }),
  onClose: () => set({ isOpen: false, typeId: null, data: {} }),
}));
