import {
  createContactApi,
  updateContactApi,
  getContactsApi,
} from "@/api/contactApi";
import { getCampaignsApi } from "@/api/campaignApi";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { contactSchema } from "@/validations/contactSchema";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { getUser } from "@/api/dashboardApi";
import Toast from "react-native-toast-message";

type Contact = {
  id?: number;
  name: string;
  email: string;
  mobile: string;
  whatsapp: string;
  campaignIds?: number[];
  campaigns?: { id: number; name: string }[];
};

type CampaignOption = {
  id: number;
  name: string;
};

export default function CreateContact() {
  const { getToken } = useAuth();
  const [campaignOptions, setCampaignOptions] = useState<CampaignOption[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [campaignsPage, setCampaignsPage] = useState(1);
  const [hasMoreCampaigns, setHasMoreCampaigns] = useState(true);
  const [loadingMoreCampaigns, setLoadingMoreCampaigns] = useState(false);
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const isDark = useColorScheme() === "dark";

  const { contactId, record: recordStr } = useLocalSearchParams();
  const isEdit = !!contactId;

  const editingContact: Contact | null = recordStr
    ? JSON.parse(recordStr as string)
    : null;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      mobile: "+91",
      whatsapp: "+91",
      campaignIds: [],
    },
    mode: "onChange",
  });

  const selectedCampaigns = watch("campaignIds") || [];
  const hasResetRef = useRef(false);

  const [existingEmails, setExistingEmails] = useState<string[]>([]);
  const [existingNumbers, setExistingNumbers] = useState<string[]>([]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Token missing");
        const user = await getUser();
        const orgId = user?.organisation?.id;

        const data = await getContactsApi(orgId);
        const emails =
          data.contacts?.map((c: any) => c.contactEmail.toLowerCase()) || [];
        const numbers = data.contacts?.map((c: any) => c.contactMobile) || [];

        setExistingEmails(emails);
        setExistingNumbers(numbers);
      } catch (err) {
        console.error("Failed to fetch contacts:", err);
      }
    };

    fetchContacts();
  }, []);

  /* Populate form if editing */
  useEffect(() => {
    if (!editingContact || hasResetRef.current) return;

    reset({
      name: editingContact.name ?? "",
      email: editingContact.email ?? "",
      mobile: editingContact.mobile || "+91",
      whatsapp: editingContact.whatsapp || "+91",
      campaignIds: editingContact.campaigns
        ? editingContact.campaigns.map((c) => c.id)
        : (editingContact.campaignIds ?? []),
    });

    hasResetRef.current = true;
  }, [editingContact, reset]);

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Token missing");
      const user = await getUser();
      const orgId = user?.organisation?.id;
      const data = await getCampaignsApi(orgId, 1, 15);
      const fetchedCampaigns = data?.campaigns ?? [];
      const options =
        fetchedCampaigns.map((c: any) => ({ id: c.id, name: c.name }));
      setCampaignOptions(options);
      setHasMoreCampaigns(fetchedCampaigns.length >= 15);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
      Toast.show({ type: 'error', text1: "Error", text2: "Failed to load campaigns" });
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleLoadMoreCampaigns = async () => {
    if (loadingCampaigns || loadingMoreCampaigns || !hasMoreCampaigns) return;

    try {
      setLoadingMoreCampaigns(true);
      const nextPage = campaignsPage + 1;
      setCampaignsPage(nextPage);

      const token = await getToken();
      if (!token) return;
      const user = await getUser();
      const orgId = user?.organisation?.id;

      const data = await getCampaignsApi(orgId, nextPage, 15);
      const fetchedCampaigns = data?.campaigns ?? [];
      const newOptions = fetchedCampaigns.map((c: any) => ({
        id: c.id,
        name: c.name,
      }));

      setCampaignOptions((prev) => {
        const existingIds = new Set(prev.map(c => c.id));
        const added = newOptions.filter((c: any) => !existingIds.has(c.id));
        return [...prev, ...added];
      });
      setHasMoreCampaigns(fetchedCampaigns.length >= 15);
    } catch (err) {
      console.error("LOAD MORE CAMPAIGNS ERROR:", err);
    } finally {
      setLoadingMoreCampaigns(false);
    }
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - (layoutMeasurement.height * 2);
    if (isCloseToBottom) {
      handleLoadMoreCampaigns();
    }
  };

  const handleSelectAllCampaigns = async () => {
    try {
      setIsSelectingAll(true);
      const user = await getUser();
      const orgId = user?.organisation?.id || 0;

      const res = await getCampaignsApi(orgId, 1, 100000);
      const allCampaigns = res.campaigns ?? [];
      const allIds = allCampaigns.map((c: any) => c.id);

      if (selectedCampaigns.length === allIds.length && allIds.length > 0) {
        setValue("campaignIds", []);
      } else {
        setValue("campaignIds", allIds);
      }
    } catch (e) {
      console.log("Select All Error: ", e);
    } finally {
      setIsSelectingAll(false);
    }
  };

  /* Fetch campaigns dynamically */
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const { fromCampaign } = useLocalSearchParams<{ fromCampaign?: string }>();

  const onSubmit = async (data: z.infer<typeof contactSchema>) => {
    if (isSubmitting || isCreating) return;
    setIsCreating(true);
    try {
      const newEmail = data.email.trim().toLowerCase();
      const newMobile = data.mobile.trim();

      // Exclude current contact if editing
      const otherEmails = existingEmails.filter(
        (e) => e.toLowerCase() !== editingContact?.email?.toLowerCase(),
      );
      const otherNumbers = existingNumbers.filter(
        (n) => n !== editingContact?.mobile,
      );

      // Check duplicates
      if (otherEmails.includes(newEmail)) {
        Toast.show({ type: 'error', text1: "Error", text2: "Email already exists" });
        return;
      }

      if (otherNumbers.includes(newMobile)) {
        Toast.show({ type: 'error', text1: "Error", text2: "Mobile number already exists" });
        return;
      }

      const token = await getToken();
      if (!token) throw new Error("Authentication token not found");
      const user = await getUser();
      const orgId = user?.organisation?.id;

      if (isEdit) {
        await updateContactApi(orgId, {
          ...data,
          id: editingContact?.id,
        });
        Toast.show({
          type: "success",
          text1: "Contact updated successfully",
        });
      } else {
        await createContactApi(orgId, data);
        Toast.show({
          type: "success",
          text1: "Contact created successfully",
        });
      }

      // create contact from the shareCampaignPost
      if (fromCampaign === "true") {
        router.navigate({ pathname: "/(tabs)/contacts", params: { refresh: Date.now() } });
        setTimeout(() => {
          router.replace("/(tabs)/campaigns/campaignsDetails");
        }, 1);
      } else {
        router.navigate({ pathname: "/(tabs)/contacts", params: { refresh: Date.now() } });
      }
    } catch (error: any) {
      console.error("Contact Error:", error.response || error);
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Dynamic Theme Palette
  const COLORS = {
    screenBg: isDark ? "#121214" : "#f8fafc",
    cardBg: isDark ? "#1e1e24" : "#ffffff",
    cardBorder: isDark ? "#2a2a32" : "#e2e8f0",
    textPrimary: isDark ? "#ffffff" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#475569",
    inputBg: isDark ? "#16161a" : "#fff",
    inputBorder: isDark ? "#2e2e38" : "#cbd5e1",
    inputText: isDark ? "#ffffff" : "#0f172a",
    iconBg: isDark ? "#2a2a32" : "#e2e8f0",
    iconColor: isDark ? "#94a3b8" : "#64748b",
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: COLORS.screenBg }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Navigation & Header row */}
        {/* <View style={styles.topRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: COLORS.cardBg }]}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View> */}

        {/* Hero Section */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <View style={styles.badgeContainer}>
              <Ionicons
                name={isEdit ? "person" : "person-add"}
                size={26}
                color="#fff"
              />
            </View>

            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={[styles.heroTitle, { color: COLORS.textPrimary }]}>
                {isEdit ? "Edit Contact" : "Create Contact"}
              </Text>

              <Text style={[styles.heroSubtitle, { color: COLORS.textSecondary }]}>
                {isEdit
                  ? "Modify and update contact details"
                  : "Manage your contact list and campaign associations"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              height: 40,
              width: 40,
              borderRadius: 20,
              backgroundColor: COLORS.cardBg,
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="close"
              size={20}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: COLORS.cardBorder,
            marginBottom: 16,
          }}
        />

        {/* Form Area */}
        <View>
          {/* Name Field */}
          <View style={styles.fieldBlock}>
            <View style={styles.labelRow}>
              <Text style={[styles.fieldLabel, { color: COLORS.textPrimary }]}>
                Full Name
              </Text>
              <Text style={styles.requiredStar}>*</Text>
            </View>

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: COLORS.inputBg,
                      borderColor: COLORS.inputBorder,
                    },
                  ]}
                >
                  <View style={styles.inputPrefixIcon}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={COLORS.iconColor}
                    />
                  </View>

                  <TextInput
                    placeholder="Enter Your Name"
                    placeholderTextColor={isDark ? "#52525b" : "#94a3b8"}
                    value={value}
                    onChangeText={onChange}
                    style={[styles.textInput, { color: COLORS.inputText }]}
                  />
                </View>
              )}
            />

            {errors.name && (
              <Text style={styles.errorMsg}>{errors.name.message}</Text>
            )}
          </View>

          {/* Email Field */}
          <View style={[styles.fieldBlock, { marginTop: 16 }]}>
            <View style={styles.labelRow}>
              <Text style={[styles.fieldLabel, { color: COLORS.textPrimary }]}>
                Email Address
              </Text>
              <Text style={styles.requiredStar}>*</Text>
            </View>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: COLORS.inputBg,
                      borderColor: COLORS.inputBorder,
                    },
                  ]}
                >
                  <View style={styles.inputPrefixIcon}>
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={COLORS.iconColor}
                    />
                  </View>

                  <TextInput
                    placeholder="e.g. name@domain.com"
                    placeholderTextColor={isDark ? "#52525b" : "#94a3b8"}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.textInput, { color: COLORS.inputText }]}
                  />
                </View>
              )}
            />

            {errors.email && (
              <Text style={styles.errorMsg}>{errors.email.message}</Text>
            )}
          </View>

          {/* Mobile Field */}
          <View style={[styles.fieldBlock, { marginTop: 16 }]}>
            <View style={styles.labelRow}>
              <Text style={[styles.fieldLabel, { color: COLORS.textPrimary }]}>
                Mobile Phone
              </Text>
              <Text style={styles.requiredStar}>*</Text>
            </View>

            <Controller
              control={control}
              name="mobile"
              render={({ field: { onChange, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: COLORS.inputBg,
                      borderColor: COLORS.inputBorder,
                    },
                  ]}
                >
                  <View style={styles.inputPrefixIcon}>
                    <Ionicons
                      name="call-outline"
                      size={18}
                      color={COLORS.iconColor}
                    />
                  </View>

                  <TextInput
                    placeholder="e.g. +91 99999 99999"
                    placeholderTextColor={isDark ? "#52525b" : "#94a3b8"}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    style={[styles.textInput, { color: COLORS.inputText }]}
                  />
                </View>
              )}
            />

            {errors.mobile && (
              <Text style={styles.errorMsg}>{errors.mobile.message}</Text>
            )}
          </View>

          {/* WhatsApp Field */}
          <View style={[styles.fieldBlock, { marginTop: 16 }]}>
            <View style={styles.labelRow}>
              <Text style={[styles.fieldLabel, { color: COLORS.textPrimary }]}>
                WhatsApp Number
              </Text>
            </View>

            <Controller
              control={control}
              name="whatsapp"
              render={({ field: { onChange, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: COLORS.inputBg,
                      borderColor: COLORS.inputBorder,
                    },
                  ]}
                >
                  <View style={styles.inputPrefixIcon}>
                    <Ionicons
                      name="logo-whatsapp"
                      size={18}
                      color={COLORS.iconColor}
                    />
                  </View>

                  <TextInput
                    placeholder="e.g. +91 99999 99999"
                    placeholderTextColor={isDark ? "#52525b" : "#94a3b8"}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    style={[styles.textInput, { color: COLORS.inputText }]}
                  />
                </View>
              )}
            />

            {errors.whatsapp && (
              <Text style={styles.errorMsg}>{errors.whatsapp.message}</Text>
            )}
          </View>

        </View>

        {/* LINKED CAMPAIGNS SECTION */}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            marginTop: 16,
            marginLeft: 4,
            marginRight: 4,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: COLORS.textSecondary,
            }}
          >
            Select Campaigns {selectedCampaigns.length > 0 ? `(${selectedCampaigns.length})` : ""}
          </Text>

          {campaignOptions.length > 0 && (
            <TouchableOpacity onPress={handleSelectAllCampaigns} disabled={isSelectingAll}>
              {isSelectingAll ? (
                <ActivityIndicator size="small" color="#dc2626" />
              ) : (
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#dc2626",
                  }}
                >
                  {selectedCampaigns.length > 0 && selectedCampaigns.length >= campaignOptions.length
                    ? "Deselect All"
                    : "Select All"}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {loadingCampaigns ? (
          <ActivityIndicator
            size="small"
            color="#dc2626"
            style={{ marginTop: 12 }}
          />
        ) : campaignOptions.length === 0 ? (
          <View
            style={{
              marginTop: 12,
              paddingVertical: 28,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
              backgroundColor: COLORS.cardBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="megaphone-outline"
              size={40}
              color={COLORS.iconColor}
            />

            <Text
              style={{
                marginTop: 10,
                fontSize: 16,
                fontWeight: "600",
                color: COLORS.textPrimary,
              }}
            >
              No Campaigns Found
            </Text>

            <Text
              style={{
                marginTop: 4,
                fontSize: 13,
                color: COLORS.textSecondary,
                textAlign: "center",
                paddingHorizontal: 20,
              }}
            >
              Create a campaign first to associate it with this contact.
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/campaigns/createCampaign",
                  params: {
                    returnTo: "/contacts/createContacts",
                  },
                })
              }
              style={{
                marginTop: 16,
                backgroundColor: "#dc2626",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 10,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "600",
                }}
              >
                Create Campaign
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={{
              marginTop: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: COLORS.cardBorder,
              backgroundColor: COLORS.cardBg,
              padding: 8,
              alignItems: "flex-start",
              justifyContent: "center",
            }}
          >
            <View style={styles.chipsContainer}>
              {campaignOptions.map((campaign) => {
                const checked = selectedCampaigns.includes(campaign.id);

                return (
                  <TouchableOpacity
                    key={campaign.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      const current = [...selectedCampaigns];

                      setValue(
                        "campaignIds",
                        checked
                          ? current.filter((id) => id !== campaign.id)
                          : [...current, campaign.id]
                      );
                    }}
                    style={[
                      styles.chipPill,
                      checked
                        ? styles.chipPillSelected
                        : [
                          styles.chipPillUnselected,
                          {
                            backgroundColor: COLORS.inputBg,
                            borderColor: COLORS.inputBorder,
                          },
                        ],
                    ]}
                  >
                    <Ionicons
                      name={
                        checked
                          ? "checkmark-circle"
                          : "add-circle-outline"
                      }
                      size={16}
                      color={checked ? "#ffffff" : COLORS.iconColor}
                      style={{ marginRight: 6 }}
                    />

                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: checked
                            ? "#ffffff"
                            : COLORS.textPrimary,
                        },
                      ]}
                    >
                      {campaign.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {loadingMoreCampaigns && (
                <ActivityIndicator
                  size="small"
                  color="#dc2626"
                  style={{ marginVertical: 12, width: "100%" }}
                />
              )}
            </View>
          </View>
        )}

        {/* Submit Action Block */}
        <TouchableOpacity
          disabled={isSubmitting || isCreating}
          onPress={handleSubmit(onSubmit)}
          style={[styles.submitButton, { marginTop: 24, opacity: (isSubmitting || isCreating) ? 0.6 : 1 }]}
        >
          {isSubmitting || isCreating ? (
            <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
          ) : null}
          <Text style={styles.submitButtonText}>
            {(isSubmitting || isCreating)
              ? isEdit
                ? "Updating Account..."
                : "Registering Contact..."
              : isEdit
                ? "Update Contact"
                : "Create Contact"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  heroLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  badgeContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
    paddingRight: 52,
    lineHeight: 16,
  },
  formCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    gap: 20,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  fieldBlock: {
    gap: 6,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  requiredStar: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "700",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    height: 54,
    paddingHorizontal: 16,
  },
  inputPrefixIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  errorMsg: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
    marginTop: 2,
  },
  centeredLoading: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyCampaignContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCampaignText: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  emptyCampaignSub: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 12,
  },
  campaignBtnCTA: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
  },
  campaignBtnCTAText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chipPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
  },
  chipPillSelected: {
    backgroundColor: "#dc2626",
    borderColor: "#dc2626",
  },
  chipPillUnselected: {
    borderColor: "transparent",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  submitButton: {
    flexDirection: "row",
    height: 56,
    borderRadius: 18,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
