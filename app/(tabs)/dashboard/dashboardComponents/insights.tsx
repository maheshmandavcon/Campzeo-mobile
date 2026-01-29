import { getUsage } from "@/api/billingApi";
import {
  getCampaigns,
  getContacts,
  // getNotifications,
  getUser,
} from "@/api/dashboardApi";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Box } from "@/components/ui/box";
import { Center } from "@/components/ui/center";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeletons";
import { VStack } from "@/components/ui/vstack";
import { Progress, ProgressFilledTrack } from "@gluestack-ui/themed";
import { View } from "@gluestack-ui/themed";

import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, ScrollView } from "react-native";
// import { ScrollView } from "react-native-gesture-handler";

/* ================= TYPES ================= */

type UsageItem = {
  current?: number;
  limit?: number;
  percentage?: number;
  isNearLimit?: boolean;
};

/* ================= COMPONENT ================= */

export default function Insights() {
  const routePage = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [campaignData, setCampaignData] = useState<any>(null);
  const [contactsData, setContactsData] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);
  // const [notificationData, setNotificationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ================= API ================= */
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const user = await getUser();
        const campaigns = await getCampaigns();
        const contacts = await getContacts();
        const usage = await getUsage();
        // const notification = await getNotifications();

        setUserData(user);
        setCampaignData(campaigns);
        setContactsData(contacts);
        setUsageData(usage);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

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

  const totalCampaigns =
    campaignData?.pagination?.total ?? campaignData?.campaigns?.length ?? "-";

  const totalContacts =
    contactsData?.pagination?.total ?? contactsData?.contacts?.length ?? "-";

  const teamSize =
    usageData?.usage?.users?.current ??
    userData?.organisation?.users?.length ??
    1;

  const planName =
    userData?.organisation?.subscriptions?.[0]?.plan?.name ?? "FREE TRIAL";

  const isApproved = userData?.organisation?.isApproved ?? null;

  // console.log("isapp check",isApproved);

  // const trialEndDate = userData?.organisation?.trialEndDate
  //   ? new Date(userData.organisation.trialEndDate).toLocaleDateString()
  //   : "N/A";

  // const notifications: NotificationItem[] =
  //   notificationData?.data?.notifications ?? [];

  /* ================= HELPERS ================= */

  // const formatDate = (date: string) =>
  //   new Date(date).toLocaleString();

  const renderUsageItem = (label: string, data?: UsageItem) => {
    const current = data?.current ?? "-";
    const limit = data?.limit ?? "-";
    const percentage =
      typeof data?.percentage === "number" ? data.percentage : 0;

    const progressColor = data?.isNearLimit ? "#f97316" : "#22c55e";

    return (
      <VStack style={{ marginBottom: 16 }}>
        <HStack style={{ justifyContent: "space-between" }}>
          <ThemedText>{label}</ThemedText>
          <ThemedText>
            {current}/{limit}
          </ThemedText>
        </HStack>

        <Center style={{ marginTop: 6 }}>
          {/* <Progress size="sm">
  <ProgressFilledTrack value={percentage} />
</Progress> */}

<Progress value={percentage} size="sm">
  <ProgressFilledTrack />
</Progress>

        </Center>
      </VStack>
    );
  };

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
            <Box style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Total Campaigns</ThemedText>
              <ThemedText style={styles.statValue}>{totalCampaigns}</ThemedText>
              <ThemedText style={styles.statSubtext}>
                Total Active Campaigns
              </ThemedText>
            </Box>

            <Box style={styles.statCard}>
              <ThemedText style={styles.statLabel}>Total Contacts</ThemedText>
              <ThemedText style={styles.statValue}>{totalContacts}</ThemedText>
              <ThemedText style={styles.statSubtext}>
                Audience Reached
              </ThemedText>
            </Box>
          </HStack>

          <Box style={[styles.statCard, styles.statCardFull]}>
            <ThemedText style={styles.statLabel}>Team Size</ThemedText>
            <ThemedText style={styles.statValue}>{teamSize}</ThemedText>
            <ThemedText style={styles.statSubtext}>
              Active team members
            </ThemedText>
          </Box>
        </VStack>

        {/* ================= USAGE ================= */}
        <Box style={styles.usageCard}>
          <ThemedText style={styles.usageName}>Usage Details</ThemedText>
          <ThemedText style={styles.usageLabel}>
            Detailed breakdown of your usage and limits
          </ThemedText>

          {renderUsageItem("Monthly Posts", usageData?.usage?.postsThisMonth)}
          {renderUsageItem("Total Contacts", usageData?.usage?.contacts)}
          {renderUsageItem("Campaigns", usageData?.usage?.campaigns)}
          {renderUsageItem("Platform Connections", usageData?.usage?.platforms)}
          {renderUsageItem("Team Members", usageData?.usage?.users)}
        </Box>

        {/* ================= TEAM ================= */}
        <Box style={styles.usageCard}>
          <ThemedText style={styles.usageName}>Team Members</ThemedText>

          <HStack
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <VStack>
              <ThemedText>
                {userData?.firstName} {userData?.lastName}
              </ThemedText>
              <ThemedText>{userData?.email}</ThemedText>
            </VStack>

            <Box style={styles.roleBadge}>
              <ThemedText style={styles.badgeText}>{userData?.role}</ThemedText>
            </Box>
          </HStack>
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
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  platformBadge: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
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
