import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Input, InputField, FormControl } from "@gluestack-ui/themed";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useAuth } from "@clerk/clerk-expo";
import {
  createCampaignApi,
  updateCampaignApi,
  getCampaignByIdApi,
} from "@/api/campaignApi";
import { getContactsApi } from "@/api/contactApi";


type Contact = {
  id: number;
  name: string;
  email: string;
};

type CampaignFormValues = {
  id?: number;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  contactIds: number[];
};

export default function CreateCampaign() {
  const router = useRouter();
  // const navigation = useNavigation();
  const { getToken } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const campaignId = id ? Number(id) : undefined;
  const isEditMode = !!campaignId;

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [loadingCampaign, setLoadingCampaign] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const today = new Date();
  const minStartDate = startDateObj && startDateObj > today ? startDateObj : today;

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      description: "",
      contactIds: [],
    },
  });

  const selectedContactIds = watch("contactIds") || [];

  // Fetch campaign if editing
  useEffect(() => {
    if (!isEditMode || !campaignId) return;

    const fetchCampaign = async () => {
      try {
        setLoadingCampaign(true);
        const token = await getToken();
        if (!token) throw new Error("Token missing");

        const res = await getCampaignByIdApi(campaignId);
        const campaign = res.campaign;

        reset({
          name: campaign.name ?? "",
          startDate: campaign.startDate?.split("T")[0] ?? "",
          endDate: campaign.endDate?.split("T")[0] ?? "",
          description: campaign.description ?? "",
          contactIds: campaign.contacts?.map((c: any) => c.id) ?? [],
        });

        if (campaign.startDate) {
          setStartDateObj(new Date(campaign.startDate));
        }
      } catch (err) {
        Alert.alert("Error", "Failed to load campaign");
        router.back();
      } finally {
        setLoadingCampaign(false);
      }
    };

    fetchCampaign();
  }, [isEditMode, campaignId]);

  /* ---------------- FETCH CONTACTS ---------------- */
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoadingContacts(true);
        const token = await getToken();
        if (!token) throw new Error("Token missing");

        const res = await getContactsApi();
        setContacts(
          (res.contacts ?? []).map((c: any) => ({
            id: c.id,
            name: c.contactName ?? "No Name",
            email: c.contactEmail ?? "No Email",
          }))
        );
      } catch {
        Alert.alert("Error", "Failed to load contacts");
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, []);

  const onSubmit: SubmitHandler<CampaignFormValues> = async (data) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Token missing");

      isEditMode && campaignId
        ? await updateCampaignApi(campaignId, data)
        : await createCampaignApi(data);

      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong");
    }
  };

  const toggleContact = (id: number) => {
    setValue(
      "contactIds",
      selectedContactIds.includes(id)
        ? selectedContactIds.filter((x) => x !== id)
        : [...selectedContactIds, id]
    );
  };

  const requiredLabel = (label: string) => (
    <Text className="mt-3 text-base font-semibold text-gray-700 dark:text-gray-300">
      {label} <Text className="text-red-500">*</Text>
    </Text>
  );

  if (loadingCampaign) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-[#161618]">
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-gray-100 dark:bg-[#161618]"
    >
      <ScrollView
        className="flex-1 px-6 py-6"
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Close */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute right-2 z-10 p-2"
        >
          <Ionicons
            name="close"
            size={24}
            color={isDark ? "#cbd5f5" : "#334155"}
          />
        </TouchableOpacity>

        {/* Header */}
        <View className="mb-2 flex-row items-center">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-sky-600">
            <Ionicons name="megaphone" size={28} color="#fff" />
          </View>

          <View className="ml-4">
            <Text className="text-[22px] font-bold text-gray-900 dark:text-white">
              {isEditMode ? "Update Campaign" : "Create Campaign"}
            </Text>
            <Text className="text-sm text-gray-500">
              {isEditMode
                ? "Update campaign details"
                : "Add all campaign details"}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View className="my-3 h-px bg-black dark:bg-white" />

        {/* FORM */}
        <View className="mb-5">
          {/* NAME */}
          <FormControl isInvalid={!!errors.name}>
            <FormControl.Label
              style={{
                marginLeft: 8,
              }}
            >
              {requiredLabel("Name")}
            </FormControl.Label>
            <Controller
              control={control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <Input
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                  }}
                >
                  <InputField
                    placeholder="Enter Name"
                    value={field.value}
                    onChangeText={field.onChange}
                    style={{ color: isDark ? "#f9fafb" : "#111827" }}
                    placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </Input>
              )}
            />
          </FormControl>

          {/* START DATE */}
          <FormControl isInvalid={!!errors.startDate}>
            <FormControl.Label>{requiredLabel("Start Date")}</FormControl.Label>
            <Controller
              control={control}
              name="startDate"
              rules={{ required: "Start Date is required" }}
              render={({ field: { value } }) => (
                <>
                  <TouchableOpacity onPress={() => setShowStartPicker(true)}>
                    <Input style={{ borderColor: "#d1d5db", borderWidth: 1, borderRadius: 12 }}>
                      <InputField value={value} placeholder="YYYY-MM-DD" editable={false} />
                    </Input>
                  </TouchableOpacity>

                  <DateTimePickerModal
                    isVisible={showStartPicker}
                    mode="date"
                    minimumDate={minStartDate} 
                    onConfirm={(date) => {
                      setShowStartPicker(false);
                      setStartDateObj(date);
                      setValue("startDate", date.toISOString().split("T")[0]);
                      setValue("endDate", ""); 
                    }}
                    onCancel={() => setShowStartPicker(false)}
                  />
                </>
              )}
            />
          </FormControl>

          {/* END DATE */}
          <FormControl isInvalid={!!errors.endDate}>
            <FormControl.Label>{requiredLabel("End Date")}</FormControl.Label>
            <Controller
              control={control}
              name="endDate"
              rules={{ required: "End Date is required" }}
              render={({ field: { value } }) => (
                <>
                  <TouchableOpacity onPress={() => setShowEndPicker(true)}>
                    <Input style={{ borderColor: "#d1d5db", borderWidth: 1, borderRadius: 12 }}>
                      <InputField value={value} placeholder="YYYY-MM-DD" editable={false} />
                    </Input>
                  </TouchableOpacity>

                  <DateTimePickerModal
                    isVisible={showEndPicker}
                    mode="date"
                    minimumDate={startDateObj || today}
                    onConfirm={(date) => {
                      setShowEndPicker(false);
                      setValue("endDate", date.toISOString().split("T")[0]);
                    }}
                    onCancel={() => setShowEndPicker(false)}
                  />
                </>
              )}
            />
          </FormControl>

          {/* DESCRIPTION */}
          <FormControl isInvalid={!!errors.description}>
            <FormControl.Label style={{ marginLeft: 8 }}>
              {requiredLabel("Description")}
            </FormControl.Label>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <Input
                  style={{
                    height: 96,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: "#d1d5db",
                    paddingTop: 12,
                  }}
                >
                  <InputField
                    multiline
                    placeholder="Enter Description"
                    value={field.value}
                    onChangeText={field.onChange}
                    style={{
                      textAlignVertical: "top",
                      color: isDark ? "#f9fafb" : "#111827",
                    }}
                    placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </Input>
              )}
            />
          </FormControl>

          {/* CONTACTS */}
          <Text
            style={{
              marginTop: 16,
              marginLeft: 8, 
              fontSize: 16,
              fontWeight: "600",
              color: isDark ? "#e5e7eb" : "#374151",
            }}
          >
            Select Contacts
          </Text>

          {loadingContacts ? (
            <ActivityIndicator size="small" color="#0284c7" style={{ marginTop: 12 }} />
          ) : contacts.length === 0 ? (
            <View
              style={{
                marginTop: 12,
                paddingVertical: 28,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: "#d1d5db",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="people-outline"
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
                No contacts found
              </Text>

              <Text
                style={{
                  fontSize: 13,
                  textAlign: "center",
                  color: isDark ? "#9ca3af" : "#6b7280",
                  paddingHorizontal: 16,
                }}
              >
                Please add contacts before creating a campaign.
              </Text>

              {/* Optional CTA */}
              <TouchableOpacity
                onPress={() => router.push("/contacts/createContact")}
                style={{
                  marginTop: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: "#0284c7",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  + Add Contact
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={{
                marginTop: 8,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: "#d1d5db",
                padding: 12,
              }}
            >
              {contacts.map((c) => {
                const checked = selectedContactIds.includes(c.id);

                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => toggleContact(c.id)}
                    style={{
                      marginVertical: 4,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        marginRight: 12,
                        height: 20,
                        width: 20,
                        borderRadius: 6,
                        borderWidth: 1,
                        borderColor: "#d1d5db",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {checked && (
                        <Ionicons
                          name="checkmark-outline"
                          size={16}
                          color="#0284c7"
                        />
                      )}
                    </View>

                    <View
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "500",
                          color: isDark ? "#f3f4f6" : "#374151",
                        }}
                      >
                        {c.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: isDark ? "#9ca3af" : "#6b7280",
                        }}
                      >
                        {c.email}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* SUBMIT */}
        <TouchableOpacity
          disabled={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          className="w-full mt-5 mb-10 rounded-xl items-center justify-center py-4 bg-sky-600"
          style={{
            // backgroundColor: "#dc2626",
            paddingVertical: 16,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Text className="text-lg font-semibold text-white">
            {isSubmitting
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
                ? "Update Campaign"
                : "Create Campaign"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>

  );
}
