import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Image, useColorScheme } from "react-native";
import { WebView } from "react-native-webview";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  View,
} from "@gluestack-ui/themed";
import React, { useEffect } from "react";
import {
  formatReadableDate,
  formatReadableTime,
} from "../../../utils/dateHelpers";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

interface EventModalProps {
  event: any | null;
  isOpen: boolean;
  onClose: () => void;
}

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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop />

      <ModalContent>
        <ModalHeader>
          <Heading size="lg">{event.platform}</Heading>
          <ModalCloseButton />
        </ModalHeader>

        <ModalBody style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          {/* INFO GRID */}
          <View style={{ gap: 12 }}>
            {/* CAMPAIGN */}
            <View>
              <Text
                style={{
                  fontSize: 13,
                  color: "#64748b",
                  marginBottom: 2,
                }}
              >
                Campaign
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#020617",
                  lineHeight: 20,
                }}
              >
                {event.campaign}
              </Text>
            </View>

            {/* SUBJECT */}
            {event.platform?.toLowerCase() !== "sms" && (
              <View>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    marginBottom: 2,
                    lineHeight: 20,
                  }}
                >
                  Subject
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: "#020617",
                    lineHeight: 20,
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
                    fontSize: 13,
                    color: "#64748b",
                    marginBottom: 2,
                  }}
                >
                  Date
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: "#020617",
                    lineHeight: 20,
                  }}
                >
                  {formatReadableDate(event.start)}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    marginBottom: 2,
                  }}
                >
                  Time
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "500",
                    color: "#020617",
                    lineHeight: 20,
                  }}
                >
                  {formatReadableTime(event.start)}
                </Text>
              </View>
            </View>
          </View>
          {/* Media Section */}
          {/* MEDIA PREVIEW */}
          {event?.mediaUrls && (
            <View
              style={{
                marginTop: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#64748b",
                  marginBottom: 8,
                }}
              >
                Media Preview
              </Text>

              <View
                style={{
                  width: "100%",
                  height: 240,
                  borderRadius: 14,
                  overflow: "hidden",
                  backgroundColor: "#f1f5f9",
                }}
              >
                {isVideoFile(event.mediaUrls) ? (
                  <WebView
                    source={{
                      html: `
              <html>
                <body style="margin:0;background:black;">
                  <video
                    src="${event.mediaUrls}"
                    controls
                    style="width:100%;height:100%;object-fit:cover;"
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
              marginVertical: 20,
              padding: 14,
              borderRadius: 12,
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "#64748b",
                marginBottom: 6,
              }}
            >
              Message
            </Text>

            <Text
              style={{
                fontSize: 15,
                lineHeight: 22,
                color: "#020617",
              }}
            >
              {event.message}
            </Text>
          </View>

          {/* STATUS SECTION */}
          <View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "#64748b",
                marginBottom: 6,
              }}
            >
              Status
            </Text>
            <View
              style={{
                alignSelf: "flex-start",
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
                  fontSize: 12,
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
          </View>
        </ModalBody>

        <ModalFooter>
          <Button
            action="primary"
            onPress={onClose}
            style={{
              marginTop: 16,
              backgroundColor: "#9ca3af",
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <ButtonText
              style={{
                color: "#fff",
                fontSize: 15,
                fontWeight: "600",
                letterSpacing: 0.5,
                lineHeight: 15,
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
