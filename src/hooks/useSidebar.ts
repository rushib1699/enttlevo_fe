import { create } from "zustand";

type SidebarStore = {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isResetting: boolean;
  setIsResetting: (resetting: boolean) => void;
  titleExpanded: string | null;
  setTitleExpanded: (title: string | null) => void;
};

export const useSidebar = create<SidebarStore>((set) => ({
  isCollapsed: false,
  setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
  isResetting: false,
  setIsResetting: (resetting) => set({ isResetting: resetting }),
  titleExpanded: null,
  setTitleExpanded: (title) => set({ titleExpanded: title }),
}));

type SettingsSidebarStore = {
  isSettingsCollapsed: boolean;
  setIsSettingsCollapsed: (collapsed: boolean) => void;
  isSettingsResetting: boolean;
  setIsSettingsResetting: (resetting: boolean) => void;
};

export const useSettingsSidebar = create<SettingsSidebarStore>((set) => ({
  isSettingsCollapsed: false,
  setIsSettingsCollapsed: (collapsed) =>
    set({ isSettingsCollapsed: collapsed }),
  isSettingsResetting: false,
  setIsSettingsResetting: (resetting) =>
    set({ isSettingsResetting: resetting }),
}));
