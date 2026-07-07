import {
  cancelSubscription,
  getCurrentSubscription,
  getPayments,
  getPlans,
  getUsage,
  getWalletBalance,
  requestTwilioAccess,
  updateAutoRenew,
  getCreditPackages,
  getAddOns,
} from "@/api/billingApi";
import { getUser } from "@/api/dashboardApi";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  useColorScheme,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  Linking,
  Switch,
  Modal,
  View,
  Dimensions,
  RefreshControl,
} from "react-native";
import Toast from "react-native-toast-message";
import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeletons";
import {
  FileText,
  ArrowLeftRight,
  Calendar,
  Zap,
  AlertCircle,
  X,
  CheckCircle2,
  Clock,
  Star,
  Info,
  ArrowUp,
  ArrowDown,
  Send,
  Share2,
  Check,
  Circle,
  CircleDot,
  Loader2,
  Package,
} from "lucide-react-native";
import { fetchInvoices } from "@/api/invoicesApi";

export default function BillingPage() {
  const router = useRouter();
  const { tab, channel } = useLocalSearchParams<{ tab: string, channel: string }>();
  const isDark = useColorScheme() === "dark";

  // Sleek Tailwind dynamic palette
  const COLORS = {
    bg: isDark ? "#0f172a" : "#f8fafc",
    card: isDark ? "#1e293b" : "#ffffff",
    border: isDark ? "#334155" : "#e2e8f0",
    text: isDark ? "#f8fafc" : "#0f172a",
    textMuted: isDark ? "#94a3b8" : "#64748b",
    accent: "#dc2626",
    success: "#10b981",
    warning: "#f59e0b",
    info: "#3b82f6",
  };

  // State
  const [loading, setLoading] = useState(true);
  const [usageData, setUsageData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [plansData, setPlansData] = useState<any[]>([]);
  const [paymentsData, setPaymentsData] = useState<{ invoices: any[] }>({
    invoices: [],
  });
  const [comparisonPlanColumns, setComparisonPlanColumns] = useState<any[]>([]);
  const [comparisonFeatures, setComparisonFeatures] = useState<any[]>([]);
  const [creditPackages, setCreditPackages] = useState<any[]>([]);
  const [addOns, setAddOns] = useState<any[]>([]);
  const [addOnQuantities, setAddOnQuantities] = useState<Record<number, number>>({});
  // UI State
  const [activeBillingTab, setActiveBillingTab] = useState<"plans" | "credits">(
    "plans",
  );
  const [plansTab, setPlansTab] = useState<'plans' | 'addons' | 'credits'>('plans');
  const [creditChannel, setCreditChannel] = useState<'SMS' | 'WHATSAPP'>('SMS');
  const [creditQuantity, setCreditQuantity] = useState<string>('100');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [redirectActionName, setRedirectActionName] = useState("");
  const [showComparePlans, setShowComparePlans] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpdatingAutoRenew, setIsUpdatingAutoRenew] = useState(false);
  const [autoRenew, setAutoRenew] = useState(false);

  // Form State
  const [requestReason, setRequestReason] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelImmediately, setCancelImmediately] = useState<boolean | null>(
    null,
  );
  const [cancellationError, setCancellationError] = useState<string | null>(
    null,
  );
  const [isSubmittingTwilio, setIsSubmittingTwilio] = useState(false);

  // Alert State
  const [premiumAlert, setPremiumAlert] = useState(false);
  const [isOneDay, setIsOneDay] = useState(false);

  // Plan Swiper State
  const [activePlanIndex, setActivePlanIndex] = useState(0);

  // Tab bar scroll ref & layout tracking
  const mainScrollRef = useRef<any>(null);
  const tabsYOffset = useRef<number>(0);
  const tabScrollRef = useRef<any>(null);
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBillingDetails();
    setRefreshing(false);
  };

  const fetchBillingDetails = async () => {
    try {
      const [usage, subscription, plan, payment, balance, creditPacks, user, addOnsData] =
        await Promise.all([
          getUsage(),
          getCurrentSubscription(),
          getPlans(),
          fetchInvoices(),
          getWalletBalance(),
          getCreditPackages(),
          getUser(),
          getAddOns(),
        ]);

      setUsageData(usage);
      setSubscriptionData(subscription);
      setUserData(user);
      setAutoRenew(subscription?.subscription?.autoRenew || false);

      const plansArray = Array.isArray(plan)
        ? plan
        : plan?.plans || plan?.data || [];
      setPlansData(plansArray);
      buildComparisonFromPlans(plansArray);
      // Ensure paymentsData always contains an invoices array
      const invoicesArray = Array.isArray(payment?.invoices)
        ? payment.invoices
        : payment?.data?.invoices || [];
      setPaymentsData({ invoices: invoicesArray });
      setBalanceData(balance);

      const creditsArray = Array.isArray(creditPacks)
        ? creditPacks
        : creditPacks?.packages || creditPacks?.data || [];
      setCreditPackages(creditsArray);

      const addOnsArray = Array.isArray(addOnsData)
        ? addOnsData
        : addOnsData?.addOns || addOnsData?.data || [];
      setAddOns(addOnsArray.filter((a: any) => a.isActive !== false));
      const initialQtys: Record<number, number> = {};
      addOnsArray.forEach((a: any) => { if (a.pricingType === 'QUANTITY') initialQtys[a.id] = 1; });
      setAddOnQuantities(initialQtys);

      if (balance?.twilioAccess?.twilioAccessStatus === "APPROVED") {
        setActiveBillingTab("credits");
      }
    } catch (error) {
      console.error("Billing fetch error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load billing data",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingDetails();
  }, []);

  useEffect(() => {
    if (subscriptionData?.subscription?.endDate) {
      const today = new Date();
      const end = new Date(subscriptionData.subscription.endDate);
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setIsOneDay(diffDays === 1);
      setPremiumAlert(diffDays >= 0 && diffDays <= 3);
    }
  }, [subscriptionData]);

  useEffect(() => {
    if (tab) {
      if (tab === "credits" || tab === "addons") {
        setActiveBillingTab("plans");
        setPlansTab(tab as any);
      }
    }
    if (channel === "SMS" || channel === "WHATSAPP") {
      setCreditChannel(channel as any);
    }
  }, [tab, channel]);

  useEffect(() => {
    if (!loading && tab && (tab === "credits" || tab === "addons")) {
      setTimeout(() => {
        if (mainScrollRef.current && tabsYOffset.current > 0) {
          mainScrollRef.current.scrollTo({ y: tabsYOffset.current, animated: true });
        }
        const layout = tabLayouts.current[tab];
        if (layout && tabScrollRef.current) {
          tabScrollRef.current.scrollTo({ x: layout.x - 16, animated: true });
        }
      }, 500);
    }
  }, [loading, tab]);

  const handlePaymentRedirect = (actionName: string) => {
    setRedirectActionName(actionName);
    setShowRedirectModal(true);
  };

  const proceedWithRedirect = () => {
    setShowRedirectModal(false);
    Linking.openURL("https://campzeo.com/organisation/billing");
  };

  const handleAutoRenewToggle = async (value: boolean) => {
    setIsUpdatingAutoRenew(true);
    try {
      await updateAutoRenew(value);
      setAutoRenew(value);
      Toast.show({
        type: "success",
        text1: "Auto-renew status updated successfully",
      });
      // Refresh current subscription settings
      const subscription = await getCurrentSubscription();
      setSubscriptionData(subscription);
      setAutoRenew(subscription?.subscription?.autoRenew || false);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to update auto-renew status",
      });
      console.error(error);
    } finally {
      setIsUpdatingAutoRenew(false);
    }
  };

  const onSubmitTwilioRequest = async () => {
    if (!requestReason.trim()) {
      Toast.show({
        type: "error",
        text1: "Please provide a reason for the request",
      });
      return;
    }
    setIsSubmittingTwilio(true);
    try {
      await requestTwilioAccess(requestReason);
      setRequestReason("");
      Toast.show({
        type: "success",
        text1: "Twilio access request submitted",
      });
      // reload
      const balance = await getWalletBalance();
      setBalanceData(balance);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error?.message || "Failed to submit request",
      });
    } finally {
      setIsSubmittingTwilio(false);
    }
  };

  const confirmCancellation = async () => {
    if (cancelImmediately === null) {
      setCancellationError(
        "Please select when the cancellation should take effect",
      );
      return;
    }
    setIsCancelling(true);
    setCancellationError(null);
    try {
      await cancelSubscription(cancelImmediately, cancellationReason);
      Toast.show({
        type: "success",
        text1: "Subscription cancelled successfully",
      });
      setShowCancelModal(false);
      fetchBillingDetails();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error?.message || "Failed to cancel subscription",
      });
      console.error(error);
    } finally {
      setIsCancelling(false);
    }
  };

  const buildComparisonFromPlans = (plans: any[]) => {
    const planOrder = ["FREE_TRIAL", "PROFESSIONAL", "ENTERPRISE"];
    const activePlans = (plans || []).filter((p) => p?.isActive !== false);
    const sortedPlans = [...activePlans].sort((a, b) => {
      const ai = planOrder.indexOf(a.name);
      const bi = planOrder.indexOf(b.name);
      return (
        (ai === -1 ? planOrder.length : ai) -
        (bi === -1 ? planOrder.length : bi)
      );
    });

    const featureNames = new Set<string>();
    for (const plan of sortedPlans) {
      (plan.features || []).forEach((feature: string) =>
        featureNames.add(feature),
      );
    }
  };

  const getPlanDisplayLabel = (planName: string): string => {
    switch (planName) {
      case "FREE_TRIAL":
        return "Free Trial";
      case "PROFESSIONAL":
        return "Professional";
      case "ENTERPRISE":
        return "Enterprise";
      default:
        return planName
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  // Fixed per-credit rates as per business pricing
  // (API packages are bulk deals, not individual credit rates)
  const CREDIT_PRICES: Record<'SMS' | 'WHATSAPP', number> = {
    SMS: 2,
    WHATSAPP: 2.5,
  };

  const getPricePerCredit = (type: 'SMS' | 'WHATSAPP') => {
    return CREDIT_PRICES[type];
  };

  const formatCreditPrice = (amount: number): string => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatCurrency = (amount: any): string => {
    const num = Number(amount);
    if (isNaN(num)) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const subscriptionValidity = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? "1 day" : `${diffDays} days`;
  };

  const getPlatformIcon = (platform: string) => {
    const name = platform?.toLowerCase() || "";
    switch (name) {
      case "facebook":
        return "facebook";
      case "instagram":
        return "instagram";
      case "linkedin":
        return "linkedin";
      case "youtube":
        return "youtube-play";
      case "pinterest":
        return "pinterest";
      case "twitter":
        return "twitter";
      default:
        return "globe";
    }
  };

  const getPlatformColor = (platform: string) => {
    const name = platform?.toLowerCase() || "";
    switch (name) {
      case "facebook":
        return "#1877F2";
      case "instagram":
        return "#E4405F";
      case "linkedin":
        return "#0A66C2";
      case "youtube":
        return "#FF0000";
      case "pinterest":
        return "#E60023";
      case "twitter":
        return "#1DA1F2";
      default:
        return COLORS.textMuted;
    }
  };

  const getPlatformBg = (platform: string) => {
    const name = platform?.toLowerCase() || "";
    switch (name) {
      case "facebook":
        return isDark ? "#172554" : "#eff6ff";
      case "instagram":
        return isDark ? "#4a044e" : "#fdf2f8";
      case "linkedin":
        return isDark ? "#172554" : "#eff6ff";
      case "youtube":
        return isDark ? "#450a0a" : "#fef2f2";
      case "pinterest":
        return isDark ? "#450a0a" : "#fef2f2";
      case "twitter":
        return isDark ? "#172554" : "#eff6ff";
      default:
        return isDark ? "#334155" : "#f1f5f9";
    }
  };

  const currentPlanName = subscriptionData?.subscription?.plan?.name || "";
  const currentPlanPrice = subscriptionData?.subscription?.plan?.price || 0;
  const isTrial =
    subscriptionData?.subscription?.plan?.name === "FREE_TRIAL" ||
    subscriptionData?.trial;

  if (loading) {
    return (
      <ThemedView
        className="flex-1 px-4 pt-16"
        style={{ backgroundColor: COLORS.bg }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* SKELETON HEADER */}
          <View className="flex-row items-center justify-between mb-6">
            <ShimmerSkeleton width={40} height={40} borderRadius={20} />
            <ShimmerSkeleton width={180} height={28} />
            <View style={{ width: 40 }} />
          </View>

          {/* SKELETON USAGE DETAILS */}
          <View
            className="p-5 rounded-2xl border mb-6"
            style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
          >
            <ShimmerSkeleton width={120} height={20} />
            <View className="h-4" />
            <ShimmerSkeleton width={160} height={14} />
            <View className="h-6" />
            {[1, 2, 3].map((i) => (
              <View key={i} className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <ShimmerSkeleton width={100} height={14} />
                  <ShimmerSkeleton width={50} height={14} />
                </View>
                <ShimmerSkeleton height={8} borderRadius={4} />
              </View>
            ))}
          </View>

          {/* SKELETON CURRENT PLAN */}
          <View
            className="p-5 rounded-2xl border mb-6"
            style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
          >
            <View className="flex-row justify-between items-start mb-6">
              <View>
                <ShimmerSkeleton width={140} height={22} />
                <View className="h-2" />
                <ShimmerSkeleton width={80} height={14} />
              </View>
              <ShimmerSkeleton width={70} height={22} borderRadius={11} />
            </View>
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <ShimmerSkeleton width={80} height={14} />
                <View className="h-2" />
                <ShimmerSkeleton width={100} height={16} />
              </View>
              <View className="flex-1">
                <ShimmerSkeleton width={80} height={14} />
                <View className="h-2" />
                <ShimmerSkeleton width={100} height={16} />
              </View>
            </View>
          </View>

          {/* SKELETON PAYMENTS */}
          <ShimmerSkeleton width={120} height={20} />
          <View className="h-4" />
          <View
            className="p-5 rounded-2xl border mb-6"
            style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
          >
            {[1, 2].map((i) => (
              <View key={i} className="flex-row justify-between py-3">
                <View>
                  <ShimmerSkeleton width={100} height={16} />
                  <View className="h-2" />
                  <ShimmerSkeleton width={70} height={12} />
                </View>
                <View className="items-end">
                  <ShimmerSkeleton width={60} height={16} />
                  <View className="h-2" />
                  <ShimmerSkeleton width={50} height={12} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      className="flex-1 px-4 pt-10"
      style={{ backgroundColor: COLORS.bg }}
    >
      {/* HEADER */}
      <View className="flex-row items-center justify-between mb-6">
        <Pressable onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back-outline" size={22} color={COLORS.text} />
        </Pressable>

        <Text
          className="text-xl font-bold text-center flex-1 ml-2"
          style={{ color: COLORS.text }}
        >
          Billing & Subscription
        </Text>

        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => router.push("/(invoices)/invoices")}
            className="flex-row items-center gap-1.5 px-3 py-1.5 border rounded-lg"
            style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}
          >
            <FileText size={14} color={COLORS.text} />
            <Text
              className="text-xs font-semibold"
              style={{ color: COLORS.text }}
            >
              Invoices
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* EXPIRING ALERT */}
        {currentPlanName !== "FREE_TRIAL" && premiumAlert && (
          <View
            className={`rounded-xl p-4 gap-3 mb-4 border ${isOneDay
              ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/30"
              : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30"
              }`}
          >
            <View className="flex-row items-start gap-2">
              <AlertCircle
                size={20}
                color={isOneDay ? "#dc2626" : "#f59e0b"}
                style={{ marginTop: 1 }}
              />
              <View className="flex-1">
                <Text
                  className={`text-sm font-semibold ${isOneDay
                    ? "text-red-900 dark:text-red-400"
                    : "text-amber-900 dark:text-amber-400"
                    }`}
                >
                  Plan Expiring Soon
                </Text>
                <Text
                  className={`text-xs mt-1 leading-5 ${isOneDay
                    ? "text-red-700 dark:text-red-300"
                    : "text-amber-700 dark:text-amber-300"
                    }`}
                >
                  Your <Text className="font-semibold">{currentPlanName}</Text>
                  plan expires in
                  <Text className="font-bold">
                    {subscriptionValidity(
                      subscriptionData?.subscription?.endDate,
                    )}
                  </Text>
                  on
                  <Text className="font-semibold">
                    {formatDate(subscriptionData?.subscription?.endDate)}
                  </Text>
                  . Please renew your subscription to maintain full access.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handlePaymentRedirect("renew your subscription")}
              className={`py-3 rounded-lg items-center flex-row justify-center gap-2 ${isOneDay ? "bg-red-600" : "bg-amber-600"
                }`}
              activeOpacity={0.8}
            >
              <Ionicons name="card" size={16} color="#fff" />
              <Text className="text-white font-semibold text-sm">
                Pay Now & Renew
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TRIAL REMAINING */}
        {currentPlanName === "FREE_TRIAL" && (
          <View
            className="p-4 rounded-xl border mb-4 flex-row items-center justify-between"
            style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
          >
            <View className="flex-row items-start gap-2 flex-1 mr-2">
              <Clock size={20} color={COLORS.text} style={{ marginTop: 1 }} />
              <View>
                <Text
                  className="text-sm font-bold"
                  style={{ color: COLORS.text }}
                >
                  Free Trial Account
                </Text>
                <Text
                  className="text-xs mt-1"
                  style={{ color: COLORS.textMuted }}
                >
                  Ends on {formatDate(subscriptionData?.subscription?.endDate)}
                </Text>
              </View>
            </View>
            <Text
              className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-gray-200 dark:bg-slate-700"
              style={{ color: COLORS.text }}
            >
              {subscriptionData?.subscription?.status ?? "Active"}
            </Text>
          </View>
        )}

        {/* USAGE DETAILS SECTION */}
        <View
          className="p-5 rounded-2xl border mb-6"
          style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
        >
          <View className="mb-4">
            <Text className="text-lg font-bold" style={{ color: COLORS.text }}>
              Usage Details
            </Text>
            <Text className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              Detailed breakdown of your usage and limits
            </Text>
          </View>

          {/* Monthly Posts */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-1">
              <Text
                className="text-xs font-bold"
                style={{ color: COLORS.text }}
              >
                Monthly Posts
              </Text>
              <Text className="text-xs" style={{ color: COLORS.textMuted }}>
                {usageData?.usage?.postsThisMonth?.current || 0} (vs
                {usageData?.usage?.postsThisMonth?.lastMonth || 0} last month)
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text
                className="text-2xl font-bold"
                style={{ color: COLORS.text }}
              >
                {usageData?.usage?.postsThisMonth?.current || 0}
              </Text>
              <View
                className="flex-row items-center px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor:
                    (usageData?.usage?.postsThisMonth?.growth || 0) >= 0
                      ? "#d1fae5"
                      : "#fee2e2",
                }}
              >
                {(usageData?.usage?.postsThisMonth?.growth || 0) >= 0 ? (
                  <ArrowUp size={10} color="#065f46" />
                ) : (
                  <ArrowDown size={10} color="#991b1b" />
                )}
                <Text
                  className="text-[10px] font-bold ml-0.5"
                  style={{
                    color:
                      (usageData?.usage?.postsThisMonth?.growth || 0) >= 0
                        ? "#065f46"
                        : "#991b1b",
                  }}
                >
                  {Math.abs(usageData?.usage?.postsThisMonth?.growth || 0)}%
                </Text>
              </View>
            </View>
          </View>

          <View
            className="h-[1px] w-full my-4"
            style={{ backgroundColor: COLORS.border }}
          />

          {/* Total Contacts */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text
                className="text-xs font-bold"
                style={{ color: COLORS.text }}
              >
                Total Contacts
              </Text>
              <Text className="text-xs" style={{ color: COLORS.textMuted }}>
                {usageData?.usage?.contacts?.current || 0} /
                {usageData?.usage?.contacts?.limit || 0}
              </Text>
            </View>
            <View
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: isDark ? "#334155" : "#e2e8f0" }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(
                    ((usageData?.usage?.contacts?.current || 0) /
                      (usageData?.usage?.contacts?.limit || 1)) *
                    100,
                    100,
                  )}%`,
                  backgroundColor:
                    (usageData?.usage?.contacts?.current || 0) >=
                      (usageData?.usage?.contacts?.limit || 0)
                      ? COLORS.accent
                      : COLORS.success,
                }}
              />
            </View>
          </View>

          <View
            className="h-[1px] w-full my-4"
            style={{ backgroundColor: COLORS.border }}
          />

          {/* Campaigns */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text
                className="text-xs font-bold"
                style={{ color: COLORS.text }}
              >
                Campaigns
              </Text>
              <Text className="text-xs" style={{ color: COLORS.textMuted }}>
                {usageData?.usage?.campaigns?.current || 0} /
                {usageData?.usage?.campaigns?.limit || 0}
              </Text>
            </View>
            <View
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: isDark ? "#334155" : "#e2e8f0" }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(
                    ((usageData?.usage?.campaigns?.current || 0) /
                      (usageData?.usage?.campaigns?.limit || 1)) *
                    100,
                    100,
                  )}%`,
                  backgroundColor:
                    (usageData?.usage?.campaigns?.current || 0) >=
                      (usageData?.usage?.campaigns?.limit || 0)
                      ? COLORS.accent
                      : COLORS.success,
                }}
              />
            </View>
          </View>

          <View
            className="h-[1px] w-full my-4"
            style={{ backgroundColor: COLORS.border }}
          />

          {/* Connected Platforms */}
          <View>
            <View className="flex-row justify-between items-center mb-2">
              <Text
                className="text-xs font-bold"
                style={{ color: COLORS.text }}
              >
                Connected Platforms
              </Text>
              <Text className="text-xs" style={{ color: COLORS.textMuted }}>
                {usageData?.usage?.platforms?.current || 0} /
                {usageData?.usage?.platforms?.limit || 0}
              </Text>
            </View>
            <View
              className="h-2 w-full rounded-full overflow-hidden mb-4"
              style={{ backgroundColor: isDark ? "#334155" : "#e2e8f0" }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(
                    ((usageData?.usage?.platforms?.current || 0) /
                      (usageData?.usage?.platforms?.limit || 1)) *
                    100,
                    100,
                  )}%`,
                  backgroundColor:
                    (usageData?.usage?.platforms?.current || 0) >=
                      (usageData?.usage?.platforms?.limit || 0)
                      ? COLORS.accent
                      : COLORS.success,
                }}
              />
            </View>

            {usageData?.usage?.platforms?.connectedNames?.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mt-2">
                {usageData.usage.platforms.connectedNames.map(
                  (platform: string, index: number) => (
                    <View
                      key={index}
                      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm"
                      style={{
                        borderColor: COLORS.border,
                        backgroundColor: getPlatformBg(platform),
                      }}
                    >
                      <FontAwesome
                        name={getPlatformIcon(platform)}
                        size={12}
                        color={getPlatformColor(platform)}
                      />
                      <Text
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: COLORS.text }}
                      >
                        {platform}
                      </Text>
                    </View>
                  ),
                )}
              </View>
            )}
          </View>
        </View>

        {/* CURRENT PLAN SECTION */}
        {subscriptionData && (
          <View
            className="p-5 rounded-2xl border mb-6"
            style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
          >
            <View className="flex-row justify-between items-start mb-6">
              <View>
                <Text
                  className="text-2xl font-bold"
                  style={{ color: COLORS.text }}
                >
                  {subscriptionData?.subscription?.plan?.name ||
                    "Standard Plan"}
                </Text>
                <Text
                  className="text-sm font-semibold mt-1"
                  style={{ color: COLORS.textMuted }}
                >
                  {formatCurrency(currentPlanPrice)}/monthly
                </Text>
              </View>
              <View className="bg-red-600 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-bold uppercase tracking-widest">
                  {subscriptionData?.subscription?.status || "Active"}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-6 mb-6">
              <View className="flex-1 flex-row items-center gap-2.5">
                <View
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: isDark ? "#334155" : "#f1f5f9" }}
                >
                  <Calendar size={18} color={COLORS.textMuted} />
                </View>
                <View>
                  <Text
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: COLORS.textMuted }}
                  >
                    Start Date
                  </Text>
                  <Text
                    className="text-xs font-semibold mt-0.5"
                    style={{ color: COLORS.text }}
                  >
                    {formatDate(subscriptionData?.subscription?.startDate)}
                  </Text>
                </View>
              </View>

              <View className="flex-1 flex-row items-center gap-2.5">
                <View
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: isDark ? "#334155" : "#f1f5f9" }}
                >
                  <Calendar size={18} color={COLORS.textMuted} />
                </View>
                <View>
                  <Text
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: COLORS.textMuted }}
                  >
                    Next Billing Date
                  </Text>
                  <Text
                    className="text-xs font-semibold mt-0.5"
                    style={{ color: COLORS.text }}
                  >
                    {formatDate(subscriptionData?.subscription?.endDate)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View
          onLayout={(e) => {
            tabsYOffset.current = e.nativeEvent.layout.y;
          }}
          style={{
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "#374151" : "#e5e7eb",
            marginBottom: 16,
          }}
        >
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'stretch' }}
          >
            {[
              { key: "plans", label: "Available Plans" },
              { key: "addons", label: "Purchase Add-ons" },
              { key: "credits", label: "Purchase Credits" },
            ].map((tab) => {
              const isActive = plansTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={1}
                  onLayout={(e) => {
                    tabLayouts.current[tab.key] = {
                      x: e.nativeEvent.layout.x,
                      width: e.nativeEvent.layout.width,
                    };
                  }}
                  onPress={() => {
                    setPlansTab(tab.key as "plans" | "addons" | "credits");
                    const layout = tabLayouts.current[tab.key];
                    if (layout && tabScrollRef.current) {
                      tabScrollRef.current.scrollTo({
                        x: layout.x - 16,
                        animated: true,
                      });
                    }
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    marginRight: 4,
                    borderBottomWidth: 2,
                    borderBottomColor: isActive ? COLORS.accent : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: isActive ? COLORS.accent : COLORS.text,
                    }}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {plansTab === 'plans' && (
          <>
            {/* MULTIPLE PLANS HANDLING */}
            {(() => {
              const planOrder = ["FREE_TRIAL", "PROFESSIONAL", "ENTERPRISE"];
              const mergedNames = new Set<string>();
              const allPlans: any[] = [];

              // Helper to add a plan object (flat shape) if not already present
              const addPlan = (planObj: any) => {
                if (!planObj?.name) return;
                if (!mergedNames.has(planObj.name)) {
                  mergedNames.add(planObj.name);
                  allPlans.push(planObj);
                }
              };

              // Source 1: current subscription plan (always guaranteed)
              if (subscriptionData?.subscription?.plan) {
                addPlan(subscriptionData.subscription.plan);
              }

              // Source 2: org subscriptions list (contains other plans user may have)
              const orgSubs = userData?.organisation?.subscriptions || [];
              for (const sub of orgSubs) {
                if (sub?.plan) addPlan(sub.plan);
              }

              // Source 3: all plans from getPlans() API
              for (const p of (plansData || [])) {
                if (p?.isActive !== false) addPlan(p);
              }

              // Filter out Free Trial if user has bought a plan (current or past)
              const hasPaidSub = (userData?.organisation?.subscriptions || []).some(
                (sub: any) => sub?.plan?.name && !sub.plan.name.toUpperCase().includes("FREE") && !sub.plan.name.toUpperCase().includes("TRIAL")
              );
              const hasInvoices = paymentsData?.invoices && paymentsData.invoices.length > 0;

              const isCurrentPaid = currentPlanName && !currentPlanName.toUpperCase().includes("FREE") && !currentPlanName.toUpperCase().includes("TRIAL");

              const hasBoughtPlan = isCurrentPaid || hasPaidSub || hasInvoices;

              if (hasBoughtPlan) {
                // Remove all free/trial plans from the list using case-insensitive check
                for (let i = allPlans.length - 1; i >= 0; i--) {
                  const n = allPlans[i].name?.toUpperCase() || "";
                  if (n.includes("FREE") || n.includes("TRIAL")) {
                    allPlans.splice(i, 1);
                  }
                }
              }

              // Sort: current plan first, then by planOrder
              allPlans.sort((a: any, b: any) => {
                const aIsCurrent = a.name === currentPlanName;
                const bIsCurrent = b.name === currentPlanName;
                if (aIsCurrent && !bIsCurrent) return -1;
                if (!aIsCurrent && bIsCurrent) return 1;
                const ai = planOrder.indexOf(a.name);
                const bi = planOrder.indexOf(b.name);
                return (ai === -1 ? planOrder.length : ai) - (bi === -1 ? planOrder.length : bi);
              });

              if (allPlans.length === 0) return null;

              return (
                <View className="mb-6">
                  <ScrollView
                    horizontal
                    snapToInterval={Dimensions.get('window').width - 40 + 16}
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ alignItems: 'stretch' }}
                    onMomentumScrollEnd={(e) => {
                      const newIndex = Math.round(e.nativeEvent.contentOffset.x / (Dimensions.get('window').width - 40 + 16));
                      setActivePlanIndex(newIndex);
                    }}
                  >
                    {allPlans.map((plan: any, idx: number) => {
                      const isCurrentPlan = plan.name === currentPlanName;

                      // Parse features if it's a string
                      let featuresList = plan.features;
                      if (typeof featuresList === 'string') {
                        try {
                          featuresList = JSON.parse(featuresList);
                        } catch (e) {
                          featuresList = [];
                        }
                      }

                      return (
                        <View key={plan.id || idx} style={{ width: Dimensions.get('window').width - 40, marginRight: 16 }}>
                          <View
                            className="p-5 rounded-2xl border flex-col justify-between"
                            style={{
                              flex: 1,
                              backgroundColor: COLORS.card,
                              borderColor: isCurrentPlan ? COLORS.accent : COLORS.border,
                              borderWidth: isCurrentPlan ? 2 : 1,
                            }}
                          >
                            <View className="flex-1">
                              <View className="flex-row justify-between items-start mb-3">
                                <View className="flex-1">
                                  <Text
                                    className="font-bold"
                                    style={{
                                      color: COLORS.text,
                                      fontSize: 22,
                                      lineHeight: 28,
                                    }}
                                  >
                                    {getPlanDisplayLabel(plan.name)}
                                  </Text>

                                  <View className="flex-row items-end mt-2">
                                    <Text
                                      className="font-bold"
                                      style={{
                                        color: COLORS.accent,
                                        fontSize: 30,
                                      }}
                                    >
                                      {formatCurrency(plan.price)}
                                    </Text>
                                    <Text
                                      className="ml-1"
                                      style={{
                                        color: COLORS.textMuted,
                                        fontSize: 13,
                                        marginBottom: 4,
                                      }}
                                    >
                                      / {plan.billingCycle?.toLowerCase() || "month"}
                                    </Text>
                                  </View>
                                </View>

                                {isCurrentPlan && (
                                  <View className="px-2.5 py-1 rounded-full bg-red-600 ml-2">
                                    <Text className="text-white text-[10px] font-bold uppercase tracking-wider">
                                      Current
                                    </Text>
                                  </View>
                                )}
                              </View>

                              <Text className="text-sm font-bold mb-3" style={{ color: COLORS.text }}>
                                Available Features
                              </Text>

                              <View className="gap-3 mb-6">
                                {featuresList?.map((feature: string, index: number) => (
                                  <View key={index} className="flex-row items-center gap-3">
                                    <View
                                      className="p-1 rounded-full"
                                      style={{ backgroundColor: isDark ? "#14532d" : "#dcfce7" }}
                                    >
                                      <CheckCircle2
                                        size={14}
                                        color={isDark ? "#4ade80" : "#16a34a"}
                                      />
                                    </View>
                                    <Text
                                      className="text-sm font-medium flex-1"
                                      style={{ color: COLORS.text }}
                                    >
                                      {feature}
                                    </Text>
                                  </View>
                                ))}

                                {(!featuresList || featuresList.length === 0) && (
                                  <Text
                                    className="text-sm"
                                    style={{ color: COLORS.textMuted }}
                                  >
                                    No features listed for this plan.
                                  </Text>
                                )}
                              </View>
                            </View>

                            {/* Current Plan Button */}
                            <TouchableOpacity
                              disabled={isCurrentPlan}
                              onPress={() => {
                                router.push({
                                  pathname: "/webview",
                                  params: {
                                    url: "https://campzeo.com/user/billing",
                                  },
                                });
                              }}
                              className="mt-auto py-3 rounded-xl items-center"
                              style={{
                                backgroundColor: isCurrentPlan ? COLORS.border : COLORS.accent,
                                opacity: isCurrentPlan ? 0.8 : 1,
                              }}
                            >
                              <Text
                                className="font-semibold"
                                style={{
                                  color: isCurrentPlan ? COLORS.textMuted : "#fff",
                                }}
                              >
                                {isCurrentPlan ? "Current Plan" : `Switch to ${getPlanDisplayLabel(plan.name)}`}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>

                  {/* Pagination Dots */}
                  {allPlans.length > 1 && (
                    <View className="flex-row justify-center items-center gap-2 mt-4">
                      {allPlans.map((_: any, idx: number) => (
                        <View
                          key={idx}
                          style={{
                            width: idx === activePlanIndex ? 20 : 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: idx === activePlanIndex ? COLORS.accent : COLORS.border,
                          }}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })()}
          </>
        )}

        {plansTab === 'addons' && (
          <View className="mb-5">
            {addOns.length === 0 ? (
              <View
                className="p-8 rounded-2xl items-center"
                style={{
                  backgroundColor: COLORS.card,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              >
                <Package size={48} color={COLORS.accent} />
                <Text className="text-lg font-bold mt-4" style={{ color: COLORS.text }}>
                  No Add-ons Available
                </Text>
                <Text className="text-center mt-2" style={{ color: COLORS.textMuted, lineHeight: 22 }}>
                  Check back later for available add-ons.
                </Text>
              </View>
            ) : (
              <>
                {addOns.filter((a: any) => a.pricingType === 'FIXED').length > 0 && (
                  <View className="mb-4">
                    <Text
                      className="text-xs font-bold uppercase tracking-widest mb-3"
                      style={{ color: COLORS.textMuted }}
                    >
                      Feature Unlocks
                    </Text>
                    {addOns
                      .filter((a: any) => a.pricingType === 'FIXED')
                      .map((addon: any) => (
                        <View
                          key={addon.id}
                          className="rounded-2xl border mb-3 overflow-hidden"
                          style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
                        >
                          <View className="p-4">
                            <View className="flex-row items-start justify-between">
                              <View className="flex-1 mr-3">
                                <Text
                                  className="font-bold text-base"
                                  style={{ color: COLORS.text }}
                                >
                                  {addon.addOnName.trim()}
                                </Text>
                                <Text
                                  className="text-xs mt-1"
                                  style={{ color: COLORS.textMuted, lineHeight: 18 }}
                                >
                                  {addon.description}
                                </Text>
                              </View>
                              <View
                                className="px-3 py-1.5 rounded-xl"
                                style={{ backgroundColor: isDark ? '#1e3a5f' : '#eff6ff' }}
                              >
                                <Text
                                  className="font-bold text-sm"
                                  style={{ color: '#3b82f6' }}
                                >
                                  {formatCurrency(addon.oneTimePrice)}
                                </Text>
                                <Text
                                  className="text-[10px] text-center"
                                  style={{ color: isDark ? '#93c5fd' : '#60a5fa' }}
                                >
                                  one-time
                                </Text>
                              </View>
                            </View>

                            <TouchableOpacity
                              onPress={() => router.push({ pathname: '/webview', params: { url: 'https://campzeo.com/user/billing' } })}
                              className="mt-4 py-2.5 rounded-xl items-center flex-row justify-center gap-2"
                              style={{ backgroundColor: COLORS.accent }}
                              activeOpacity={0.8}
                            >
                              <Zap size={14} color="#fff" />
                              <Text className="font-semibold text-sm" style={{ color: '#fff' }}>
                                Unlock Now
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                  </View>
                )}

                {addOns.filter((a: any) => a.pricingType === 'QUANTITY').length > 0 && (
                  <View>
                    <Text
                      className="text-xs font-bold uppercase tracking-widest mb-3"
                      style={{ color: COLORS.textMuted }}
                    >
                      Credit Packs
                    </Text>
                    {addOns
                      .filter((a: any) => a.pricingType === 'QUANTITY')
                      .map((addon: any) => {
                        const qty = addOnQuantities[addon.id] ?? 1;
                        const total = addon.oneTimePrice * qty;
                        return (
                          <View
                            key={addon.id}
                            className="rounded-2xl border mb-3 overflow-hidden"
                            style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
                          >
                            <View
                              className="px-4 py-2 flex-row items-center gap-2"
                              style={{ backgroundColor: isDark ? '#14532d' : '#dcfce7' }}
                            >
                              <Zap size={12} color={isDark ? '#4ade80' : '#16a34a'} />
                              <Text
                                className="text-xs font-bold uppercase tracking-wider"
                                style={{ color: isDark ? '#4ade80' : '#15803d' }}
                              >
                                AI Credits
                              </Text>
                            </View>
                            <View className="p-4">
                              <View className="flex-row items-start justify-between mb-4">
                                <View className="flex-1 mr-3">
                                  <Text
                                    className="font-bold text-base"
                                    style={{ color: COLORS.text }}
                                  >
                                    {addon.addOnName.trim()}
                                  </Text>
                                  <Text
                                    className="text-xs mt-1"
                                    style={{ color: COLORS.textMuted, lineHeight: 18 }}
                                  >
                                    {addon.description}
                                  </Text>
                                </View>
                                <View className="items-end">
                                  <Text
                                    className="font-bold text-base"
                                    style={{ color: COLORS.success }}
                                  >
                                    {formatCurrency(total)}
                                  </Text>
                                  <Text
                                    className="text-[10px]"
                                    style={{ color: COLORS.textMuted }}
                                  >
                                    {formatCurrency(addon.oneTimePrice)} / pack
                                  </Text>
                                </View>
                              </View>

                              <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>
                                  Quantity
                                </Text>
                                <View
                                  className="flex-row items-center rounded-xl border overflow-hidden"
                                  style={{ borderColor: COLORS.border }}
                                >
                                  <TouchableOpacity
                                    onPress={() =>
                                      setAddOnQuantities(prev => ({
                                        ...prev,
                                        [addon.id]: Math.max(1, (prev[addon.id] ?? 1) - 1),
                                      }))
                                    }
                                    className="px-4 py-2"
                                    style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9' }}
                                  >
                                    <Text className="font-bold text-base" style={{ color: COLORS.text }}>−</Text>
                                  </TouchableOpacity>
                                  <View className="px-5 py-2">
                                    <Text className="font-bold text-sm" style={{ color: COLORS.text }}>{qty}</Text>
                                  </View>
                                  <TouchableOpacity
                                    onPress={() =>
                                      setAddOnQuantities(prev => ({
                                        ...prev,
                                        [addon.id]: (prev[addon.id] ?? 1) + 1,
                                      }))
                                    }
                                    className="px-4 py-2"
                                    style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9' }}
                                  >
                                    <Text className="font-bold text-base" style={{ color: COLORS.text }}>+</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>

                              <TouchableOpacity
                                onPress={() => router.push({ pathname: '/webview', params: { url: 'https://campzeo.com/user/billing' } })}
                                className="py-2.5 rounded-xl items-center flex-row justify-center gap-2"
                                style={{ backgroundColor: COLORS.success }}
                                activeOpacity={0.8}
                              >
                                <Zap size={14} color="#fff" />
                                <Text className="font-semibold text-sm" style={{ color: '#fff' }}>
                                  Buy {qty} Pack{qty > 1 ? 's' : ''} · {formatCurrency(total)}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {plansTab === 'credits' && (
          <View className="mb-5">
            <View className="p-5 rounded-2xl border" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
              <Text className="text-xl font-bold mb-1" style={{ color: COLORS.text }}>Purchase Credits</Text>
              <Text className="text-sm mb-6" style={{ color: COLORS.textMuted }}>
                Enter the amount of credits you want to purchase. The cost will be calculated automatically.
              </Text>

              <Text className="text-sm font-bold mb-3" style={{ color: COLORS.text }}>Select Channel</Text>

              <View className="flex-row gap-4 mb-6">
                <TouchableOpacity
                  onPress={() => setCreditChannel('SMS')}
                  className={`flex-1 p-4 rounded-xl border ${creditChannel === 'SMS' ? 'border-red-600 bg-red-50 dark:bg-red-900/20' : ''}`}
                  style={{ borderColor: creditChannel === 'SMS' ? COLORS.accent : COLORS.border }}
                >
                  <View className="flex-row justify-between items-start mb-2 gap-1">
                    <Text className="font-bold flex-1" style={{ color: creditChannel === 'SMS' ? COLORS.accent : COLORS.text }}>SMS Credits</Text>
                    {creditChannel === 'SMS' && <CheckCircle2 size={16} color={COLORS.accent} />}
                  </View>
                  <Text className="text-xs" style={{ color: COLORS.textMuted }}>
                    {formatCreditPrice(getPricePerCredit('SMS'))} / credit
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCreditChannel('WHATSAPP')}
                  className={`flex-1 p-4 rounded-xl border ${creditChannel === 'WHATSAPP' ? 'border-red-600 bg-red-50 dark:bg-red-900/20' : ''}`}
                  style={{ borderColor: creditChannel === 'WHATSAPP' ? COLORS.accent : COLORS.border }}
                >
                  <View className="flex-row justify-between items-start mb-2 gap-1">
                    <Text className="font-bold flex-1" style={{ color: creditChannel === 'WHATSAPP' ? COLORS.accent : COLORS.text }}>WhatsApp Credits</Text>
                    {creditChannel === 'WHATSAPP' && <CheckCircle2 size={16} color={COLORS.accent} />}
                  </View>
                  <Text className="text-xs" style={{ color: COLORS.textMuted }}>
                    {formatCreditPrice(getPricePerCredit('WHATSAPP'))} / credit
                  </Text>
                </TouchableOpacity>
              </View>

              <Text className="text-sm font-bold mb-2" style={{ color: COLORS.text }}>Quantity (Min 100)</Text>
              <TextInput
                value={creditQuantity}
                onChangeText={(val) => {
                  let cleaned = val.replace(/[^0-9]/g, '');
                  if (cleaned !== '') {
                    const num = parseInt(cleaned, 10);
                    if (num > 9999) {
                      cleaned = '9999';
                    }
                  }
                  setCreditQuantity(cleaned);
                }}
                onEndEditing={(e) => {
                  const num = parseInt(e.nativeEvent.text || '0', 10);
                  if (isNaN(num) || num < 100) {
                    setCreditQuantity('100');
                  }
                }}
                onBlur={() => {
                  const num = parseInt(creditQuantity || '0', 10);
                  if (isNaN(num) || num < 100) {
                    setCreditQuantity('100');
                  }
                }}
                keyboardType="numeric"
                maxLength={4}
                className="w-full border rounded-xl p-4 text-base mb-6"
                style={{
                  color: COLORS.text,
                  backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                  borderColor: COLORS.border,
                }}
              />

              <View className="p-4 rounded-xl mb-6" style={{ backgroundColor: isDark ? "#33415550" : "#f8fafc" }}>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-sm" style={{ color: COLORS.textMuted }}>Price per credit</Text>
                  <Text className="font-bold" style={{ color: COLORS.text }}>
                    {formatCreditPrice(getPricePerCredit(creditChannel))}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-sm" style={{ color: COLORS.textMuted }}>Quantity</Text>
                  <Text className="font-bold" style={{ color: COLORS.text }}>{creditQuantity || '0'}</Text>
                </View>
                <View className="h-[1px] w-full mb-4" style={{ backgroundColor: COLORS.border }} />
                <View className="flex-row justify-between items-center">
                  <Text className="text-base font-bold" style={{ color: COLORS.text }}>Total Price</Text>
                  <Text className="text-xl font-bold" style={{ color: COLORS.accent }}>
                    {formatCurrency((parseInt(creditQuantity || '0') * getPricePerCredit(creditChannel)))}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                disabled={!creditQuantity || parseInt(creditQuantity, 10) < 100}
                onPress={() => router.push({ pathname: '/webview', params: { url: 'https://campzeo.com/user/billing' } })}
                className="w-full py-4 rounded-xl items-center"
                style={{ backgroundColor: (!creditQuantity || parseInt(creditQuantity, 10) < 100) ? COLORS.border : COLORS.accent }}
              >
                <Text 
                  className="font-bold text-base" 
                  style={{ color: (!creditQuantity || parseInt(creditQuantity, 10) < 100) ? COLORS.textMuted : '#fff' }}
                >
                  Buy Credits
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View className="gap-6 mb-5">
          {isTrial ? (
            <View className="p-5 rounded-2xl border bg-amber-50/20 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/30">
              <View className="flex-row items-start gap-2.5 mb-2">
                <AlertCircle
                  size={20}
                  color="#d97706"
                  style={{ marginTop: 1 }}
                />
                <View className="flex-1">
                  <Text className="text-base font-bold text-amber-950 dark:text-amber-400">
                    Access Restricted
                  </Text>
                  <Text className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-5">
                    SMS and WhatsApp messaging is not available for free trial
                    accounts.
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-amber-900 dark:text-amber-400 font-medium leading-5">
                Please upgrade your plan to a paid subscription to request
                Add-ons access and start sending campaigns.
              </Text>
            </View>
          ) : (
            <View>
              {balanceData?.twilioAccess?.twilioAccessStatus === "APPROVED" && (
                <View className="p-5 rounded-2xl border bg-green-50/20 border-green-200 dark:bg-green-950/10 dark:border-green-900/30">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <CheckCircle2 size={18} color="#16a34a" />
                      <Text
                        className="text-sm font-bold"
                        style={{ color: COLORS.text }}
                      >
                        Twilio SMS & WhatsApp Access
                      </Text>
                    </View>
                    <View className="px-2.5 py-0.5 rounded-full bg-green-600">
                      <Text className="text-white text-[10px] font-bold uppercase">
                        Approved
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-green-800 dark:text-green-400 mt-3 leading-5">
                    Your access has been approved. You can now purchase credits
                    and send campaigns.
                  </Text>
                </View>
              )}

              {balanceData?.twilioAccess?.twilioAccessStatus === "PENDING" && (
                <View className="p-5 rounded-2xl border bg-blue-50/20 border-blue-200 dark:bg-blue-950/10 dark:border-blue-900/30">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <Clock size={18} color="#3b82f6" />
                      <Text
                        className="text-sm font-bold"
                        style={{ color: COLORS.text }}
                      >
                        Access Request Pending
                      </Text>
                    </View>
                    <View className="px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                      <Text className="text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase">
                        Pending Review
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-blue-800 dark:text-blue-400 mt-3 leading-5">
                    Our team is reviewing your request for Twilio access. You'll
                    be notified once it's approved.
                  </Text>
                  {balanceData?.twilioAccess?.twilioAccessReason && (
                    <View className="mt-3 p-2.5 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-blue-100 dark:border-blue-950">
                      <Text className="text-[11px] italic text-blue-600 dark:text-blue-400">
                        "{balanceData.twilioAccess.twilioAccessReason}"
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {(balanceData?.twilioAccess?.twilioAccessStatus === "NONE" ||
                balanceData?.twilioAccess?.twilioAccessStatus ===
                "REJECTED") && (
                  <View
                    className="p-5 rounded-2xl border"
                    style={{
                      backgroundColor: COLORS.card,
                      borderColor:
                        balanceData?.twilioAccess?.twilioAccessStatus ===
                          "REJECTED"
                          ? "#fecaca"
                          : COLORS.border,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center gap-2">
                        <Send size={18} color={COLORS.accent} />
                        <Text
                          className="text-base font-bold"
                          style={{ color: COLORS.text }}
                        >
                          Request Twilio Access
                        </Text>
                      </View>
                      {balanceData?.twilioAccess?.twilioAccessStatus ===
                        "REJECTED" && (
                          <View className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-900/30">
                            <Text className="text-red-700 dark:text-red-400 text-[10px] font-bold uppercase">
                              Rejected
                            </Text>
                          </View>
                        )}
                    </View>

                    <Text
                      className="text-xs mb-4"
                      style={{ color: COLORS.textMuted }}
                    >
                      Apply for SMS and WhatsApp campaign access. Please describe
                      your use case briefly.
                    </Text>

                    {balanceData?.twilioAccess?.twilioAccessStatus ===
                      "REJECTED" && (
                        <View className="p-3 bg-red-50 border border-red-100 rounded-xl mb-4 flex-row items-start gap-2 dark:bg-red-950/20 dark:border-red-900/30">
                          <AlertCircle
                            size={16}
                            color="#dc2626"
                            style={{ marginTop: 1 }}
                          />
                          <View className="flex-1">
                            <Text className="text-xs font-bold text-red-900 dark:text-red-400">
                              Request Rejected
                            </Text>
                            <Text className="text-[11px] text-red-800 dark:text-red-300 mt-0.5">
                              {balanceData?.twilioAccess?.twilioAccessReason ||
                                "No reason provided by admin."}
                            </Text>
                          </View>
                        </View>
                      )}

                    <Text
                      className="text-[10px] font-bold uppercase mb-1 block tracking-wider"
                      style={{ color: COLORS.textMuted }}
                    >
                      Reason for request
                    </Text>
                    <TextInput
                      value={requestReason}
                      onChangeText={setRequestReason}
                      multiline
                      numberOfLines={4}
                      className="w-full border rounded-xl p-3 text-xs focus:outline-none mb-3"
                      placeholder="e.g. I want to send promotional SMS and WhatsApp updates to my 5000+ customer base."
                      placeholderTextColor={COLORS.textMuted}
                      style={{
                        color: COLORS.text,
                        backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                        borderColor: COLORS.border,
                        minHeight: 80,
                        textAlignVertical: "top",
                      }}
                    />
                    <TouchableOpacity
                      disabled={isSubmittingTwilio || !requestReason.trim()}
                      onPress={onSubmitTwilioRequest}
                      className="w-full py-3 bg-red-600 rounded-xl items-center flex-row justify-center gap-2"
                      style={{
                        opacity:
                          isSubmittingTwilio || !requestReason.trim() ? 0.5 : 1,
                      }}
                    >
                      {isSubmittingTwilio && (
                        <Loader2
                          size={14}
                          className="animate-spin"
                          color="#ffffff"
                        />
                      )}
                      <Text className="text-white font-bold text-sm">
                        {isSubmittingTwilio ? "Submitting..." : "Submit Request"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
            </View>
          )}

          {balanceData?.twilioAccess?.twilioAccessStatus === "APPROVED" && (
            <View
              className="p-5 rounded-2xl border"
              style={{
                backgroundColor: COLORS.card,
                borderColor: COLORS.border,
              }}
            >
              <View
                className="border-b pb-4 mb-4 flex-row items-center"
                style={{ borderColor: COLORS.border }}
              >
                {/* Left Content */}
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text
                    style={{
                      color: COLORS.text,
                      fontSize: 18,
                      fontWeight: "700",
                    }}
                    numberOfLines={2}
                  >
                    Wallet & Messaging Credits
                  </Text>

                  <Text
                    style={{
                      color: COLORS.textMuted,
                      fontSize: 12,
                      marginTop: 4,
                    }}
                    numberOfLines={1}
                  >
                    Track credits for campaigns
                  </Text>
                </View>

                {/* Badge */}
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: isDark
                      ? "rgba(34,197,94,0.15)"
                      : "#dcfce7",
                    flexShrink: 0,
                  }}
                >
                  <Text
                    style={{
                      color: "#16a34a",
                      fontSize: 10,
                      fontWeight: "700",
                    }}
                    numberOfLines={1}
                  >
                    Active Wallet
                  </Text>
                </View>
              </View>

              <View className="gap-4">
                <View
                  className="p-4 rounded-xl border"
                  style={{
                    backgroundColor: isDark ? "#450a0a10" : "#fee2e230",
                    borderColor: "#fecaca50",
                  }}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-[10px] font-bold uppercase tracking-widest text-red-700 dark:text-red-400">
                      SMS Balance
                    </Text>
                    <View className="px-2 py-0.5 bg-red-100 rounded dark:bg-red-950/50">
                      <Text className="text-red-800 text-[9px] font-bold dark:text-red-400">
                        Pay-As-You-Go
                      </Text>
                    </View>
                  </View>
                  <Text
                    className="text-3xl font-extrabold"
                    style={{ color: COLORS.text }}
                  >
                    {Number(
                      balanceData?.wallet?.smsCreditsAvailable || 0,
                    ).toLocaleString("en-IN")}
                  </Text>
                  <Text
                    className="text-[10px] mt-1"
                    style={{ color: COLORS.textMuted }}
                  >
                    Used:{" "}
                    <Text className="font-bold">
                      {Number(
                        balanceData?.wallet?.smsCreditsUsed || 0,
                      ).toLocaleString("en-IN")}
                    </Text>{" "}
                    credits
                  </Text>
                </View>

                <View
                  className="p-4 rounded-xl border"
                  style={{
                    backgroundColor: isDark ? "#064e3b10" : "#d1fae530",
                    borderColor: "#a7f3d050",
                  }}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-[10px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
                      WhatsApp Balance
                    </Text>
                    <View className="px-2 py-0.5 bg-green-100 rounded dark:bg-green-950/50">
                      <Text className="text-green-800 text-[9px] font-bold dark:text-green-400">
                        Pay-As-You-Go
                      </Text>
                    </View>
                  </View>
                  <Text
                    className="text-3xl font-extrabold"
                    style={{ color: COLORS.text }}
                  >
                    {Number(
                      balanceData?.wallet?.whatsappCreditsAvailable || 0,
                    ).toLocaleString("en-IN")}
                  </Text>
                  <Text
                    className="text-[10px] mt-1"
                    style={{ color: COLORS.textMuted }}
                  >
                    Used:{" "}
                    <Text className="font-bold">
                      {Number(
                        balanceData?.wallet?.whatsappCreditsUsed || 0,
                      ).toLocaleString("en-IN")}
                    </Text>{" "}
                    credits
                  </Text>
                </View>
              </View>

              {balanceData?.wallet?.transactions &&
                balanceData.wallet.transactions.length > 0 && (
                  <View className="mt-6">
                    <Text
                      className="text-sm font-bold mb-3"
                      style={{ color: COLORS.text }}
                    >
                      Recent Transactions
                    </Text>
                    <View
                      className="border rounded-xl overflow-hidden"
                      style={{ borderColor: COLORS.border }}
                    >
                      {balanceData?.wallet?.transactions
                        ?.slice(0, 3)
                        .map((tx: any, idx: number) => {
                          const isPurchase =
                            tx.type === "PURCHASE" || tx.type === "CREDIT";
                          return (
                            <View
                              key={tx.id || idx}
                              className="flex-row items-center justify-between p-3 border-b"
                              style={{
                                borderColor: COLORS.border,
                                backgroundColor:
                                  idx % 2 === 0
                                    ? isDark
                                      ? "#1e293b"
                                      : "#ffffff"
                                    : isDark
                                      ? "#0f172a"
                                      : "#f8fafc",
                              }}
                            >
                              <View className="flex-1 mr-2">
                                <Text
                                  className="text-[11px] font-medium"
                                  style={{ color: COLORS.text }}
                                >
                                  {tx.description}
                                </Text>
                                <Text
                                  className="text-[9px] mt-0.5"
                                  style={{ color: COLORS.textMuted }}
                                >
                                  {formatDate(tx.createdDate)}
                                </Text>
                                <View
                                  className="self-start px-2 py-1 rounded-full mt-0.5"
                                  style={{ backgroundColor: "#EEF2FF" }}
                                >
                                  <Text
                                    className="text-[9px] font-semibold uppercase"
                                    style={{ color: "#2563EB" }}
                                  >
                                    {tx.type}
                                  </Text>
                                </View>
                              </View>
                              <View className="items-end">
                                <View className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 mb-1">
                                  <Text
                                    className="text-[8px] font-bold uppercase"
                                    style={{ color: COLORS.textMuted }}
                                  >
                                    {tx.service}
                                  </Text>
                                </View>
                                <Text
                                  className="text-xs font-bold"
                                  style={{
                                    color: isPurchase
                                      ? COLORS.success
                                      : COLORS.accent,
                                  }}
                                >
                                  {isPurchase ? "+" : "-"}
                                  {Number(tx.amount).toLocaleString("en-IN")}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                    </View>
                  </View>
                )}
            </View>
          )}
        </View>

        <View
          className="p-5 rounded-2xl border"
          style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}
        >
          <View className="mb-4">
            <Text className="text-lg font-bold" style={{ color: COLORS.text }}>
              Payment History
            </Text>
            <Text className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              View your past transactions
            </Text>
          </View>

          <ScrollView 
            nestedScrollEnabled 
            style={{ maxHeight: 400 }} 
            showsVerticalScrollIndicator={false}
          >
            {paymentsData &&
              paymentsData?.invoices &&
              paymentsData?.invoices?.length > 0 ? (
              paymentsData.invoices.map((payment: any, idx: number) => {
                const isPaid = payment.status === "PAID";
                return (
                  <View key={payment.id || idx}>
                    <View className="flex-row justify-between items-center py-4">
                      <View className="flex-1 mr-4">
                        {(() => {
                          const desc = payment?.description ||
                            (payment?.subscription?.billingPlan?.name
                              ? `Subscription for ${getPlanDisplayLabel(payment.subscription.billingPlan.name)} Plan`
                              : "Free Trial Plan");
                          if (desc.includes(":")) {
                            const parts = desc.split(":");
                            return (
                              <>
                                <Text className="text-sm font-bold" style={{ color: COLORS.text }}>
                                  {parts[0]}:
                                </Text>
                                <Text className="text-xs font-semibold mt-0.5 mb-1" style={{ color: COLORS.textMuted }}>
                                  {parts.slice(1).join(":").trim()}
                                </Text>
                              </>
                            );
                          }
                          return (
                            <Text className="text-sm font-bold" style={{ color: COLORS.text }}>
                              {desc}
                            </Text>
                          );
                        })()}
                        <Text
                          className="text-[10px] mt-1"
                          style={{ color: COLORS.textMuted }}
                        >
                          {formatDate(payment.paidDate)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text
                          className="text-sm font-bold mb-1"
                          style={{ color: COLORS.text }}
                        >
                          {formatCurrency(payment.amount)}
                        </Text>
                        <View
                          className="px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: isPaid
                              ? isDark
                                ? "#064e3b"
                                : "#d1fae5"
                              : isDark
                                ? "#450a0a"
                                : "#fee2e2",
                          }}
                        >
                          <Text
                            className="text-[8px] font-bold uppercase tracking-wider"
                            style={{
                              color: isPaid ? COLORS.success : COLORS.accent,
                            }}
                          >
                            {payment.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {idx !== paymentsData.invoices.length - 1 && (
                      <View
                        className="h-[1px] w-full"
                        style={{ backgroundColor: COLORS.border }}
                      />
                    )}
                  </View>
                );
              })
            ) : (
              <View className="py-8 items-center justify-center">
                <Text
                  className="text-xs italic"
                  style={{ color: COLORS.textMuted }}
                >
                  No payment history found.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      {/* CANCELLATION MODAL */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-4">
          <View
            className="w-full max-w-sm rounded-3xl p-6"
            style={{ backgroundColor: COLORS.card }}
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text
                className="text-lg font-bold"
                style={{ color: COLORS.text }}
              >
                Cancel Subscription
              </Text>
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                className="p-1"
              >
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
              Are you sure you want to cancel your
              {currentPlanName || "subscription"}? This action will affect your
              access to features.
            </Text>

            <View className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl flex-row gap-2 mb-4">
              <AlertCircle size={16} color="#dc2626" style={{ marginTop: 1 }} />
              <Text className="text-[11px] font-semibold text-red-800 dark:text-red-400 flex-1 leading-4">
                Cancelling your subscription will result in loss of access to
                premium features.
              </Text>
            </View>

            <Text
              className="text-xs font-bold mb-3"
              style={{ color: COLORS.text }}
            >
              When should the cancellation take effect?
            </Text>

            <View className="gap-3 mb-4">
              <TouchableOpacity
                onPress={() => setCancelImmediately(false)}
                className={`p-3.5 border rounded-xl flex-row items-start gap-2.5 ${cancelImmediately === false ? "bg-red-50/20" : ""}`}
                style={{
                  borderColor:
                    cancelImmediately === false ? COLORS.accent : COLORS.border,
                }}
              >
                {cancelImmediately === false ? (
                  <CircleDot
                    size={16}
                    color={COLORS.accent}
                    style={{ marginTop: 1 }}
                  />
                ) : (
                  <Circle
                    size={16}
                    color={COLORS.textMuted}
                    style={{ marginTop: 1 }}
                  />
                )}
                <View className="flex-1">
                  <Text
                    className="text-xs font-bold"
                    style={{ color: COLORS.text }}
                  >
                    At the end of billing period
                  </Text>
                  <Text
                    className="text-[10px] mt-0.5"
                    style={{ color: COLORS.textMuted }}
                  >
                    You'll retain access until your subscription ends
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCancelImmediately(true)}
                className={`p-3.5 border rounded-xl flex-row items-start gap-2.5 ${cancelImmediately === true ? "bg-red-50/20" : ""}`}
                style={{
                  borderColor:
                    cancelImmediately === true ? COLORS.accent : COLORS.border,
                }}
              >
                {cancelImmediately === true ? (
                  <CircleDot
                    size={16}
                    color={COLORS.accent}
                    style={{ marginTop: 1 }}
                  />
                ) : (
                  <Circle
                    size={16}
                    color={COLORS.textMuted}
                    style={{ marginTop: 1 }}
                  />
                )}
                <View className="flex-1">
                  <Text
                    className="text-xs font-bold"
                    style={{ color: COLORS.text }}
                  >
                    Immediately
                  </Text>
                  <Text
                    className="text-[10px] mt-0.5"
                    style={{ color: COLORS.textMuted }}
                  >
                    Your access will be revoked right away
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {cancellationError && (
              <Text className="text-[10px] font-bold text-red-600 mb-3">
                {cancellationError}
              </Text>
            )}

            <Text
              className="text-xs font-bold mb-1.5"
              style={{ color: COLORS.text }}
            >
              Reason for cancellation (optional)
            </Text>
            <TextInput
              value={cancellationReason}
              onChangeText={setCancellationReason}
              className="w-full border rounded-xl p-3 text-xs focus:outline-none mb-5"
              placeholder="Let us know why you're cancelling..."
              placeholderTextColor={COLORS.textMuted}
              style={{
                color: COLORS.text,
                backgroundColor: isDark ? "#0f172a" : "#f8fafc",
                borderColor: COLORS.border,
                minHeight: 60,
                textAlignVertical: "top",
              }}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                className="flex-1 py-3 border rounded-xl items-center"
                style={{ borderColor: COLORS.border }}
              >
                <Text
                  className="font-semibold text-xs"
                  style={{ color: COLORS.text }}
                >
                  Keep Subscription
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={isCancelling}
                onPress={confirmCancellation}
                className="flex-1 py-3 bg-red-600 rounded-xl items-center flex-row justify-center gap-1.5"
                style={{ opacity: isCancelling ? 0.7 : 1 }}
              >
                {isCancelling && (
                  <Loader2 size={12} className="animate-spin" color="#ffffff" />
                )}
                <Text className="text-white font-bold text-xs">
                  {isCancelling ? "Cancelling..." : "Confirm"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* REDIRECT MODAL */}
      <Modal
        visible={showRedirectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRedirectModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-4">
          <View
            className="w-full max-w-sm rounded-3xl p-6"
            style={{ backgroundColor: COLORS.card }}
          >
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <View className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <AlertCircle size={20} color="#3b82f6" />
                </View>
                <Text
                  className="text-lg font-bold"
                  style={{ color: COLORS.text }}
                >
                  Redirect to Web
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowRedirectModal(false)}
                className="p-1"
              >
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <Text className="text-sm mb-6 leading-5" style={{ color: COLORS.textMuted }}>
              Payments cannot be processed directly through the mobile application. You will be redirected to the web dashboard to {redirectActionName}.
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowRedirectModal(false)}
                className="flex-1 py-3.5 border rounded-xl items-center"
                style={{ borderColor: COLORS.border }}
              >
                <Text
                  className="font-bold text-sm"
                  style={{ color: COLORS.text }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={proceedWithRedirect}
                className="flex-1 py-3.5 bg-blue-600 rounded-xl items-center flex-row justify-center"
              >
                <Text className="text-white font-bold text-sm">
                  Proceed
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}
