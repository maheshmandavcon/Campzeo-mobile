import {
  createContactApi,
  updateContactApi,
} from "@/api/contact/contactApi";
import { getCampaignsApi } from "@/api/campaign/campaignApi";
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
        ? editingContact.campaigns.map(c => c.id)
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

        const data = await getCampaignsApi(token, 1, 50);
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
        await updateContactApi(Number(contactId), data, token);
        Alert.alert("Success", "Contact updated successfully");
      } else {
        await createContactApi(data, token);
        Alert.alert("Success", "Contact created successfully");
      }

      router.back();
    } catch (error: any) {
      console.error("Contact Error:", error.response || error);
      Alert.alert("Error", error.message || "Something went wrong");
    }
  };

  const requiredLabel = (label: string) => (
    <Text
      className="text-base mt-3 font-semibold"
      style={{ color: isDark ? "#f3f4f6" : "#111" }}
    >
      {label} <Text className="text-red-500">*</Text>
    </Text>
  );

  // ✅ Dynamic colors for light/dark
  const inputBg = isDark ? "#161618" : "#fff";
  const inputBorder = isDark ? "#4b5563" : "#d1d5db";
  const inputText = isDark ? "#fff" : "#111";
  const labelText = isDark ? "#f3f4f6" : "#111";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: isDark ? "#161618" : "#fff" }}
    >
      <ScrollView
        className="flex-1 px-6 py-6"
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: "absolute", right: 10, zIndex: 10, padding: 8 }}
        >
          <Ionicons
            name="close"
            size={24}
            color={isDark ? "#fff" : "#111"}
          />
        </TouchableOpacity>

        <ThemedView className="flex-row items-center"
          style={{
            backgroundColor: isDark ? "#161618" : "#fff",
          }}>
          <ThemedView
            className="w-14 h-14 rounded-lg border-transparent items-center justify-center"
            style={{ backgroundColor: "#dc2626" }} // red icon background
          >
            <Ionicons
              name={isEdit ? "person" : "person-add"}
              size={28}
              color="#fff"
            />
          </ThemedView>

          <ThemedView
            className="ml-4 p-4 rounded-lg"
            style={{
              backgroundColor: isDark ? "#161618" : "#fff",
            }}
          >
            <ThemedText
              className="text-2xl font-bold"
              style={{ color: isDark ? "#f3f4f6" : "#111" }}
            >
              {isEdit ? "Edit Contact" : "Create Contact"}
            </ThemedText>
            <ThemedText
              className="text-sm mt-1"
              style={{ color: isDark ? "#d1d5db" : "#6b7280" }}
            >
              {isEdit
                ? "Update the contact details"
                : "Add a new contact to your list"}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView
          style={{
            height: 1, // thickness of the line
            backgroundColor: isDark ? "#ffffff" : "#fff", // white in dark mode
            marginVertical: 12, // space above and below
          }}
        />
        <ThemedView className="space-y-6"
          style={{
            backgroundColor: isDark ? "#161618" : "#fff",
          }}>
          {/* Name */}
          <FormControl isInvalid={!!errors.name}>
            <FormControl.Label>{requiredLabel("Name")}</FormControl.Label>
            <Controller
              control={control}
              name="name"
              rules={{
                required: "Name is required",
                minLength: { value: 3, message: "Minimum 3 letters" },
                pattern: {
                  value: /^[A-Za-z\s]+$/i,
                  message: "Only letters allowed",
                },
              }}
              render={({ field: { onChange, value } }) => (
                <Input style={{ backgroundColor: inputBg, borderColor: inputBorder }}>
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
              <Text className="text-red-500 text-xs mt-1">
                {errors.name.message}
              </Text>
            )}
          </FormControl>

          {/* Email */}
          <FormControl isInvalid={!!errors.email}>
            <FormControl.Label>{requiredLabel("Email")}</FormControl.Label>
            <Controller
              control={control}
              name="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email",
                },
              }}
              render={({ field: { onChange, value } }) => (
                <Input style={{ backgroundColor: inputBg, borderColor: inputBorder }}>
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
              <Text className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </Text>
            )}
          </FormControl>

          {/* Mobile */}
          <FormControl isInvalid={!!errors.mobile}>
            <FormControl.Label>{requiredLabel("Mobile")}</FormControl.Label>
            <Controller
              control={control}
              name="mobile"
              rules={{
                required: "Mobile is required",
                pattern: {
                  value: /^\d{7,15}$/,
                  message: "Not a valid number",
                },
              }}
              render={({ field: { onChange, value } }) => (
                <Input style={{ backgroundColor: inputBg, borderColor: inputBorder }}>
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
              <Text className="text-red-500 text-xs mt-1">
                {errors.mobile.message}
              </Text>
            )}
          </FormControl>

          {/* WhatsApp */}
          <FormControl isInvalid={!!errors.whatsapp}>
            <FormControl.Label>{requiredLabel("WhatsApp")}</FormControl.Label>
            <Controller
              control={control}
              name="whatsapp"
              rules={{
                required: "WhatsApp is required",
                pattern: {
                  value: /^\d{10,15}$/,
                  message: "Not a valid number",
                },
              }}
              render={({ field: { onChange, value } }) => (
                <Input style={{ backgroundColor: inputBg, borderColor: inputBorder }}>
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
              <Text className="text-red-500 text-xs mt-1">
                {errors.whatsapp.message}
              </Text>
            )}
          </FormControl>

          {/* Associate with Campaigns */}
          <FormControl>
            <FormControl.Label>
              <Text className="text-base mt-3 font-semibold" style={{ color: labelText }}>
                Associate with Campaigns
              </Text>
            </FormControl.Label>

            {loadingCampaigns ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : campaignOptions.length === 0 ? (
              <Text style={{ color: labelText }}>No campaigns available</Text>
            ) : (
              <ThemedView
                className="border rounded-lg p-4"
                style={{ borderColor: inputBorder, backgroundColor: inputBg }}
              >
                {campaignOptions.map((campaign) => {
                  const checked = selectedCampaigns.includes(campaign.id);
                  return (
                    <TouchableOpacity
                      key={campaign.id}
                      onPress={() => {
                        const current = [...selectedCampaigns];
                        if (checked) {
                          setValue(
                            "campaignIds",
                            current.filter((id) => id !== campaign.id)
                          );
                        } else {
                          setValue("campaignIds", [...current, campaign.id]);
                        }
                      }}
                      className="flex-row items-center my-2"
                    >
                      <ThemedView
                        className="w-5 h-5 mr-3 border rounded items-center justify-center"
                        style={{ borderColor: inputBorder }}
                      >
                        {checked && (
                          <Ionicons name="checkmark-outline" size={16} color="#dc2626" />
                        )}
                      </ThemedView>
                      <ThemedText
                        style={{
                          color: inputText,
                          flexShrink: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        {campaign.name}
                      </ThemedText>
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
