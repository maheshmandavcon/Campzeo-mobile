import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  Alert,
  Clipboard,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Toast from "react-native-toast-message";

// Platform colors & icons
const platformIcons: Record<
  string,
  { Icon: any; color: string; name: string }
> = {
  WHATSAPP: { Icon: Ionicons, name: "logo-whatsapp", color: "#25D366" },
  INSTAGRAM: { Icon: FontAwesome, name: "instagram", color: "#C13584" },
  FACEBOOK: { Icon: FontAwesome, name: "facebook-square", color: "#1877F2" },
  YOUTUBE: { Icon: FontAwesome, name: "youtube-play", color: "#FF0000" },
  LINKEDIN: { Icon: FontAwesome, name: "linkedin-square", color: "#0A66C2" },
  PINTEREST: { Icon: FontAwesome, name: "pinterest", color: "#E60023" },
  EMAIL: { Icon: Ionicons, name: "mail", color: "#F59E0B" },
  SMS: { Icon: Ionicons, name: "chatbubble-ellipses-outline", color: "#10B981" },
};

// Post status configurations
const statusConfig: Record<
  string,
  {
    bg: string;
    text: string;
    darkBg: string;
    darkText: string;
    icon: string;
    color: string;
  }
> = {
  SENT: {
    bg: "#dcfce7",
    text: "#15803d",
    darkBg: "rgba(34, 197, 94, 0.15)",
    darkText: "#4ade80",
    icon: "paper-plane",
    color: "#22c55e",
  },
  SCHEDULED: {
    bg: "#dbeafe",
    text: "#1d4ed8",
    darkBg: "rgba(59, 130, 246, 0.15)",
    darkText: "#60a5fa",
    icon: "alarm-outline",
    color: "#3b82f6",
  },
  PENDING: {
    bg: "#fef3c7",
    text: "#b45309",
    darkBg: "rgba(245, 158, 11, 0.15)",
    darkText: "#fbbf24",
    icon: "hourglass-outline",
    color: "#fbbf24",
  },
  FAILED: {
    bg: "#fee2e2",
    text: "#b91c1c",
    darkBg: "rgba(239, 68, 68, 0.15)",
    darkText: "#f87171",
    icon: "alert-circle-outline",
    color: "#ef4444",
  },
};

interface PostDetailsModalProps {
  visible: boolean;
  post: any | null;
  onClose: () => void;
  onShare?: (postId: number) => void;
  onEdit?: (postId: number) => void;
  onDelete?: (postId: number) => void;
}

// PREMIUM CUSTOM AUDIO PLAYER COMPONENT (WEBVIEW BACKED)
function PremiumAudioPlayer({ url, isDark }: { url: string; isDark: boolean }) {
  return (
    <View
      style={{
        height: 60,
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: isDark ? "#2c2c2e" : "#f1f5f9",
        borderWidth: 1,
        borderColor: isDark ? "#3c3c3e" : "#e2e8f0",
        marginBottom: 8,
      }}
    >
      <WebView
        source={{
          html: `
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>
                  html, body {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    background: ${isDark ? "#2c2c2e" : "#f1f5f9"};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                  }
                  audio {
                    width: 96%;
                    height: 40px;
                  }
                </style>
              </head>
              <body>
                <audio src="${url}" controls />
              </body>
            </html>
          `,
        }}
        style={{
          flex: 1,
          backgroundColor: isDark ? "#2c2c2e" : "#f1f5f9",
        }}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

// PREMIUM CUSTOM VIDEO CARD COMPONENT (WEBVIEW BACKED)
function PremiumVideoPlayer({ url, isDark }: { url: string; isDark: boolean }) {
  return (
    <View style={styles.videoPlayerWrapper}>
      <WebView
        source={{
          html: `
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>
                  html, body {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    background: ${isDark ? "#000000" : "#ffffff"};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                  }
                  video {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                  }
                </style>
              </head>
              <body>
                <video
                  src="${url}"
                  controls
                  playsinline
                />
              </body>
            </html>
          `,
        }}
        style={{
          flex: 1,
          backgroundColor: isDark ? "#000000" : "#ffffff",
        }}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

export default function PostDetailsModal({
  visible,
  post,
  onClose,
  onShare,
  onEdit,
  onDelete,
}: PostDetailsModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!visible || !post) return null;

  // Detect post status
  const getPostStatus = (item: any): "SENT" | "SCHEDULED" | "PENDING" | "FAILED" => {
    if (item.failureReason) return "FAILED";
    if (item.isPostSent === true || item.publishedDate) return "SENT";

    if (item.scheduledPostTime && !item.isPostSent) {
      const scheduled = new Date(item.scheduledPostTime);
      if (scheduled > new Date()) return "SCHEDULED";
    }

    return "PENDING";
  };

  const status = getPostStatus(post);
  const config = statusConfig[status];
  const platform = platformIcons[post.type];

  // Quick action check
  const canDelete = status !== "SENT";
  const canEdit = status !== "SENT";
  const canShare = status !== "SENT";

  // Merge mediaUrls & videoUrl
  const allMedia: string[] = [];
  let parsedMediaUrls = post.mediaUrls;
  if (typeof post.mediaUrls === "string" && post.mediaUrls.trim().length > 0) {
    try {
      parsedMediaUrls = JSON.parse(post.mediaUrls);
    } catch (e) {
      console.warn("Failed to parse mediaUrls string in modal:", e);
    }
  }

  if (parsedMediaUrls && Array.isArray(parsedMediaUrls)) {
    parsedMediaUrls.forEach((url: string) => {
      if (url && typeof url === "string" && !allMedia.includes(url)) {
        allMedia.push(url);
      }
    });
  }
  if (post.videoUrl && typeof post.videoUrl === "string" && !allMedia.includes(post.videoUrl)) {
    allMedia.push(post.videoUrl);
  }

  // Detect type (audio, video, image)
  const getMediaType = (url: string): "image" | "video" | "audio" => {
    const cleanUrl = url.toLowerCase().split("?")[0];
    if (cleanUrl.match(/\.(mp3|wav|m4a|aac|ogg|flac)$/i) || url.includes("audio")) {
      return "audio";
    }
    if (
      cleanUrl.match(/\.(mp4|mov|webm|avi|mkv|3gp|m4v)$/i) ||
      url.includes("video") ||
      (url.includes("stable-horde") && post.videoUrl === url)
    ) {
      return "video";
    }
    return "image";
  };

  // Format date using device local timezone (fixes UTC display issue in Hermes)
  const formatLocalDateTime = (dateString?: string | null): string => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleCopyToClipboard = (text: string) => {
    Clipboard.setString(text);
    Toast.show({
      type: "success",
      text1: "Copied",
      text2: "Content copied to clipboard successfully!"
    });
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
          {/* HEADER */}
          <View style={[styles.header, isDark && styles.headerDark]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {platform && (
                <View
                  style={[
                    styles.platformBadge,
                    { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : platform.color + "1A" },
                  ]}
                >
                  <platform.Icon
                    name={platform.name}
                    size={18}
                    color={platform.color}
                  />
                  <ThemedText style={[styles.platformText, { color: platform.color }]}>
                    {post.type}
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Close Button */}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={isDark ? "#a1a1aa" : "#4b5563"} />
            </TouchableOpacity>
          </View>

          {/* SCROLLABLE BODY */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Subject/Title */}
            {post.subject ? (
              <View style={styles.subjectBox}>
                <View style={styles.subjectHeader}>
                  <ThemedText style={styles.subjectTitle}>Subject</ThemedText>
                  <TouchableOpacity
                    onPress={() => handleCopyToClipboard(post.subject)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="copy-outline" size={16} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
                <ThemedText style={styles.subjectText}>{post.subject}</ThemedText>
              </View>
            ) : post.type === "SMS" ? null : (
              <View style={styles.subjectBox}>
                <ThemedText style={[styles.subjectText, styles.italicText]}>
                  No subject available
                </ThemedText>
              </View>
            )}

            {/* Status Pill & Schedule Time Box */}
            <View style={[styles.metaContainer, isDark && styles.metaContainerDark]}>
              <View style={styles.metaRow}>
                <ThemedText style={styles.metaLabel}>Status</ThemedText>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isDark ? config.darkBg : config.bg,
                      borderColor: config.color,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Ionicons name={config.icon as any} size={12} color={config.color} />
                  <ThemedText style={[styles.statusText, { color: config.color }]}>
                    {status}
                  </ThemedText>
                </View>
              </View>

              {/* Scheduled Time — always show if it exists */}
              {post.scheduledPostTime && (
                <View style={styles.metaRow}>
                  <ThemedText style={styles.metaLabel}>Scheduled Time</ThemedText>
                  <ThemedText style={styles.metaValue}>
                    {new Date(post.scheduledPostTime).toLocaleString()}
                  </ThemedText>
                </View>
              )}

              {/* No schedule and not yet sent */}
              {!post.scheduledPostTime && status !== "SENT" && (
                <View style={styles.metaRow}>
                  <ThemedText style={styles.metaLabel}>Scheduled Time</ThemedText>
                  <ThemedText style={[styles.metaValue, { color: "#94a3b8" }]}>Not Scheduled</ThemedText>
                </View>
              )}

              {/* Sent Time — only show when post is actually sent */}
              {status === "SENT" && (
                <View style={styles.metaRow}>
                  <ThemedText style={styles.metaLabel}>Sent Time</ThemedText>
                  <ThemedText style={[styles.metaValue, { color: "#22c55e" }]}>
                    {post.publishedDate
                      ? new Date(post.publishedDate).toLocaleString()
                      : post.createdDate
                        ? new Date(post.createdDate).toLocaleString()
                        : "Unknown"}
                  </ThemedText>
                </View>
              )}
            </View>

            {post.failureReason && (
              <View style={styles.failureBox}>
                <View style={styles.failureHeader}>
                  <Ionicons name="warning" size={18} color="#ef4444" />
                  <ThemedText style={styles.failureTitle}>Post Failure Reason</ThemedText>
                </View>
                <ThemedText style={styles.failureText}>{post.failureReason}</ThemedText>
              </View>
            )}

            <View style={styles.messageBox}>
              <View style={styles.subjectHeader}>
                <ThemedText style={styles.sectionTitle}>Message Content</ThemedText>
                {post.message && (
                  <TouchableOpacity
                    onPress={() => handleCopyToClipboard(post.message)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="copy-outline" size={16} color="#3b82f6" />
                  </TouchableOpacity>
                )}
              </View>
              {post.message ? (
                <ThemedText style={styles.messageText} selectable={true}>
                  {post.message}
                </ThemedText>
              ) : (
                <ThemedText style={[styles.messageText, styles.italicText]}>
                  No message description available
                </ThemedText>
              )}
            </View>

            {/* RICH MEDIA ITEMS PREVIEW GALLERY */}
            {allMedia.length > 0 && (
              <View style={styles.mediaSection}>
                <ThemedText style={styles.sectionTitle}>Rich Media Attachments</ThemedText>
                <View style={styles.mediaContainer}>
                  {allMedia.map((url, idx) => {
                    const mediaType = getMediaType(url);

                    if (mediaType === "audio") {
                      return (
                        <PremiumAudioPlayer key={idx} url={url} isDark={isDark} />
                      );
                    }

                    if (mediaType === "video") {
                      return (
                        <PremiumVideoPlayer key={idx} url={url} isDark={isDark} />
                      );
                    }

                    // Defaults to image
                    return (
                      <View key={idx} style={styles.imageWrapper}>
                        <Image
                          source={{ uri: url }}
                          style={styles.imagePreview}
                          resizeMode="cover"
                        />
                        <View style={styles.imageOverlayBadge}>
                          <Ionicons name="image-outline" size={14} color="#fff" />
                          <ThemedText style={styles.imageOverlayText}>IMAGE</ThemedText>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* ACTION BUTTON FOOTER */}
          <View style={[styles.footer, isDark && styles.footerDark]}>
            {status === "SENT" && (
              <TouchableOpacity
                onPress={onClose}
                style={[styles.actionBtn, styles.cancelBtn]}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.cancelBtnText}>Close</ThemedText>
              </TouchableOpacity>
            )}

            {status !== "SENT" && (
              <View style={{ flexDirection: "row", flex: 1, gap: 8 }}>
                {canShare && onShare && (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      onShare(post.id);
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.actionBtn,
                      styles.shareBtn,
                      { flex: 1 }
                    ]}
                  >
                    <Ionicons name="share-social-outline" size={18} color="#fff" />
                    <ThemedText style={styles.btnText}>Share</ThemedText>
                  </TouchableOpacity>
                )}

                {canEdit && onEdit && (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      onEdit(post.id);
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.actionBtn,
                      styles.editBtn,
                      { flex: 1 }
                    ]}
                  >
                    <Ionicons name="create-outline" size={18} color="#fff" />
                    <ThemedText style={styles.btnText}>Edit</ThemedText>
                  </TouchableOpacity>
                )}

                {canDelete && onDelete && (
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      onDelete(post.id);
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.actionBtn,
                      styles.deleteBtn,
                      { flex: 1 }
                    ]}
                  >
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                    <ThemedText style={styles.btnText}>Delete</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 500,
    height: "85%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalContentDark: {
    backgroundColor: "#1c1c1e",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerDark: {
    borderBottomColor: "#2c2c2e",
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  platformText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 50,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  subjectBox: {
    gap: 4,
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subjectTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  subjectText: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 24,
  },
  italicText: {
    fontStyle: "italic",
    color: "#64748b",
  },
  metaContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  metaContainerDark: {
    backgroundColor: "#2c2c2e",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  failureBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  failureHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  failureTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#991b1b",
  },
  failureText: {
    fontSize: 13,
    color: "#b91c1c",
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 6,
  },
  messageBox: {
    gap: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
  },
  mediaSection: {
    gap: 8,
  },
  mediaContainer: {
    gap: 12,
  },
  imageWrapper: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imageOverlayBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  imageOverlayText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  // Premium custom audio player styles
  audioContainer: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  audioContainerDark: {
    backgroundColor: "#2c2c2e",
    borderColor: "#3a3a3c",
  },
  audioPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  audioProgressBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
    width: "100%",
  },
  audioProgressBgDark: {
    backgroundColor: "#48484a",
  },
  audioProgressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
  },
  // Premium custom video player styles
  videoPlayerWrapper: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
    position: "relative",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  playIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(59, 130, 246, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  // Footer & Buttons
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  footerDark: {
    borderTopColor: "#2c2c2e",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  cancelBtn: {
    backgroundColor: "#f3f4f6",
  },
  cancelBtnText: {
    color: "#4b5563",
    fontWeight: "700",
    fontSize: 14,
  },
  editBtn: {
    backgroundColor: "#10b981",
  },
  shareBtn: {
    backgroundColor: "#3b82f6",
  },
  deleteBtn: {
    backgroundColor: "#ef4444",
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  disabledBtn: {
    opacity: 0.4,
  },
});
