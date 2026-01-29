import {
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

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
}

export default function ContactCard({
  record,
  onEdit,
  onDelete,
  onCopy,
  onToggleShow,
}: RecordCardProps) {
  const [modalVisible, setModalVisible] = React.useState(false);

  const isDark = useColorScheme() === "dark";
  const iconColor = isDark ? "#ffffff" : "#000000";

  return (
    <ThemedView
      style={{
        backgroundColor: isDark ? "#161618" : "white",
        borderWidth: isDark ? 1 : 1,
        borderColor: isDark ? "#ffffff" : "#e5e7eb",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      {/* Name + Icons */}
      <ThemedView
        style={{ backgroundColor: isDark ? "transparent" : undefined }}
        className="flex-row justify-between items-center"
      >
        <Text
          style={{ color: isDark ? "#ffffff" : "#111827" }}
          className="font-bold text-lg"
        >
          {record.name}
        </Text>

        <ThemedView
          style={{ backgroundColor: isDark ? "transparent" : undefined }}
          className="flex-row"
        >
          <TouchableOpacity onPress={() => onEdit(record)} className="mx-1">
            <Ionicons name="create-outline" size={22} color="#10b981" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onDelete(record)} className="mx-1">
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => onCopy(record)} className="mx-1">
            <Ionicons name="copy-outline" size={22} color="#3b82f6" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onToggleShow(record)}
            className="mx-1"
          >
            <Ionicons
              name={record.show ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={isDark ? "#9ca3af" : "#6b7280"}
            />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Details */}
      {record.show && (
        <ThemedView
          style={{ backgroundColor: isDark ? "transparent" : undefined }}
          className="mt-3 space-y-2"
        >
          {[
            { label: "Email", value: record.email, icon: "mail-outline" },
            { label: "Mobile", value: record.mobile, icon: "call-outline" },
            { label: "WhatsApp", value: record.whatsapp, icon: "logo-whatsapp" },
          ].map((item, index) => (
            <ThemedView
              key={index}
              style={{ backgroundColor: isDark ? "transparent" : undefined }}
              className="flex-row justify-between items-center"
            >
              <ThemedView
                style={{ backgroundColor: isDark ? "transparent" : undefined }}
                className="flex-row items-center gap-2"
              >
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={iconColor}
                />
                <Text
                  style={{ color: isDark ? "#d1d5db" : "#374151" }}
                  className="text-base font-bold"
                >
                  {item.label}
                </Text>
              </ThemedView>

              {isDark ? (
                <Text className="text-white text-sm">{item.value}</Text>
              ) : (
                <ThemedView className="bg-gray-100 px-2 py-0.5 rounded-full">
                  <Text className="text-base text-gray-800">
                    {item.value}
                  </Text>
                </ThemedView>
              )}
            </ThemedView>
          ))}

          {/* Campaign Count */}
          <ThemedView
            style={{ backgroundColor: isDark ? "transparent" : undefined }}
            className="flex-row justify-between items-center"
          >
            <ThemedView
              style={{ backgroundColor: isDark ? "transparent" : undefined }}
              className="flex-row items-center gap-2"
            >
              <Ionicons
                name="megaphone-outline"
                size={18}
                color={iconColor}
              />
              <Text
                style={{ color: isDark ? "#d1d5db" : "#374151" }}
                className="text-base font-bold"
              >
                Campaigns
              </Text>
            </ThemedView>

            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text
                style={{ color: isDark ? "#ffffff" : "#1f2937" }}
                className="text-base"
              >
                {record.campaigns?.length ?? 0}{" "}
                {record.campaigns?.length === 1 ? "campaign" : "campaigns"}
              </Text>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      )}
    </ThemedView>
  );
}
