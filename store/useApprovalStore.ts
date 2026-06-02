import { create } from "zustand";
import { getUser } from "@/api/dashboardApi";

type ApprovalState = {
  isApproved: boolean | null;
  isChecking: boolean;
  checkApproval: () => Promise<void>;
  reset: () => void;
};

export const useApprovalStore = create<ApprovalState>((set) => ({
  isApproved: null,
  isChecking: false,

  checkApproval: async () => {
    set({ isChecking: true });

    try {
      const user = await getUser();

      const approved =
        user?.organisation?.isApproved === true;

      set({ isApproved: approved });
    } catch (error) {
      console.error("Approval check failed", error);

      // Fail-safe: block access
      set({ isApproved: false });
    } finally {
      set({ isChecking: false });
    }
  },

  reset: () => {
    set({ isApproved: null, isChecking: false });
  },
}));
