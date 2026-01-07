import React, { useState, useCallback, useEffect } from "react";
import {
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import { View, Text } from "@gluestack-ui/themed";
import { Ionicons } from "@expo/vector-icons";
import ContactCard, { ContactsRecord } from "./contactComponents/contactCard";
import { router, useLocalSearchParams } from "expo-router";
import {
  getContactsApi,
  deleteContactApi,
  exportContactsApi,
} from "@/api/contact/contactApi";
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

  const { getToken } = useAuth();

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

  /* ================= EXPORT ================= */
  const handleExportAll = async () => {
    try {
      setMenuVisible(false);
      setLoading(true);

      const token = await getToken();
      if (!token) throw new Error("Token missing");

      // Get data as arraybuffer instead of blob
      const arrayBuffer = await exportContactsApi(token); // make sure API returns arraybuffer

      // Convert arraybuffer to base64
      const binary = new Uint8Array(arrayBuffer);
      let binaryString = "";
      for (let i = 0; i < binary.length; i++) {
        binaryString += String.fromCharCode(binary[i]);
      }
      const base64Data = btoa(binaryString); // Base64 encoded string

      const fileUri = `${FileSystem.cacheDirectory}contacts_export_${Date.now()}.csv`;

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Exported", "Contacts exported successfully");
      }
    } catch (e: any) {
      Alert.alert("Export Failed", e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleImportContacts = () => {
    setMenuVisible(false);
    Alert.alert("Coming Soon", "Import Contacts feature will be added soon.");
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleLoadToggle = () => {
    isAllVisible
      ? setVisibleCount(5)
      : setVisibleCount(filteredRecords.length);
  };

  const handleNew = () => {
    router.push("/contacts/createContact");
  };

  const toggleShow = (record: ContactsRecord) => {
    record.show = !record.show;
    setRecords([...records]);
  };

  const handleAddOrUpdate = useCallback((newContact: ContactsRecord) => {
    setRecords((prev) => {
      const index = prev.findIndex((r) => r.id === newContact.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = newContact;
        return updated;
      }
      return [...prev, { ...newContact, show: true }];
    });
  }, []);

  const { newContact } = useLocalSearchParams();
  useEffect(() => {
    if (newContact) {
      handleAddOrUpdate(JSON.parse(newContact as string));
    }
  }, [newContact]);

  return (
    <Pressable onPress={() => setMenuVisible(false)} className="flex-1">
      <View className="flex-1 p-4 bg-gray-100">
        {loading && (
          <View className="absolute inset-0 justify-center items-center bg-black/10 z-10">
            <ActivityIndicator size="large" />
          </View>
        )}

        {/* Top Bar */}
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={handleNew}
            className="flex-row items-center px-3 py-2 rounded-full bg-blue-100 mr-2"
          >
            <Ionicons name="add-circle-outline" size={20} color="#0284c7" />
            <Text className="ml-2 font-semibold text-blue-700">New</Text>
          </TouchableOpacity>

          <TextInput
            value={search}
            onChangeText={(v) => {
              setSearch(v);
              setVisibleCount(5);
            }}
            placeholder="Search contacts..."
            className="flex-1 px-3 py-2 rounded-full border border-gray-300 bg-white"
          />

          <TouchableOpacity
            onPress={() => setMenuVisible(!menuVisible)}
            className="ml-2 rounded-full"
          >
            <Ionicons name="ellipsis-vertical" size={20} />
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu */}
        {menuVisible && (
          <View className="absolute right-4 top-20 bg-white rounded-xl shadow-lg border border-gray-200 z-20">
            <TouchableOpacity
              onPress={handleImportContacts}
              className="flex-row items-center px-4 py-3"
            >
              <Ionicons
                name="cloud-upload-outline"
                size={18}
                color="#2563eb"
              />
              <Text className="ml-3 font-medium text-blue-700">
                Import Contacts
              </Text>
            </TouchableOpacity>

            <View className="h-[1px] bg-gray-200 mx-3" />

            <TouchableOpacity
              onPress={handleExportAll}
              className="flex-row items-center px-4 py-3"
            >
              <Ionicons name="download-outline" size={18} color="#7c3aed" />
              <Text className="ml-3 font-medium text-purple-700">
                Export All
              </Text>
            </TouchableOpacity>

            <View className="h-[1px] bg-gray-200 mx-3" />

            <TouchableOpacity
              onPress={toggleSortOrder}
              className="flex-row items-center px-4 py-3"
            >
              <Ionicons name="funnel-outline" size={18} color="#f59e0b" />
              <Text className="ml-3 font-medium text-yellow-700">
                {sortOrder === "asc"
                  ? "Sort Z → A"
                  : sortOrder === "desc"
                    ? "Sort A → Z"
                    : "Sort"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contact List */}
        <FlatList
          data={visibleRecords}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ContactCard
              record={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleShow={toggleShow}
              onCopy={() => { }}
            />
          )}
          ListEmptyComponent={
            !loading ? (
              <Text className="text-center mt-6">No Contacts Found</Text>
            ) : null
          }
          ListFooterComponent={
            filteredRecords.length > 5 ? (
              <TouchableOpacity
                onPress={handleLoadToggle}
                className={`py-3 my-2 rounded-xl items-center ${isAllVisible ? "bg-red-100" : "bg-blue-100"
                  }`}
              >
                <Text
                  className={`font-semibold ${isAllVisible ? "text-red-700" : "text-blue-700"
                    }`}
                >
                  {isAllVisible ? "See Less" : "Load More"}
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      </View>
    </Pressable>
  );
}
