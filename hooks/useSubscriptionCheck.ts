import { useEffect, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { getUser } from "@/api/dashboardApi";
import { useAuth } from "@/context/AuthContext";

let subscriptionCache: {
  hasSubscription: boolean;
  timestamp: number;
} | null = null;

/** Avoid re-running the API check on every tab navigation */
let subscriptionVerifiedThisSession = false;

const CACHE_TTL = 30000;

const SKIP_CHECK_ROUTES = [
  "/login",
  "/auth-callback",
  "/expiredPlan",
  "/(auth)/login",
  "/(auth)/expiredPlan",
  "/changePassword",
  "/(auth)/changePassword",
];

function shouldSkipSubscriptionCheck(pathname: string | null) {
  return pathname != null && SKIP_CHECK_ROUTES.includes(pathname);
}

/** Matches useApprovalStore — subscriptions may be an object or an array */
export function hasActiveSubscription(userData: {
  organisation?: {
    isTrial?: boolean;
    trialStartDate?: string | null;
    trialEndDate?: string | null;
    subscriptions?:
      | { status?: string }
      | Array<{ status?: string }>;
  };
} | null): boolean {
  const org = userData?.organisation;
  if (!org) return false;

  const isTrial =
    org.isTrial === true ||
    org.trialStartDate != null ||
    org.trialEndDate != null;
  if (isTrial) return true;

  const subs = org.subscriptions;
  if (!subs) return false;

  const isActiveStatus = (status?: string) => {
    const normalized = (status ?? "").toUpperCase();
    return normalized === "ACTIVE" || normalized === "COMPLETE";
  };

  if (Array.isArray(subs)) {
    return subs.some((s) => isActiveStatus(s?.status));
  }

  return isActiveStatus(subs.status);
}

export function useSubscriptionCheck() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      subscriptionVerifiedThisSession = false;
      setLoading(false);
      setHasSubscription(null);
      return;
    }

    if (shouldSkipSubscriptionCheck(pathname)) {
      setLoading(false);
      return;
    }

    if (subscriptionVerifiedThisSession) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        const now = Date.now();
        if (
          subscriptionCache &&
          now - subscriptionCache.timestamp < CACHE_TTL
        ) {
          if (cancelled) return;
          const active = subscriptionCache.hasSubscription;
          setHasSubscription(active);
          subscriptionVerifiedThisSession = true;
          if (!active) {
            router.replace("/(auth)/expiredPlan");
          }
          return;
        }

        const userData = await getUser();
        if (cancelled) return;

        const active = hasActiveSubscription(userData);

        subscriptionCache = {
          hasSubscription: active,
          timestamp: Date.now(),
        };

        setHasSubscription(active);
        subscriptionVerifiedThisSession = true;

        if (!active) {
          router.replace("/(auth)/expiredPlan");
        }
      } catch (error) {
        console.error("Subscription check error:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    check();

    return () => {
      cancelled = true;
    };
  }, [pathname, isSignedIn, isLoaded]);

  return { loading, hasSubscription };
}

export function clearSubscriptionCache() {
  subscriptionCache = null;
  subscriptionVerifiedThisSession = false;
}
