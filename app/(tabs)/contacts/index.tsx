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
  Modal,
  ScrollView,
} from "react-native";
import { Buffer } from "buffer";
import { Text } from "@gluestack-ui/themed";
import { Ionicons } from "@expo/vector-icons";
import ContactCard, { ContactsRecord } from "./contactComponents/contactCard";
import { router, useFocusEffect } from "expo-router";
import {
  getContactsApi,
  deleteContactApi,
  exportContactsApi,
} from "@/api/contactApi";
import * as DocumentPicker from "expo-document-picker";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeletons";
import { getUser } from "@/api/dashboardApi";
import Toast from "react-native-toast-message";

export default function Contacts() {
  const [visibleCount, setVisibleCount] = useState(10);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [records, setRecords] = useState<ContactsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const [importModalVisible, setImportModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [importStatus, setImportStatus] = useState<"idle" | "importing" | "complete">("idle");
  const [importResult, setImportResult] = useState<any>(null);

  const isDark = useColorScheme() === "dark";

  const DARK_TOPBAR_BG = "#1f2937";
  const DARK_TEXT = "#ffffff";
  const DARK_BORDER = "#ffffff";

  const { getToken } = useAuth();

  /* ================= FETCH ================= */
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

  const filteredRecords = records
    .filter((r) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.mobile && r.mobile.includes(q)) ||
        (r.whatsapp && r.whatsapp.includes(q))
      );
    })
    .sort((a, b) => {
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
  //   const handleEdit = (record: ContactsRecord) => {
  //   // 1️⃣ Print all emails
  //   const allEmails = records.map((r) => r.email);
  //   console.log("Existing contact emails:", allEmails);

  //   // 2️⃣ Print all mobile numbers
  //   const allMobiles = records.map((r) => r.mobile);
  //   console.log("Existing contact numbers:", allMobiles);

  //   // 3️⃣ Navigate to edit page
  //   router.push({
  //     pathname: "/contacts/createContact",
  //     params: {
  //       contactId: String(record.id),
  //       record: JSON.stringify(record),
  //     },
  //   });
  // };

  const handleCopy = (record: ContactsRecord) => {
    const textToCopy = `
Name: ${record.name}
Email: ${record.email || "-"}
Mobile: ${record.mobile || "-"}
WhatsApp: ${record.whatsapp || "-"}
  `;

    Clipboard.setStringAsync(textToCopy)
      .then(() => {
        Toast.show({
          type: "success",
          text1: "Contact copied successfully",
        });
      })
      .catch((err) => {
        console.error("Clipboard error:", err);
        Toast.show({
          type: "error",
          text1: "Failed to copy contact details",
        });
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

            await deleteContactApi(orgId, record.id, token);

            setRecords((prev) => prev.filter((r) => r.id !== record.id));
            Toast.show({
              type: "success",
              text1: "Contact deleted successfully",
            });
          } catch (e: any) {
            Toast.show({
              type: "error",
              text1: "Failed to delete contact",
            });
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

      const user = await getUser();
      const orgId = user?.organisation?.id;
      if (!orgId) throw new Error("Organisation ID missing");

      const blob = await exportContactsApi(orgId);

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Url = reader.result as string;
          const base64Data = base64Url.split(",")[1];

          const fileUri = `${FileSystem.cacheDirectory}contacts_${Date.now()}.csv`;

          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
          }
        } catch (fileErr) {
          console.error("File save error:", fileErr);
          Toast.show({
            type: "error",
            text1: "Failed to save exported file",
          });
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setLoading(false);
        Toast.show({
          type: "error",
          text1: "Failed to read export blob",
        });
      };

      reader.readAsDataURL(blob);
    } catch (e: any) {
      console.error("Export all error:", e);
      Toast.show({
        type: "error",
        text1: "Failed to export contacts",
      });
      setLoading(false);
    }
  };

  const handleImportContacts = async () => {
    setMenuVisible(false);
    setSelectedFile(null);
    setPreviewData([]);
    setImportStatus("idle");
    setImportResult(null);
    setImportModalVisible(true);
  };

  const handleDownloadTemplate = async () => {
  try {
    const csvContent =
      "Name,Email,Mobile,WhatsApp\nJohn Doe,john@example.com,9876543210,9876543210";

    const fileUri =
      FileSystem.cacheDirectory + "contacts_template.csv";

    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await Sharing.shareAsync(fileUri, {
      mimeType: "text/csv",
      dialogTitle: "Download CSV Template",
    });

  } catch (error) {
    console.error(error);
    Alert.alert("Error", "Failed to download template");
  }
};

  const handleBrowseFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        setSelectedFile(file);

        // Try reading the file for preview
        try {
          const fileString = await FileSystem.readAsStringAsync(file.uri);
          const lines = fileString.split(/\r?\n/).filter((line) => line.trim() !== "");
          const rows = lines.slice(0, 4).map((line) => line.split(","));
          setPreviewData(rows);
        } catch (e) {
          console.log("Failed to read CSV for preview", e);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick file");
    }
  };

  const handleImportSubmit = async () => {
    if (!selectedFile) {
      Alert.alert("Error", "Please select a file first");
      return;
    }
    setImportStatus("importing");
    
    // Mocking an API call
    setTimeout(() => {
      setImportStatus("complete");
      setImportResult({
        successful: 2,
        failed: 1,
        duplicates: 0,
        errors: [
          { row: 3, field: "ContactMobile", error: "Invalid mobile format" },
          { row: 3, field: "ContactWhatsApp", error: "Invalid WhatsApp format" }
        ]
      });
    }, 1500);
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

      {/* EMAIL ROW */}
      <View className="flex-row justify-between items-center mb-2">
        <ShimmerSkeleton height={12} width="20%" />
        <ShimmerSkeleton height={12} width="55%" />
      </View>

      {/* MOBILE ROW */}
      <View className="flex-row justify-between items-center mb-2">
        <ShimmerSkeleton height={12} width="20%" />
        <ShimmerSkeleton height={12} width="45%" />
      </View>

      {/* WHATSAPP ROW */}
      <View className="flex-row justify-between items-center mb-2">
        <ShimmerSkeleton height={12} width="25%" />
        <ShimmerSkeleton height={12} width="45%" />
      </View>

      {/* CAMPAIGNS COUNT ROW */}
      <View className="flex-row justify-between items-center mt-2">
        <ShimmerSkeleton height={12} width="30%" />
        <ShimmerSkeleton height={14} width={40} borderRadius={6} />
      </View>
    </ThemedView>
  );

  const listData = loading ? skeletonData : visibleRecords;
  const COLORS = {
    screenBg: isDark ? "#121214" : "#f8fafc",
    cardBg: isDark ? "#1e1e24" : "#ffffff",
    cardBorder: isDark ? "#2e2e38" : "#e2e8f0",
    textPrimary: isDark ? "#ffffff" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    newButtonBg: "#dc2626",
    newButtonText: "#ffffff",
    inputBg: isDark ? "#1e1e24" : "#ffffff",
    inputBorder: isDark ? "#2e2e38" : "#cbd5e1",
    inputText: isDark ? "#ffffff" : "#0f172a",
  };

  /* ================= UI ================= */
  return (
    <ThemedView className="flex-1" style={{ backgroundColor: COLORS.screenBg }}>
      <ThemedView
        style={{ backgroundColor: COLORS.screenBg }}
        className="flex-1 p-4"
      >
        {/* Heading & Add Contacts Button Row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "900",
              color: COLORS.textPrimary,
              letterSpacing: 0.3,
            }}
          >
            Contacts
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/contacts/createContact")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 99,
              backgroundColor: COLORS.newButtonBg,
              shadowColor: "#dc2626",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
            }}
          >
            <Ionicons
              name="add-circle"
              size={18}
              color={COLORS.newButtonText}
            />
            <Text
              style={{
                marginLeft: 6,
                fontWeight: "700",
                fontSize: 14,
                color: COLORS.newButtonText,
              }}
            >
              Add Contact
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search input box & 3 dots in single row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          {/* Search Bar */}
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: COLORS.inputBg,
              borderRadius: 99,
              borderWidth: 1,
              borderColor: COLORS.inputBorder,
              paddingHorizontal: 12,
              height: 46,
            }}
          >
            <Ionicons name="search-outline" size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              value={search}
              onChangeText={(v) => {
                setSearch(v);
                setVisibleCount(5);
              }}
              placeholder="Search contacts..."
              placeholderTextColor={isDark ? "#52525b" : "#94a3b8"}
              style={{
                flex: 1,
                color: COLORS.inputText,
                fontSize: 14,
                fontWeight: "600",
                height: "100%",
                padding: 0,
              }}
            />
          </View>

          {/* 3-dot menu */}
          <TouchableOpacity
            onPress={() => setMenuVisible(!menuVisible)}
            style={{
              padding: 12,
              borderRadius: 23,
              backgroundColor: COLORS.cardBg,
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
              marginLeft: 10,
              alignItems: "center",
              justifyContent: "center",
              width: 46,
              height: 46,
            }}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Dropdown */}
        {menuVisible && (
          <View
            style={{
              backgroundColor: COLORS.cardBg,
              borderColor: COLORS.cardBorder,
              borderWidth: 1,
              position: "absolute",
              right: 16,
              top: 124,
              borderRadius: 16,
              zIndex: 30,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 8,
              minWidth: 150,
            }}
          >
            <TouchableOpacity
              onPress={handleExportAll}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.cardBorder,
              }}
            >
              <Ionicons
                name="download-outline"
                size={18}
                color={COLORS.textPrimary}
              />
              <Text style={{ marginLeft: 10, fontWeight: "600", color: COLORS.textPrimary, fontSize: 14 }}>
                Export All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleImportContacts}
              className="flex-row items-center px-4 py-3"
            >
              <Ionicons
                name="person-add-outline"
                size={18}
                color={isDark ? "#ffffff" : "#111827"}
              />
              <ThemedText className="ml-3 font-medium text-white">
                Import Contacts
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleSortOrder}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <Ionicons
                name="funnel-outline"
                size={18}
                color={COLORS.textPrimary}
              />
              <Text style={{ marginLeft: 10, fontWeight: "600", color: COLORS.textPrimary, fontSize: 14 }}>
                {sortOrder === "asc"
                  ? "Sort Z → A"
                  : sortOrder === "desc"
                    ? "Sort A → Z"
                    : "Sort"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
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
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingVertical: 80,
                  backgroundColor: "transparent",
                }}
              >
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: COLORS.cardBg,
                    borderWidth: 1,
                    borderColor: COLORS.cardBorder,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="people-outline" size={32} color={COLORS.textSecondary} />
                </View>
                <Text
                  style={{ fontSize: 18, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 4 }}
                >
                  No contacts yet
                </Text>

                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "500",
                    textAlign: "center",
                    color: COLORS.textSecondary,
                    paddingHorizontal: 36,
                    lineHeight: 18,
                  }}
                >
                  Tap "+ Add Contact" to register your first lead or customer.
                </Text>
              </View>
            ) : null
          }
          contentContainerStyle={{
            flexGrow: listData.length === 0 ? 1 : undefined,
            paddingBottom: 24,
          }}
        />
        <Modal
          visible={importModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setImportModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <ThemedView
              style={{
                borderRadius: 16,
                padding: 20,
                backgroundColor: isDark ? "#161618" : "#ffffff",
                maxHeight: "90%",
              }}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {importStatus === "complete" && importResult ? (
                  <View>
                    <ThemedText style={{ fontSize: 20, fontWeight: "700", marginBottom: 8, color: "#10b981" }}>
                      Import Complete
                    </ThemedText>
                    <ThemedText style={{ marginBottom: 20 }}>
                      Here's a summary of your import
                    </ThemedText>

                    <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 20 }}>
                      <View style={{ alignItems: "center" }}>
                        <ThemedText style={{ fontSize: 24, fontWeight: "bold", color: "#10b981" }}>{importResult.successful}</ThemedText>
                        <ThemedText>Successful</ThemedText>
                      </View>
                      <View style={{ alignItems: "center" }}>
                        <ThemedText style={{ fontSize: 24, fontWeight: "bold", color: "#ef4444" }}>{importResult.failed}</ThemedText>
                        <ThemedText>Failed</ThemedText>
                      </View>
                      <View style={{ alignItems: "center" }}>
                        <ThemedText style={{ fontSize: 24, fontWeight: "bold", color: "#f59e0b" }}>{importResult.duplicates}</ThemedText>
                        <ThemedText>Duplicates</ThemedText>
                      </View>
                    </View>

                    {importResult.errors && importResult.errors.length > 0 && (
                      <View style={{ marginBottom: 20 }}>
                        <ThemedText style={{ fontWeight: "700", marginBottom: 8, color: "#ef4444" }}>Error Details</ThemedText>
                        <View style={{ borderWidth: 1, borderColor: isDark ? "#374151" : "#e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                          <View style={{ flexDirection: "row", backgroundColor: isDark ? "#374151" : "#f9fafb", padding: 8 }}>
                            <ThemedText style={{ flex: 1, fontWeight: "600" }}>Row</ThemedText>
                            <ThemedText style={{ flex: 2, fontWeight: "600" }}>Field</ThemedText>
                            <ThemedText style={{ flex: 3, fontWeight: "600" }}>Error</ThemedText>
                          </View>
                          {importResult.errors.map((err: any, idx: number) => (
                            <View key={idx} style={{ flexDirection: "row", padding: 8, borderTopWidth: 1, borderColor: isDark ? "#374151" : "#e5e7eb" }}>
                              <ThemedText style={{ flex: 1 }}>{err.row}</ThemedText>
                              <ThemedText style={{ flex: 2 }}>{err.field}</ThemedText>
                              <ThemedText style={{ flex: 3, color: "#ef4444" }}>{err.error}</ThemedText>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => {
                        setSelectedFile(null);
                        setPreviewData([]);
                        setImportStatus("idle");
                        setImportResult(null);
                      }}
                      style={{
                        backgroundColor: "#3b82f6",
                        padding: 12,
                        borderRadius: 10,
                        alignItems: "center",
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600" }}>Import Another File</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setImportModalVisible(false);
                        fetchContacts();
                      }}
                      style={{
                        borderWidth: 1,
                        borderColor: "#d1d5db",
                        padding: 12,
                        borderRadius: 10,
                        alignItems: "center",
                      }}
                    >
                      <ThemedText style={{ fontWeight: "600" }}>View Contacts</ThemedText>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <ThemedText style={{ fontSize: 20, fontWeight: "700", marginBottom: 8 }}>
                      Import Contacts
                    </ThemedText>
                    <ThemedText style={{ marginBottom: 20 }}>
                      Upload a CSV file to bulk import contacts
                    </ThemedText>

                    <ThemedText style={{ fontWeight: "700", marginBottom: 8 }}>
                      Step 1: Download Template
                    </ThemedText>
                    <TouchableOpacity
                      onPress={handleDownloadTemplate}
                      style={{
                        borderWidth: 1,
                        borderColor: isDark ? "#374151" : "#e5e7eb",
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 20,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="download-outline" size={18} color={isDark ? "#fff" : "#000"} style={{ marginRight: 8 }} />
                      <ThemedText>Download CSV Template</ThemedText>
                    </TouchableOpacity>

                    <ThemedText style={{ fontWeight: "700", marginBottom: 8 }}>
                      Step 2: Upload CSV File
                    </ThemedText>
                    {selectedFile ? (
                      <View style={{ borderWidth: 1, borderColor: isDark ? "#374151" : "#e5e7eb", borderRadius: 12, padding: 16, marginBottom: 20, alignItems: "center" }}>
                        <Ionicons name="document-text" size={32} color="#3b82f6" />
                        <ThemedText style={{ marginTop: 8, fontWeight: "600" }}>{selectedFile.name}</ThemedText>
                        <TouchableOpacity onPress={handleBrowseFile} style={{ marginTop: 12 }}>
                          <Text style={{ color: "#3b82f6" }}>Choose Different File</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={handleBrowseFile}
                        style={{
                          borderWidth: 2,
                          borderStyle: "dashed",
                          borderColor: isDark ? "#374151" : "#d1d5db",
                          borderRadius: 12,
                          padding: 24,
                          alignItems: "center",
                          marginBottom: 20,
                        }}
                      >
                        <Ionicons name="cloud-upload-outline" size={40} color={isDark ? "#9ca3af" : "#6b7280"} />
                        <ThemedText style={{ marginTop: 10 }}>Browse Files</ThemedText>
                      </TouchableOpacity>
                    )}

                    {previewData.length > 0 && (
                      <View style={{ marginBottom: 20 }}>
                        <ThemedText style={{ fontWeight: "700", marginBottom: 8 }}>
                          Step 3: Preview Data
                        </ThemedText>
                        <ThemedText style={{ fontSize: 12, marginBottom: 8, color: "#6b7280" }}>
                          Showing first {previewData.length - 1} rows from your CSV file
                        </ThemedText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={{ borderWidth: 1, borderColor: isDark ? "#374151" : "#e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                            {previewData.map((row, rowIndex) => (
                              <View key={rowIndex} style={{ flexDirection: "row", backgroundColor: rowIndex === 0 ? (isDark ? "#374151" : "#f9fafb") : "transparent", borderBottomWidth: rowIndex === previewData.length - 1 ? 0 : 1, borderColor: isDark ? "#374151" : "#e5e7eb" }}>
                                {row.map((cell, cellIndex) => (
                                  <View key={cellIndex} style={{ width: 120, padding: 8, borderRightWidth: cellIndex === row.length - 1 ? 0 : 1, borderColor: isDark ? "#374151" : "#e5e7eb" }}>
                                    <ThemedText style={{ fontSize: 12, fontWeight: rowIndex === 0 ? "600" : "400" }} numberOfLines={1}>{cell}</ThemedText>
                                  </View>
                                ))}
                              </View>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    )}

                    {selectedFile && (
                      <View style={{ marginBottom: 20 }}>
                        <ThemedText style={{ fontWeight: "700", marginBottom: 8 }}>
                          Step 4: Import Contacts
                        </ThemedText>
                        <TouchableOpacity
                          onPress={handleImportSubmit}
                          disabled={importStatus === "importing"}
                          style={{
                            backgroundColor: importStatus === "importing" ? "#93c5fd" : "#3b82f6",
                            padding: 12,
                            borderRadius: 10,
                            alignItems: "center",
                            flexDirection: "row",
                            justifyContent: "center",
                          }}
                        >
                          {importStatus === "importing" ? (
                            <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                          ) : (
                            <Ionicons name="cloud-upload" size={18} color="#fff" style={{ marginRight: 8 }} />
                          )}
                          <Text style={{ color: "#fff", fontWeight: "600" }}>
                            {importStatus === "importing" ? "Importing..." : "Import Contacts"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => setImportModalVisible(false)}
                      style={{
                        backgroundColor: "#ef4444",
                        padding: 12,
                        borderRadius: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600" }}>Close</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </ThemedView>
          </View>
        </Modal>

      </ThemedView>
    </ThemedView>
  );
}
