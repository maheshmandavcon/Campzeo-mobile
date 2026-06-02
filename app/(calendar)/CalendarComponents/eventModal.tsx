import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Image, ScrollView, useColorScheme } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import {
  HStack,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  View,
} from "@gluestack-ui/themed";
import React from "react";
import {
  formatReadableDate,
  formatReadableTime,
} from "../../../utils/dateHelpers";
import { ThemedText } from "@/components/themed-text";

interface EventModalProps {
  event: any | null;
  isOpen: boolean;
  onClose: () => void;
}

const PLATFORM_CONFIGS: Record<string, { name: string; color: string; icon: string }> = {
  facebook: { name: "Facebook", color: "#1877F2", icon: "logo-facebook" },
  instagram: { name: "Instagram", color: "#E4405F", icon: "logo-instagram" },
  linkedin: { name: "LinkedIn", color: "#0A66C2", icon: "logo-linkedin" },
  youtube: { name: "YouTube", color: "#FF0000", icon: "logo-youtube" },
  pinterest: { name: "Pinterest", color: "#BD081C", icon: "logo-pinterest" },
  whatsapp: { name: "WhatsApp", color: "#25D366", icon: "logo-whatsapp" },
  sms: { name: "SMS", color: "#10B981", icon: "chatbubble-ellipses-outline" },
  email: { name: "Email", color: "#EA4335", icon: "mail-outline" },
};

const EventModal: React.FC<EventModalProps> = ({ event, isOpen, onClose }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!event) return null;

  const isVideoFile = (url: string) => {
    return (
      url?.includes(".mp4") ||
      url?.includes(".mov") ||
      url?.includes(".webm") ||
      url?.includes("#video")
    );
  };

  const platformKey = event.platform?.toLowerCase() || "facebook";
  const config = PLATFORM_CONFIGS[platformKey] || {
    name: event.platform || "Platform",
    color: "#6b7280",
    icon: "document-text-outline",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop />

      <ModalContent
        style={{
          minHeight: "65%",
          width: "92%",
          backgroundColor: isDark ? "#0f172a" : "#ffffff",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: isDark ? "#1e293b" : "#e2e8f0",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 15,
          elevation: 5,
        }}
      >
        {/* HEADER */}
        <ModalHeader
          style={{
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "#1e293b" : "#f1f5f9",
            paddingVertical: 16,
            paddingHorizontal: 20,
            justifyContent: "space-between",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <HStack style={{ alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDark ? "rgba(30, 41, 59, 0.7)" : "#f8fafc",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: isDark ? "#334155" : "#e2e8f0",
              }}
            >
              <Ionicons name={config.icon as any} size={20} color={config.color} />
            </View>
            <Heading
              size="lg"
              style={{
                color: isDark ? "#f1f5f9" : "#020617",
                fontWeight: "700",
              }}
            >
              {config.name}
            </Heading>
          </HStack>
          <ModalCloseButton />
        </ModalHeader>

        <ModalBody
          style={{
            flex: 1,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 8,
          }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 20,
            }}
          >
            <View style={{ gap: 16 }}>
              {/* CAMPAIGN & STATUS */}
              <HStack style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: isDark ? "#94a3b8" : "#64748b",
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Campaign
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: isDark ? "#f1f5f9" : "#020617",
                      lineHeight: 22,
                    }}
                  >
                    {event.campaign || "No Campaign Name"}
                  </Text>
                </View>
                
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 999,
                    backgroundColor: event.isPostSent
                      ? isDark
                        ? "rgba(34,197,94,0.15)"
                        : "#dcfce7"
                      : isDark
                        ? "rgba(251,191,36,0.15)"
                        : "#fef3c7",
                    borderWidth: 1,
                    borderColor: event.isPostSent
                      ? isDark
                        ? "#22c55e"
                        : "#86efac"
                      : isDark
                        ? "#fbbf24"
                        : "#fcd34d",
                  }}
                >
                  <ThemedText
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      letterSpacing: 0.5,
                      color: event.isPostSent
                        ? isDark
                          ? "#4ade80"
                          : "#15803d"
                        : isDark
                          ? "#facc15"
                          : "#b45309",
                    }}
                  >
                    {event.isPostSent ? "SENT" : "SCHEDULED"}
                  </ThemedText>
                </View>
              </HStack>

              {/* SUBJECT (IF NOT SMS) */}
              {event.platform?.toLowerCase() !== "sms" && event.subject && (
                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: isDark ? "#94a3b8" : "#64748b",
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Subject
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: isDark ? "#e2e8f0" : "#334155",
                      lineHeight: 22,
                    }}
                  >
                    {event.subject}
                  </Text>
                </View>
              )}

              {/* DATE & TIME */}
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: isDark ? "#94a3b8" : "#64748b",
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Date
                  </Text>
                  <HStack style={{ alignItems: "center", gap: 6 }}>
                    <Ionicons name="calendar-outline" size={16} color={config.color} />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: isDark ? "#f1f5f9" : "#020617",
                      }}
                    >
                      {formatReadableDate(event.start)}
                    </Text>
                  </HStack>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: isDark ? "#94a3b8" : "#64748b",
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Time
                  </Text>
                  <HStack style={{ alignItems: "center", gap: 6 }}>
                    <Ionicons name="time-outline" size={16} color={config.color} />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: isDark ? "#f1f5f9" : "#020617",
                      }}
                    >
                      {formatReadableTime(event.start)}
                    </Text>
                  </HStack>
                </View>
              </View>

              {/* MEDIA PREVIEW */}
              {event?.mediaUrls && (
                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: isDark ? "#94a3b8" : "#64748b",
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Media Preview
                  </Text>

                  <View
                    style={{
                      width: "100%",
                      height: 200,
                      borderRadius: 12,
                      overflow: "hidden",
                      backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                      borderWidth: 1,
                      borderColor: isDark ? "#334155" : "#e2e8f0",
                    }}
                  >
                    {isVideoFile(event.mediaUrls) ? (
                      <WebView
                        source={{
                          html: `
                            <html>
                              <body style="margin:0;background:black;display:flex;align-items:center;justify-content:center;">
                                <video
                                  src="${event.mediaUrls}"
                                  controls
                                  style="width:100%;height:100%;object-fit:contain;"
                                />
                              </body>
                            </html>
                          `,
                        }}
                        style={{
                          flex: 1,
                          backgroundColor: "black",
                        }}
                        javaScriptEnabled
                        domStorageEnabled
                      />
                    ) : (
                      <Image
                        source={{ uri: event.mediaUrls }}
                        style={{
                          width: "100%",
                          height: "100%",
                        }}
                        resizeMode="cover"
                      />
                    )}
                  </View>
                </View>
              )}

              {/* MESSAGE SECTION */}
              <View
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                  borderWidth: 1,
                  borderColor: isDark ? "#334155" : "#e5e7eb",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: isDark ? "#94a3b8" : "#64748b",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Message
                </Text>

                <Text
                  style={{
                    fontSize: 14,
                    lineHeight: 22,
                    color: isDark ? "#e2e8f0" : "#334155",
                    fontWeight: "500",
                  }}
                >
                  {event.message || "No Message Body"}
                </Text>
              </View>
            </View>
          </ScrollView>
        </ModalBody>

        <ModalFooter
          style={{
            borderTopWidth: 1,
            borderTopColor: isDark ? "#1e293b" : "#f1f5f9",
            paddingVertical: 12,
            paddingHorizontal: 20,
            justifyContent: "flex-end",
          }}
        >
          <Button
            action="secondary"
            onPress={onClose}
            style={{
              backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
              borderRadius: 10,
              paddingHorizontal: 20,
              height: 42,
              borderWidth: 1,
              borderColor: isDark ? "#334155" : "#e2e8f0",
            }}
          >
            <ButtonText
              style={{
                color: isDark ? "#cbd5e1" : "#475569",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              Close
            </ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EventModal;
