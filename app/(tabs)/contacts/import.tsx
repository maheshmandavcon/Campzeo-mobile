import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getUser } from "@/api/dashboardApi";
import { importContactsApi } from "@/api/contactApi";
import Toast from "react-native-toast-message";

// ─── CSV Template ─────────────────────────────────────────────────────────────
const CSV_TEMPLATE =
  `Name,Email,Mobile,WhatsApp,Campaigns\r\n` +
  `Contact 1,contact1@example.com,+9199000001,+9199000001,Campaign1\r\n` +
  `Contact 2,contact2@example.com,+9199000002,+9199000002,Campaign2\r\n` +
  `Contact 3,contact3@example.com,+9199000003,+9199000003,Campaign3\r\n` +
  `Contact 4,contact4@example.com,+9199000004,+9199000004,Campaign1;Campaign2\r\n` +
  `Contact 5,contact5@example.com,+9199000005,+9199000005,Campaign1;Campaign3`;

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ParsedContact = {
  name: string;
  email: string;
  mobile: string;
  whatsapp: string;
  campaigns: string;
};

type ImportResult = {
  successful: number;
  failed: number;
  duplicates: number;
  failedRows: ParsedContact[];
  duplicateRows: ParsedContact[];
};

const REQUIRED_HEADERS = ["name", "email", "mobile"];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ImportContacts() {
  const isDark = useColorScheme() === "dark";

  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [fileUri, setFileUri] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [validationError, setValidationError] = useState<string>("");

  const COLORS = {
    screenBg: isDark ? "#121214" : "#f8fafc",
    cardBg: isDark ? "#1e1e24" : "#ffffff",
    cardBorder: isDark ? "#2e2e38" : "#e2e8f0",
    textPrimary: isDark ? "#ffffff" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    inputBg: isDark ? "#16161a" : "#f1f5f9",
    tableHeaderBg: isDark ? "#252530" : "#e2e8f0",
    tableRowAlt: isDark ? "#191920" : "#f8fafc",
    accent: "#dc2626",
  };

  // ── Download Template ──────────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const fileUri = `${FileSystem.cacheDirectory}contacts_template.csv`;
      await FileSystem.writeAsStringAsync(fileUri, CSV_TEMPLATE, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Save CSV Template",
        });
      } else {
        Toast.show({ type: "error", text1: "Sharing is not available on this device" });
      }
    } catch {
      Toast.show({ type: "error", text1: "Failed to download template" });
    } finally {
      setDownloadingTemplate(false);
    }
  };
  

  // ── Pick & Validate CSV ────────────────────────────────────────────────────
  const handlePickFile = async () => {
    try {
      setValidationError("");
      setParsedContacts([]);
      setFileName("");
      setFileUri("");

      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/csv", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset?.uri) return;

      const name = asset.name ?? "";
      if (!name.toLowerCase().endsWith(".csv")) {
        setValidationError("Please select a valid CSV file (.csv extension required).");
        return;
      }

      setFileName(name);
      setFileUri(asset.uri);

      const rawContent = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Strip UTF-8 BOM (added by Excel / Google Sheets) and any other
      // invisible/control characters that cause silent column-name mismatches.
      const content = rawContent
        .replace(/^\uFEFF/, "")           // UTF-8 BOM
        .replace(/^\u00EF\u00BB\u00BF/, "") // raw byte sequence BOM
        .replace(/\r\n/g, "\n")           // normalise line endings
        .replace(/\r/g, "\n");

      const rows = parseCSV(content);

      if (rows.length < 2) {
        setValidationError("The CSV file must have a header row and at least one data row.");
        return;
      }

      // Strip every invisible / non-printable character from each header cell
      // so BOM remnants, zero-width spaces, etc. never cause false negatives.
      const cleanHeader = (h: string) =>
        h
          .replace(/[\u0000-\u001F\u007F-\u009F\uFEFF\u200B-\u200D\uFFFD]/g, "")
          .toLowerCase()
          .trim();

      const headers = rows[0].map(cleanHeader);

      const nameIdx =
        headers.indexOf("name") >= 0
          ? headers.indexOf("name")
          : headers.indexOf("contactname");

      const emailIdx =
        headers.indexOf("email") >= 0
          ? headers.indexOf("email")
          : headers.indexOf("contactemail");

      const mobileIdx =
        headers.indexOf("mobile") >= 0
          ? headers.indexOf("mobile")
          : headers.indexOf("contactmobile");

      if (nameIdx === -1 || emailIdx === -1 || mobileIdx === -1) {
        setValidationError(
          `Required columns missing.\n` +
          `Accepted headers:\n` +
          `Name or ContactName\n` +
          `Email or ContactEmail\n` +
          `Mobile or ContactMobile`
        );
        return;
      }
      const whatsappIdx =
        headers.includes("whatsapp")
          ? headers.indexOf("whatsapp")
          : headers.indexOf("contactwhatsapp");

      const campaignsIdx =
        headers.includes("campaigns")
          ? headers.indexOf("campaigns")
          : headers.indexOf("contactcampaigns");

      const contacts: ParsedContact[] = rows
        .slice(1)
        .map((row) => ({
          name: row[nameIdx] ?? "",
          email: row[emailIdx] ?? "",
          mobile: row[mobileIdx] ?? "",
          whatsapp: whatsappIdx >= 0 ? (row[whatsappIdx] ?? "") : "",
          campaigns: campaignsIdx >= 0 ? (row[campaignsIdx] ?? "") : "",
        }))
        .filter((c) => c.name.trim() || c.email.trim() || c.mobile.trim());

      if (contacts.length === 0) {
        setValidationError("No valid contact rows found in the CSV file.");
        return;
      }

      setParsedContacts(contacts);
    } catch (e) {
      console.error("File pick error:", e);
      setValidationError("Failed to read the file. Please ensure it is a valid CSV.");
    }
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!fileUri || !fileName) return;
    try {
      setImporting(true);
      const user = await getUser();
      const orgId = user?.organisation?.id;

      const res = await importContactsApi(orgId, fileUri, fileName);

      // Normalise API response — field names may vary by backend convention
      const successful: number =
        res?.successful ?? res?.successCount ?? res?.successfulCount ?? 0;
      const failed: number =
        res?.failed ?? res?.failedCount ?? res?.errorCount ?? 0;
      const duplicates: number =
        res?.duplicates ?? res?.duplicateCount ?? res?.duplicatesCount ?? 0;

      // Map failed / duplicate contact arrays from API if present
      const mapRow = (c: any): ParsedContact => ({
        name: c?.contactName ?? c?.name ?? "",
        email: c?.contactEmail ?? c?.email ?? "",
        mobile: c?.contactMobile ?? c?.mobile ?? "",
        whatsapp: c?.contactWhatsApp ?? c?.whatsapp ?? "",
        campaigns: c?.campaigns ?? "",
      });

      const failedRows: ParsedContact[] = (res?.failedContacts ?? res?.failedRows ?? []).map(mapRow);
      const duplicateRows: ParsedContact[] = (res?.duplicateContacts ?? res?.duplicateRows ?? []).map(mapRow);

      setImportResult({ successful, failed, duplicates, failedRows, duplicateRows });
      setShowResultModal(true);
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Import failed",
        text2: err?.message ?? "Please try again.",
      });
    } finally {
      setImporting(false);
    }
  };

  // ── Reset for another import ───────────────────────────────────────────────
  const handleImportAnother = () => {
    setShowResultModal(false);
    setParsedContacts([]);
    setFileName("");
    setFileUri("");
    setImportResult(null);
    setValidationError("");
  };

  const handleViewContacts = () => {
    setShowResultModal(false);
    router.replace("/(tabs)/contacts");
  };

  const previewContacts = parsedContacts.slice(0, 10);
  const fileIsLoaded = parsedContacts.length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.screenBg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 56 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page Header ─────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: COLORS.cardBg,
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
            }}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "900",
                color: COLORS.textPrimary,
                letterSpacing: 0.2,
              }}
            >
              Import Contacts
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: COLORS.textSecondary,
                marginTop: 2,
                fontWeight: "500",
              }}
            >
              Upload a CSV file to bulk import contacts
            </Text>
          </View>
        </View>

        {/* ── Step 1: Download Template ────────────────────────── */}
        <StepCard
          step={1}
          title="Download Template"
          subtitle="Download our CSV template to ensure your data is formatted correctly"
          isDone={false}
          COLORS={COLORS}
        >
          <TouchableOpacity
            onPress={handleDownloadTemplate}
            disabled={downloadingTemplate}
            style={{
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
              backgroundColor: COLORS.cardBg,
              borderWidth: 1.5,
              borderColor: COLORS.accent,
              borderRadius: 12,
              paddingHorizontal: 18,
              paddingVertical: 12,
              opacity: downloadingTemplate ? 0.65 : 1,
            }}
          >
            {downloadingTemplate ? (
              <ActivityIndicator
                size="small"
                color={COLORS.accent}
                style={{ marginRight: 8 }}
              />
            ) : (
              <Ionicons
                name="download-outline"
                size={18}
                color={COLORS.accent}
                style={{ marginRight: 8 }}
              />
            )}
            <Text
              style={{
                fontWeight: "700",
                fontSize: 14,
                color: COLORS.accent,
              }}
            >
              Download CSV Template
            </Text>
          </TouchableOpacity>

          {/* Column guide */}
          <View
            style={{
              marginTop: 14,
              backgroundColor: isDark ? "#1a1a23" : "#f8fafc",
              borderRadius: 10,
              padding: 12,
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: COLORS.textSecondary,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 6,
              }}
            >
              Required Columns
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {["Name", "Email", "Mobile", "WhatsApp", "Campaigns"].map(
                (col, i) => (
                  <View
                    key={col}
                    style={{
                      backgroundColor:
                        i < 3
                          ? isDark
                            ? "#2d1515"
                            : "#fff0f0"
                          : isDark
                            ? "#1e2a1e"
                            : "#f0fdf4",
                      borderRadius: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderWidth: 1,
                      borderColor: i < 3 ? "#fca5a5" : "#86efac",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: i < 3 ? "#dc2626" : "#16a34a",
                      }}
                    >
                      {col}
                      {i >= 3 ? " (optional)" : "*"}
                    </Text>
                  </View>
                )
              )}
            </View>
          </View>
        </StepCard>

        {/* ── Step 2: Upload CSV ────────────────────────────────── */}
        <StepCard
          step={2}
          title="Upload CSV File"
          subtitle="Drag and drop your CSV file or click to browse"
          isDone={fileIsLoaded}
          COLORS={COLORS}
        >
          {/* Drop zone */}
          <TouchableOpacity
            onPress={handlePickFile}
            activeOpacity={0.75}
            style={{
              borderWidth: 2,
              borderColor: fileIsLoaded ? "#16a34a" : COLORS.cardBorder,
              borderStyle: "dashed",
              borderRadius: 16,
              padding: 28,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: fileIsLoaded
                ? isDark
                  ? "#0d1f0d"
                  : "#f0fdf4"
                : COLORS.inputBg,
            }}
          >
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: fileIsLoaded
                  ? isDark
                    ? "#1a2f1a"
                    : "#dcfce7"
                  : isDark
                    ? "#2a2a38"
                    : "#e2e8f0",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Ionicons
                name={fileIsLoaded ? "document-text" : "cloud-upload-outline"}
                size={30}
                color={fileIsLoaded ? "#16a34a" : COLORS.textSecondary}
              />
            </View>

            {fileIsLoaded ? (
              <>
                <Text
                  style={{
                    fontWeight: "800",
                    fontSize: 15,
                    color: "#16a34a",
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {fileName}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: COLORS.textSecondary,
                    marginTop: 4,
                    fontWeight: "500",
                  }}
                >
                  {parsedContacts.length} contacts found · Tap to change
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={{
                    fontWeight: "800",
                    fontSize: 15,
                    color: COLORS.textPrimary,
                    textAlign: "center",
                  }}
                >
                  Drop your CSV file here
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: COLORS.textSecondary,
                    marginTop: 4,
                    fontWeight: "500",
                  }}
                >
                  or click the button below
                </Text>
                <View
                  style={{
                    marginTop: 16,
                    backgroundColor: COLORS.accent,
                    paddingHorizontal: 22,
                    paddingVertical: 10,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{ fontWeight: "700", color: "#fff", fontSize: 14 }}
                  >
                    Browse Files
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* Validation error */}
          {validationError ? (
            <View
              style={{
                marginTop: 12,
                backgroundColor: isDark ? "#2d1515" : "#fff5f5",
                borderRadius: 10,
                padding: 12,
                borderWidth: 1,
                borderColor: "#fca5a5",
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color="#dc2626"
                style={{ marginRight: 8, marginTop: 1 }}
              />
              <Text
                style={{
                  color: "#dc2626",
                  fontSize: 13,
                  flex: 1,
                  fontWeight: "600",
                  lineHeight: 18,
                }}
              >
                {validationError}
              </Text>
            </View>
          ) : null}
        </StepCard>

        {/* ── Step 3: Preview ───────────────────────────────────── */}
        {fileIsLoaded && (
          <StepCard
            step={3}
            title="Preview Data"
            subtitle={`Showing first ${previewContacts.length} rows from your CSV file`}
            isDone={false}
            COLORS={COLORS}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              style={{ borderRadius: 10, overflow: "hidden" }}
            >
              <View>
                {/* Table header */}
                <View
                  style={{
                    flexDirection: "row",
                    backgroundColor: COLORS.tableHeaderBg,
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                  }}
                >
                  {["Name", "Email", "Mobile", "WhatsApp", "Campaigns"].map(
                    (h) => (
                      <View
                        key={h}
                        style={{
                          width: 130,
                          paddingHorizontal: 12,
                          paddingVertical: 9,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "800",
                            color: COLORS.textSecondary,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {h}
                        </Text>
                      </View>
                    )
                  )}
                </View>

                {/* Table rows */}
                {previewContacts.map((contact, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: "row",
                      backgroundColor:
                        idx % 2 === 0 ? COLORS.cardBg : COLORS.tableRowAlt,
                    }}
                  >
                    {[
                      contact.name,
                      contact.email,
                      contact.mobile,
                      contact.whatsapp,
                      contact.campaigns,
                    ].map((val, ci) => (
                      <View
                        key={ci}
                        style={{
                          width: 130,
                          paddingHorizontal: 12,
                          paddingVertical: 9,
                        }}
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            fontSize: 12,
                            color: COLORS.textPrimary,
                            fontWeight: "500",
                          }}
                        >
                          {val || "—"}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>

            {parsedContacts.length > 10 && (
              <Text
                style={{
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  marginTop: 10,
                  fontStyle: "italic",
                  fontWeight: "500",
                }}
              >
                + {parsedContacts.length - 10} more contacts will also be imported
              </Text>
            )}
          </StepCard>
        )}

        {/* ── Step 4: Import ────────────────────────────────────── */}
        {fileIsLoaded && (
          <StepCard
            step={4}
            title="Import Contacts"
            subtitle="Click the button below to start importing your contacts"
            isDone={false}
            COLORS={COLORS}
          >
            {/* Ready badge */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDark ? "#0d1f0d" : "#f0fdf4",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: "#86efac",
                alignSelf: "flex-start",
                marginBottom: 16,
              }}
            >
              <Ionicons
                name="people-outline"
                size={16}
                color="#16a34a"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ fontWeight: "700", color: "#16a34a", fontSize: 13 }}
              >
                {parsedContacts.length} contacts ready to import
              </Text>
            </View>

            {/* Import button */}
            <TouchableOpacity
              onPress={handleImport}
              disabled={importing}
              style={{
                backgroundColor: COLORS.accent,
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                opacity: importing ? 0.7 : 1,
                shadowColor: "#dc2626",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              {importing ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={{ marginRight: 10 }}
                />
              ) : (
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 10 }}
                />
              )}
              <Text style={{ fontWeight: "800", fontSize: 16, color: "#fff" }}>
                {importing ? "Importing…" : "Import Contacts"}
              </Text>
            </TouchableOpacity>
          </StepCard>
        )}
      </ScrollView>

      {/* ── Result Modal ─────────────────────────────────────────── */}
      <Modal
        visible={showResultModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => { }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.cardBg,
              borderRadius: 24,
              width: "100%",
              maxWidth: 400,
              padding: 28,
              alignItems: "center",
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.3,
              shadowRadius: 32,
              elevation: 24,
            }}
          >
            {/* Icon */}
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                backgroundColor: isDark ? "#0d1f0d" : "#f0fdf4",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                borderWidth: 2,
                borderColor: "#86efac",
              }}
            >
              <Ionicons name="checkmark-circle" size={42} color="#16a34a" />
            </View>

            <Text
              style={{
                fontSize: 22,
                fontWeight: "900",
                color: COLORS.textPrimary,
                marginBottom: 4,
                letterSpacing: 0.2,
              }}
            >
              Import Complete
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: COLORS.textSecondary,
                textAlign: "center",
                marginBottom: 24,
                fontWeight: "500",
              }}
            >
              Here's a summary of your import
            </Text>

            {/* Stats row */}
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                width: "100%",
                marginBottom: 20,
              }}
            >
              <StatBox
                count={importResult?.successful ?? 0}
                label="Successful"
                color="#16a34a"
                bg={isDark ? "#0d1f0d" : "#f0fdf4"}
                borderColor="#86efac"
              />
              <StatBox
                count={importResult?.failed ?? 0}
                label="Failed"
                color="#dc2626"
                bg={isDark ? "#2d1515" : "#fff5f5"}
                borderColor="#fca5a5"
              />
              <StatBox
                count={importResult?.duplicates ?? 0}
                label="Duplicates"
                color="#d97706"
                bg={isDark ? "#251d0a" : "#fffbeb"}
                borderColor="#fcd34d"
              />
            </View>

            {/* Duplicates list */}
            {(importResult?.duplicateRows?.length ?? 0) > 0 && (
              <View
                style={{
                  width: "100%",
                  backgroundColor: isDark ? "#251d0a" : "#fffbeb",
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#fcd34d",
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Ionicons
                    name="copy-outline"
                    size={15}
                    color="#d97706"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: "#d97706",
                    }}
                  >
                    Duplicate Contacts
                  </Text>
                </View>
                <ScrollView style={{ maxHeight: 90 }}>
                  {importResult!.duplicateRows.map((c, i) => (
                    <Text
                      key={i}
                      style={{
                        fontSize: 12,
                        color: COLORS.textSecondary,
                        marginBottom: 3,
                        fontWeight: "500",
                      }}
                    >
                      • {c.name || "—"}
                      {c.email ? ` (${c.email})` : ""}
                    </Text>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Failed list */}
            {(importResult?.failedRows?.length ?? 0) > 0 && (
              <View
                style={{
                  width: "100%",
                  backgroundColor: isDark ? "#2d1515" : "#fff5f5",
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#fca5a5",
                  marginBottom: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={15}
                    color="#dc2626"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: "#dc2626",
                    }}
                  >
                    Failed Contacts
                  </Text>
                </View>
                <ScrollView style={{ maxHeight: 90 }}>
                  {importResult!.failedRows.map((c, i) => (
                    <Text
                      key={i}
                      style={{
                        fontSize: 12,
                        color: COLORS.textSecondary,
                        marginBottom: 3,
                        fontWeight: "500",
                      }}
                    >
                      • {c.name || "—"}
                      {c.email ? ` (${c.email})` : ""}
                    </Text>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Action buttons */}
            <TouchableOpacity
              onPress={handleImportAnother}
              style={{
                width: "100%",
                borderWidth: 1.5,
                borderColor: COLORS.accent,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  fontWeight: "700",
                  color: COLORS.accent,
                  fontSize: 15,
                }}
              >
                Import Another File
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleViewContacts}
              style={{
                width: "100%",
                backgroundColor: COLORS.accent,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                shadowColor: "#dc2626",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ fontWeight: "700", color: "#fff", fontSize: 15 }}>
                View Contacts
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── StepCard ─────────────────────────────────────────────────────────────────
function StepCard({
  step,
  title,
  subtitle,
  isDone,
  COLORS,
  children,
}: {
  step: number;
  title: string;
  subtitle: string;
  isDone: boolean;
  COLORS: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: isDone ? "#86efac" : COLORS.cardBorder,
        padding: 20,
        marginBottom: 16,
      }}
    >
      {/* Step label row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isDone ? "#16a34a" : "#dc2626",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          {isDone ? (
            <Ionicons name="checkmark" size={17} color="#fff" />
          ) : (
            <Text style={{ fontSize: 13, fontWeight: "900", color: "#fff" }}>
              {step}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "800",
              color: COLORS.textPrimary,
            }}
          >
            Step {step}: {title}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: COLORS.textSecondary,
              marginTop: 2,
              fontWeight: "500",
            }}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      {children}
    </View>
  );
}

// ─── StatBox ──────────────────────────────────────────────────────────────────
function StatBox({
  count,
  label,
  color,
  bg,
  borderColor,
}: {
  count: number;
  label: string;
  color: string;
  bg: string;
  borderColor: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: bg,
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "900",
          color,
          lineHeight: 32,
        }}
      >
        {count}
      </Text>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color,
          marginTop: 4,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
