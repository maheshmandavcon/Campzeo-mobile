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
      bg: isDark ? "#161618" : "#f3f4f6",
      card: isDark ? "#1f2937" : "#ffffff",
      text: isDark ? "#f3f4f6" : "#111827",
      muted: isDark ? "#9ca3af" : "#6b7280",
      border: isDark ? "#374151" : "#e5e7eb",
      subtle: isDark ? "#374151" : "#f3f4f6",
      primary: "#dc2626",
      primarySoft: isDark ? "rgba(220, 38, 38, 0.15)" : "#fee2e2",
      success: "#16a34a",
      successSoft: isDark ? "rgba(22, 163, 74, 0.15)" : "#dcfce7",
      disconnectBg: isDark ? "rgba(220, 38, 38, 0.1)" : "#fff1f2",
      disconnectBorder: isDark ? "rgba(220, 38, 38, 0.3)" : "#fecdd3",
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

  const renderSkeleton = () => (
    <ThemedView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header Card Skeleton */}
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <HStack
          style={{
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <VStack style={{ flex: 1 }}>
            <ThemedText
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontSize: 26,
                  marginBottom: 4,
                },
              ]}
            >
              Accounts
            </ThemedText>

            <ShimmerSkeleton height={16} width={220} />
          </VStack>

          <ShimmerSkeleton
            height={60}
            width={60}
            borderRadius={18}
          />
        </HStack>

        <View
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <ShimmerSkeleton height={34} width={80} />
            <View style={{ height: 8 }} />
            <ShimmerSkeleton height={14} width={150} />
          </View>

          <ShimmerSkeleton
            height={36}
            width={110}
            borderRadius={20}
          />
        </View>
      </View>

      {/* Platforms Skeleton */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.unifiedCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <View key={index}>
              <HStack style={styles.platformRow}>
                <ShimmerSkeleton
                  height={46}
                  width={46}
                  borderRadius={23}
                />

                <VStack style={styles.rowText}>
                  <ShimmerSkeleton
                    height={16}
                    width={120}
                  />
                  <View style={{ height: 8 }} />
                  <ShimmerSkeleton
                    height={14}
                    width={140}
                  />
                </VStack>

                <ShimmerSkeleton
                  height={34}
                  width={90}
                  borderRadius={17}
                />
              </HStack>

              {index < 4 && (
                <View
                  style={[
                    styles.separator,
                    { backgroundColor: colors.border },
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );

  if (pageLoading) return renderSkeleton();

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <HStack
          style={{
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <VStack style={{ flex: 1 }}>
            <ThemedText
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontSize: 26,
                  marginBottom: 4,
                },
              ]}
            >
              Accounts
            </ThemedText>

            <ThemedText
              style={[
                styles.subtitle,
                {
                  color: colors.muted,
                  marginTop: 0,
                },
              ]}
            >
              Manage your connected social platforms
            </ThemedText>
          </VStack>

          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              backgroundColor: colors.primarySoft,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialCommunityIcons
              name="rocket-launch"
              size={30}
              color={colors.primary}
            />
          </View>
        </HStack>

        <View
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View>
            <ThemedText
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: colors.text,
              }}
            >
              {connectedCount}/{platforms.length}
            </ThemedText>

            <ThemedText
              style={{
                color: colors.muted,
                marginTop: 2,
              }}
            >
              Platforms Connected
            </ThemedText>
          </View>

          <View
            style={{
              backgroundColor: colors.successSoft,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <ThemedText
              style={{
                color: colors.success,
                fontWeight: "700",
                fontSize: 13,
              }}
            >
              {connectedCount === platforms.length
                ? "All Connected"
                : `${platforms.length - connectedCount} Remaining`}
            </ThemedText>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View
          style={[
            styles.unifiedCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {platforms.map((item, index) => {
            const isLoading = loadingPlatform === item.platformKey;
            const isConnected = Boolean(item.connected);
            const isLast = index === platforms.length - 1;

            return (
              <RNPressable
                key={item.platformKey}
                pointerEvents={isLoading ? "none" : "auto"}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <HStack style={styles.platformRow}>
                  <View
                    style={[
                      styles.platformIcon,
                      { backgroundColor: item.backgroundColor },
                    ]}
                  >
                    <FontAwesome
                      name={item.icon}
                      size={22}
                      color={item.color}
                    />
                  </View>

                  <VStack style={styles.rowText}>
                    <ThemedText
                      style={[styles.platformTitle, { color: colors.text }]}
                    >
                      {item.title}
                    </ThemedText>
                    {isConnected ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 6,
                        }}
                      >
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: item.color,
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: 8,
                          }}
                        >
                          <ThemedText
                            style={{
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: "700",
                            }}
                          >
                            {item.connectedAs?.charAt(0)}
                          </ThemedText>
                        </View>

                        <ThemedText
                          style={[
                            styles.connectedAs,
                            { color: colors.muted },
                          ]}
                          numberOfLines={1}
                        >
                          {item.connectedAs}
                        </ThemedText>
                      </View>
                    ) : (
                      <ThemedText
                        style={[styles.description, { color: colors.muted }]}
                        numberOfLines={1}
                      >
                        Not connected
                      </ThemedText>
                    )}
                  </VStack>

                  {isConnected ? (
                    <RNPressable
                      onPress={() => requestDisconnect(item)}
                      style={[
                        styles.pillButton,
                        {
                          backgroundColor: colors.disconnectBg,
                          borderColor: colors.disconnectBorder,
                          borderWidth: 1,
                        },
                      ]}
                    >
                      {isLoading && loadingAction === "disconnect" ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                        />
                      ) : (
                        <HStack
                          style={{
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Ionicons
                            name="unlink-outline"
                            size={14}
                            color={colors.primary}
                          />

                          <ThemedText
                            style={[
                              styles.disconnectText,
                              { color: colors.primary },
                            ]}
                          >
                            Revoke
                          </ThemedText>
                        </HStack>
                      )}
                    </RNPressable>
                  ) : (
                    <RNPressable
                      onPress={() => handleConnect(item.platformKey)}
                      style={[
                        styles.pillButton,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      {isLoading && loadingAction === "connect" ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <HStack
                          style={{
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Ionicons
                            name="link-outline"
                            size={14}
                            color="#fff"
                          />

                          <ThemedText style={styles.connectText}>
                            Connect
                          </ThemedText>
                        </HStack>
                      )}
                    </RNPressable>
                  )}
                </HStack>
                {!isLast && (
                  <View
                    style={[
                      styles.separator,
                      { backgroundColor: colors.border },
                    ]}
                  />
                )}
              </RNPressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Disconnect Modal */}
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
            <View
              style={[
                styles.warningIcon,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Ionicons name="close" size={28} color={colors.primary} />
            </View>
            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
              Revoke {platformToDisconnect?.title}?
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
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                {loadingAction === "disconnect" ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <ThemedText style={styles.confirmText}>Revoke</ThemedText>
                )}
              </RNPressable>
            </HStack>
          </View>
        </View>
      </Modal>

      {/* Facebook Page Select Modal */}
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
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={colors.primary}
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
    paddingTop: 16,
  },
  content: {
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    letterSpacing: -0.2,
  },
  unifiedCard: {
    borderRadius: 30,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  platformRow: {
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 20,
    gap: 16,
  },
  platformIcon: {
    alignItems: "center",
    borderRadius: 23,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  platformTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  statusContainer: {
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectedAs: {
    fontSize: 13,
  },
  description: {
    fontSize: 13,
    marginTop: 2,
  },
  pillButton: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    paddingHorizontal: 16,
    height: 34,
  },
  connectText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  disconnectText: {
    fontSize: 13,
    fontWeight: "700",
  },
  separator: {
    height: 1,
    marginLeft: 82,
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  warningIcon: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 20,
    height: 68,
    justifyContent: "center",
    marginBottom: 18,
    width: 68,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  modalCopy: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
  modalActions: {
    gap: 14,
    marginTop: 26,
    flexDirection: "row",
  },
  modalButton: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    minHeight: 50,
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "800",
  },
  confirmText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },
  pageModal: {
    maxHeight: "80%",
    padding: 20,
  },
  pageModalHeader: {
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  pageTitle: {
    textAlign: "left",
    fontSize: 20,
  },
  pageSubtitle: {
    marginTop: 4,
    textAlign: "left",
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  pagesList: {
    maxHeight: 400,
  },
  pageRow: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
    padding: 14,
  },
  pageAvatar: {
    alignItems: "center",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  pageInitial: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  pageName: {
    fontSize: 15,
    fontWeight: "800",
  },
  pageId: {
    fontSize: 12,
    marginTop: 2,
  },
  statsCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
  },

  statsNumber: {
    fontSize: 34,
    fontWeight: "900",
    marginTop: 10,
  },
  headerCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 22,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
});
