import { Element } from "@/types";
import { create } from "zustand";

type ElementsStoreState = {
  Objects: Element[];
  isAddingAction: boolean;
  isDeletingAction: boolean;
  setIsAddingAction: (isAddingAction: boolean) => void;
  setIsDeletingAction: (isDeletingAction: boolean) => void;
  setObjects: (elements: Element[]) => void;
};

export const useElementsStore = create<ElementsStoreState>((set) => ({
  Objects: [],
  isAddingAction: false,
  isDeletingAction: false,
  setIsAddingAction: (isAddingAction) => set({ isAddingAction }),
  setIsDeletingAction: (isDeletingAction) => set({ isDeletingAction }),

  setObjects: (elements) => set({ Objects: elements }),
}));
