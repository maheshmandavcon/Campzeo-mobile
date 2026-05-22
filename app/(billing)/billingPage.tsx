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
} from "@/api/billingApi";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
} from "lucide-react-native";
import { fetchInvoices } from "@/api/invoicesApi";

export default function BillingPage() {
  const router = useRouter();
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
  const [balanceData, setBalanceData] = useState<any>(null);
  const [plansData, setPlansData] = useState<any[]>([]);
  const [paymentsData, setPaymentsData] = useState<{ invoices: any[] }>({
    invoices: [],
  });
  const [comparisonPlanColumns, setComparisonPlanColumns] = useState<any[]>([]);
  const [comparisonFeatures, setComparisonFeatures] = useState<any[]>([]);
  const [creditPackages, setCreditPackages] = useState<any[]>([]);
  // UI State
  const [activeBillingTab, setActiveBillingTab] = useState<"plans" | "credits">(
    "plans",
  );
  const [showCancelModal, setShowCancelModal] = useState(false);
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
  const fetchBillingDetails = async () => {
    try {
      const [usage, subscription, plan, payment, balance, creditPacks] =
        await Promise.all([
          getUsage(),
          getCurrentSubscription(),
          getPlans(),
          fetchInvoices(),
          getWalletBalance(),
          getCreditPackages(),
        ]);

      setUsageData(usage);
      setSubscriptionData(subscription);
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

  const handlePaymentRedirect = (actionName: string) => {
    Alert.alert(
      "Redirect to Web Dashboard",
      `Payments cannot be processed directly through the mobile application. You will be redirected to the web dashboard to ${actionName}.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Proceed",
          onPress: () => {
            Linking.openURL("https://campzeo.com/organisation/billing");
          },
        },
      ],
    );
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
      className="flex-1 px-4 pt-16"
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
            onPress={() => router.push("/(tabs)/invoices")}
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

          {/* <TouchableOpacity
            onPress={() => setShowComparePlans(true)}
            className="flex-row items-center gap-1.5 px-3 py-1.5 border rounded-lg"
            style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}
          >
            <ArrowLeftRight size={14} color={COLORS.text} />
            <Text className="text-xs font-semibold" style={{ color: COLORS.text }}>Compare</Text>
          </TouchableOpacity> */}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* EXPIRING ALERT */}
        {currentPlanName !== "FREE_TRIAL" && premiumAlert && (
          <View
            className={`rounded-xl p-4 gap-3 mb-4 border ${
              isOneDay
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
                  className={`text-sm font-semibold ${
                    isOneDay
                      ? "text-red-900 dark:text-red-400"
                      : "text-amber-900 dark:text-amber-400"
                  }`}
                >
                  Plan Expiring Soon
                </Text>
                <Text
                  className={`text-xs mt-1 leading-5 ${
                    isOneDay
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
              className={`py-3 rounded-lg items-center flex-row justify-center gap-2 ${
                isOneDay ? "bg-red-600" : "bg-amber-600"
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

        <View className="mb-6 gap-6">
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

              {/* {balanceData?.twilioAccess?.twilioAccessStatus === "PENDING" && (
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
              )} */}
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
                className="border-b pb-4 mb-4 flex-row justify-between items-center"
                style={{ borderColor: COLORS.border }}
              >
                <View>
                  <Text
                    className="text-lg font-bold"
                    style={{ color: COLORS.text }}
                  >
                    Wallet & Messaging Credits
                  </Text>
                  <Text
                    className="text-xs mt-1"
                    style={{ color: COLORS.textMuted }}
                  >
                    Track credits for campaigns
                  </Text>
                </View>
                <View className="px-2.5 py-0.5 bg-green-100 rounded-full dark:bg-green-950/50">
                  <Text className="text-green-700 text-[10px] font-bold uppercase tracking-wider dark:text-green-400">
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

        {/* TABS (PURCHASE CREDITS / AVAILABLE PLANS) */}
        <View className="mb-6">
          {/* <View className="flex-row border-b mb-6" style={{ borderColor: COLORS.border }}>
            {balanceData?.twilioAccess?.twilioAccessStatus === 'APPROVED' && (
              <TouchableOpacity
                onPress={() => setActiveBillingTab('credits')}
                className="pb-3 px-4 border-b-2"
                style={{
                  borderColor: activeBillingTab === 'credits' ? COLORS.accent : 'transparent',
                }}
              >
                <Text
                  className="text-sm font-bold"
                  style={{ color: activeBillingTab === 'credits' ? COLORS.accent : COLORS.textMuted }}
                >
                  Purchase Credits
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setActiveBillingTab('plans')}
              className="pb-3 px-4 border-b-2"
              style={{
                borderColor: activeBillingTab === 'plans' ? COLORS.accent : 'transparent',
              }}
            >
              <Text
                className="text-sm font-bold"
                style={{ color: activeBillingTab === 'plans' ? COLORS.accent : COLORS.textMuted }}
              >
                Available Plans
              </Text>
            </TouchableOpacity>
          </View> */}

          {/* PURCHASE CREDITS TAB CONTENT */}
          {/* {activeBillingTab === 'credits' && balanceData?.twilioAccess?.twilioAccessStatus === 'APPROVED' && (
            <View>
              <View className="mb-4">
                <Text className="text-base font-bold" style={{ color: COLORS.text }}>Purchase SMS & WhatsApp Credits</Text>
                <Text className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Add credits to your channels using secure dashboard payments</Text>
              </View>

              <View className="gap-4">
                {creditPackages.map((pkg: any) => (
                  <View key={pkg.id} className="p-5 rounded-2xl border" style={{ backgroundColor: COLORS.card, borderColor: COLORS.border }}>
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1 mr-2">
                        <Text className="text-base font-bold uppercase" style={{ color: COLORS.text }}>{pkg.name}</Text>
                        <Text className="text-2xl font-extrabold mt-1.5" style={{ color: COLORS.text }}>{formatCurrency(pkg.price)}</Text>
                      </View>
                      <View
                        className="px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: pkg.type === 'SMS' ? (isDark ? "#450a0a" : "#fee2e2") : (isDark ? "#064e3b" : "#d1fae5"),
                        }}
                      >
                        <Text
                          className="text-[9px] font-bold uppercase"
                          style={{ color: pkg.type === 'SMS' ? COLORS.accent : COLORS.success }}
                        >
                          {pkg.type} Pack
                        </Text>
                      </View>
                    </View>

                    <View className="mb-4 gap-2">
                      <View className="flex-row items-center gap-2">
                        <Check size={12} color={COLORS.accent} />
                        <Text className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>
                          {Number(pkg.credits).toLocaleString("en-IN")} Credits
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Check size={12} color={COLORS.accent} />
                        <Text className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>No expiration (valid forever)</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Check size={12} color={COLORS.accent} />
                        <Text className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>Instant credit delivery</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handlePaymentRedirect(`purchase the ${pkg.name} credit package`)}
                      className="w-full py-3 bg-red-600 rounded-xl items-center"
                    >
                      <Text className="text-white font-bold text-sm">Buy {pkg.name}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )} */}

          {/* AVAILABLE PLANS TAB CONTENT */}
          {/* {activeBillingTab === 'plans' && (
            <View>
              <View className="mb-4">
                <Text className="text-base font-bold" style={{ color: COLORS.text }}>Available Subscription Plans</Text>
                <Text className="text-xs mt-1" style={{ color: COLORS.textMuted }}>Choose the perfect plan for your business growth</Text>
              </View>

              <View className="gap-6">
                {plansData && plansData.filter((p: any) => p.name !== 'FREE_TRIAL').map((plan: any) => {
                  const isCurrent = currentPlanName === plan.name;
                  const isPopular = plan.name === 'PROFESSIONAL' || plan.name === 'ENTERPRISE';

                  return (
                    <View
                      key={plan.id}
                      className="p-6 rounded-3xl border relative"
                      style={{
                        backgroundColor: COLORS.card,
                        borderColor: isPopular ? COLORS.accent : COLORS.border,
                        borderWidth: isPopular ? 2 : 1,
                      }}
                    >
                      {isPopular && (
                        <View className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 px-4 py-1 rounded-full">
                          <Text className="text-white text-[9px] font-bold uppercase tracking-widest">Most Popular</Text>
                        </View>
                      )}

                      <View className="mb-4">
                        <Text className="text-lg font-bold uppercase" style={{ color: COLORS.text }}>{plan.name}</Text>
                        <View className="flex-row items-baseline mt-2">
                          <Text className="text-3xl font-extrabold" style={{ color: COLORS.text }}>{formatCurrency(plan.price)}</Text>
                          <Text className="text-xs uppercase ml-1" style={{ color: COLORS.textMuted }}>/{plan.billingCycle}</Text>
                        </View>
                      </View>

                      <View className="mb-5 gap-2.5">
                        {plan.features?.map((feature: string, idx: number) => (
                          <View key={idx} className="flex-row items-start gap-2">
                            <Check size={14} color={COLORS.accent} style={{ marginTop: 2 }} />
                            <Text className="text-xs flex-1" style={{ color: COLORS.textMuted }}>{feature}</Text>
                          </View>
                        ))}
                      </View>

                      <TouchableOpacity
                        disabled={isCurrent}
                        onPress={() => handlePaymentRedirect(`change your plan to ${plan.name}`)}
                        className={`w-full py-3 rounded-xl items-center ${isCurrent ? 'bg-slate-100 dark:bg-slate-800' : 'bg-red-600'}`}
                      >
                        <Text className={`font-bold text-sm ${isCurrent ? 'text-gray-500' : 'text-white'}`}>
                          {isCurrent ? 'Current Plan' : `Change to ${plan.name}`}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          )} */}
        </View>

        {/* PAYMENT HISTORY INVOICES SECTION */}
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

          <View>
            {paymentsData &&
            paymentsData?.invoices &&
            paymentsData?.invoices?.length > 0 ? (
              paymentsData.invoices.map((payment: any, idx: number) => {
                const isPaid = payment.status === "PAID";
                return (
                  <View key={payment.id || idx}>
                    <View className="flex-row justify-between items-center py-4">
                      <View>
                        <Text
                          className="text-sm font-bold"
                          style={{ color: COLORS.text }}
                        >
                          {payment?.subscription?.billingPlan?.name ??
                            "Free Trial"}
                          Plan
                        </Text>
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
          </View>
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

      {/* COMPARE PLANS MODAL */}
      {/* <Modal
        visible={showComparePlans}
        animationType="slide"
        onRequestClose={() => setShowComparePlans(false)}
      >
        <ThemedView className="flex-1 pt-12" style={{ backgroundColor: COLORS.bg }}>
          <View className="flex-row justify-between items-center px-6 py-4 border-b" style={{ borderColor: COLORS.border }}>
            <View className="flex-1 items-center">
              <View className="bg-red-100 dark:bg-red-950/50 px-3 py-1 rounded-full border border-red-200 dark:border-red-900/30 mb-2">
                <Text className="text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest">
                  Upgrade Your Workflow
                </Text>
              </View>
              <Text className="text-2xl font-bold" style={{ color: COLORS.text }}>Choose the perfect plan</Text>
              <Text className="text-xs text-center mt-1" style={{ color: COLORS.textMuted }}>
                Select a plan that scales with your growth. Cancel anytime.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowComparePlans(false)}
              className="absolute top-4 right-4 p-2 rounded-full border"
              style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}
            >
              <X size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <ScrollView className="p-6" contentContainerStyle={{ paddingBottom: 60 }}>
            <View className="gap-6 mb-8">
              {plansData && plansData.filter((p: any) => p.name !== 'FREE_TRIAL' && p.isActive !== false).map((plan: any) => {
                const isCurrent = currentPlanName === plan.name;
                const isPopular = plan.name === 'PROFESSIONAL' || plan.name === 'ENTERPRISE';
                return (
                  <View
                    key={plan.id}
                    className="p-6 rounded-3xl border relative"
                    style={{
                      backgroundColor: COLORS.card,
                      borderColor: isPopular ? COLORS.accent : COLORS.border,
                      borderWidth: isPopular ? 2 : 1,
                    }}
                  >
                    {isPopular && (
                      <View className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 px-4 py-1 rounded-full">
                        <Text className="text-white text-[9px] font-bold uppercase tracking-widest">Most Popular</Text>
                      </View>
                    )}
                    <Text className="text-lg font-bold uppercase" style={{ color: COLORS.text }}>{plan.name}</Text>
                    <View className="flex-row items-baseline mt-2 mb-4">
                      <Text className="text-3xl font-extrabold" style={{ color: COLORS.text }}>{formatCurrency(plan.price)}</Text>
                      <Text className="text-xs uppercase ml-1" style={{ color: COLORS.textMuted }}>/{plan.billingCycle}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        setShowComparePlans(false);
                        handlePaymentRedirect(`change your plan to ${plan.name}`);
                      }}
                      disabled={isCurrent}
                      className={`w-full py-3 rounded-xl items-center ${isCurrent ? 'bg-slate-100 dark:bg-slate-800' : 'bg-red-600'}`}
                    >
                      <Text className={`font-bold text-sm ${isCurrent ? 'text-gray-500' : 'text-white'}`}>
                        {isCurrent ? 'Current Plan' : `Change to ${plan.name}`}
                      </Text>
                    </TouchableOpacity>

                    <View className="mt-4 gap-2.5">
                      {plan.features?.map((feat: string, idx: number) => (
                        <View key={idx} className="flex-row items-start gap-2">
                          <Check size={14} color={COLORS.accent} style={{ marginTop: 2 }} />
                          <Text className="text-xs flex-1" style={{ color: COLORS.textMuted }}>{feat}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>

            <View className="border rounded-2xl overflow-hidden mb-12" style={{ borderColor: COLORS.border, backgroundColor: COLORS.card }}>
              <View className="p-4 border-b flex-row items-center gap-2" style={{ borderColor: COLORS.border }}>
                <Star size={18} color={COLORS.accent} />
                <Text className="font-bold text-sm" style={{ color: COLORS.text }}>Feature Comparison</Text>
              </View>

              <View className="flex-row border-b py-2.5 px-4" style={{ borderColor: COLORS.border, backgroundColor: isDark ? "#33415550" : "#f1f5f9" }}>
                <Text className="flex-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>Features</Text>
                {comparisonPlanColumns.map((col) => (
                  <Text key={col.key} className="w-16 text-center text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.textMuted }}>
                    {col.label}
                  </Text>
                ))}
              </View>

              {comparisonFeatures.map((feat, idx) => (
                <View key={idx} className="flex-row py-3.5 px-4 border-b items-center animate-pulse" style={{ borderColor: COLORS.border }}>
                  <Text className="flex-1 text-xs font-semibold" style={{ color: COLORS.text }}>{feat.name}</Text>
                  {comparisonPlanColumns.map((col) => {
                    const included = !!feat.included[col.key];
                    return (
                      <View key={col.key} className="w-16 items-center">
                        {included ? (
                          <CheckCircle2 size={16} color={COLORS.success} />
                        ) : (
                          <X size={14} color={COLORS.textMuted} />
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </ThemedView>
      </Modal> */}
    </ThemedView>
  );
}
