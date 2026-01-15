import {
  cancelSubscription,
  getCurrentSubscription,
  getPayments,
  getPlans,
  getUsage,
  updateAutoRenew,
} from "@/api/billingApi";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CancelFormValues, cancelSchema } from "@/validations/billingSchema";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
// import {
//     Center,
//     Divider,
//     HStack,
//     Modal,
//     ModalBackdrop,
//     ModalBody,
//     ModalContent,
//     ModalFooter,
//     ModalHeader,
//     Progress,
//     ProgressFilledTrack,
//     Radio,
//     RadioGroup,
//     RadioIcon,
//     RadioIndicator,
//     Switch,
//     Textarea,
//     TextareaInput,
//     VStack,
// } from "@gluestack-ui/themed";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { AlertTriangle } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, useColorScheme, ScrollView } from "react-native";
// import { ScrollView } from "react-native-gesture-handler";
import PaymentHistoryCard from "./billingComponents/paymentHistoryCard";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Center } from "@/components/ui/center";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import {
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
} from "@/components/ui/radio";
import { Divider } from "@/components/ui/divider";
import { Textarea, TextareaInput } from "@/components/ui/textarea";

const ACCENT = "#dc2626";
const MUTED = "#6b7280";

export default function BillingPage() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  const [loading, setLoading] = useState(true);

  const [autoRenew, setAutoRenew] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [usageData, setusageData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [plansData, setPlansData] = useState<any>(null);
  const [paymentsData, setPaymentsData] = useState<any>(null);

  const { signOut } = useAuth();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CancelFormValues>({
    resolver: zodResolver(cancelSchema),
    defaultValues: {
      cancelImmediately: null,
      reason: "",
    },
  });

  const handleAutoRenew = async (value: boolean) => {
    setAutoRenew(value);

    try {
      await updateAutoRenew(value);
      console.log("Auto renew updated:", value);
    } catch (error) {
      console.error("Failed to update auto renew", error);
    }
  };

  const onSubmit = async (data: CancelFormValues) => {
    try {
      const { cancelImmediately, reason } = data;

      if (cancelImmediately === null) return;

      const safeReason = reason?.trim() || "";

      await cancelSubscription(cancelImmediately, safeReason);

      Alert.alert(
        "Subscription Cancelled",
        cancelImmediately
          ? "Your subscription has been cancelled immediately."
          : "Your subscription will be cancelled at the end of the billing period."
      );

      setShowModal(false);

      const subscription = await getCurrentSubscription();
      setSubscriptionData(subscription);

      await signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Cancel subscription failed:", error);
      Alert.alert(
        "Cancellation Failed",
        "Something went wrong. Please try again."
      );
    }
  };

  const currentPlanName = subscriptionData?.subscription?.plan?.name ?? null;

  // const hasPaidPlan =
  //   currentPlanName === "PROFESSIONAL" || currentPlanName === "ENTERPRISE";

  useEffect(() => {
    const fetchBillingDetails = async () => {
      try {
        const usage = await getUsage();
        const subscription = await getCurrentSubscription();
        const plan = await getPlans();
        const payment = await getPayments();

        setusageData(usage);
        setSubscriptionData(subscription);
        setPlansData(plan);
        setPaymentsData(payment);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingDetails();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const cardStyle = {
    backgroundColor: isDark ? "#020617" : "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDark ? "#1e293b" : "#e5e7eb",
  };
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
      </HStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ================= USAGE OVERVIEW ================= */}
        <ThemedView style={cardStyle}>
          <ThemedText style={{ fontSize: 20, fontWeight: "600" }}>
            Usage Overview
          </ThemedText>

          <ThemedText
            style={{
              fontSize: 13,
              color: MUTED,
              marginBottom: 12,
            }}
          >
            Current usage vs plan limits
          </ThemedText>

          {[
            { label: "Campaigns", key: "campaigns" },
            { label: "Contacts", key: "contacts" },
            { label: "Team Members", key: "users" },
            { label: "Connected Platforms", key: "platforms" },
            { label: "Posts This Month", key: "postsThisMonth" },
          ].map(({ label, key }) => {
            const item = usageData?.usage?.[key];

            const current = item?.current ?? 0;
            const limit = item?.limit ?? 0;
            const percentage =
              item?.percentage ??
              (limit > 0 ? Math.round((current / limit) * 100) : 0);

            return (
              <VStack key={key} style={{ marginBottom: 12 }}>
                <HStack style={{ justifyContent: "space-between" }}>
                  <ThemedText style={{ fontSize: 14 }}>{label}</ThemedText>

                  <ThemedText style={{ fontSize: 13, color: MUTED }}>
                    {current} / {limit}
                  </ThemedText>
                </HStack>

                <Center style={{ marginTop: 6 }}>
                  <Progress value={percentage} size="sm">
                    <ProgressFilledTrack
                      style={{
                        backgroundColor: item?.isNearLimit ? "#ef4444" : ACCENT,
                      }}
                    />
                  </Progress>
                </Center>
              </VStack>
            );
          })}
        </ThemedView>

        {/* ================= CURRENT SUBSCRIPTION ================= */}
        <ThemedView style={cardStyle}>
          <HStack style={{ justifyContent: "space-between" }}>
            <VStack>
              <ThemedText style={{ fontSize: 20, fontWeight: "600" }}>
                {subscriptionData?.subscription?.plan?.name ?? "—"}
              </ThemedText>

              <ThemedText style={{ fontSize: 14 }}>
                <ThemedText style={{ fontWeight: "700", fontSize: 20 }}>
                  ₹{subscriptionData?.subscription?.plan?.price ?? 0}
                </ThemedText>
                / month
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

            <VStack>
              <ThemedText style={{ fontSize: 13, color: MUTED }}>
                Next Billing
              </ThemedText>
              <ThemedText>
                {formatDate(subscriptionData?.subscription?.renewalDate)}
              </ThemedText>
            </VStack>
          </HStack>

          {/* AUTO RENEW */}
          <HStack
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
          </HStack>

          <ThemedText
            style={{
              fontSize: 13,
              color: MUTED,
              marginTop: 4,
            }}
          >
            Automatically renew the subscription at the end of your billing
            period
          </ThemedText>

          <Pressable
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
          </Pressable>

          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            size="lg"
          >
            <ModalBackdrop />

            <ModalContent>
              {/* ================= HEADER ================= */}
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

              {/* ================= BODY ================= */}
              <ModalBody>
                {/* Warning Card */}
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

                {/* Radio Section Title */}
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
                  {/* Option 1 */}
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

                  {/* Option 2 */}
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

                {/* Reason */}
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

              {/* ================= FOOTER ================= */}
              <ModalFooter>
                <HStack className="gap-3">
                  {/* Secondary */}
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

                  {/* Danger */}
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
          </Modal>
        </ThemedView>

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
          {paymentsData?.payments?.length > 0 ? (
            paymentsData.payments.map((payment: any) => (
              <PaymentHistoryCard key={payment.id} payment={payment} />
            ))
          ) : (
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
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}
