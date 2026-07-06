import { getUsage } from "@/api/billingApi";
import { getUser, getActivityLogs } from "@/api/dashboardApi";
import { Text, TouchableOpacity, useColorScheme, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Box } from "@/components/ui/box";
import { Center } from "@/components/ui/center";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeletons";
import { VStack } from "@/components/ui/vstack";
import { Progress, ProgressFilledTrack } from "@gluestack-ui/themed";

import { router, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Divider } from "@gluestack-ui/themed";
import { FontAwesome, Ionicons } from "@expo/vector-icons";

/* ================= COMPONENT ================= */

export default function Insights({ userData, usageData, walletData, subscriptionData, loading, onRefresh, refreshing }: { userData: any, usageData: any, walletData: any, subscriptionData?: any, loading: boolean, onRefresh?: () => void, refreshing?: boolean }) {
  const isDark = useColorScheme() === "dark";

  const routePage = useRouter();

  const [activeTab, setActiveTab] = useState<"usage" | "activity">("usage");
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  useEffect(() => {
    if (activeTab === "activity" && activityLogs.length === 0) {
      const fetchLogs = async () => {
        setIsLoadingActivity(true);
        try {
          const res = await getActivityLogs(1, 20);
          const logs = Array.isArray(res) ? res : (res?.data || res?.activityLogs || res?.logs || []);
          setActivityLogs(logs);
        } catch (error) {
          console.error("Failed to fetch activity logs", error);
        } finally {
          setIsLoadingActivity(false);
        }
      };
      fetchLogs();
    }
  }, [activeTab]);

  // const [userData, setUserData] = useState<any>(null);
  // const [usageData, setUsageData] = useState<any>(null);
  // const [loading, setLoading] = useState(true);

  //   const fetchInsights = async () => {
  //     try {
  //       const user = await getUser();
  //       const usage = await getUsage();
  //       setUserData(user);
  //       setUsageData(usage);
  //     } catch (error) {
  //       console.error("Dashboard fetch error:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  // useEffect(() => {
  //   fetchInsights();
  // }, []);

  // useFocusEffect(
  //   useCallback(() => {
  //     fetchInsights();
  //   }, [])
  // );
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
  /* ================= SKELETON HELPERS ================= */

  const renderHeaderSkeleton = () => (
    <HStack style={{ marginBottom: 24 }}>
      <ShimmerSkeleton height={22} width={300} />
    </HStack>
  );

  const renderPlanCardSkeleton = () => (
    <Box style={[styles.planCard, { backgroundColor: "#fee2e2" }]}>
      <HStack style={{ justifyContent: "space-between", alignItems: "center" }}>
        <VStack className="gap-5 mb-5">
          <ShimmerSkeleton height={13} width={90} />
          <ShimmerSkeleton height={17} width={120} />
        </VStack>
        <ShimmerSkeleton height={15} width={110} borderRadius={8} />
      </HStack>
      <ShimmerSkeleton height={13} width="90%" />
    </Box>
  );

  const renderStatCardSkeleton = () => (
    <Box style={styles.statCard}>
      <ShimmerSkeleton height={13} width={120} />
      <ShimmerSkeleton height={30} width={60} />
      <ShimmerSkeleton height={12} width="80%" />
    </Box>
  );

  const renderUsageItemSkeleton = () => (
    <VStack style={{ marginBottom: 16, gap: 13 }}>
      <HStack style={{ justifyContent: "space-between" }}>
        <ShimmerSkeleton height={14} width={130} />
        <ShimmerSkeleton height={14} width={60} />
      </HStack>
      <ShimmerSkeleton height={8} width="100%" borderRadius={4} />
    </VStack>
  );

  const renderTeamSkeleton = () => (
    <Box style={styles.usageCard} className="gap-2">
      <ShimmerSkeleton height={15} width={145} />

      <HStack style={{ justifyContent: "space-between", alignItems: "center" }}>
        <VStack className="gap-3">
          <ShimmerSkeleton height={14} width={120} />
          <ShimmerSkeleton height={12} width={160} />
        </VStack>

        <ShimmerSkeleton height={17} width={60} borderRadius={12} />
      </HStack>
    </Box>
  );

  /* ================= DERIVED DATA PRE-LOAD ================= */
  const smsCreditsAvailable = walletData?.wallet?.smsCreditsAvailable ?? 0;
  const whatsappCreditsAvailable = walletData?.wallet?.whatsappCreditsAvailable ?? 0;

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <ThemedView style={styles.container}>
        {renderHeaderSkeleton()}

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} tintColor="#dc2626" /> : undefined
          }
        >
          {/* Plan */}
          {renderPlanCardSkeleton()}

          {/* Stats */}
          <VStack style={styles.section}>
            <HStack style={styles.statsRow} className="justify-between">
              {Array.from({ length: 2 }).map((_, i) => (
                <View key={i} style={{ flex: 1 }}>{renderStatCardSkeleton()}</View>
              ))}
            </HStack>

            <HStack style={styles.statsRow} className="justify-between">
              {Array.from({ length: 2 }).map((_, i) => (
                <View key={i} style={{ flex: 1 }}>{renderStatCardSkeleton()}</View>
              ))}
            </HStack>
          </VStack>

          {/* Usage */}
          <Box style={styles.usageCard} className="gap-3">
            <ShimmerSkeleton height={18} width={160} />
            <ShimmerSkeleton height={14} width="90%" />

            {Array.from({ length: 5 }).map((_, i) => (
              <View key={i}>{renderUsageItemSkeleton()}</View>
            ))}
          </Box>

          {/* Team */}
          {renderTeamSkeleton()}
        </ScrollView>
      </ThemedView>
    );
  }

  /* ================= DERIVED DATA ================= */

  const organisationName = userData?.organisation?.name ?? "Organisation";

  const totalCampaigns = usageData?.usage?.campaigns?.current ?? "-";

  const totalContacts = usageData?.usage?.contacts?.current ?? "-";

  const connectedAccounts = usageData?.usage?.platforms?.current ?? "-";

  const rawPlanName =
    subscriptionData?.subscription?.plan?.name ??
    userData?.organisation?.subscriptions?.[0]?.plan?.name ??
    "FREE_TRIAL";

  const getPlanDisplayLabel = (name: string): string => {
    if (!name) return "Free Trial";
    switch (name) {
      case "FREE_TRIAL":
      case "FREE TRIAL":
        return "Free Trial";
      case "PROFESSIONAL":
        return "Professional";
      case "ENTERPRISE":
        return "Enterprise";
      default:
        return name
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  const planName = getPlanDisplayLabel(rawPlanName);

  const isApproved = userData?.organisation?.isApproved ?? null;

  /* ================= UI ================= */

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <HStack style={styles.header}>
        <ThemedText style={styles.heading}>Welcome back, </ThemedText>
        <ThemedText style={styles.orgName}>{organisationName}</ThemedText>
      </HStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing || false} onRefresh={onRefresh} tintColor="#dc2626" /> : undefined
        }
      >
        {/* PLAN CARD */}
        <Box style={styles.planCard}>
          <HStack
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <VStack>
              <ThemedText style={styles.planLabel}>Current Plan</ThemedText>
              <ThemedText style={styles.planName}>{planName}</ThemedText>
            </VStack>

            <Pressable
              style={styles.trialBadge}
              onPress={() => routePage.push("/(billing)/billingPage")}
            >
              <ThemedText style={styles.trialText}>Manage Billing</ThemedText>
            </Pressable>
          </HStack>

          <ThemedText
            style={[
              styles.trialDate,
              {
                color:
                  isApproved === true
                    ? "#dcfce7"
                    : isApproved === false
                      ? "#fee2e2"
                      : "#ffffff",
              },
            ]}
          >
            {isApproved === true && "Your subscription is active."}
            {isApproved === false && "You don't have any active subscription."}
            {isApproved === null && "-"}
          </ThemedText>
        </Box>

        {/* ================= STATS ================= */}
        <VStack style={styles.section}>
          <HStack style={styles.statsRow}>
            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={0.8}
              onPress={() => router.push("/(tabs)/campaigns")}
            >
              <Box style={styles.statCard}>
                <ThemedText style={styles.statLabel}>
                  Total Campaigns
                </ThemedText>
                <ThemedText style={styles.statValue}>
                  {totalCampaigns}
                </ThemedText>
                <ThemedText style={styles.statSubtext}>
                  Total Active Campaigns
                </ThemedText>
              </Box>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={0.8}
              onPress={() => router.push("/(tabs)/contacts")}
            >
              <Box style={styles.statCard}>
                <ThemedText style={styles.statLabel}>Total Contacts</ThemedText>
                <ThemedText style={styles.statValue}>
                  {totalContacts}
                </ThemedText>
                <ThemedText style={styles.statSubtext}>
                  Audience Reached
                </ThemedText>
              </Box>
            </TouchableOpacity>
          </HStack>

          <HStack style={styles.statsRow}>
            <Box style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Connected Accounts</ThemedText>
              <ThemedText style={styles.statValue}>
                {connectedAccounts}
              </ThemedText>
              <ThemedText style={styles.statSubtext}>
                Active social connections
              </ThemedText>
            </Box>

            <Box style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Available Credits</ThemedText>

              <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "center", marginTop: 5, flex: 1 }}>
                <View style={{ alignItems: "center" }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: isDark ? "rgba(234, 179, 8, 0.15)" : "#fef9c3",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 10,
                    // shadowColor: "#eab308",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 5,
                  }}>
                    <Ionicons name="chatbubble-ellipses" size={18} color="#eab308" />
                  </View>
                  <Text style={[styles.creditValue, { fontSize: 16, color: "#eab308" }]}>{smsCreditsAvailable}</Text>
                </View>

                <View style={{ alignItems: "center" }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: isDark ? "rgba(37, 211, 102, 0.15)" : "#dcfce7",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 10,
                    // shadowColor: "#25D366",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 5,
                  }}>
                    <Ionicons name="logo-whatsapp" size={18} color="#25D366" style={{ marginLeft: 2 }} />
                  </View>
                  <Text style={[styles.creditValue, { fontSize: 16 }]}>{whatsappCreditsAvailable}</Text>
                </View>
              </View>
            </Box>
          </HStack>
        </VStack>

        {/* ================= USAGE ================= */}
        <HStack
          style={{
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "#374151" : "#e5e7eb",
            marginBottom: 20,
          }}
        >
          {[
            { key: "usage", label: "Usage Details" },
            { key: "activity", label: "Recent Activity" },
          ].map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 14,
                  borderBottomWidth: 2,
                  borderBottomColor: isActive
                    ? "#dc2626"
                    : "transparent",
                }}
              >
                <ThemedText
                  style={{
                    fontSize: 15,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive
                      ? (isDark ? "#fff" : "#000")
                      : "#9ca3af",
                  }}
                >
                  {tab.label}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </HStack>

        <Box style={styles.usageCard}>
          {/* Usage Details Tab */}
          {activeTab === "usage" && (
            <>
              <ThemedText style={styles.usageName}>
                Usage Details
              </ThemedText>

              <ThemedText style={styles.usageLabel}>
                Detailed breakdown of your usage and limits
              </ThemedText>
              <VStack style={{ marginBottom: 16 }}>
                <HStack style={{ justifyContent: "space-between" }}>
                  <VStack className="gap-3">
                    <ThemedText>Monthly Posts</ThemedText>
                    <HStack className="gap-3 items-center">
                      <ThemedText style={{ fontSize: 27, fontWeight: "700" }}>
                        {usageData?.usage?.postsThisMonth?.current}
                      </ThemedText>
                      <HStack className="items-center gap-1">
                        <Ionicons name="arrow-up" size={17} color={"#00c950"} />
                        <ThemedText style={{ color: "#00c950" }}>
                          {usageData?.usage?.postsThisMonth?.growth}%
                        </ThemedText>
                      </HStack>
                    </HStack>
                  </VStack>

                  <ThemedText>
                    {usageData?.usage?.postsThisMonth?.current} (vs{" "}
                    {usageData?.usage?.postsThisMonth?.lastMonth} last month)
                  </ThemedText>
                </HStack>

                <Center style={{ marginTop: 6 }}></Center>
              </VStack>
              <VStack style={{ marginBottom: 16 }}>
                <HStack style={{ justifyContent: "space-between" }}>
                  <ThemedText>Total Contacts</ThemedText>

                  <ThemedText>
                    {usageData?.usage?.contacts?.current}/
                    {usageData?.usage?.contacts?.limit}
                  </ThemedText>
                </HStack>

                <Center style={{ marginTop: 6 }}>
                  <Progress
                    value={usageData?.usage?.contacts?.percentage}
                    size="sm"
                  >
                    <ProgressFilledTrack
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
                  </Progress>
                </Center>
              </VStack>
              <VStack style={{ marginBottom: 16 }}>
                <HStack style={{ justifyContent: "space-between" }}>
                  <ThemedText>Campaigns</ThemedText>

                  <ThemedText>
                    {usageData?.usage?.campaigns?.current}/
                    {usageData?.usage?.campaigns?.limit}
                  </ThemedText>
                </HStack>

                <Center style={{ marginTop: 6 }}>
                  <Progress
                    value={usageData?.usage?.campaigns?.percentage}
                    size="sm"
                  >
                    <ProgressFilledTrack
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
                  </Progress>
                </Center>
              </VStack>
              <VStack style={{ marginBottom: 16 }}>
                <HStack style={{ justifyContent: "space-between" }}>
                  <ThemedText>Connected Platform</ThemedText>

                  <ThemedText>
                    {usageData?.usage?.platforms?.current}/
                    {usageData?.usage?.platforms.limit}
                  </ThemedText>
                </HStack>

                <Center style={{ marginTop: 6 }}>
                  <Progress
                    value={usageData?.usage?.platforms?.percentage}
                    size="sm"
                  >
                    <ProgressFilledTrack
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
                  </Progress>
                </Center>
              </VStack>

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
            </>
          )}

          {/* Recent Activity Tab */}
          {activeTab === "activity" && (
            <>
              <ThemedText style={styles.usageName}>
                Recent Activity
              </ThemedText>

              {isLoadingActivity ? (
                <ThemedText style={{ marginTop: 10 }}>Loading recent activity...</ThemedText>
              ) : activityLogs?.length === 0 ? (
                <ThemedText style={{ marginTop: 10 }}>No recent activity found.</ThemedText>
              ) : (
                <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 350 }} showsVerticalScrollIndicator={true}>
                  {activityLogs.map((item: any) => (
                    <View
                      key={item.id}
                      style={{
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: "#e5e7eb",
                      }}
                    >
                      <ThemedText
                        style={{
                          fontSize: 14,
                          marginBottom: 6,
                        }}
                      >
                        {item.message}
                      </ThemedText>

                      <HStack
                        style={{
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <ThemedText
                          style={{
                            fontSize: 12,
                            color: COLORS.textMuted,
                          }}
                        >
                          {new Date(item.createdAt).toLocaleString()}
                        </ThemedText>

                        <View
                          style={{
                            backgroundColor: "#fee2e2",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                          }}
                        >
                          <ThemedText
                            style={{
                              color: "#dc2626",
                              fontSize: 11,
                              fontWeight: "600",
                            }}
                          >
                            {item.module}
                          </ThemedText>
                        </View>
                      </HStack>
                    </View>
                  ))}
                </ScrollView>
              )}
            </>
          )}
        </Box>

        {/* ================= TEAM ================= */}
        <Box style={styles.usageCard}>
          <ThemedText style={styles.usageName}>Team Members</ThemedText>

          <HStack
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              marginVertical: 9,
            }}
          >
            <VStack style={{ alignItems: "center" }}>
              <ThemedText>
                {userData?.firstName} {userData?.lastName}
              </ThemedText>
            </VStack>

            <Box style={styles.roleBadge}>
              <ThemedText style={styles.badgeText}>{userData?.role}</ThemedText>
            </Box>
          </HStack>
          <ThemedText>{userData?.email}</ThemedText>

          <Divider style={{ marginVertical: 13 }} />
        </Box>

        {/* ================= NOTIFICATIONS ================= */}
        {/* <Box style={styles.usageCard}>
          <ThemedText style={styles.usageName}>
            Recent Activity
          </ThemedText>

          {notifications.length === 0 ? (
            <ThemedText>-</ThemedText>
          ) : (
            notifications.map((item) => (
              <Box key={item.id} style={styles.notificationItem}>
                <ThemedText style={styles.notificationMessage}>
                  {item.message}
                </ThemedText>

                <HStack justifyContent="space-between">
                  <ThemedText style={styles.notificationDate}>
                    {formatDate(item.createdAt)}
                  </ThemedText>

                  {item.platform && (
                    <Box style={styles.platformBadge}>
                      <Text style={styles.badgeText}>
                        {item.platform}
                      </Text>
                    </Box>
                  )}
                </HStack>
              </Box>
            ))
          )}
        </Box> */}
      </ScrollView>
    </ThemedView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  header: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
  },
  orgName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#dc2626",
  },
  creditRow: {
    marginTop: 4,
    fontSize: 15,
  },
  creditHeading: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  creditValue: {
    color: "#16a34a",
    fontSize: 12,
    fontWeight: "800",
  },

  /* PLAN */
  planCard: {
    backgroundColor: "#dc2626",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  planLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
  planName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  trialBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trialText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  trialDate: {
    color: "#fff",
    fontSize: 13,
    marginTop: 5,
  },

  /* STATS */
  section: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 16,
    minHeight: 130,
    justifyContent: "space-between",
  },
  statCardFull: {
    width: "100%",
  },
  statLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  statValue: {
    fontSize: 30,
    fontWeight: "700",
  },
  statSubtext: {
    fontSize: 12,
    color: "#9ca3af",
  },

  /* USAGE */
  usageCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  usageName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 9,
  },
  usageLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
  },

  /* BADGES */
  roleBadge: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 7,
  },
  platformBadge: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },

  /* NOTIFICATIONS */
  notificationItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 12,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 6,
  },
  notificationDate: {
    fontSize: 12,
    color: "#6b7280",
  },
});
