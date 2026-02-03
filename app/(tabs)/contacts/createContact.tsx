import {
  createContactApi,
  updateContactApi,
} from "@/api/contactApi";
import { getCampaignsApi } from "@/api/campaignApi";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { FormControl, Input, InputField } from "@gluestack-ui/themed";
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
} from "react-native";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { View } from "lucide-react-native";

type Contact = {
  id?: number;
  name: string;
  email: string;
  mobile: string;
  whatsapp: string;
  campaignIds: number[];
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
  } = useForm<Contact>({
    defaultValues: {
      name: "",
      email: "",
      mobile: "",
      whatsapp: "",
      campaignIds: [],
    },
    mode: "onChange",
  });

  const selectedCampaigns = watch("campaignIds");
  const hasResetRef = useRef(false);

  /* Populate form if editing */
  useEffect(() => {
    if (!editingContact || hasResetRef.current) return;

    reset({
      name: editingContact.name ?? "",
      email: editingContact.email ?? "",
      mobile: editingContact.mobile ?? "",
      whatsapp: editingContact.whatsapp ?? "",
      campaignIds: editingContact.campaigns
        ? editingContact.campaigns.map((c) => c.id)
        : editingContact.campaignIds ?? [],
    });

    hasResetRef.current = true;
  }, [editingContact, reset]);

  /* Fetch campaigns dynamically */
  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoadingCampaigns(true);
      try {
        const token = await getToken();
        if (!token) throw new Error("Token missing");

        const data = await getCampaignsApi(1, 50);
        const options =
          data?.campaigns?.map((c: any) => ({ id: c.id, name: c.name })) ?? [];
        setCampaignOptions(options);
      } catch (err) {
        console.error("Failed to load campaigns:", err);
        Alert.alert("Error", "Failed to load campaigns");
      } finally {
        setLoadingCampaigns(false);
      }
    };

    fetchCampaigns();
  }, []);

  const onSubmit = async (data: Contact) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication token not found");

      if (isEdit) {
        await updateContactApi(Number(contactId), data);
        Alert.alert("Success", "Contact updated successfully");
      } else {
        await createContactApi(data);
        Alert.alert("Success", "Contact created successfully");
      }

      router.back();
    } catch (error: any) {
      console.error("Contact Error:", error.response || error);
      Alert.alert("Error", error.message || "Something went wrong");
    }
  };

  const requiredLabel = (label: string) => (
    <ThemedText
      style={{
        fontSize: 14,
        fontWeight: "600",
        marginTop: 12,
        color: isDark ? "#e5e7eb" : "#111",
      }}
    >
      {label} <ThemedText style={{ color: "#ef4444" }}>*</ThemedText>
    </ThemedText>
  );

  // ✅ Dynamic colors for light/dark
  const inputBg = isDark ? "#161618" : "#f3f4f6";
  const inputBorder = isDark ? "#fff" : "#d1d5db";
  const inputText = isDark ? "#fff" : "#111";
  const labelText = isDark ? "#f3f4f6" : "#111";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
    >
      <ScrollView className="flex-1 px-6 py-6" keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: "absolute", right: 10, zIndex: 10, padding: 8 }}
        >
          <Ionicons name="close" size={24} color={isDark ? "#fff" : "#111"} />
        </TouchableOpacity>

        {/* Header */}
        <ThemedView
          className="flex-row items-center"
          style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
        >
          <ThemedView
            className="w-14 h-14 rounded-lg border-transparent items-center justify-center"
            style={{ backgroundColor: "#dc2626" }}
          >
            <Ionicons name={isEdit ? "person" : "person-add"} size={28} color="#fff" />
          </ThemedView>

          <ThemedView
            className="ml-4 p-4 rounded-lg"
            style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}
          >
            <ThemedText
              style={{
                fontSize: 22,
                fontWeight: "700",
                color: isDark ? "#f3f4f6" : "#111",
                marginLeft: 8,
              }}
            >
              {isEdit ? "Edit Contact" : "Create Contact"}
            </ThemedText>
            <ThemedText
              className="text-sm mt-1"
              style={{ color: isDark ? "#d1d5db" : "#6b7280", marginLeft: 8 }}
            >
              {isEdit ? "Update the contact details" : "Add a new contact to your list"}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Divider */}
        <ThemedView
          style={{
            height: 1,
            backgroundColor: isDark ? "#ffffff" : "#000",
            marginVertical: 12,
          }}
        />

        {/* Form Fields */}
        <ThemedView className="space-y-6" style={{ backgroundColor: isDark ? "#161618" : "#f3f4f6" }}>
          {/* Name */}
          <FormControl isInvalid={!!errors.name}>
            <FormControl.Label style={{ marginLeft: 8 }}>
              {requiredLabel("Name")}
            </FormControl.Label>
            <Controller
              control={control}
              name="name"
              rules={{
                required: "Name is required",
                minLength: { value: 3, message: "Minimum 3 letters" },
                pattern: { value: /^[A-Za-z\s]+$/i, message: "Only letters allowed" },
              }}
              render={({ field: { onChange, value } }) => (
                <Input
                  size="md"
                  style={{
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    borderWidth: 1,
                    borderRadius: 999,
                  }}
                >
                  <InputField
                    placeholder="Enter Name"
                    value={value}
                    onChangeText={onChange}
                    style={{ color: inputText }}
                    placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </Input>
              )}
            />
            {errors.name && (
              <Text className="text-red-500 text-xs mt-1">{errors.name.message}</Text>
            )}
          </FormControl>

          {/* Email */}
          <FormControl isInvalid={!!errors.email}>
            <FormControl.Label style={{ marginLeft: 8 }}>
              {requiredLabel("Email")}
            </FormControl.Label>
            <Controller
              control={control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" },
              }}
              render={({ field: { onChange, value } }) => (
                <Input
                  style={{
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    borderWidth: 1,
                    borderRadius: 999,
                  }}
                >
                  <InputField
                    placeholder="Enter Email"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{ color: inputText }}
                    placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </Input>
              )}
            />
            {errors.email && (
              <Text className="text-red-500 text-xs mt-1">{errors.email.message}</Text>
            )}
          </FormControl>

          {/* Mobile */}
          <FormControl isInvalid={!!errors.mobile}>
            <FormControl.Label style={{ marginLeft: 8 }}>
              {requiredLabel("Mobile")}
            </FormControl.Label>
            <Controller
              control={control}
              name="mobile"
              rules={{
                required: "Mobile is required",
                pattern: { value: /^\d{7,15}$/, message: "Not a valid number" },
              }}
              render={({ field: { onChange, value } }) => (
                <Input
                  style={{
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    borderWidth: 1,
                    borderRadius: 999,
                  }}
                >
                  <InputField
                    placeholder="Enter Mobile"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    style={{ color: inputText }}
                    placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </Input>
              )}
            />
            {errors.mobile && (
              <Text className="text-red-500 text-xs mt-1">{errors.mobile.message}</Text>
            )}
          </FormControl>

          {/* WhatsApp */}
          <FormControl isInvalid={!!errors.whatsapp}>
            <FormControl.Label style={{ marginLeft: 8 }}>
              {requiredLabel("WhatsApp")}
            </FormControl.Label>
            <Controller
              control={control}
              name="whatsapp"
              rules={{
                required: "WhatsApp is required",
                pattern: { value: /^\d{10,15}$/, message: "Not a valid number" },
              }}
              render={({ field: { onChange, value } }) => (
                <Input
                  style={{
                    backgroundColor: inputBg,
                    borderColor: inputBorder,
                    borderWidth: 1,
                    borderRadius: 999,
                  }}
                >
                  <InputField
                    placeholder="Enter WhatsApp"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    style={{ color: inputText }}
                    placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </Input>
              )}
            />
            {errors.whatsapp && (
              <Text className="text-red-500 text-xs mt-1">{errors.whatsapp.message}</Text>
            )}
          </FormControl>

          {/* Associate with Campaigns */}
          <FormControl>
            <FormControl.Label>
              <Text
                className="text-base mt-3 font-semibold"
                style={{ color: labelText, marginLeft: 8 }}
              >
                Associate with Campaigns
              </Text>
            </FormControl.Label>

            {loadingCampaigns ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : campaignOptions.length === 0 ? (
              <ThemedView
                style={{
                  marginTop: 12,
                  paddingVertical: 28,
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: inputBorder,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isDark ? "#161618" : "#f3f4f6",
                }}
              >
                <Ionicons
                  name="megaphone-outline"
                  size={32}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                  style={{ marginBottom: 8 }}
                />

                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: isDark ? "#e5e7eb" : "#374151",
                    marginBottom: 4,
                  }}
                >
                  No campaigns found
                </Text>

                <Text
                  style={{
                    fontSize: 13,
                    textAlign: "center",
                    color: isDark ? "#9ca3af" : "#6b7280",
                    paddingHorizontal: 20,
                  }}
                >
                  Create a campaign first to attach it here.
                </Text>

                {/* Optional CTA */}
                <TouchableOpacity
                  onPress={() => router.push("/campaigns/createCampaign")}
                  style={{
                    marginTop: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: "#dc2626",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    + Create Campaign
                  </Text>
                </TouchableOpacity>
              </ThemedView>
            ) : (
              <ThemedView
                className="border p-4"
                style={{
                  borderColor: inputBorder,
                  backgroundColor: isDark ? "#161618" : "#f3f4f6",
                  borderRadius: 24,
                }}
              >
                {campaignOptions.map((campaign) => {
                  const checked = selectedCampaigns.includes(campaign.id);
                  return (
                    <TouchableOpacity
                      key={campaign.id}
                      onPress={() => {
                        const current = [...selectedCampaigns];
                        setValue(
                          "campaignIds",
                          checked
                            ? current.filter((id) => id !== campaign.id)
                            : [...current, campaign.id]
                        );
                      }}
                      className="flex-row items-center my-2"
                    >
                      <ThemedView
                        style={{
                          marginRight: 12,
                          height: 20,
                          width: 20,
                          borderRadius: 6,
                          borderWidth: 1,
                          borderColor: "#d1d5db",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: inputBg,
                        }}
                      >
                        {checked && (
                          <Ionicons name="checkmark-outline" size={16} color="#dc2626" />
                        )}
                      </ThemedView>

                      <Text
                        style={{
                          color: inputText,
                          flexShrink: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Text className="font-medium text-gray-700 dark:text-gray-200">
                          {campaign.name}
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ThemedView>
            )}
          </FormControl>

        </ThemedView>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          className="w-full mt-5 mb-10 rounded-xl items-center justify-center py-4"
          style={{
            backgroundColor: "#dc2626",
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 12,
            elevation: 6,
          }}
          disabled={isSubmitting}
        >
          <Text className="text-white font-semibold text-lg">
            {isSubmitting
              ? isEdit
                ? "Updating..."
                : "Creating..."
              : isEdit
                ? "Update Contact"
                : "Create Contact"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
