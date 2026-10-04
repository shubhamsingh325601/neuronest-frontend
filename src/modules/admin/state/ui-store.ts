"use client";

import { create } from "zustand";
import { readSidebarCollapsed, writeSidebarCollapsed } from "./sidebar-pref";

// The one small client-UI store (plan 0001 §14). Nothing fetched from the backend lives here.
interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  commandOpen: boolean;
  notificationsOpen: boolean;
  toggleSidebar: () => void;
  /** Reads the persisted preference once after mount (the server render cannot know it). */
  hydrateSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()((set, get) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  commandOpen: false,
  notificationsOpen: false,
  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    writeSidebarCollapsed(next);
    set({ sidebarCollapsed: next });
  },
  hydrateSidebar: () => set({ sidebarCollapsed: readSidebarCollapsed() }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
}));
