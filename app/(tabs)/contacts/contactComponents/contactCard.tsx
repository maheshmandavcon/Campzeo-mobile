import {
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  useColorScheme,
  View,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ThemedView } from "@/components/themed-view";

export interface ContactsRecord {
  id: number;
  name: string;
  email: string;
  mobile: string;
  whatsapp: string;
  show?: boolean;
  campaigns?: { id: number; name: string }[];
}

interface RecordCardProps {
  record: ContactsRecord;
  onEdit: (record: ContactsRecord) => void;
  onDelete: (record: ContactsRecord) => void;
  onCopy: (record: ContactsRecord) => void;
  onToggleShow: (record: ContactsRecord) => void;
  onLongPress?: (record: ContactsRecord) => void;
  onPress?: (record: ContactsRecord) => void;
  isSelected?: boolean;
  isMultiSelectMode?: boolean;
  isDeleting?: boolean;
}

const AVATAR_COLORS = [
  "#2563eb", // Vibrant Blue
  "#059669", // Vibrant Emerald
  "#4f46e5", // Vibrant Indigo
  "#db2777", // Vibrant Pink
  "#d97706", // Vibrant Amber
  "#7c3aed", // Vibrant Purple
  "#dc2626", // Vibrant Red
  "#0891b2", // Vibrant Cyan
];

const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function ContactCard({
  record,
  onEdit,
  onDelete,
  onCopy,
  onToggleShow,
  onLongPress,
  onPress,
  isSelected,
  isMultiSelectMode,
  isDeleting,
}: RecordCardProps) {
  const [modalVisible, setModalVisible] = React.useState(false);
  const isDark = useColorScheme() === "dark";

  const initials = getInitials(record.name);
  const avatarColor = getAvatarColor(record.name);

  // Theme-aware local color tokens
  const COLORS = {
    cardBg: isDark ? "#1e1e24" : "#ffffff",
    cardBorder: isDark ? "#2e2e38" : "#f1f5f9",
    textPrimary: isDark ? "#ffffff" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    tagBg: isDark ? "#111827" : "#f8fafc",
    tagBorder: isDark ? "#374151" : "#e2e8f0",
    divider: isDark ? "#2e2e38" : "#e2e8f0",
    
    // Circular action configurations
    editBg: isDark ? "rgba(16, 185, 129, 0.15)" : "#e6f4ea",
    editIcon: "#10b981",
    deleteBg: isDark ? "rgba(239, 68, 68, 0.15)" : "#fce8e6",
    deleteIcon: "#ef4444",
    copyBg: isDark ? "rgba(59, 130, 246, 0.15)" : "#e8f0fe",
    copyIcon: "#3b82f6",
    eyeBg: isDark ? "rgba(148, 163, 184, 0.15)" : "#f1f5f9",
    eyeIcon: isDark ? "#94a3b8" : "#475569",
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        delayLongPress={300}
        onPress={() => onPress ? onPress(record) : onToggleShow(record)}
        onLongPress={() => onLongPress?.(record)}
        style={[
          styles.card,
          {
            backgroundColor: isSelected 
              ? (isDark ? "rgba(220, 38, 38, 0.15)" : "#fef2f2") 
              : COLORS.cardBg,
            borderColor: isSelected 
              ? "#dc2626" 
              : COLORS.cardBorder,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
      >
      {/* Top Main Section */}
      <View style={styles.cardHeader}>
        {/* Left Side: Avatar + Details */}
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.nameBlock}>
            <Text style={[styles.nameText, { color: COLORS.textPrimary }]} numberOfLines={1}>
              {record.name}
            </Text>
            {record.email ? (
              <Text style={[styles.subText, { color: COLORS.textSecondary }]} numberOfLines={1}>
                {record.email}
              </Text>
            ) : (
              <Text style={[styles.subText, { color: COLORS.textSecondary }]}>No email provided</Text>
            )}
          </View>
        </View>

        {/* Right Side: Action Badges */}
        <View style={styles.actionRow}>
          {!isMultiSelectMode && (
            <>
              <TouchableOpacity
                onPress={() => onEdit(record)}
                style={[styles.circularBtn, { backgroundColor: COLORS.editBg }]}
              >
                <Ionicons name="create-outline" size={18} color={COLORS.editIcon} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onDelete(record)}
                style={[styles.circularBtn, { backgroundColor: COLORS.deleteBg }]}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={COLORS.deleteIcon} />
                ) : (
                  <Ionicons name="trash-outline" size={18} color={COLORS.deleteIcon} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onCopy(record)}
                style={[styles.circularBtn, { backgroundColor: COLORS.copyBg }]}
              >
                <Ionicons name="copy-outline" size={18} color={COLORS.copyIcon} />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={() => onToggleShow(record)}
            style={[styles.circularBtn, { backgroundColor: COLORS.eyeBg }]}
          >
            <Ionicons
              name={record.show ? "chevron-up" : "chevron-down"}
              size={18}
              color={COLORS.eyeIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expanded Sub-Details Block */}
      {record.show && (
        <View style={[styles.detailsBlock, { borderTopColor: COLORS.divider }]}>
          {/* Detail Item Grid */}
          {[
            { label: "Mobile Number", value: record.mobile, icon: "call-outline", iconColor: "#10b981" },
            { label: "WhatsApp Chat", value: record.whatsapp, icon: "logo-whatsapp", iconColor: "#22c55e" },
          ].map((item, index) => (
            <View key={index} style={styles.detailItem}>
              <View style={styles.detailLabelRow}>
                <View style={[styles.iconWrapper, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc" }]}>
                  <Ionicons name={item.icon as any} size={16} color={item.iconColor} />
                </View>
                <Text style={[styles.detailLabel, { color: COLORS.textSecondary }]}>
                  {item.label}
                </Text>
              </View>
              <Text style={[styles.detailValue, { color: COLORS.textPrimary }]}>
                {item.value || "Not Set"}
              </Text>
            </View>
          ))}

          {/* Connected Campaigns Details */}
          <View style={styles.detailItem}>
            <View style={styles.detailLabelRow}>
              <View style={[styles.iconWrapper, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc" }]}>
                <Ionicons name="megaphone-outline" size={16} color="#db2777" />
              </View>
              <Text style={[styles.detailLabel, { color: COLORS.textSecondary }]}>
                Campaign Links
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={[
                styles.campaignBadgeTrigger,
                {
                  backgroundColor: isDark ? "rgba(219,39,119,0.15)" : "#fdf2f8",
                  borderColor: isDark ? "rgba(219,39,119,0.3)" : "#fbcfe8",
                },
              ]}
            >
              <Text style={styles.campaignBadgeText}>
                {record.campaigns?.length ?? 0}{" "}
                {record.campaigns?.length === 1 ? "Campaign" : "Campaigns"}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#db2777" />
            </TouchableOpacity>
          </View>
        </View>
        )}
      </TouchableOpacity>

      {/* Campaigns Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? "#161618" : "#ffffff" }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalBadgeIcon}>
                  <Ionicons name="megaphone" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: COLORS.textPrimary }]}>
                    Linked Campaigns
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: COLORS.textSecondary }]}>
                    Contact: {record.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDark ? "#2a2a30" : "#f1f5f9" }]}
              >
                <Ionicons name="close" size={20} color={isDark ? "#ffffff" : "#475569"} />
              </TouchableOpacity>
            </View>

            {/* Scrollable list */}
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {record.campaigns && record.campaigns.length > 0 ? (
                record.campaigns.map((camp) => (
                  <View
                    key={camp.id}
                    style={[
                      styles.campaignRow,
                      {
                        backgroundColor: isDark ? "#1e1e24" : "#f8fafc",
                        borderColor: isDark ? "#2e2e38" : "#e2e8f0",
                      },
                    ]}
                  >
                    <View style={styles.campaignRowInfo}>
                      <View style={styles.campaignDot} />
                      <Text style={[styles.campaignNameText, { color: COLORS.textPrimary }]}>
                        {camp.name}
                      </Text>
                    </View>
                    <View style={styles.activeTag}>
                      <Text style={styles.activeTagText}>Active</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.modalEmpty}>
                  <View style={[styles.emptyIconBg, { backgroundColor: isDark ? "#1e1e24" : "#f8fafc" }]}>
                    <Ionicons name="folder-open-outline" size={40} color={COLORS.textSecondary} />
                  </View>
                  <Text style={[styles.modalEmptyTitle, { color: COLORS.textPrimary }]}>
                    No campaigns associated
                  </Text>
                  <Text style={[styles.modalEmptySub, { color: COLORS.textSecondary }]}>
                    This contact is currently not linked to any marketing campaigns.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  nameBlock: {
    flex: 1,
  },
  nameText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  subText: {
    fontSize: 13,
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  circularBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsBlock: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  campaignBadgeTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
  },
  campaignBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#db2777",
  },

  // Modal Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "75%",
    minHeight: "45%",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.08)",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalBadgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#db2777",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalScroll: {
    paddingBottom: 20,
  },
  campaignRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  campaignRowInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  campaignDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#db2777",
  },
  campaignNameText: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  activeTag: {
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTagText: {
    color: "#10b981",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  modalEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalEmptySub: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});
