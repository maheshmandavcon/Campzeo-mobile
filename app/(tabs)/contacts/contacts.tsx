import React, { useState, useCallback, useEffect } from "react";
import {
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
  useColorScheme,
} from "react-native";
import { Text } from "@gluestack-ui/themed";
import { Ionicons } from "@expo/vector-icons";
import ContactCard, { ContactsRecord } from "./contactComponents/contactCard";
import { router, useLocalSearchParams } from "expo-router";
import {
  getContactsApi,
  deleteContactApi,
  exportContactsApi,
} from "@/api/contact/contactApi";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export default function Contacts() {
  const [visibleCount, setVisibleCount] = useState(10);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [records, setRecords] = useState<ContactsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const isDark = useColorScheme() === "dark";

  const DARK_TOPBAR_BG = "#1f2937"; // gray-800
  const DARK_SEARCH_BG = "#374151"; // gray-700
  const DARK_BUTTON_BG = "#2563eb"; // blue-600
  const DARK_TEXT = "#ffffff";
  const DARK_BORDER = "#ffffff";

  const { getToken } = useAuth();

  /* ================= FETCH ================= */
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error("Authentication token not found");

      const res = await getContactsApi(token, 1, 50, search);
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
    }, [search])
  );

  const filteredRecords = [...records].sort((a, b) => {
    if (sortOrder === "asc") return a.name.localeCompare(b.name);
    if (sortOrder === "desc") return b.name.localeCompare(a.name);
    return 0;
  });

  const visibleRecords = filteredRecords.slice(0, visibleCount);
  const isAllVisible = visibleCount >= filteredRecords.length;

  /* ================= ACTIONS ================= */
  const handleEdit = (record: ContactsRecord) => {
    router.push({
      pathname: "/contacts/createContact",
      params: {
        contactId: String(record.id),
        record: JSON.stringify(record),
      },
    });
  };

  const handleDelete = (record: ContactsRecord) => {
    Alert.alert("Delete Contact", `Delete ${record.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const token = await getToken();
            if (!token) return;

            await deleteContactApi([record.id], token);
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

      const arrayBuffer = await exportContactsApi(token);
      const binary = new Uint8Array(arrayBuffer);
      let binaryString = "";
      binary.forEach((b) => (binaryString += String.fromCharCode(b)));
      const base64Data = btoa(binaryString);

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
    isAllVisible
      ? setVisibleCount(5)
      : setVisibleCount(filteredRecords.length);
  };

  const toggleShow = (record: ContactsRecord) => {
    record.show = !record.show;
    setRecords([...records]);
  };

  /* ================= UI ================= */
  return (
    <Pressable onPress={() => setMenuVisible(false)} className="flex-1">
      <ThemedView
        style={{ backgroundColor: isDark ? "#000000" : "#f3f4f6" }} // gray-100 light bg
        className="flex-1 p-4"
      >
        {loading && (
          <ThemedView className="absolute inset-0 justify-center items-center bg-black/40 z-10">
            <ActivityIndicator size="large" color={DARK_TEXT} />
          </ThemedView>
        )}

        {/* Top Bar */}
        <ThemedView
          className="flex-row items-center mb-4"
          style={{ backgroundColor: "transparent" }}
        >
          {/* New Button */}
          <TouchableOpacity
            onPress={() => router.push("/contacts/createContact")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 9999,
              backgroundColor: isDark ? DARK_TOPBAR_BG : "#bfdbfe", // gray-800 / blue-100
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
                color: isDark ? DARK_TEXT : "#1e40af",
              }}
            >
              New
            </Text>
          </TouchableOpacity>

          {/* Search Bar */}
          <TextInput
            value={search}
            onChangeText={(v) => {
              setSearch(v);
              setVisibleCount(5);
            }}
            placeholder="Search contacts..."
            placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"} // gray-400 / gray-500
            style={{
              flex: 1,
              backgroundColor: isDark ? DARK_SEARCH_BG : "#ffffff",
              color: isDark ? DARK_TEXT : "#000000",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: isDark ? "#4b5563" : "#d1d5db", // gray-600 / gray-300
            }}
          />

          {/* 3-dot menu */}
          <TouchableOpacity
            onPress={() => setMenuVisible(!menuVisible)}
            className="ml-2"
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
        </ThemedView>

        {/* Dropdown */}
        {menuVisible && (
          <ThemedView
            style={{
              backgroundColor: isDark ? DARK_TOPBAR_BG : "#ffffff",
              borderColor: isDark ? DARK_BORDER : "#d1d5db",
            }}
            className="absolute right-4 top-20 rounded-xl border z-20"
          >
            <TouchableOpacity
              onPress={handleExportAll}
              className="flex-row items-center px-4 py-3"
            >
              <Ionicons name="download-outline" size={18} color={DARK_TEXT} />
              <Text className="ml-3 font-medium text-white">Export All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleSortOrder}
              className="flex-row items-center px-4 py-3"
            >
              <Ionicons name="funnel-outline" size={18} color={DARK_TEXT} />
              <Text className="ml-3 font-medium text-white">
                {sortOrder === "asc"
                  ? "Sort Z → A"
                  : sortOrder === "desc"
                  ? "Sort A → Z"
                  : "Sort"}
              </Text>
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* List */}
        <FlatList
          data={visibleRecords}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ContactCard
              record={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleShow={toggleShow}
              onCopy={() => {}}
            />
          )}
          ListFooterComponent={
            filteredRecords.length > 5 ? (
              <TouchableOpacity
                onPress={handleLoadToggle}
                className="py-3 my-2 rounded-xl items-center"
                style={{
                  backgroundColor: isDark ? DARK_TOPBAR_BG : "#e0f2fe", // light blue
                  borderWidth: isDark ? 1 : 0,
                  borderColor: isDark ? DARK_BORDER : "transparent",
                }}
              >
                <Text
                  style={{
                    color: isDark ? DARK_TEXT : "#0284c7",
                    fontWeight: "600",
                  }}
                >
                  {isAllVisible ? "See Less" : "Load More"}
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </ThemedView>
    </Pressable>
  );
}
