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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Input, InputField, FormControl } from "@gluestack-ui/themed";
import { useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useAuth } from "@clerk/clerk-expo";
import {
  createCampaignApi,
  updateCampaignApi,
  getCampaignByIdApi,
} from "@/api/campaign/campaignApi";
import { getContactsApi } from "@/api/contact/contactApi";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

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
  const navigation = useNavigation();
  const { getToken } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const campaignId = id ? Number(id) : undefined;
  const isEditMode = !!campaignId;

  const [loadingCampaign, setLoadingCampaign] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const today = new Date();

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
    mode: "onChange",
  });

  const selectedContactIds = watch("contactIds") || [];

  // Fetch campaign if editing
  useEffect(() => {
    if (!isEditMode || !campaignId) return;

    const fetchCampaign = async () => {
      try {
        setLoadingCampaign(true);
        const token = await getToken();
        if (!token) throw new Error("Authentication token not found");

        const response = await getCampaignByIdApi(campaignId, token);
        const campaign = response.campaign;

        reset({
          name: campaign.name ?? "",
          startDate: campaign.startDate?.split("T")[0] ?? "",
          endDate: campaign.endDate?.split("T")[0] ?? "",
          description: campaign.description ?? "",
          contactIds: campaign.contacts?.map((c: any) => c.id) ?? [],
        });

        if (campaign.startDate) setStartDateObj(new Date(campaign.startDate));
      } catch (error) {
        console.error("Fetch Campaign Error:", error);
        Alert.alert("Error", "Failed to load campaign data");
        router.back();
      } finally {
        setLoadingCampaign(false);
      }
    };

    fetchCampaign();
  }, [isEditMode, campaignId]);

  // Fetch all contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoadingContacts(true);
        const token = await getToken();
        if (!token) throw new Error("Token missing");

        const res = await getContactsApi(token);
        // Map API fields to name/email
        const mappedContacts = (res.contacts ?? []).map((c: any) => ({
          id: c.id,
          name: c.contactName ?? "No Name",
          email: c.contactEmail ?? "No Email",
        }));
        setContacts(mappedContacts);
      } catch (err) {
        console.error("Failed to fetch contacts:", err);
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
      if (!token) throw new Error("Authentication token not found");

      if (isEditMode && campaignId) {
        await updateCampaignApi(campaignId, data, token);
      } else {
        await createCampaignApi(data, token);
      }

      router.back();
    } catch (error: any) {
      console.error("Campaign Submit Error:", error);
      Alert.alert("Error", error.message || "Something went wrong");
    }
  };

  const toggleContact = (contactId: number) => {
    const newSelection = selectedContactIds.includes(contactId)
      ? selectedContactIds.filter((id) => id !== contactId)
      : [...selectedContactIds, contactId];
    setValue("contactIds", newSelection);
  };

  const requiredLabel = (label: string) => (
    <Text style={{ fontSize: 16, fontWeight: "600", marginTop: 12, color: "#374151" }}>
      {label} <Text style={{ color: "red" }}>*</Text>
    </Text>
  );

  if (loadingCampaign) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb" }}>
        <ActivityIndicator size="large" color="#0284c7" />
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
    >
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 24 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Close Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ position: "absolute", right: 10, zIndex: 10, padding: 8 }}
        >
          <Ionicons name="close" size={24} color="#334155" />
        </TouchableOpacity>

        {/* Header */}
        <ThemedView style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <ThemedView style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "#0284c7", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="megaphone" size={28} color="#fff" />
          </ThemedView>
          <ThemedView style={{ marginLeft: 16 }}>
            <ThemedText style={{ fontSize: 22, fontWeight: "700", color: "#111827" }}>
              {isEditMode ? "Update Campaign" : "Create Campaign"}
            </ThemedText>
            <ThemedText style={{ fontSize: 14, color: "#6b7280" }}>
              {isEditMode ? "Update campaign details" : "Add all campaign details"}
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Form Fields */}
        <ThemedView style={{ marginBottom: 20 }}>
          {/* Name */}
          <FormControl isInvalid={!!errors.name}>
            <FormControl.Label>{requiredLabel("Name")}</FormControl.Label>
            <Controller
              control={control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field: { onChange, value } }) => (
                <Input style={{ borderColor: "#d1d5db", borderWidth: 1, borderRadius: 12 }}>
                  <InputField
                    value={value}
                    placeholder="Enter Name"
                    onChangeText={onChange}
                  />
                </Input>
              )}
            />
          </FormControl>

          {/* Start Date */}
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
                    minimumDate={today}
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

          {/* End Date */}
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

          {/* Description */}
          <FormControl isInvalid={!!errors.description}>
            <FormControl.Label>{requiredLabel("Description")}</FormControl.Label>
            <Controller
              control={control}
              name="description"
              rules={{ required: "Description is required" }}
              render={({ field: { onChange, value } }) => (
                <Input style={{ borderColor: "#d1d5db", borderWidth: 1, borderRadius: 12, height: 90 }}>
                  <InputField
                    multiline
                    value={value}
                    placeholder="Enter Description"
                    onChangeText={onChange}
                    style={{ textAlignVertical: "top" }}
                  />
                </Input>
              )}
            />
          </FormControl>

          {/* Select Contacts */}
          <FormControl>
            <FormControl.Label>
              <ThemedText style={{ fontSize: 16, fontWeight: "600", marginTop: 12, color: "#374151" }}>
                Select Contacts
              </ThemedText>
            </FormControl.Label>

            {loadingContacts ? (
              <ActivityIndicator size="small" color="#0284c7" />
            ) : contacts.length === 0 ? (
              <ThemedText>No contacts available</ThemedText>
            ) : (
              <ThemedView style={{ borderColor: "#d1d5db", borderWidth: 1, borderRadius: 12, padding: 12 }}>
                {contacts.map((contact) => {
                  const checked = selectedContactIds.includes(contact.id);
                  return (
                    <TouchableOpacity
                      key={contact.id}
                      onPress={() => toggleContact(contact.id)}
                      style={{ flexDirection: "row", alignItems: "center", marginVertical: 6 }}
                    >
                      {/* Checkbox */}
                      <ThemedView
                        style={{
                          width: 20,
                          height: 20,
                          marginRight: 12,
                          borderColor: "#d1d5db",
                          borderWidth: 1,
                          borderRadius: 4,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {checked && <Ionicons name="checkmark-outline" size={16} color="#0284c7" />}
                      </ThemedView>

                      {/* Name + Email Row */}
                      <ThemedView style={{ flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <ThemedText style={{ color: "#374151", fontWeight: "500" }}>{contact.name}</ThemedText>
                        <ThemedText style={{ color: "#6b7280", fontSize: 14 }}>{contact.email}</ThemedText>
                      </ThemedView>
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
          style={{
            width: "100%",
            marginTop: 40,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 16,
            backgroundColor: "#0284c7",
          }}
          disabled={isSubmitting || loadingCampaign}
        >
          <ThemedText style={{ color: "#fff", fontWeight: "600", fontSize: 18 }}>
            {isSubmitting ? (isEditMode ? "Updating..." : "Creating...") : isEditMode ? "Update Campaign" : "Create Campaign"}
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
