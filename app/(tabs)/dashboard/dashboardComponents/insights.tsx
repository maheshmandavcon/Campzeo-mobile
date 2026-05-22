import { getUsage } from "@/api/billingApi";
import { getUser } from "@/api/dashboardApi";
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
import { StyleSheet, ScrollView } from "react-native";
import { Divider } from "@gluestack-ui/themed";
import { FontAwesome, Ionicons } from "@expo/vector-icons";

/* ================= COMPONENT ================= */

export default function Insights() {
  const isDark = useColorScheme() === "dark";

  const routePage = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ================= API ================= */
    const fetchInsights = async () => {
      try {
        const user = await getUser();
        const usage = await getUsage();
        setUserData(user);
        setUsageData(usage);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
    fetchInsights();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchInsights();
    }, [])
  );
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

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <ThemedView style={styles.container}>
        {renderHeaderSkeleton()}

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Plan */}
          {renderPlanCardSkeleton()}

          {/* Stats */}
          <VStack style={styles.section}>
            <HStack style={styles.statsRow} className="justify-between">
              {Array.from({ length: 2 }).map((_, i) => (
                <View key={i}>{renderStatCardSkeleton()}</View>
              ))}
            </HStack>

            <Box style={[styles.statCard, styles.statCardFull]}>
              <ShimmerSkeleton height={13} width={120} />
              <ShimmerSkeleton height={30} width={60} />
              <ShimmerSkeleton height={12} width="80%" />
            </Box>
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

  const planName =
    userData?.organisation?.subscriptions?.[0]?.plan?.name ?? "FREE TRIAL";

  const isApproved = userData?.organisation?.isApproved ?? null;

  /* ================= UI ================= */

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <HStack style={styles.header}>
        <ThemedText style={styles.heading}>Welcome back, </ThemedText>
        <ThemedText style={styles.orgName}>{organisationName}</ThemedText>
      </HStack>

      <ScrollView showsVerticalScrollIndicator={false}>
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
                    ? "#dcfce7" // light green
                    : isApproved === false
                      ? "#fee2e2" // light red
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

          <Box style={[styles.statCard, styles.statCardFull]}>
            <ThemedText style={styles.statLabel}>Connected Accounts</ThemedText>
            <ThemedText style={styles.statValue}>
              {connectedAccounts}
            </ThemedText>
            <ThemedText style={styles.statSubtext}>
              Active social connections
            </ThemedText>
          </Box>
        </VStack>

        {/* ================= USAGE ================= */}
        <Box style={styles.usageCard}>
          <ThemedText style={styles.usageName}>Usage Details</ThemedText>
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
