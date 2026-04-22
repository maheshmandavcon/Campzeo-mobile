import React, { useState, useEffect, useCallback } from "react";
import {
  TouchableOpacity,
  ScrollView,
  View as RNView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import CampaignPostForm from "./campaignPostForm";
import { useAuth } from "@clerk/clerk-expo";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { router, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { getSocialStatus } from "@/api/accountsApi";

export default function CampaignPost() {
  const icons = [
    { name: "chatbubble-ellipses-outline", label: "SMS" as const, library: Ionicons, color: "#10b981" },
    { name: "mail", label: "EMAIL" as const, library: Ionicons, color: "#f59e0b" },
    { name: "logo-whatsapp", label: "WHATSAPP" as const, library: Ionicons, color: "#25D366" },
    { name: "instagram", label: "INSTAGRAM" as const, library: FontAwesome, color: "#c13584" },
    { name: "facebook-square", label: "FACEBOOK" as const, library: FontAwesome, color: "#1877F2" },
    { name: "youtube-play", label: "YOUTUBE" as const, library: FontAwesome, color: "#FF0000" },
    { name: "linkedin-square", label: "LINKEDIN" as const, library: FontAwesome, color: "#0A66C2" },
    { name: "pinterest", label: "PINTEREST" as const, library: FontAwesome, color: "#E60023" },
  ];

  type PlatformType =
    | "SMS"
    | "EMAIL"
    | "WHATSAPP"
    | "INSTAGRAM"
    | "FACEBOOK"
    | "YOUTUBE"
    | "LINKEDIN"
    | "PINTEREST";

  const restrictedPlatforms: PlatformType[] = ["SMS", "WHATSAPP"];
  const [selected, setSelected] = useState<PlatformType | null>(null);
  const [existingPost, setExistingPost] = useState<any>(null);
  const [loadingPost, setLoadingPost] = useState(false);

  const [twilioAccessStatus, setTwilioAccessStatus] = useState<string | null>(null);
  const [smsCredits, setSmsCredits] = useState<number>(0);
  const [whatsappCredits, setWhatsappCredits] = useState<number>(0);

  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>({});
  const [loadingConnections, setLoadingConnections] = useState(true);

  const route = useRouter();

  const params = useLocalSearchParams();
  const { campaignId, campaignStartDate: campaignStartDateStr, campaignEndDate: campaignEndDateStr } = useLocalSearchParams<{
    campaignId?: string;
    campaignStartDate?: string;
    campaignEndDate?: string;
  }>();

  const campaignStartDate = campaignStartDateStr ? new Date(campaignStartDateStr) : new Date();
  const campaignEndDate = campaignEndDateStr ? new Date(campaignEndDateStr) : undefined;
  // console.log("campaignStartDate on CampaignPost:", campaignStartDate);
  // console.log("campaignEndDate on CampaignPost:", campaignEndDate);

  const campaignIdStr =
    typeof params.campaignId === "string" ? params.campaignId : params.campaignId?.[0];

  const postIdStr =
    typeof params.postId === "string" ? params.postId : params.postId?.[0];

  const typeStr =
    typeof params.type === "string" ? params.type : params.type?.[0];

  const isEditMode = !!(postIdStr && typeStr);

  const { getToken } = useAuth();

  const socialPlatforms = ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "YOUTUBE", "PINTEREST"];

  const connectedCount = socialPlatforms.filter(
    (p) => connectedPlatforms[p]
  ).length;

  const totalCount = socialPlatforms.length;

  const noneConnected = connectedCount === 0;
  const someConnected = connectedCount > 0 && connectedCount < totalCount;

  const bannerMessage = noneConnected
    ? "No social accounts are connected yet. Connect them to continue."
    : `Almost there! ${totalCount - connectedCount} account(s) still need connection.`;

  useFocusEffect(
    useCallback(() => {
      const fetchConnections = async () => {
        try {
          setLoadingConnections(true);
          const data = await getSocialStatus();

          if (data?.twilioAccess) {
            setTwilioAccessStatus(data.twilioAccess.twilioAccessStatus);
          }
          if (data?.wallet) {
            setSmsCredits(data.wallet.smsCreditsAvailable || 0);
            setWhatsappCredits(data.wallet.whatsappCreditsAvailable || 0);
          }

          setConnectedPlatforms({
            FACEBOOK: data.facebook?.connected ?? false,
            INSTAGRAM: data.instagram?.connected ?? false,
            LINKEDIN: data.linkedin?.connected ?? false,
            YOUTUBE: data.youtube?.connected ?? false,
            PINTEREST: data.pinterest?.connected ?? false,
            EMAIL: true,
            SMS: true,
            WHATSAPP: true,
          });
        } catch (error) {
          console.error("Failed to fetch social status", error);
        } finally {
          setLoadingConnections(false);
        }
      };

      fetchConnections();
    }, [])
  );

  useEffect(() => {
    if (!campaignIdStr || !postIdStr) return;

    let isMounted = true;
    setLoadingPost(true);

    const fetchPostDetails = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Token missing");

        // const url = `https://campzeo-v1-oym2.vercel.app/api/campaigns/${campaignIdStr}/posts/${postIdStr}`;
        const url = `https://campzeo.com/api/campaigns/${campaignIdStr}/posts/${postIdStr}`;

        console.log("Fetching post details from:", url);

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        console.log("Post details API response:", data);

        if (isMounted && data?.post) {
          setExistingPost(data.post);
          setSelected((prev) => prev || data.post.type);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error("Error fetching post details:", error.message);
        } else {
          console.error("Unexpected error:", error);
        }
      } finally {
        setLoadingPost(false);
      }
    };

    fetchPostDetails();

    return () => {
      isMounted = false;
    };
  }, [campaignIdStr, postIdStr]);

  useEffect(() => {
    if (!isEditMode || !typeStr || selected) return;

    const allowedPlatforms: PlatformType[] = [
      "SMS",
      "EMAIL",
      "WHATSAPP",
      "INSTAGRAM",
      "FACEBOOK",
      "YOUTUBE",
      "LINKEDIN",
      "PINTEREST",
    ];

    if (allowedPlatforms.includes(typeStr as PlatformType)) {
      setSelected(typeStr as PlatformType);
    }
  }, [isEditMode, typeStr]);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const hasDisconnectedPlatform = ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "YOUTUBE", "PINTEREST"].some(
    (key) => connectedPlatforms[key] === false
  );

  const SkeletonBlock = ({
    width = "100%",
    height = 12,
    radius = 20,
    style = {},
  }: {
    width?: number | string;
    height?: number;
    radius?: number;
    style?: any;
  }) => {
    const isDark = useColorScheme() === "dark";
    const bg = isDark ? "#27272a" : "#f3f4f6";

    return (
      <RNView
        style={{
          width,
          height,
          borderRadius: radius,
          backgroundColor: bg,
          marginBottom: 10,
          ...style,
        }}
      />
    );
  };

  const SkeletonInput = ({
    height = 40,
  }: {
    height?: number;
  }) => {
    const isDark = useColorScheme() === "dark";

    return (
      <RNView
        style={{
          height,
          borderRadius: 12,
          backgroundColor: isDark ? "#27272a" : "#ffffff",
          borderWidth: 1,
          borderColor: isDark ? "#3f3f46" : "#e5e7eb",
          marginBottom: 12,
          paddingHorizontal: 12,
          justifyContent: "center",
        }}
      >
        <SkeletonBlock
          height={12}
          width="60%"
          radius={6}
          style={{ marginBottom: 0 }}
        />
      </RNView>
    );
  };

  const CampaignPostFormSkeleton = () => {
    const isDark = useColorScheme() === "dark";

    return (
      <ThemedView
        style={{
          paddingVertical: 16,
          backgroundColor: isDark ? "#18181b" : "#f3f4f6",
        }}
      >
        <SkeletonInput />
        <SkeletonInput />
        <SkeletonInput height={120} />
        <SkeletonInput />
        <SkeletonBlock height={44} radius={12} />
      </ThemedView>
    );
  };

  const getPlatformOrder = (label: string) => {
    if (restrictedPlatforms.includes(label as any)) return 1;
    if (label === "EMAIL") return 2;
    if (connectedPlatforms[label] === true) return 3;
    return 4;
  };

  const sortedIcons = [...icons].sort((a, b) => getPlatformOrder(a.label) - getPlatformOrder(b.label));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        className="flex-1 p-4"
        style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {isEditMode ? (
          <ThemedView
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              paddingVertical: 16,
              paddingHorizontal: 16,
              marginHorizontal: -16,
              marginTop: -16,
              backgroundColor: isDark ? "#161618" : "#f3f4f6",
            }}
          >
            <ThemedText
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              Edit Campaign Post
            </ThemedText>

            <RNView
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDark ? "#1f2937" : "#fff",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isDark ? "#374151" : "#e5e7eb",
              }}
            >
              {(() => {
                const icon = icons.find((i) => i.label === selected);
                if (!icon) return null;
                const IconComponent = icon.library;
                return (
                  <>
                    <IconComponent
                      name={icon.name as any}
                      size={18}
                      color={icon.color}
                      style={{ marginRight: 8 }}
                    />
                    <ThemedText style={{ fontSize: 13, fontWeight: "bold" }}>
                      {selected}
                    </ThemedText>
                  </>
                );
              })()}
            </RNView>
          </ThemedView>
        ) : (
          <>
            <ThemedView
              style={{
                paddingVertical: 16,
                paddingHorizontal: 16,
                marginHorizontal: -16,
                marginTop: -16,
                marginBottom: 12,
                backgroundColor: isDark ? "#161618" : "#f3f4f6",
                alignItems: "flex-start",
              }}
            >
              <ThemedText
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: isDark ? "#ffffff" : "#111827",
                  textAlign: "left",
                }}
              >
                Create Campaign Post
              </ThemedText>
            </ThemedView>

            <ThemedView
              className="flex-row flex-wrap justify-between mb-4"
              style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
            >
              {sortedIcons
                .filter((icon) => connectedPlatforms[icon.label] !== false)
                .map((icon, index) => {
                  const IconComponent = icon.library;
                  const isSelected = selected === icon.label;
                  const isConnected = connectedPlatforms[icon.label] ?? false;
                  const isEditingThisPlatform =
                    isEditMode &&
                    !loadingPost &&
                    !!existingPost &&
                    existingPost.type === icon.label;
                  const isDisabled =
                    loadingConnections ||
                    !isConnected ||
                    (isEditMode && !isEditingThisPlatform);

                  const isRestrictedPlatform = restrictedPlatforms.includes(
                    icon.label as any,
                  );
                  const credits =
                    icon.label === "SMS" ? smsCredits : whatsappCredits;
                  const isFullyApprovedAndFunded =
                    isRestrictedPlatform &&
                    twilioAccessStatus === "APPROVED" &&
                    credits > 0;
                  const visuallyRestricted =
                    isRestrictedPlatform && !isFullyApprovedAndFunded;

                  return (
                    <ThemedView
                      key={index}
                      className="w-1/4 mb-6 items-center"
                      style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
                    >
                      <RNView
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: icon.color,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity:
                            isSelected && !isDisabled && !visuallyRestricted
                              ? 0.5
                              : 0,
                          shadowRadius:
                            isSelected && !isDisabled && !visuallyRestricted
                              ? 12
                              : 0,
                          elevation:
                            isSelected && !isDisabled && !visuallyRestricted
                              ? 12
                              : 0,
                        }}
                      >
                        <TouchableOpacity
                          disabled={!isRestrictedPlatform && isDisabled}
                          onPress={() => {
                            if (isRestrictedPlatform) {
                              if (twilioAccessStatus === "APPROVED") {
                                if (credits <= 0) {
                                  Alert.alert(
                                    "No Credits Available",
                                    `You have 0 ${icon.label} credits. Please purchase a pack to use this channel.`,
                                    [
                                      { text: "Cancel", style: "cancel" },
                                      {
                                        text: "Add Credits",
                                        onPress: () =>
                                          router.push("/(billing)/billingPage"),
                                      },
                                    ],
                                  );
                                  return;
                                }
                                // Has credits, can proceed to select
                              } else {
                                Alert.alert(
                                  "Admin Approval Required",
                                  "SMS and WhatsApp messaging requires admin approval and credit purchase.",
                                  [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                      text: "Purchase Pack",
                                      onPress: () =>
                                        router.push("/(billing)/billingPage"),
                                    },
                                  ],
                                );
                                return;
                              }
                            }

                            if (isDisabled) {
                              Alert.alert(
                                "Platform not connected",
                                `Please connect your ${icon.label} account from Accounts first.`,
                              );
                              return;
                            }
                            setSelected(icon.label as any);
                          }}
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 2,
                            borderColor: visuallyRestricted
                              ? "#9ca3af"
                              : isDisabled
                                ? "#9ca3af"
                                : isSelected
                                  ? icon.color
                                  : "#d1d5db",
                            backgroundColor: isDark ? "#161618" : "#ffffff",
                            opacity: visuallyRestricted
                              ? 0.6
                              : isDisabled
                                ? 0.4
                                : 1,
                          }}
                        >
                          <IconComponent
                            name={icon.name as any}
                            size={28}
                            color={
                              isDark
                                ? "#ffffff"
                                : visuallyRestricted
                                  ? "#9ca3af"
                                  : icon.color
                            }
                          />
                        </TouchableOpacity>
                      </RNView>

                      <ThemedText
                        style={{
                          marginTop: 8,
                          textAlign: "center",
                          fontSize: 14,
                          fontWeight: "bold",
                          opacity: visuallyRestricted ? 0.6 : 1,
                        }}
                      >
                        {icon.label}
                      </ThemedText>
                    </ThemedView>
                  );
                })}
            </ThemedView>
          </>
        )}

        {hasDisconnectedPlatform && (
          <ThemedView style={{
            backgroundColor: isDark ? "#1f2937" : "#fef3c7",
            padding: 12,
            borderRadius: 12,
            marginBottom: 12,
            marginTop: -20,
            flexDirection: "row",
            alignItems: "center",
          }}>
            <Ionicons name="alert-circle-outline" size={20} style={{ color: isDark ? "#facc15" : "#b45309", }} />
            <ThemedText style={{ flex: 1, marginLeft: 8, color: isDark ? "#fde68a" : "#000" }}>{bannerMessage}</ThemedText>
            <TouchableOpacity onPress={() => router.push("/(accounts)/accounts")}>
              <ThemedText style={{ color: isDark ? "#facc15" : "#b45309", fontWeight: "bold" }}>Connect</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {!selected && !loadingConnections && !loadingPost && (
          <ThemedView
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 20,
              backgroundColor: isDark ? "#161618" : "#f3f4f6",
            }}
          >
            <ThemedView
              style={{
                padding: 18,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: isDark ? "#161618" : "#ecfeff",
                borderWidth: 1,
                borderColor: isDark ? "#1f2937" : "#67e8f9",
                maxWidth: 320,
                width: "100%",
              }}
            >
              <Ionicons
                name="flash-outline"
                size={28}
                color={isDark ? "#22d3ee" : "#0891b2"}
                style={{ marginBottom: 8 }}
              />

              <ThemedText style={{ fontSize: 16, fontWeight: "700", textAlign: "center" }}>
                Choose a platform to create your post
              </ThemedText>

              <ThemedText
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  textAlign: "center",
                  color: isDark ? "#9ca3af" : "#164e63",
                }}
              >
                We’ll tailor the content and preview for the platform you choose
              </ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {selected && !isEditMode && connectedPlatforms[selected] === false ? (
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <ThemedView
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 24,
                backgroundColor: isDark ? "#161618" : "#f3f4f6",
              }}
            >
              <ThemedView
                style={{
                  width: "100%",
                  maxWidth: 360,
                  padding: 24,
                  borderRadius: 18,
                  backgroundColor: isDark ? "#1f1f22" : "#ffffff",
                  shadowColor: "#000",
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 6,
                  alignItems: "center",
                }}
              >
                <RNView
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: isDark ? "#262626" : "#f3f4f6",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={36}
                    color={isDark ? "#f87171" : "#dc2626"}
                  />
                </RNView>

                <ThemedText
                  style={{
                    textAlign: "center",
                    fontSize: 17,
                    fontWeight: "bold",
                    marginBottom: 6,
                  }}
                >
                  Platform Disconnected
                </ThemedText>

                <ThemedText
                  style={{
                    textAlign: "center",
                    fontSize: 14,
                    lineHeight: 20,
                    color: isDark ? "#d1d5db" : "#4b5563",
                  }}
                >
                  This platform is currently disconnected.
                  Please connect it from Accounts to continue.
                </ThemedText>

                <TouchableOpacity
                  style={{
                    marginTop: 18,
                    width: "100%",
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: "#10b981",
                  }}
                  onPress={() => {
                    router.push("/(accounts)/accounts");
                  }}
                >
                  <ThemedText
                    style={{
                      textAlign: "center",
                      color: "#ffffff",
                      fontWeight: "bold",
                      fontSize: 14,
                    }}
                  >
                    Go to Accounts
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </ScrollView>
        ) : loadingConnections || loadingPost ? (
          <CampaignPostFormSkeleton />
        ) : selected ? (
          <ThemedView style={{ marginTop: 0, marginBottom: 5 }}>
            <CampaignPostForm
              key={selected}
              platform={selected}
              campaignId={campaignIdStr.toString()}
              existingPost={existingPost}
              campaignStartDate={campaignStartDate.toISOString()}
              campaignEndDate={campaignEndDate ? campaignEndDate.toISOString() : undefined}
              onClose={() => {
                setSelected(null);
                setExistingPost(null);
              }}
            />
          </ThemedView>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
