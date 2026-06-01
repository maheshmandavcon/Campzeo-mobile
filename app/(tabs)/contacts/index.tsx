import React, { useState, useCallback, useEffect } from "react";
import {
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
  useColorScheme,
  View,
} from "react-native";
import { Text } from "@gluestack-ui/themed";
import { Ionicons } from "@expo/vector-icons";
import ContactCard, { ContactsRecord } from "./contactComponents/contactCard";
import { router, useFocusEffect } from "expo-router";
import {
  getContactsApi,
  deleteContactApi,
  exportContactsApi,
} from "@/api/contactApi";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeletons";
import { getUser } from "@/api/dashboardApi";

export default function Contacts() {
  const [visibleCount, setVisibleCount] = useState(10);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [records, setRecords] = useState<ContactsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const isDark = useColorScheme() === "dark";

  const DARK_TOPBAR_BG = "#1f2937";
  const DARK_TEXT = "#ffffff";
  const DARK_BORDER = "#ffffff";

  const { getToken } = useAuth();

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error("Authentication token not found");
      const user = await getUser();
      const orgId = user?.organisation?.id;

      const res = await getContactsApi(orgId);

      const contactsArray = res?.contacts ?? [];

      const mapped: ContactsRecord[] = contactsArray.map((item: any) => ({
        id: item.id,
        name: item.contactName,
        email: item.contactEmail,
        mobile: item.contactMobile,
        whatsapp: item.contactWhatsApp,
        show: true,
        campaigns: item.campaigns ?? [],
      }));

      setRecords(mapped);
    } catch (err) {
      console.log("GET CONTACTS ERROR:", err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
    }, [search]),
  );

  const filteredRecords = [...records].sort((a, b) => {
    if (sortOrder === "asc") return a.name.localeCompare(b.name);
    if (sortOrder === "desc") return b.name.localeCompare(a.name);
    return 0;
  });

  const visibleRecords = filteredRecords.slice(0, visibleCount);
  const isAllVisible = visibleCount >= filteredRecords.length;

  const handleEdit = (record: ContactsRecord) => {
    router.push({
      pathname: "/contacts/createContact",
      params: {
        contactId: String(record.id),
        record: JSON.stringify(record),
      },
    });
  };

  const handleCopy = (record: ContactsRecord) => {
    const textToCopy = `
Name: ${record.name}
Email: ${record.email || "-"}
Mobile: ${record.mobile || "-"}
WhatsApp: ${record.whatsapp || "-"}
  `;

    Clipboard.setStringAsync(textToCopy)
      .then(() => {
        Alert.alert("Copied!", "Contact details copied to clipboard.");
      })
      .catch((err) => {
        console.error("Clipboard error:", err);
        Alert.alert("Error", "Failed to copy contact details.");
      });
  };

  const handleDelete = (record: ContactsRecord) => {
    Alert.alert("Delete Contact", `Are you sure you want to delete this contact? This action cannot be undone. Delete ${record.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);

            const token = await getToken();
            if (!token) return;

            const user = await getUser();
            const orgId = user?.organisation?.id;

            await deleteContactApi(orgId, record.id,token);

            setRecords((prev) => prev.filter((r) => r.id !== record.id));
          } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to delete");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleExportAll = async () => {
    try {
      setMenuVisible(false);
      setLoading(true);

      const token = await getToken();
      if (!token) throw new Error("Token missing");

      const arrayBuffer = await exportContactsApi();
      const binary = new Uint8Array(arrayBuffer);
      let binaryString = "";
      binary.forEach((b) => (binaryString += String.fromCharCode(b)));
      const base64Data = Buffer.from(binaryString, "binary").toString("base64");

      const fileUri = `${FileSystem.cacheDirectory}contacts_${Date.now()}.csv`;

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
    } catch (e: any) {
      Alert.alert("Export Failed", e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleLoadToggle = () => {
    isAllVisible ? setVisibleCount(5) : setVisibleCount(filteredRecords.length);
  };

  const toggleShow = (record: ContactsRecord) => {
    record.show = !record.show;
    setRecords([...records]);
  };

  type ListItem = ContactsRecord | { id: string; skeleton: true };

  const skeletonData: ListItem[] = Array.from({ length: 6 }, (_, i) => ({
    id: `skeleton-${i}`,
    skeleton: true,
  }));

  const ContactSkeletonCard = () => (
    <ThemedView className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-200">
      {/* NAME + ACTIONS */}
      <View className="flex-row items-center justify-between mb-3">
        <ShimmerSkeleton height={16} width="45%" />

        <View className="flex-row gap-2" style={{ marginLeft: 8 }}>
          <ShimmerSkeleton height={24} width={24} borderRadius={12} />
          <ShimmerSkeleton height={24} width={24} borderRadius={12} />
          <ShimmerSkeleton height={24} width={24} borderRadius={12} />
          <ShimmerSkeleton height={24} width={24} borderRadius={12} />
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-2">
        <ShimmerSkeleton height={12} width="20%" />
        <ShimmerSkeleton height={12} width="55%" />
      </View>

      <View className="flex-row justify-between items-center mb-2">
        <ShimmerSkeleton height={12} width="20%" />
        <ShimmerSkeleton height={12} width="45%" />
      </View>

      <View className="flex-row justify-between items-center mb-2">
        <ShimmerSkeleton height={12} width="25%" />
        <ShimmerSkeleton height={12} width="45%" />
      </View>

      <View className="flex-row justify-between items-center mt-2">
        <ShimmerSkeleton height={12} width="30%" />
        <ShimmerSkeleton height={14} width={40} borderRadius={6} />
      </View>
    </ThemedView>
  );

  const listData = loading ? skeletonData : visibleRecords;

  return (
    <ThemedView className="flex-1">
      <ThemedView
        style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
        className="flex-1 p-4"
      >
        <View
          className="flex-row items-center mb-4"
          style={{ backgroundColor: "transparent" }}
        >
          <TouchableOpacity
            onPress={() => router.push("/contacts/createContact")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 9999,
              backgroundColor: isDark ? "#161618" : "#bfdbfe",
              borderWidth: 1,
              borderColor: isDark ? DARK_BORDER : "transparent",
              marginRight: 8,
            }}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={isDark ? DARK_TEXT : "#0284c7"}
            />
            <Text
              style={{
                marginLeft: 8,
                fontWeight: "600",
                color: isDark ? DARK_TEXT : "#0284c7",
              }}
            >
              New
            </Text>
          </TouchableOpacity>

          <TextInput
            value={search}
            onChangeText={(v) => {
              setSearch(v);
              setVisibleCount(5);
            }}
            placeholder="Search contacts..."
            placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
            style={{
              flex: 1,
              backgroundColor: isDark ? "#161618" : "#ffffff",
              color: isDark ? "#e5e7eb" : "#000000",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: isDark ? "#fff" : "#d1d5db",
            }}
          />

          <TouchableOpacity
            onPress={() => setMenuVisible(!menuVisible)}
            className=""
            style={{
              padding: 8,
              borderRadius: 9999,
              borderColor: isDark ? DARK_BORDER : "transparent",
            }}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={isDark ? DARK_TEXT : "#000000"}
            />
          </TouchableOpacity>
        </View>

        {menuVisible && (
          <ThemedView
            style={{
              backgroundColor: isDark ? "#161618" : "#ffffff",
              borderColor: isDark ? DARK_BORDER : "#d1d5db",
            }}
            className="absolute right-4 top-20 rounded-xl border z-20"
          >
            <TouchableOpacity
              onPress={handleExportAll}
              className="flex-row items-center px-4 py-3"
            >
              <Ionicons
                name="download-outline"
                size={18}
                color={isDark ? "#ffffff" : "#111827"}
              />
              <ThemedText className="ml-3 font-medium text-white">
                Export All
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleSortOrder}
              className="flex-row items-center px-4 py-3"
            >
              <Ionicons
                name="funnel-outline"
                size={18}
                color={isDark ? "#ffffff" : "#111827"}
              />
              <ThemedText className="ml-3 font-medium text-white">
                {sortOrder === "asc"
                  ? "Sort Z → A"
                  : sortOrder === "desc"
                    ? "Sort A → Z"
                    : "Sort"}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        <FlatList<ListItem>
          data={listData}
          keyExtractor={(item) =>
            "skeleton" in item ? item.id : item.id.toString()
          }
          renderItem={({ item }) =>
            "skeleton" in item ? (
              <ContactSkeletonCard />
            ) : (
              <ContactCard
                record={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCopy={handleCopy}
                onToggleShow={toggleShow}
              />
            )
          }
          ListEmptyComponent={
            !loading ? (
              <ThemedView
                className="flex-1 justify-center items-center"
                style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
              >
                <ThemedText
                  style={{ fontSize: 18, fontWeight: "bold", marginBottom: 6 }}
                >
                  No contacts yet
                </ThemedText>

                <ThemedText
                  style={{
                    fontSize: 14,
                    textAlign: "center",
                    paddingHorizontal: 24,
                    opacity: 0.7,
                  }}
                >
                  Tap + New to add your first contact.
                </ThemedText>
              </ThemedView>
            ) : null
          }
          contentContainerStyle={{
            flexGrow: listData.length === 0 ? 1 : undefined,
          }}
        />
      </ThemedView>
    </ThemedView>
  );
}
