import { View, Text, TouchableOpacity, Alert, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

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

  const handleDelete = () => {
    onDelete(record);
  };

  return (
    <View
      style={{
        backgroundColor: "white",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      {/* Name + Icons */}
      <View className="flex-row justify-between items-center">
        <Text className="font-bold text-lg text-gray-900">
          {record.name}
        </Text>

        <View className="flex-row">
          <TouchableOpacity onPress={() => onEdit(record)} className="mx-1">
            <Ionicons name="create-outline" size={22} color="#10b981" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDelete} className="mx-1">
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
              color="#6b7280"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Details */}
      {record.show && (
        <View className="mt-3 space-y-2">
          {[
            { label: "Email", value: record.email, icon: "mail-outline", color: "blue-500" },
            { label: "Mobile", value: record.mobile, icon: "call-outline", color: "gray-500" },
            { label: "WhatsApp", value: record.whatsapp, icon: "logo-whatsapp", color: "green-500" },
          ].map((item, index) => (
            <View key={index} className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-2">
                <Ionicons name={item.icon as any} size={18} color={`#${item.color}`} />
                <Text className="text-base font-bold text-gray-700">{item.label}</Text>
              </View>
              <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                <Text className="text-base text-gray-800">{item.value}</Text>
              </View>
            </View>
          ))}

          {/* Campaign Count */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <Ionicons name="megaphone-outline" size={18} color="green-500" />
              <Text className="text-base font-bold text-gray-700">Campaigns</Text>
            </View>

            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="bg-gray-100 px-2 py-0.5 rounded-full"
            >
              <Text className="text-gray-800 text-base">
                {record.campaigns?.length ?? 0} {record.campaigns?.length === 1 ? "campaign" : "campaigns"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Modal */}
          <Modal
            visible={modalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
          >
            <View className="flex-1 justify-center items-center bg-black/50 p-4">
              <View className="bg-white w-full max-h-80 p-4 rounded-lg">
                <Text className="font-bold text-lg mb-3">Campaigns</Text>
                <ScrollView>
                  {record.campaigns && record.campaigns.length > 0 ? (
                    record.campaigns.map((c) => (
                      <Text key={c.id} className="text-gray-800 text-base py-1">
                        {c.name}
                      </Text>
                    ))
                  ) : (
                    <Text className="text-gray-500">No campaigns</Text>
                  )}
                </ScrollView>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={{
                    backgroundColor: "#dc2626", // red background
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                >
                  <Text className="text-white font-semibold text-base">Close</Text>
                </TouchableOpacity>

              </View>
            </View>
          </Modal>
        </View>
      )}
    </View>
  );
}
