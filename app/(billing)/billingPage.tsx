import {
  cancelSubscription,
  getCurrentSubscription,
  getPayments,
  getPlans,
  getUsage,
  getWalletBalance,
  requestTwilioAccess,
  updateAutoRenew,
} from "@/api/billingApi";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CancelFormValues, cancelSchema } from "@/validations/billingSchema";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Pressable,
  useColorScheme,
  ScrollView,
  Text,
  TouchableOpacity,
  TextInput,
  Linking,
} from "react-native";
import Toast from "react-native-toast-message";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Center } from "@/components/ui/center";
import { Box, Divider } from "@gluestack-ui/themed";

import { Progress, ProgressFilledTrack } from "@gluestack-ui/themed";
import { View } from "@gluestack-ui/themed";
import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeletons";

type PaymentStatus = "CREATED" | "COMPLETED" | "FAILED";

type PaymentPlan = "BASIC" | "PRO" | "ENTERPRISE";

export interface Payment {
  id: string;
  amount: string;
  currency: "INR";
  plan: PaymentPlan;
  status: PaymentStatus;

  organisationId: number;
  receipt: string;

  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;

  notes: Record<string, any>; // safest for now

  createdAt: string;
  updatedAt: string;
}

export interface PaymentsResponse {
  payments: Payment[];
}

const ACCENT = "#dc2626";
const SUCCESS = "#00c950";
const MUTED = "#6b7280";

export default function BillingPage() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  const [loading, setLoading] = useState(true);

  const [autoRenew, setAutoRenew] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [usageData, setusageData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [plansData, setPlansData] = useState<any>(null);
  // const [paymentsData, setPaymentsData] = useState<any>(null);
  const [reason, setReason] = useState("");

  const [paymentsData, setPaymentsData] = useState<PaymentsResponse | null>(
    null,
  );

  const [premiumAlert, setPremiumAlert] = useState(false);
  const [isOneDay, setIsOneDay] = useState(false);
  // const handleAutoRenew = async (value: boolean) => {
  //   setAutoRenew(value);

  //   try {
  //     await updateAutoRenew(value);
  //     console.log("Auto renew updated:", value);
  //   } catch (error) {
  //     console.error("Failed to update auto renew", error);
  //   }
  // };

  // const onSubmit = async (data: CancelFormValues) => {
  //   try {
  //     const { cancelImmediately, reason } = data;

  //     if (cancelImmediately === null) return;

  //     const safeReason = reason?.trim() || "";

  //     await cancelSubscription(cancelImmediately, safeReason);

  //     Alert.alert(
  //       "Subscription Cancelled",
  //       cancelImmediately
  //         ? "Your subscription has been cancelled immediately."
  //         : "Your subscription will be cancelled at the end of the billing period.",
  //     );

  //     setShowModal(false);

  //     const subscription = await getCurrentSubscription();
  //     setSubscriptionData(subscription);

  //     await signOut();
  //     router.replace("/(auth)/login");
  //   } catch (error) {
  //     console.error("Cancel subscription failed:", error);
  //     Alert.alert(
  //       "Cancellation Failed",
  //       "Something went wrong. Please try again.",
  //     );
  //   }
  // };

  // const currentPlanName = subscriptionData?.subscription?.plan?.name ?? null;

  // const hasPaidPlan =
  //   currentPlanName === "PROFESSIONAL" || currentPlanName === "ENTERPRISE";

  //       ToastAndroid.show("Password updated successfully!", ToastAndroid.SHORT);

  const fetchBillingDetails = async () => {
    try {
      const usage = await getUsage();
      const subscription = await getCurrentSubscription();
      const plan = await getPlans();
      const payment = await getPayments();
      const balance = await getWalletBalance();

      // console.log("bbbdata",balance);

      setusageData(usage);
      setSubscriptionData(subscription);
      // console.log("bbbb", balance);

      setBalanceData(balance);
      setPlansData(plan);
      setPaymentsData(payment);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
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

      if (diffDays === 1) {
        setIsOneDay(true);
      } else {
        setIsOneDay(false);
      }

      if (diffDays >= 0 && diffDays <= 3) {
        setPremiumAlert(true);
      } else {
        setPremiumAlert(false);
      }
    }
  }, [subscriptionData]);

  const onRequestTwilio = async () => {
    try {
      const response = await requestTwilioAccess(reason);
      // console.log("Response: ", response);
      setReason("");
      fetchBillingDetails();
      Toast.show({
        type: "success",
        text1: "Request sent successfully!",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Request failed!",
      });
      console.error("Request failed:", error);
    }
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

    if (diffDays === 1) {
      return diffDays + " day";
    } else {
      return diffDays + " days";
    }
  };

  const cardStyle = {
    backgroundColor: isDark ? "#020617" : "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDark ? "#1e293b" : "#e5e7eb",
  };

  function SkeletonCard({ children }: { children: React.ReactNode }) {
    return <ThemedView style={cardStyle}>{children}</ThemedView>;
  }

  function Spacer({ h }: { h: number }) {
    return <View style={{ height: h }} />;
  }

  function BillingPageSkeleton() {
    return (
      <ThemedView className="flex-1 px-3 pt-16">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <HStack style={{ marginBottom: 24, alignItems: "center" }}>
            <Pressable onPress={() => router.back()}>
              <Ionicons
                name="arrow-back-outline"
                size={22}
                color={isDark ? "#ffffff" : "#020617"}
              />
            </Pressable>

            <ThemedText
              style={{
                flex: 1,
                fontSize: 24,
                fontWeight: "700",
                textAlign: "center",
                lineHeight: 30,
              }}
            >
              Billing & Subscription
            </ThemedText>
            {/* RIGHT: Spacer */}
            <View style={{ width: 34 }} />
          </HStack>

          {/* USAGE Metrics CARD */}
          <SkeletonCard>
            <ShimmerSkeleton width={160} height={20} />
            <Spacer h={10} />

            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={{ marginBottom: 14 }}>
                <HStack style={{ justifyContent: "space-between" }}>
                  <ShimmerSkeleton width={120} height={14} />
                  <ShimmerSkeleton width={60} height={14} />
                </HStack>
                <Spacer h={6} />
                <ShimmerSkeleton height={8} borderRadius={6} />
              </View>
            ))}
          </SkeletonCard>

          {/* CURRENT SUBSCRIPTION */}
          <SkeletonCard>
            <HStack style={{ justifyContent: "space-between" }}>
              <VStack>
                <ShimmerSkeleton width={140} height={18} />
                <Spacer h={6} />
                <ShimmerSkeleton width={100} height={14} />
              </VStack>

              <ShimmerSkeleton width={80} height={14} />
            </HStack>
          </SkeletonCard>

          {/* PAYMENT HISTORY */}
          <ShimmerSkeleton width={200} height={24} />
          <Spacer h={12} />

          {[1, 2].map((i) => (
            <SkeletonCard key={i}>
              <HStack style={{ justifyContent: "space-between" }}>
                <VStack>
                  <ShimmerSkeleton width={120} height={16} />
                  <Spacer h={6} />
                  <ShimmerSkeleton width={90} height={12} />
                </VStack>

                <VStack style={{ alignItems: "flex-end" }}>
                  <ShimmerSkeleton width={80} height={18} />
                  <Spacer h={6} />
                  <ShimmerSkeleton width={70} height={12} />
                </VStack>
              </HStack>
            </SkeletonCard>
          ))}
        </ScrollView>
      </ThemedView>
    );
  }
  if (loading) {
    return <BillingPageSkeleton />;
  }

  return (
    <ThemedView className="flex-1 px-3 pt-16">
      {/* HEADER */}
      <HStack style={{ marginBottom: 24, alignItems: "center" }}>
        <Pressable onPress={() => router.back()}>
          <Ionicons
            name="arrow-back-outline"
            size={22}
            color={isDark ? "#ffffff" : "#020617"}
          />
        </Pressable>

        <ThemedText
          style={{
            flex: 1,
            fontSize: 24,
            fontWeight: "700",
            textAlign: "center",
            lineHeight: 30,
          }}
        >
          Billing & Subscription
        </ThemedText>
        {/* RIGHT: Spacer */}
        <View style={{ width: 34 }} />
      </HStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        {subscriptionData?.subscription?.plan?.name != "FREE_TRIAL" &&
        premiumAlert ? (
          // isOneDay
          // bg-[#fef2f2] border border-[#ffc9c9]
          // bg-[#fff7ed] border border-[#fed7aa]
          <VStack
            className={`${isOneDay ? "bg-[#fef2f2] border border-[#ffc9c9]" : "bg-[#fff7ed] border border-[#fed7aa]"} rounded-xl p-3 gap-3 mb-3`}
          >
            <HStack className="items-start gap-2">
              {/* Icon */}
              <Ionicons
                name="warning-outline"
                size={20}
                color={isOneDay ? "#e7000b" : "#ea580c"}
              />

              {/* Text Content */}
              <VStack className="flex-1 gap-1">
                <Text
                  className={`text-[14px] font-semibold ${isOneDay ? "text-[#9f0712]" : "text-[#9a3412]"}`}
                >
                  Plan Expiring Soon
                </Text>

                <Text
                  className={`text-[13px] ${isOneDay ? "text-[#9f0712]" : "text-[#7c2d12]"} leading-5`}
                >
                  Your{" "}
                  <Text className="font-semibold">
                    {subscriptionData?.subscription?.plan?.name ?? "—"}
                  </Text>{" "}
                  plan expires in{" "}
                  <Text className="font-semibold">
                    {subscriptionValidity(
                      subscriptionData?.subscription?.endDate,
                    )}
                  </Text>{" "}
                  on{" "}
                  <Text className="font-semibold">
                    {formatDate(subscriptionData?.subscription?.endDate)}
                  </Text>
                  . Please renew your subscription to maintain full access to
                  all features.
                </Text>
              </VStack>
            </HStack>
            {/* Button */}
            <TouchableOpacity
              onPress={() => {
                Linking.openURL("https://campzeo.com/organisation/billing");
              }}
              className={`isOneDay ? bg-[#e7000b] : bg-[#e17100] py-3 rounded-lg items-center`}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-lg gap-5 items-center">
                <Ionicons name="card" size={15} color="#fff" /> Pay Now & Renew
              </Text>
            </TouchableOpacity>
          </VStack>
        ) : (
          ""
        )}
        {/* Top Row */}

        {subscriptionData?.subscription?.plan?.name === "FREE_TRIAL" && (
          <ThemedView style={cardStyle}>
            <HStack
              style={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <HStack className="gap-2 items-start">
                <Ionicons
                  name="time"
                  size={22}
                  color={isDark ? "#ffffff" : "#020617"}
                />
                <VStack>
                  <ThemedText style={{ fontSize: 15, fontWeight: "700" }}>
                    {subscriptionData?.subscription?.plan?.price > 0
                      ? "₹" + subscriptionData?.subscription?.plan?.price
                      : "Free Trial"}
                    - 12 Days Remaining
                  </ThemedText>
                  <ThemedText style={{ fontSize: 13, color: MUTED }}>
                    Your trial ends on{" "}
                    {formatDate(subscriptionData?.subscription?.endDate)}.
                  </ThemedText>
                  <ThemedText></ThemedText>
                </VStack>
              </HStack>

              <ThemedText
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color:
                    subscriptionData?.subscription?.status === "ACTIVE"
                      ? ACCENT
                      : "#6b7280",
                }}
              >
                {subscriptionData?.subscription?.status ?? "—"}
              </ThemedText>
            </HStack>
          </ThemedView>
        )}

        {/* ================= USAGE Metrics ================= */}
        <ThemedView style={cardStyle}>
          <ThemedText style={{ fontSize: 20, fontWeight: "600" }}>
            Usage Metrics
          </ThemedText>

          <ThemedText
            style={{
              fontSize: 13,
              color: MUTED,
              marginBottom: 12,
            }}
          >
            Current usage and performance
          </ThemedText>

          {[
            { label: "Campaigns", key: "campaigns" },
            { label: "Contacts", key: "contacts" },
            // { label: "Team Members", key: "users" },
            {
              label: "Connected Platforms",
              key: "platforms",
              showInfo: true,
              showPills: true,
              suffix: " connected",
            },
            { label: "Posts This Month", key: "postsThisMonth", isTrend: true },
          ].map(({ label, key, showInfo, showPills, suffix, isTrend }) => {
            const item = usageData?.usage?.[key];

            const current = item?.current ?? 0;
            const limit = item?.limit ?? 0;
            const percentage =
              item?.percentage ??
              (limit > 0 ? Math.round((current / limit) * 100) : 0);

            if (isTrend) {
              return (
                <View key={key} style={{ marginTop: 12 }}>
                  <HStack
                    style={{
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <VStack>
                      <ThemedText style={{ fontSize: 14, fontWeight: "500" }}>
                        {label}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, color: MUTED }}>
                        vs {item?.lastMonth ?? 0} last month
                      </ThemedText>
                    </VStack>

                    <HStack style={{ alignItems: "center", gap: 8 }}>
                      <ThemedText style={{ fontSize: 24, fontWeight: "700" }}>
                        {current}
                      </ThemedText>
                      <Box
                        style={{
                          backgroundColor: "#e8f5e9",
                          paddingHorizontal: 6,
                          paddingVertical: 4,
                          borderRadius: 6,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <Ionicons
                          name="trending-up"
                          size={14}
                          color="#2e7d32"
                        />
                        <ThemedText
                          style={{
                            color: "#2e7d32",
                            fontSize: 12,
                            fontWeight: "600",
                          }}
                        >
                          {usageData
                            ? usageData?.usage?.postsThisMonth?.growth + "%"
                            : "0%"}{" "}
                          up
                        </ThemedText>
                      </Box>
                    </HStack>
                  </HStack>
                </View>
              );
            }

            return (
              <VStack key={key} style={{ marginBottom: 16 }}>
                <HStack style={{ justifyContent: "space-between" }}>
                  <HStack style={{ alignItems: "center", gap: 4 }}>
                    <ThemedText style={{ fontSize: 14, fontWeight: "500" }}>
                      {label}
                    </ThemedText>
                    {/* {showInfo && (
                      <Ionicons
                        name="information-circle-outline"
                        size={14}
                        color={MUTED}
                      />
                    )} */}
                  </HStack>

                  <ThemedText style={{ fontSize: 13, color: MUTED }}>
                    {current} / {limit}
                    {suffix || ` (${percentage}% used)`}
                  </ThemedText>
                </HStack>

                <Center style={{ marginTop: 8 }}>
                  <Progress value={percentage} size="sm">
                    <ProgressFilledTrack
                      style={{
                        backgroundColor: current < limit ? SUCCESS : ACCENT,
                        overflow: "hidden",
                      }}
                    />
                  </Progress>
                </Center>

                {showPills && usageData?.usage?.platforms?.connectedNames && (
                  <HStack style={{ marginTop: 10, gap: 8, flexWrap: "wrap" }}>
                    {usageData?.usage?.platforms?.connectedNames.map(
                      (name: string) => {
                        const platformColors: Record<
                          string,
                          { bg: string; text: string }
                        > = {
                          Facebook: { bg: "#b2c8f7ff", text: "#2563eb" },
                          Instagram: { bg: "#f7b2e0ff", text: "#c6005c" },
                          LinkedIn: { bg: "#b2bff7ff", text: "#2d63d7ff" },
                          YouTube: { bg: "#f7b2b2ff", text: "#c10007" },
                          Pinterest: { bg: "#f7d1b2ff", text: "#c70036" },
                        };
                        const colors = platformColors[name] || {
                          bg: "#e2e8f0",
                          text: "#64748b",
                        };

                        return (
                          <Box
                            key={name}
                            style={{
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 20,
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              backgroundColor: colors.bg,
                            }}
                          >
                            <HStack style={{ alignItems: "center", gap: 4 }}>
                              <Ionicons
                                name={
                                  name == "Facebook"
                                    ? "logo-facebook"
                                    : name == "Instagram"
                                      ? "logo-instagram"
                                      : name == "LinkedIn"
                                        ? "logo-linkedin"
                                        : name == "YouTube"
                                          ? "logo-youtube"
                                          : name == "Pinterest"
                                            ? "logo-pinterest"
                                            : ""
                                }
                                size={14}
                                color={colors.text}
                              />
                              <ThemedText
                                style={{
                                  fontSize: 11,
                                  fontWeight: "600",
                                  color: colors.text,
                                }}
                              >
                                {name}
                              </ThemedText>
                            </HStack>
                          </Box>
                        );
                      },
                    )}
                  </HStack>
                )}
              </VStack>
            );
          })}
        </ThemedView>

        {/* ================= CURRENT SUBSCRIPTION ================= */}
        <ThemedView style={cardStyle}>
          <HStack style={{ justifyContent: "space-between" }}>
            <VStack>
              <ThemedText style={{ fontSize: 20, fontWeight: "600" }}>
                {subscriptionData?.subscription?.plan?.name ?? "—"} Plan
              </ThemedText>

              <ThemedText style={{ fontSize: 14 }}>
                <ThemedText>
                  {subscriptionData?.subscription?.plan?.price > 0
                    ? "₹" + subscriptionData?.subscription?.plan?.price
                    : "Free"}
                </ThemedText>
                / MONTHLY
              </ThemedText>
            </VStack>

            <ThemedText
              style={{
                fontSize: 12,
                fontWeight: "600",
                color:
                  subscriptionData?.subscription?.status === "ACTIVE"
                    ? ACCENT
                    : "#6b7280",
              }}
            >
              {subscriptionData?.subscription?.status ?? "—"}
            </ThemedText>
          </HStack>

          <Divider style={{ marginVertical: 12 }} />

          <HStack style={{ justifyContent: "space-between" }}>
            <VStack>
              <ThemedText style={{ fontSize: 13, color: MUTED }}>
                Start Date
              </ThemedText>
              <ThemedText>
                {formatDate(subscriptionData?.subscription?.startDate)}
              </ThemedText>
            </VStack>

            {subscriptionData?.subscription?.plan?.price > 0 ? (
              <VStack>
                <ThemedText style={{ fontSize: 13, color: MUTED }}>
                  Next Billing
                </ThemedText>
                <ThemedText>
                  {formatDate(subscriptionData?.subscription?.renewalDate)}
                </ThemedText>
              </VStack>
            ) : null}
          </HStack>

          {/* AUTO RENEW */}
          {/* <HStack
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <ThemedText style={{ fontSize: 14 }}>Auto-Renew</ThemedText>

            <Switch
              size="md"
              isDisabled={false}
              value={autoRenew}
              onValueChange={handleAutoRenew}
              // isChecked={subscriptionData?.subscription?.autoRenew ?? false}
              trackColor={{
                false: "#d4d4d4",
                true: ACCENT,
              }}
              thumbColor="#ffffff"
            />
          </HStack> */}

          {/* <ThemedText
            style={{
              fontSize: 13,
              color: MUTED,
              marginTop: 4,
            }}
          >
            Automatically renew the subscription at the end of your billing
            period
          </ThemedText> */}

          {/* <Pressable
            style={{
              marginTop: 16,
              paddingVertical: 10,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#ef4444",
            }}
            onPress={() => setShowModal(true)}
          >
            <ThemedText
              style={{
                textAlign: "center",
                fontSize: 14,
                fontWeight: "500",
                color: "#ef4444",
              }}
            >
              Cancel Subscription
            </ThemedText>
          </Pressable> */}

          {/* <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            size="lg"
          >
            <ModalBackdrop />

            <ModalContent>
              <ModalHeader>
                <HStack
                  style={{
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <VStack style={{ gap: 6 }}>
                    <ThemedText
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "#020617",
                      }}
                    >
                      Cancel Subscription
                    </ThemedText>

                    <ThemedText
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                        lineHeight: 18,
                      }}
                    >
                      Are you sure you want to cancel{" "}
                      {subscriptionData?.subscription?.plan?.name ?? "—"} This
                      will affect your access to features.
                    </ThemedText>
                  </VStack>
                </HStack>
              </ModalHeader>

              <ModalBody>
                <ThemedView
                  style={{
                    flexDirection: "row",
                    gap: 10,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: "#fff7ed",
                    borderWidth: 1,
                    borderColor: "#fed7aa",
                    marginBottom: 16,
                  }}
                >
                  <AlertTriangle size={20} color="#dc2626" />

                  <ThemedText
                    style={{
                      fontSize: 13,
                      color: "#9a3412",
                      lineHeight: 18,
                      flex: 1,
                    }}
                  >
                    Cancelling your subscription will result in loss of access
                    to premium features.
                  </ThemedText>
                </ThemedView>

                <ThemedText
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    marginBottom: 10,
                    color: "#020617",
                  }}
                >
                  When should the cancellation take effect?
                </ThemedText>

                <RadioGroup>
                  <Radio
                    value="end"
                    onPress={() =>
                      setValue("cancelImmediately", false, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <HStack style={{ gap: 10, marginBottom: 14 }}>
                      <RadioIndicator
                        style={{
                          borderColor: "#dc2626",
                          borderWidth: 2,
                          width: 18,
                          height: 18,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <RadioIcon
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#dc2626",
                          }}
                        />
                      </RadioIndicator>

                      <VStack>
                        <ThemedText
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: "#020617",
                          }}
                        >
                          At the end of billing period
                        </ThemedText>

                        <ThemedText
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            lineHeight: 16,
                          }}
                        >
                          You'll retain access until your subscription ends
                        </ThemedText>
                      </VStack>
                    </HStack>
                  </Radio>

                  <Radio
                    value="immediate"
                    onPress={() =>
                      setValue("cancelImmediately", true, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <HStack style={{ gap: 10, marginBottom: 18 }}>
                      <RadioIndicator
                        style={{
                          borderColor: "#dc2626",
                          borderWidth: 2,
                          width: 18,
                          height: 18,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <RadioIcon
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#dc2626",
                          }}
                        />
                      </RadioIndicator>

                      <VStack>
                        <ThemedText
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: "#020617",
                          }}
                        >
                          Immediately
                        </ThemedText>

                        <ThemedText
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            lineHeight: 16,
                          }}
                        >
                          Your access will be revoked right away
                        </ThemedText>
                      </VStack>
                    </HStack>
                  </Radio>
                </RadioGroup>

                {errors.cancelImmediately && (
                  <ThemedText
                    style={{
                      color: "#dc2626",
                      fontSize: 12,
                      marginTop: 3,
                    }}
                  >
                    {errors.cancelImmediately.message}
                  </ThemedText>
                )}

                <VStack style={{ gap: 6 }}>
                  <ThemedText
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#020617",
                    }}
                  >
                    Reason for cancellation (optional)
                  </ThemedText>

                  <Controller
                    control={control}
                    name="reason"
                    render={({ field }) => (
                      <Textarea>
                        <TextareaInput
                          placeholder="Let us know why you are cancelling..."
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                      </Textarea>
                    )}
                  />
                </VStack>
              </ModalBody>

              <ModalFooter>
                <HStack className="gap-3">
                  <Pressable
                    onPress={() => setShowModal(false)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                    }}
                  >
                    <ThemedText
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: "#374151",
                      }}
                    >
                      Keep Subscription
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={handleSubmit(onSubmit)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      backgroundColor: "#dc2626",
                    }}
                  >
                    <ThemedText
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#ffffff",
                      }}
                    >
                      Confirm Cancellation
                    </ThemedText>
                  </Pressable>
                </HStack>
              </ModalFooter>
            </ModalContent>
          </Modal> */}
        </ThemedView>
        {/*         {/* Request form */}
        {balanceData?.twilioAccess?.twilioAccessStatus === "REJECTED" && (
          <VStack className="bg-white border border-gray-200 rounded-xl p-4 gap-4">
            {/* Header */}
            <HStack className="justify-between items-center">
              <HStack className="items-center gap-2">
                <Ionicons
                  name="paper-plane-outline"
                  size={20}
                  color="#991b1b"
                />
                <Text className="text-[16px] font-semibold text-gray-900">
                  Request Twilio Access
                </Text>
              </HStack>
              balanceData?.twilioAccess?.twilioAccessReason == true && (
              <Box
                style={{
                  backgroundColor: "#dc2626",
                  padding: 5,
                  borderRadius: 10,
                }}
              >
                <Text className="text-white">Rejected</Text>
              </Box>
              )
            </HStack>

            {/* Description */}
            <Text className="text-[14px] text-gray-600 leading-5">
              Apply for SMS and WhatsApp campaign access. Please describe your
              use case briefly.
            </Text>

            <Box
              style={{
                backgroundColor: "#ffe2e2",
                padding: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#ffe2e2",
              }}
            >
              <HStack className="gap-3">
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color="#991b1b"
                />
                <VStack>
                  <Text
                    className="text-xl font-semibold"
                    style={{ color: "#9f0712" }}
                  >
                    Request Rejected
                  </Text>
                  <Text className="text-sm" style={{ color: "#9f0712" }}>
                    {balanceData?.twilioAccess?.twilioAccessReason}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            {/* Label */}
            <Text className="text-[12px] font-semibold text-gray-700 uppercase">
              Reason for Request
            </Text>

            {/* Text Area */}
            <TextInput
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. I want to send promotional SMS and WhatsApp updates to my 5000+ customer base."
              placeholderTextColor="#9ca3af"
              className="border rounded-lg p-3 text-[14px] text-gray-900"
              style={{
                borderColor: "#dc2626",
                borderWidth: 1,
                textAlignVertical: "top", // important for Android
                minHeight: 100,
              }}
            />

            {/* Submit Button */}
            <TouchableOpacity
              onPress={() => onRequestTwilio()}
              className="bg-[#e58a8a] py-3 rounded-lg items-center"
              style={{ backgroundColor: "#dc2626" }}
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-[15px]">
                Submit Request
              </Text>
            </TouchableOpacity>
          </VStack>
        )}

        {/* Pending */}
        {balanceData?.twilioAccess?.twilioAccessStatus === "PENDING" && (
          <VStack
            className="rounded-xl p-4 gap-4"
            style={{
              borderColor: "#dbeafe",
              borderWidth: 1,
              backgroundColor: "#eff6ff",
            }}
          >
            {/* Header */}
            <HStack className="justify-between items-center">
              {/* Left */}
              <HStack className="items-center gap-2">
                <Ionicons name="time-outline" size={20} color="#2563eb" />
                <Text className="text-[16px] font-semibold text-gray-900">
                  Access Request Pending
                </Text>
              </HStack>

              {/* Badge */}
              <View
                className="px-3 py-1 rounded-full border border-[#93c5fd] bg-[#e0edff]"
                style={{
                  borderColor: "#dbeafe",
                  borderWidth: 1,
                  backgroundColor: "#eff6ff",
                }}
              >
                <Text
                  className="text-[12px] font-medium"
                  style={{ color: "#1447e6" }}
                >
                  Pending Review
                </Text>
              </View>
            </HStack>

            {/* Description */}
            <Text className="text-md leading-5" style={{ color: "#193cb8" }}>
              Our team is reviewing your request for Twilio access. You'll be
              notified once it's approved.
            </Text>

            {/* Message Box */}
            <View
              className="border border-[#c7d7fe] bg-[#f5f9ff] rounded-lg p-3"
              style={{
                borderColor: "#155dfc",
                borderWidth: 1,
                backgroundColor: "#fff",
              }}
            >
              <Text className="italic text-[13px]" style={{ color: "#155dfc" }}>
                {/* "testing to get header - amit" */}
                {balanceData?.twilioAccess?.twilioAccessReason}
                {/* wallet/balance */}
              </Text>
            </View>
          </VStack>
        )}

        {/* Approved */}
        {balanceData?.twilioAccess?.twilioAccessStatus === "APPROVED" && (
          <>
            <VStack
              className="bg-[#ecfdf5] border border-[#bbf7d0] rounded-xl p-4 gap-4 mb-3"
              style={{
                borderColor: "#dcfce7",
                borderWidth: 1,
                backgroundColor: "#f0fdf4",
              }}
            >
              {/* Header */}
              <HStack className="justify-between items-center">
                {/* Left */}
                <HStack className="items-center gap-2">
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#16a34a"
                  />
                  <Text className="text-[16px] font-semibold text-gray-900">
                    Twilio SMS & WhatsApp Access
                  </Text>
                </HStack>

                {/* Badge */}
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: "#00a63e", borderRadius: 10 }}
                >
                  <Text className="text-white text-[12px] font-medium">
                    Approved
                  </Text>
                </View>
              </HStack>

              {/* Description */}
              <Text
                className="text-[14px] text-[#15803d] leading-5"
                style={{ color: "#016630" }}
              >
                Your access has been approved. You can now purchase credits and
                send campaigns.
              </Text>
            </VStack>
            <VStack className="gap-4">
              {/* SMS Credits */}
              <VStack className="bg-white border border-gray-200 rounded-xl p-4 gap-3">
                {/* Header */}
                <HStack className="items-center gap-2">
                  <Ionicons name="call-outline" size={18} color="#2563eb" />
                  <Text className="text-[14px] font-medium text-gray-700">
                    SMS Credits
                  </Text>
                </HStack>

                {/* Available */}
                <HStack className="items-end gap-1">
                  <Text className="text-2xl font-bold text-gray-900">
                    {balanceData?.wallet?.smsCreditsAvailable}
                  </Text>
                  <Text className="text-gray-500 mb-1">Available</Text>
                </HStack>

                {/* Usage */}
                <HStack className="justify-between">
                  <Text className="text-xs text-gray-500">
                    {balanceData?.wallet?.smsCreditsUsed} used
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {balanceData?.wallet?.smsCreditsUsed}%
                  </Text>
                </HStack>

                {/* Progress */}
                <Progress
                  value={balanceData?.wallet?.smsCreditsUsed}
                  className="h-2 bg-gray-200 rounded-full"
                  size="sm"
                >
                  <ProgressFilledTrack
                    style={{
                      backgroundColor:
                        balanceData?.wallet?.smsCreditsUsed <
                        balanceData?.wallet?.smsCreditsAvailable
                          ? SUCCESS
                          : ACCENT,
                    }}
                  />
                </Progress>

                {/* Footer */}
                <HStack className="items-center gap-1">
                  <Ionicons
                    name="trending-up-outline"
                    size={14}
                    color="#16a34a"
                  />
                  <Text className="text-xs text-gray-600">
                    {balanceData?.wallet?.smsCreditsAvailable} Total Credits
                  </Text>
                </HStack>
              </VStack>

              {/* WhatsApp Credits */}
              <VStack className="bg-white border border-gray-200 rounded-xl p-4 gap-3">
                <HStack className="items-center gap-2">
                  <Ionicons name="logo-whatsapp" size={18} color="#16a34a" />
                  <Text className="text-[14px] font-medium text-gray-700">
                    WhatsApp Credits
                  </Text>
                </HStack>

                <HStack className="items-end gap-1">
                  <Text className="text-2xl font-bold text-gray-900">
                    {balanceData?.wallet?.whatsappCreditsAvailable}
                  </Text>
                  <Text className="text-gray-500 mb-1">Available</Text>
                </HStack>

                <HStack className="justify-between">
                  <Text className="text-xs text-gray-500">
                    {balanceData?.wallet?.whatsappCreditsUsed} used
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {balanceData?.wallet?.whatsappCreditsUsed} %
                  </Text>
                </HStack>

                <Progress
                  value={balanceData?.wallet?.whatsappCreditsUsed}
                  className="h-2 bg-gray-200 rounded-full"
                  size="sm"
                >
                  <ProgressFilledTrack
                    style={{
                      backgroundColor:
                        balanceData?.wallet?.whatsappCreditsUsed <
                        balanceData?.wallet?.whatsappCreditsAvailable
                          ? SUCCESS
                          : ACCENT,
                    }}
                  />
                </Progress>

                <HStack className="items-center gap-1">
                  <Ionicons
                    name="trending-up-outline"
                    size={14}
                    color="#16a34a"
                  />
                  <Text className="text-xs text-gray-600">
                    {balanceData?.wallet?.whatsappCreditsAvailable} Total
                    Credits
                  </Text>
                </HStack>
              </VStack>

              {/* Recent Activity */}
              <VStack className="bg-white border border-gray-200 rounded-xl p-4 gap-4">
                {/* Header */}
                <HStack className="items-center gap-2">
                  <Ionicons name="time-outline" size={18} color="#f97316" />
                  <Text className="text-[14px] font-medium text-gray-700">
                    Recent Activity
                  </Text>
                </HStack>

                {/* Content */}
                <VStack className="gap-3">
                  {balanceData?.wallet?.transactions?.length === 0 ? (
                    <View className="py-4 items-center">
                      <Text className="text-gray-500 text-sm">
                        No transactions found
                      </Text>
                    </View>
                  ) : (
                    balanceData?.wallet?.transactions?.map(
                      (item: any, index: number) => (
                        <VStack key={index} className="gap-2">
                          {/* Description */}
                          <ThemedText
                            style={{ fontSize: 15, fontWeight: "700" }}
                          >
                            {item?.description}
                          </ThemedText>

                          {/* Date + Amount */}
                          <HStack className="justify-between items-center">
                            <ThemedText style={{ fontSize: 13, color: MUTED }}>
                              {formatDate(item?.createdAt)}
                            </ThemedText>

                            <ThemedText
                              style={{
                                fontSize: 16,
                                fontWeight: "700",
                                color: SUCCESS,
                              }}
                            >
                              +{item?.amount}
                            </ThemedText>
                          </HStack>

                          {/* Divider (only if not last item) */}
                          {index !==
                            balanceData.wallet.transactions.length - 1 && (
                            <Divider className="mt-2" />
                          )}
                        </VStack>
                      ),
                    )
                  )}
                </VStack>
              </VStack>
            </VStack>
          </>
        )}

        {/* Restricted */}
        {balanceData?.twilioAccess?.twilioAccessStatus === "NONE" && (
          <VStack
            className="rounded-xl p-4 gap-3"
            style={{
              backgroundColor: "#fdf6ec",
              borderWidth: 1,
              borderColor: "#f5c97a",
            }}
          >
            {/* Twilio - message restricted */}
            <HStack className="items-center gap-2">
              <Ionicons name="alert-circle-outline" size={20} color="#d97706" />
              <Text className="text-lg font-semibold text-[#1f2937]">
                Access Restricted
              </Text>
            </HStack>

            {/* Description */}
            <Text className="text-sm text-[#374151] leading-5">
              SMS and WhatsApp messaging is not available for free trial
              accounts.
            </Text>

            {/* Highlight Text */}
            <Text className="text-sm leading-5" style={{ color: "#d97706" }}>
              Please upgrade your plan to a paid subscription to request Add-ons
              access and start sending campaigns.
            </Text>
          </VStack>
        )}

        {/* ================= PAYMENT HISTORY ================= */}
        <ThemedText
          style={{
            fontSize: 25,
            fontWeight: "700",
            textAlign: "center",
            marginVertical: 20,
          }}
        >
          Payment History
        </ThemedText>

        <ThemedView style={cardStyle}>
          {paymentsData == null ? (
            <ThemedText
              style={{
                textAlign: "center",
                fontSize: 14,
                color: MUTED,
                marginTop: 10,
              }}
            >
              No payment history found
            </ThemedText>
          ) : (
            paymentsData.payments.map((payment) => {
              const formattedDate = new Date(
                payment.createdAt,
              ).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              const statusColor =
                payment.status === "COMPLETED"
                  ? "#16a34a"
                  : payment.status === "FAILED"
                    ? "#dc2626"
                    : "#f59e0b";

              return (
                <View key={payment.id}>
                  <HStack style={{ justifyContent: "space-between" }}>
                    <VStack>
                      <ThemedText style={{ fontSize: 15, fontWeight: "600" }}>
                        {payment.plan.replace("_", " ")}
                      </ThemedText>

                      <ThemedText
                        style={{
                          fontSize: 13,
                          color: ACCENT,
                          marginTop: 2,
                        }}
                      >
                        {formattedDate}
                      </ThemedText>
                    </VStack>

                    <VStack style={{ alignItems: "flex-end" }}>
                      <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>
                        ₹{Number(payment.amount).toLocaleString("en-IN")}
                      </ThemedText>

                      <ThemedText
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: statusColor,
                          marginTop: 2,
                        }}
                      >
                        {payment.status}
                      </ThemedText>
                    </VStack>
                  </HStack>

                  <Divider style={{ marginVertical: 13 }} />
                </View>
              );
            })
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
