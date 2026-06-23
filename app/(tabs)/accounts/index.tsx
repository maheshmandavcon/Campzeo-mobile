import {
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable as RNPressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
  RefreshControl,
} from "react-native";

import {
  disconnectPlatform,
  FacebookPage,
  getFbPages,
  getPlatform,
  getSocialStatus,
  saveFacebookPage,
} from "@/api/accountsApi";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeletons";
import { VStack } from "@/components/ui/vstack";
import * as WebBrowser from "expo-web-browser";

type FontAwesomeName = React.ComponentProps<typeof FontAwesome>["name"];

type SocialItem = {
  icon: FontAwesomeName;
  color: string;
  backgroundColor: string;
  platformKey: string;
  title: string;
  description: string;
  connected?: boolean;
  connectedAs?: string;
};

const backendKeyMap: Record<string, string> = {
  facebook: "FACEBOOK",
  instagram: "INSTAGRAM",
  linkedin: "LINKEDIN",
  pinterest: "PINTEREST",
  youtube: "YOUTUBE",
};

const initialPlatforms: SocialItem[] = [
  {
    icon: "facebook",
    color: "#1877F2",
    backgroundColor: "#eff6ff",
    platformKey: "FACEBOOK",
    title: "Facebook",
    description: "Connect a Facebook Page for publishing and analytics.",
    connected: false,
  },
  {
    icon: "instagram",
    color: "#E4405F",
    backgroundColor: "#fdf2f8",
    platformKey: "INSTAGRAM",
    title: "Instagram",
    description:
      "Connect an Instagram Business account for posts and insights.",
    connected: false,
  },
  {
    icon: "linkedin",
    color: "#0A66C2",
    backgroundColor: "#eff6ff",
    platformKey: "LINKEDIN",
    title: "LinkedIn",
    description: "Share updates to a profile or company page.",
    connected: false,
  },
  {
    icon: "youtube-play",
    color: "#FF0000",
    backgroundColor: "#fef2f2",
    platformKey: "YOUTUBE",
    title: "YouTube",
    description: "Upload and manage video content from your channel.",
    connected: false,
  },
  {
    icon: "pinterest",
    color: "#E60023",
    backgroundColor: "#fef2f2",
    platformKey: "PINTEREST",
    title: "Pinterest",
    description: "Publish visual content to Pinterest boards.",
    connected: false,
  },
];

export default function Accounts() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [pageLoading, setPageLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [platforms, setPlatforms] = useState<SocialItem[]>(initialPlatforms);
  const [loadingPlatform, setLoadingPlatform] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<
    "connect" | "disconnect" | "save-page" | null
  >(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [platformToDisconnect, setPlatformToDisconnect] =
    useState<SocialItem | null>(null);
  const [showFacebookPageModal, setShowFacebookPageModal] = useState(false);
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);

  const colors = useMemo(
    () => ({
      bg: isDark ? "#0f1115" : "#f8fafc",
      card: isDark ? "#171a20" : "#ffffff",
      text: isDark ? "#f8fafc" : "#0f172a",
      muted: isDark ? "#9ca3af" : "#64748b",
      border: isDark ? "#2a2f3a" : "#e5e7eb",
      subtle: isDark ? "#20242c" : "#f1f5f9",
    }),
    [isDark],
  );

  const connectedCount = platforms.filter((item) => item.connected).length;

  const fetchConnections = async (showLoader = true) => {
    try {
      if (showLoader) setPageLoading(true);
      const response = await getSocialStatus();
      const data = response?.data || response;

      setPlatforms((prev) =>
        prev.map((item) => {
          const backendKey = Object.keys(backendKeyMap).find(
            (key) => backendKeyMap[key] === item.platformKey,
          );
          const status = backendKey ? data?.[backendKey] : null;

          if (!status) {
            return { ...item, connected: false, connectedAs: undefined };
          }

          return {
            ...item,
            connected: Boolean(status.connected),
            connectedAs:
              status.pageName ||
              status.username ||
              status.userName ||
              status.name ||
              (backendKey === "linkedin" ? status.urn : undefined),
          };
        }),
      );
    } catch (error) {
      console.error("Failed to fetch connected platforms", error);
      Alert.alert("Unable to load accounts", "Please try again in a moment.");
    } finally {
      setPageLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchConnections(false);
    setIsRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchConnections(true);
    }, [])
  );

  const fetchFacebookPagesForSelection = async () => {
    try {
      const pages = await getFbPages();
      setFacebookPages(pages);

      if (pages.length > 0) {
        setShowFacebookPageModal(true);
        return;
      }

      Alert.alert(
        "No Facebook pages found",
        "Reconnect with an account that manages a Facebook Page.",
      );
      fetchConnections(false);
    } catch (error) {
      console.error("Error fetching facebook pages:", error);
      Alert.alert(
        "Facebook pages unavailable",
        "We could not retrieve your Facebook Pages.",
      );
      fetchConnections(false);
    }
  };

  const handleConnect = async (platformKey: string) => {
    try {
      setLoadingPlatform(platformKey);
      setLoadingAction("connect");

      const data = await getPlatform(platformKey);

      if (!data?.success || !data?.url) {
        Alert.alert(
          "Connection failed",
          data?.errorMessage || `Unable to connect ${platformKey}.`,
        );
        return;
      }

      await WebBrowser.openBrowserAsync(data.url);

      if (platformKey === "FACEBOOK") {
        await fetchFacebookPagesForSelection();
      } else {
        await fetchConnections(false);
      }
    } catch (error) {
      console.error("Failed to connect:", error);
      Alert.alert(
        "Connection failed",
        "Please try connecting the account again.",
      );
    } finally {
      setLoadingPlatform(null);
      setLoadingAction(null);
    }
  };

  const requestDisconnect = (item: SocialItem) => {
    setPlatformToDisconnect(item);
    setShowDisconnectModal(true);
  };

  const confirmDisconnect = async () => {
    if (!platformToDisconnect) return;

    try {
      setLoadingPlatform(platformToDisconnect.platformKey);
      setLoadingAction("disconnect");
      const response = await disconnectPlatform(
        platformToDisconnect.platformKey,
      );

      if (response?.success === false) {
        Alert.alert(
          "Disconnect failed",
          response?.errorMessage ||
          `Unable to disconnect ${platformToDisconnect.title}.`,
        );
        return;
      }

      setShowDisconnectModal(false);
      setPlatformToDisconnect(null);
      await fetchConnections(false);
    } catch (error) {
      console.error("Failed to disconnect:", error);
      Alert.alert("Disconnect failed", "Please try again in a moment.");
    } finally {
      setLoadingPlatform(null);
      setLoadingAction(null);
    }
  };

  const selectFacebookPage = async (page: FacebookPage) => {
    const pageAccessToken = page.access_token || page.accessToken;

    if (!page.id || !pageAccessToken) {
      Alert.alert(
        "Page cannot be linked",
        "The selected page is missing access details.",
      );
      return;
    }

    try {
      setLoadingPlatform("FACEBOOK");
      setLoadingAction("save-page");
      await saveFacebookPage(page.id, pageAccessToken);
      setShowFacebookPageModal(false);
      await fetchConnections(false);
    } catch (error) {
      console.error("Error saving page:", error);
      Alert.alert(
        "Page link failed",
        "We could not link the selected Facebook Page.",
      );
    } finally {
      setLoadingPlatform(null);
      setLoadingAction(null);
    }
  };

  const renderHeader = (loading: boolean) => (
    <HStack style={styles.header}>
      {/* <Pressable
        disabled={loading}
        onPress={() => router.back()}
        style={styles.iconButton}
      >
        <Ionicons name="arrow-back-outline" size={22} color={colors.text} />
      </Pressable> */}

      <VStack style={styles.headerText}>
        <ThemedText style={[styles.title, { color: colors.text }]}>
          Accounts
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.muted }]}>
          Manage social connections for publishing.
        </ThemedText>
      </VStack>
    </HStack>
  );

  const renderSkeleton = () => (
    <ThemedView style={[styles.container, { backgroundColor: colors.bg }]}>
      {renderHeader(true)}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={{ gap: 12 }}>
            <ShimmerSkeleton height={18} width={150} />
            <ShimmerSkeleton height={34} width={90} borderRadius={16} />
            <ShimmerSkeleton height={12} width="85%" />
          </View>
        </View>

        {Array.from({ length: 5 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.platformCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <HStack style={styles.cardTop}>
              <ShimmerSkeleton height={48} width={48} borderRadius={16} />
              <VStack style={styles.cardText}>
                <ShimmerSkeleton height={16} width={110} />
                <ShimmerSkeleton height={12} width="92%" />
              </VStack>
            </HStack>
            <ShimmerSkeleton height={36} width="100%" borderRadius={12} />
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );

  if (pageLoading) return renderSkeleton();

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.bg }]}>
      {renderHeader(false)}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#dc2626" />
        }
      >
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <HStack style={styles.summaryTop}>
            <VStack>
              <ThemedText
                style={[styles.summaryLabel, { color: colors.muted }]}
              >
                Connected accounts
              </ThemedText>
              <ThemedText style={[styles.summaryValue, { color: colors.text }]}>
                {connectedCount} of {platforms.length}
              </ThemedText>
            </VStack>
            <View style={styles.summaryIcon}>
              <MaterialCommunityIcons
                name="connection"
                size={24}
                color="#dc2626"
              />
            </View>
          </HStack>
          <ThemedText style={[styles.summaryCopy, { color: colors.muted }]}>
            Connect your social media accounts to enable posting and analytics.
          </ThemedText>
        </View>

        {platforms.map((item) => {
          const isLoading = loadingPlatform === item.platformKey;
          const isConnected = Boolean(item.connected);

          return (
            <View
              key={item.platformKey}
              style={[
                styles.platformCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              pointerEvents={isLoading ? "none" : "auto"}
            >
              <HStack style={styles.cardTop}>
                <View
                  style={[
                    styles.platformIcon,
                    { backgroundColor: item.backgroundColor },
                  ]}
                >
                  <FontAwesome name={item.icon} size={24} color={item.color} />
                </View>

                <VStack style={styles.cardText}>
                  <HStack style={styles.nameRow}>
                    <ThemedText
                      style={[styles.platformTitle, { color: colors.text }]}
                    >
                      {item.title}
                    </ThemedText>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: isConnected
                            ? "#dcfce7"
                            : colors.subtle,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          isConnected ? "checkmark-circle" : "ellipse-outline"
                        }
                        size={13}
                        color={isConnected ? "#16a34a" : colors.muted}
                      />
                      <ThemedText
                        style={[
                          styles.statusText,
                          { color: isConnected ? "#15803d" : colors.muted },
                        ]}
                      >
                        {isConnected ? "Connected" : "Not connected"}
                      </ThemedText>
                    </View>
                  </HStack>

                  <ThemedText
                    style={[styles.description, { color: colors.muted }]}
                  >
                    {item.description}
                  </ThemedText>

                  {item.connectedAs ? (
                    <ThemedText style={styles.connectedAs}>
                      Connected as: {item.connectedAs}
                    </ThemedText>
                  ) : null}
                </VStack>
              </HStack>

              {isConnected ? (
                <RNPressable
                  onPress={() => requestDisconnect(item)}
                  style={[styles.actionButton, styles.disconnectButton]}
                >
                  {isLoading && loadingAction === "disconnect" ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <ThemedText style={styles.disconnectText}>
                      Disconnect
                    </ThemedText>
                  )}
                </RNPressable>
              ) : (
                <RNPressable
                  onPress={() => handleConnect(item.platformKey)}
                  style={[styles.actionButton, styles.connectButton]}
                >
                  {isLoading && loadingAction === "connect" ? (
                    <HStack style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <ThemedText style={styles.connectText}>
                        Connecting
                      </ThemedText>
                    </HStack>
                  ) : (
                    <ThemedText style={styles.connectText}>Connect</ThemedText>
                  )}
                </RNPressable>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={showDisconnectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDisconnectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.warningIcon}>
              <Ionicons name="close" size={28} color="#dc2626" />
            </View>
            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
              Disconnect {platformToDisconnect?.title}?
            </ThemedText>
            <ThemedText style={[styles.modalCopy, { color: colors.muted }]}>
              Campaign publishing and analytics for this channel will pause
              until it is connected again.
            </ThemedText>

            <HStack style={styles.modalActions}>
              <RNPressable
                onPress={() => setShowDisconnectModal(false)}
                style={[styles.modalButton, { backgroundColor: colors.subtle }]}
              >
                <ThemedText style={[styles.cancelText, { color: colors.text }]}>
                  Cancel
                </ThemedText>
              </RNPressable>
              <RNPressable
                onPress={confirmDisconnect}
                style={[styles.modalButton, styles.confirmButton]}
              >
                {loadingAction === "disconnect" ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <ThemedText style={styles.confirmText}>Disconnect</ThemedText>
                )}
              </RNPressable>
            </HStack>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFacebookPageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFacebookPageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              styles.pageModal,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <HStack style={styles.pageModalHeader}>
              <View
                style={[styles.platformIcon, { backgroundColor: "#eff6ff" }]}
              >
                <FontAwesome name="facebook" size={23} color="#1877F2" />
              </View>
              <VStack style={{ flex: 1 }}>
                <ThemedText
                  style={[
                    styles.modalTitle,
                    styles.pageTitle,
                    { color: colors.text },
                  ]}
                >
                  Select Facebook Page
                </ThemedText>
                <ThemedText
                  style={[
                    styles.modalCopy,
                    styles.pageSubtitle,
                    { color: colors.muted },
                  ]}
                >
                  Choose the page to link with campaigns.
                </ThemedText>
              </VStack>
              <RNPressable
                onPress={() => setShowFacebookPageModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </RNPressable>
            </HStack>

            <ScrollView
              style={styles.pagesList}
              showsVerticalScrollIndicator={false}
            >
              {facebookPages.map((page) => {
                const savingThisPage =
                  loadingPlatform === "FACEBOOK" &&
                  loadingAction === "save-page";

                return (
                  <RNPressable
                    key={page.id}
                    onPress={() => selectFacebookPage(page)}
                    disabled={savingThisPage}
                    style={[
                      styles.pageRow,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.subtle,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.pageAvatar,
                        { backgroundColor: "#1877F2" },
                      ]}
                    >
                      <ThemedText style={styles.pageInitial}>
                        {page.name?.charAt(0)?.toUpperCase() || "F"}
                      </ThemedText>
                    </View>
                    <VStack style={{ flex: 1 }}>
                      <ThemedText
                        style={[styles.pageName, { color: colors.text }]}
                      >
                        {page.name}
                      </ThemedText>
                      <ThemedText
                        style={[styles.pageId, { color: colors.muted }]}
                      >
                        ID: {page.id}
                      </ThemedText>
                    </VStack>
                    {savingThisPage ? (
                      <ActivityIndicator size="small" color="#dc2626" />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#dc2626"
                      />
                    )}
                  </RNPressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  content: {
    paddingBottom: 32,
    gap: 14,
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  iconButton: {
    alignItems: "center",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
    alignItems: "flex-start",
  },

  subtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: "left",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 4,
    padding: 18,
  },
  summaryTop: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 30,
    fontWeight: "800",
    marginTop: 4,
  },
  summaryIcon: {
    alignItems: "center",
    backgroundColor: "#fee2e2",
    borderRadius: 16,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  summaryCopy: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  platformCard: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  cardTop: {
    alignItems: "flex-start",
    gap: 12,
  },
  platformIcon: {
    alignItems: "center",
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  cardText: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  platformTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  statusPill: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  connectedAs: {
    color: "#16a34a",
    fontSize: 12,
    fontWeight: "700",
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 42,
  },
  connectButton: {
    backgroundColor: "#dc2626",
  },
  connectText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  disconnectButton: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderWidth: 1,
  },
  disconnectText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "800",
  },
  loadingRow: {
    alignItems: "center",
    gap: 8,
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.58)",
    flex: 1,
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    width: "100%",
  },
  warningIcon: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#fee2e2",
    borderRadius: 18,
    height: 64,
    justifyContent: "center",
    marginBottom: 16,
    width: 64,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  modalCopy: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    textAlign: "center",
  },
  modalActions: {
    gap: 12,
    marginTop: 22,
  },
  modalButton: {
    alignItems: "center",
    borderRadius: 14,
    flex: 1,
    minHeight: 46,
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "800",
  },
  confirmButton: {
    backgroundColor: "#dc2626",
  },
  confirmText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  pageModal: {
    maxHeight: "78%",
  },
  pageModalHeader: {
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  pageTitle: {
    textAlign: "left",
  },
  pageSubtitle: {
    marginTop: 2,
    textAlign: "left",
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  pagesList: {
    maxHeight: 360,
  },
  pageRow: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
    padding: 12,
  },
  pageAvatar: {
    alignItems: "center",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  pageInitial: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  pageName: {
    fontSize: 14,
    fontWeight: "800",
  },
  pageId: {
    fontSize: 11,
    marginTop: 2,
  },
});
