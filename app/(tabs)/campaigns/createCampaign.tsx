import {
  createCampaignApi,
  getCampaignByIdApi,
  getPostsByCampaignIdApi,
  updateCampaignApi,
} from "@/api/campaignApi";
import { getContactsApi } from "@/api/contactApi";
import { getUser } from "@/api/dashboardApi";
import { getToken, useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Toast from "react-native-toast-message";

type CampaignPost = {
  id: number;
  scheduledPostTime: string;
};

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
  const { Id } = useLocalSearchParams();
  const campaignId = Number(Id);
  const isEditMode = campaignId ? true : false;

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const COLORS = {
    screenBg: isDark ? "#121214" : "#f8fafc",
    cardBg: isDark ? "#1e1e24" : "#ffffff",
    cardBorder: isDark ? "#2a2a32" : "#e2e8f0",
    textPrimary: isDark ? "#ffffff" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    inputBg: isDark ? "#1e1e24" : "#ffffff",
    inputBorder: isDark ? "#2a2a32" : "#cbd5e1",
    inputText: isDark ? "#ffffff" : "#0f172a",
    newButtonBg: "#0284c7",
    newButtonText: "#ffffff",
  };

  const [loadingCampaign, setLoadingCampaign] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const today = new Date();
  const minStartDate =
    startDateObj && startDateObj > today ? startDateObj : today;

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

  // const [posts, setPosts] = useState<CampaignPost[]>([]);

  // --- LOG POSTS TO CONSOLE ---
  // useEffect(() => {
  //   if (posts.length > 0) {
  //     console.log("Scheduled posts:", posts);
  //     posts.forEach((post) => {
  //       console.log(
  //         `Post ID: ${post.id}, Scheduled Time: ${new Date(
  //           post.scheduledPostTime
  //         ).toLocaleString()}`
  //       );
  //     });
  //   }
  // }, [posts]);

  // Minimum end date based on scheduled posts
  // const minEndDate = React.useMemo(() => {
  //   if (!posts || posts.length === 0) return startDateObj || today;

  //   // Find the latest scheduled post date
  //   const latestPostDate = posts.reduce((latest, post) => {
  //     const postDate = new Date(post.scheduledPostTime);
  //     return postDate > latest ? postDate : latest;
  //   }, new Date(posts[0].scheduledPostTime));

  //   return latestPostDate;
  // }, [posts, startDateObj]);

  const fetchCampaign = async () => {
    try {
      setLoadingCampaign(true);
      const token = await getToken();
      if (!token) throw new Error("Token missing");
      const user = await getUser();
      const orgId = user?.organisation?.id;      
      const res = await getCampaignByIdApi(campaignId, orgId, token);
      
      const campaign = res;

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

      const postsRes = await getPostsByCampaignIdApi(campaign?.id, orgId);

      // const postsArray = Array.isArray(postsRes)
      //   ? postsRes
      //   : (postsRes.posts ?? []);

      // console.log("Setting posts array:", postsArray);

      // setPosts(postsArray);
    } catch (err) {
      Alert.alert("Error", "Failed to load campaign");
      router.back();
    } finally {
      setLoadingCampaign(false);
    }
  };

  // Fetch campaign if editing
  useEffect(() => {
    if (!isEditMode || !campaignId) return;

    fetchCampaign();
  }, [isEditMode, campaignId]);

  /* ---------------- FETCH CONTACTS ---------------- */
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoadingContacts(true);
        const token = await getToken();
        if (!token) throw new Error("Token missing");
        const user = await getUser();
        const orgId = user?.organisation?.id;
        const res = await getContactsApi(orgId);
        setContacts(
          (res.contacts ?? []).map((c: any) => ({
            id: c.id,
            name: c.contactName ?? "No Name",
            email: c.contactEmail ?? "No Email",
          })),
        );
      } catch {
        Alert.alert("Error", "Failed to load contacts");
      } finally {
        setLoadingContacts(false);
      }
    };

    fetchContacts();
  }, []);

  // const hasInvalidPostDates = (startDate: string, endDate: string) => {
  //   if (!startDate || !endDate) return false;

  //   const start = new Date(startDate);
  //   const end = new Date(endDate);

  //   // Set end date to the end of the day to include all posts on that date
  //   end.setHours(23, 59, 59, 999);

  //   return posts.some((post) => {
  //     const postDate = new Date(post.scheduledPostTime);
  //     return postDate < start || postDate > end;
  //   });
  // };

  const onSubmit: SubmitHandler<CampaignFormValues> = async (data) => {
    if (isSubmitting) return;

    try {
      const token = await getToken();
      if (!token) throw new Error("Token missing");

      // 🔒 LOCK DATE CHANGE IF POSTS EXIST
      // if (isEditMode && posts.length > 0) {
      //   const invalid = hasInvalidPostDates(data.startDate, data.endDate);

      //   if (invalid) {
      //     // Find the latest scheduled post
      //     const latestPostDate = posts.reduce((latest, post) => {
      //       const postDate = new Date(post.scheduledPostTime);
      //       return postDate > latest ? postDate : latest;
      //     }, new Date(posts[0].scheduledPostTime));

      //     Alert.alert(
      //       "Date change not allowed",
      //       `Some posts are scheduled outside this date range.\n\n` +
      //         `Latest scheduled post is on ${latestPostDate.toLocaleDateString()}`,
      //     );
      //     return;
      //   }
      // }
      const user = await getUser();
      const orgId = user?.organisation?.id || 0;

      const fullData = {
        ...data,
        organisationId: orgId,
      };
      const updatePayload = {
        contactIds: data.contactIds,
        description: data.description,
        endDate: data.endDate,
        id: campaignId,
        name: data.name,
        organisationId: orgId,
        startDate: data.startDate,
      }
      isEditMode
        ? await updateCampaignApi(updatePayload, token)
        : await createCampaignApi(fullData, token);
      router.replace("/campaigns");
      Toast.show({
        type: "success",
        text1: `Campaign ${isEditMode ? "updated" : "created"} successfully`,
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: err.message || "Something went wrong",
      });
    }
  };

  const toggleContact = (id: number) => {
    setValue(
      "contactIds",
      selectedContactIds.includes(id)
        ? selectedContactIds.filter((x) => x !== id)
        : [...selectedContactIds, id],
    );
  };

  const requiredLabel = (label: string) => (
    <Text
      style={{
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.textSecondary,
        marginBottom: 8,
        marginTop: 12,
      }}
    >
      {label} <Text style={{ color: "#ef4444" }}>*</Text>
    </Text>
  );

  if (loadingCampaign) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.screenBg,
        }}
      >
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: COLORS.screenBg }}
    >
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                height: 52,
                width: 52,
                borderRadius: 16,
                backgroundColor: "#0284c7",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#0284c7",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Ionicons name="megaphone" size={24} color="#fff" />
            </View>

            <View style={{ marginLeft: 14 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "900",
                  color: COLORS.textPrimary,
                }}
              >
                {isEditMode ? "Update Campaign" : "Create Campaign"}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: COLORS.textSecondary,
                  marginTop: 2,
                }}
              >
                {isEditMode
                  ? "Modify campaign settings"
                  : "Launch a new campaign"}
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
            <Ionicons name="close" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: COLORS.cardBorder,
            marginBottom: 16,
          }}
        />

        {/* FORM */}
        <View>
          {/* NAME */}
          <View style={{ marginBottom: 16 }}>
            {requiredLabel("Name")}
            <Controller
              control={control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: COLORS.inputBg,
                    borderWidth: 1,
                    borderColor: errors.name ? "#ef4444" : COLORS.inputBorder,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    height: 50,
                  }}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={COLORS.textSecondary}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    placeholder="Campaign Name"
                    value={field.value}
                    onChangeText={field.onChange}
                    style={{
                      flex: 1,
                      color: COLORS.inputText,
                      fontSize: 15,
                      fontWeight: "600",
                      height: "100%",
                      padding: 0,
                    }}
                    placeholderTextColor={isDark ? "#52525b" : "#94a3b8"}
                  />
                </View>
              )}
            />
            {errors.name && (
              <Text
                style={{
                  color: "#ef4444",
                  fontSize: 12,
                  marginTop: 4,
                  marginLeft: 4,
                }}
              >
                {errors.name.message}
              </Text>
            )}
          </View>

          {/* START DATE */}
          <View style={{ marginBottom: 16 }}>
            {requiredLabel("Start Date")}
            <Controller
              control={control}
              name="startDate"
              rules={{ required: "Start Date is required" }}
              render={({ field: { value } }) => (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: COLORS.inputBg,
                      borderWidth: 1,
                      borderColor: errors.startDate
                        ? "#ef4444"
                        : COLORS.inputBorder,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      height: 50,
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={COLORS.textSecondary}
                      style={{ marginRight: 10 }}
                    />
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        height: "100%",
                      }}
                      onPress={() => setShowStartPicker(true)}
                    >
                      <Text
                        style={{
                          color: value
                            ? COLORS.inputText
                            : isDark
                              ? "#52525b"
                              : "#94a3b8",
                          fontSize: 15,
                          fontWeight: "600",
                        }}
                      >
                        {value || "YYYY-MM-DD"}
                      </Text>
                    </TouchableOpacity>

                    {value ? (
                      <TouchableOpacity
                        onPress={() => {
                          setValue("startDate", "");
                          setValue("endDate", "");
                          setStartDateObj(null);
                        }}
                      >
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={COLORS.textSecondary}
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>

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
            {errors.startDate && (
              <Text
                style={{
                  color: "#ef4444",
                  fontSize: 12,
                  marginTop: 4,
                  marginLeft: 4,
                }}
              >
                {errors.startDate.message}
              </Text>
            )}
          </View>

          {/* END DATE */}
          <View style={{ marginBottom: 16 }}>
            {requiredLabel("End Date")}
            <Controller
              control={control}
              name="endDate"
              rules={{ required: "End Date is required" }}
              render={({ field: { value } }) => (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: COLORS.inputBg,
                      borderWidth: 1,
                      borderColor: errors.endDate
                        ? "#ef4444"
                        : COLORS.inputBorder,
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      height: 50,
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={COLORS.textSecondary}
                      style={{ marginRight: 10 }}
                    />
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        justifyContent: "center",
                        height: "100%",
                      }}
                      onPress={() => setShowEndPicker(true)}
                    >
                      <Text
                        style={{
                          color: value
                            ? COLORS.inputText
                            : isDark
                              ? "#52525b"
                              : "#94a3b8",
                          fontSize: 15,
                          fontWeight: "600",
                        }}
                      >
                        {value || "YYYY-MM-DD"}
                      </Text>
                    </TouchableOpacity>

                    {value ? (
                      <TouchableOpacity onPress={() => setValue("endDate", "")}>
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={COLORS.textSecondary}
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>

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
            {errors.endDate && (
              <Text
                style={{
                  color: "#ef4444",
                  fontSize: 12,
                  marginTop: 4,
                  marginLeft: 4,
                }}
              >
                {errors.endDate.message}
              </Text>
            )}
          </View>

          {/* DESCRIPTION */}
          <View style={{ marginBottom: 16 }}>
            {requiredLabel("Description")}
            <Controller
              control={control}
              name="description"
              rules={{ required: "Description is required" }}
              render={({ field }) => (
                <View
                  style={{
                    backgroundColor: COLORS.inputBg,
                    borderWidth: 1,
                    borderColor: errors.description
                      ? "#ef4444"
                      : COLORS.inputBorder,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    minHeight: 100,
                  }}
                >
                  <TextInput
                    placeholder="Enter Description..."
                    value={field.value}
                    onChangeText={field.onChange}
                    multiline
                    textAlignVertical="top"
                    style={{
                      color: COLORS.inputText,
                      fontSize: 15,
                      fontWeight: "600",
                      flex: 1,
                      minHeight: 80,
                    }}
                    placeholderTextColor={isDark ? "#52525b" : "#94a3b8"}
                  />
                </View>
              )}
            />
            {errors.description && (
              <Text
                style={{
                  color: "#ef4444",
                  fontSize: 12,
                  marginTop: 4,
                  marginLeft: 4,
                }}
              >
                {errors.description.message}
              </Text>
            )}
          </View>

          {/* CONTACTS */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: COLORS.textSecondary,
              marginBottom: 8,
              marginTop: 16,
              marginLeft: 4,
            }}
          >
            SELECT CONTACTS
          </Text>

          {loadingContacts ? (
            <ActivityIndicator
              size="small"
              color="#0284c7"
              style={{ marginTop: 12 }}
            />
          ) : contacts.length === 0 ? (
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
                name="people-outline"
                size={32}
                color={COLORS.textSecondary}
                style={{ marginBottom: 8 }}
              />

              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: COLORS.textPrimary,
                  marginBottom: 4,
                }}
              >
                No contacts found
              </Text>

              <Text
                style={{
                  fontSize: 13,
                  textAlign: "center",
                  color: COLORS.textSecondary,
                  paddingHorizontal: 16,
                  marginBottom: 12,
                }}
              >
                Please add contacts before creating a campaign.
              </Text>

              <TouchableOpacity
                onPress={() => router.push("/contacts/createContact")}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 99,
                  backgroundColor: "#0284c7",
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}
                >
                  + Add Contact
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={{
                marginTop: 8,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.cardBorder,
                backgroundColor: COLORS.cardBg,
                padding: 8,
              }}
            >
              {contacts.map((c) => {
                const checked = selectedContactIds.includes(c.id);
                const initials = c.name
                  ? c.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "C";

                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => toggleContact(c.id)}
                    style={{
                      marginVertical: 4,
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      borderRadius: 12,
                      backgroundColor: checked
                        ? isDark
                          ? "rgba(2,132,199,0.08)"
                          : "#f0f9ff"
                        : "transparent",
                    }}
                  >
                    {/* Circle initials badge */}
                    <View
                      style={{
                        height: 38,
                        width: 38,
                        borderRadius: 19,
                        backgroundColor: checked
                          ? "#0284c7"
                          : isDark
                            ? "#2a2a32"
                            : "#f1f5f9",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: checked ? "#ffffff" : COLORS.textSecondary,
                        }}
                      >
                        {initials}
                      </Text>
                    </View>

                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: COLORS.textPrimary,
                        }}
                        numberOfLines={1}
                      >
                        {c.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: COLORS.textSecondary,
                          marginTop: 1,
                        }}
                        numberOfLines={1}
                      >
                        {c.email}
                      </Text>
                    </View>

                    {/* Circular custom checkbox checkmark badge */}
                    <View
                      style={{
                        height: 22,
                        width: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: checked ? "#0284c7" : COLORS.cardBorder,
                        backgroundColor: checked ? "#0284c7" : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {checked && (
                        <Ionicons name="checkmark" size={12} color="#ffffff" />
                      )}
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
          style={{
            width: "100%",
            marginTop: 24,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 14,
            backgroundColor: "#0284c7",
            shadowColor: "#0284c7",
            shadowOpacity: 0.2,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 12,
            elevation: 4,
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#ffffff" }}>
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
