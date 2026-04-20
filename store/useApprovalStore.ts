import { create } from "zustand";
import { getUser } from "@/api/dashboardApi";

type ApprovalState = {
  isApproved: boolean | null;
  isChecking: boolean;
  checkApproval: () => Promise<void>;
  reset: () => void;
};
//  isTrial = isTrial false  trialEndDate = null
// active Subs = subs.status == ACTIVE || active || Complete || complete 
export const useApprovalStore = create<ApprovalState>((set) => ({
  isApproved: null,
  isChecking: false,

  checkApproval: async () => {
    set((s) => {
      if (s.isChecking) return s;
      return { ...s, isChecking: true };
    });

    try {
      const user = await getUser();
      const isTrial = user.organisation.isTrial == true || user.organisation.trialStartDate != null || user.organisation.trialEndDate != null;

      const subscriptionStatus = user.organisation.subscriptions?.status?.toUpperCase();
      const isActive = subscriptionStatus === "ACTIVE" || subscriptionStatus === "COMPLETE";

      if (isTrial || isActive) {
        console.log("isTrial", isTrial);
        console.log("isActive", isActive);
        set({ isApproved: true });
        console.log("approved", true);
      } else {
        // Neither trial nor active subscription — plan expired
        console.log("Plan not active. isTrial:", isTrial, "isActive:", isActive);
        set({ isApproved: false });
      }

    } catch (error) {
      console.error("Approval check failed (Maybe You don't have Purchased any plan yet)", error);

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
