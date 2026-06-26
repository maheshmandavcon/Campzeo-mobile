import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  Briefcase,
  Mail,
  User,
  UserPen,
} from "lucide-react-native";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
  TextInput,
} from "react-native";
import { ReactNode, useEffect, useState } from "react";
import { useUser } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Divider } from "@/components/ui/divider";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeletons";
import { getDisplayName, getInitials } from "@/utils/userDisplay";
import { useUserDetails } from "@/hooks/useUserDetails";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { editProfileSchema, EditProfileSchemaType } from "@/validations/profileSchema";
import { updateProfile } from "@/api/dashboardApi";
import Toast from "react-native-toast-message";
import { ActivityIndicator } from "react-native";
import { KeyboardAvoidingView, Platform } from "react-native";
import { Input, InputField } from "@/components/ui/input";

export default function UserProfile() {
  const [showEditProfile, setEditProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const colorScheme = useColorScheme();
  const routePage = useRouter();
  const { user } = useUser();
  const isDark = colorScheme === "dark";
  const { userData, loading, refetch } = useUserDetails(Boolean(user));

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProfileSchemaType>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      mobile: "",
      email: "",
    },
  });

  useEffect(() => {
    if (userData) {
      reset({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        mobile: userData.mobile || "",
        email: userData.organisation?.email || userData.email || "",
      });
    }
  }, [userData, reset, showEditProfile]);

  if (!user) return null;

  const profileUser = userData || user;
  const displayName = getDisplayName(profileUser);
  const initials = getInitials(profileUser);
  const email = profileUser?.email ?? user.primaryEmailAddress?.emailAddress ?? "-";
  const organisation = userData?.organisation?.name ?? "-";

  const onSubmit = async (data: EditProfileSchemaType) => {
    try {
      setIsSaving(true);
      const payload = {
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        mobile: data.mobile || null,
      };
      await updateProfile(payload);

      // Refresh the page
      await refetch();

      setEditProfile(false);
      Toast.show({
        type: "success",
        text1: "Profile updated successfully",
      });
    } catch (err: any) {
      console.log("Profile update error:", err);
      Toast.show({
        type: "error",
        text1: "Failed to update profile",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const COLORS = {
    bg: isDark ? "#0f1115" : "#f8fafc",
    card: isDark ? "#171a20" : "#ffffff",
    border: isDark ? "#2a2f3a" : "#e5e7eb",
    text: isDark ? "#f8fafc" : "#0f172a",
    muted: isDark ? "#9ca3af" : "#64748b",
    subtle: isDark ? "#20242c" : "#f1f5f9",
  };

  const DetailRow = ({
    icon,
    label,
    value,
  }: {
    icon: ReactNode;
    label: string;
    value: string;
  }) => (
    <HStack style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: isDark ? "#2a1515" : "#fee2e2" }]}>
        {icon}
      </View>
      <VStack style={{ flex: 1 }}>
        <ThemedText style={[styles.detailLabel, { color: COLORS.muted }]}>
          {label}
        </ThemedText>
        <ThemedText style={[styles.detailValue, { color: COLORS.text }]}>
          {value}
        </ThemedText>
      </VStack>
    </HStack>
  );

  const ProfileSkeleton = () => (
    <ThemedView style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <HStack style={styles.header}>
        <Pressable onPress={() => routePage.back()} style={styles.backButton}>
          <Ionicons
            name="arrow-back-outline"
            size={22}
            color={COLORS.text}
          />
        </Pressable>
      </HStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack style={styles.profileHeader}>
          <ShimmerSkeleton height={112} width={112} borderRadius={56} />
          <ShimmerSkeleton height={24} width={190} />
          <ShimmerSkeleton height={14} width={220} />
        </VStack>

        <Box style={[styles.detailsCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
          <VStack style={{ gap: 18 }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <HStack key={index} style={styles.detailRow}>
                <ShimmerSkeleton height={44} width={44} borderRadius={14} />
                <VStack style={{ flex: 1, gap: 8 }}>
                  <ShimmerSkeleton height={12} width={90} />
                  <ShimmerSkeleton height={16} width={index === 1 ? "90%" : "60%"} />
                </VStack>
              </HStack>
            ))}
          </VStack>
        </Box>
      </ScrollView>
    </ThemedView>
  );

  if (loading) return <ProfileSkeleton />;

  return (
    <>
      <ThemedView
  style={[styles.container, { backgroundColor: COLORS.bg }]}
>
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
          <HStack style={styles.header}>
            <Pressable onPress={() => routePage.back()} style={styles.backButton}>
              <Ionicons
                name="arrow-back-outline"
                size={22}
                color={COLORS.text}
              />
            </Pressable>
          </HStack>

          <VStack style={styles.profileHeader}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>{initials}</ThemedText>
            </View>

            <ThemedText style={[styles.name, { color: COLORS.text }]}>
              {displayName}
            </ThemedText>
            <ThemedText style={[styles.email, { color: COLORS.muted }]}>
              {email}
            </ThemedText>
          </VStack>

          <Box
            style={[
              styles.detailsCard,
              {
                backgroundColor: COLORS.card,
                borderColor: COLORS.border,
              },
            ]}
          >
            {showEditProfile ? (
              <VStack style={{ gap: 8 }}>
                {/* First Name */}
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { value, onChange } }) => (
                    <>
                      <ThemedText style={[styles.inputLabel, { color: COLORS.muted }]}>
                        First Name
                      </ThemedText>

                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="Enter first name"
                        style={[
                          styles.editInput,
                          {
                            backgroundColor: isDark ? "#20242c" : "#f8fafc",
                            color: COLORS.text,
                            borderColor: COLORS.border,
                          },
                        ]}
                      />
                    </>
                  )}
                />

                {/* Last Name */}
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { value, onChange } }) => (
                    <>
                      <ThemedText style={[styles.inputLabel, { color: COLORS.muted }]}>
                        Last Name
                      </ThemedText>

                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="Enter last name"
                        style={[
                          styles.editInput,
                          {
                            backgroundColor: isDark ? "#20242c" : "#f8fafc",
                            color: COLORS.text,
                            borderColor: COLORS.border,
                          },
                        ]}
                      />
                    </>
                  )}
                />

                {/* Organisation */}
                <Controller
                  control={control}
                  name="mobile"
                  render={({ field: { value, onChange } }) => (
                    <>
                      <ThemedText style={[styles.inputLabel, { color: COLORS.muted }]}>
                        Organisation
                      </ThemedText>

                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="Enter organisation"
                        style={[
                          styles.editInput,
                          {
                            backgroundColor: isDark ? "#20242c" : "#f8fafc",
                            color: COLORS.text,
                            borderColor: COLORS.border,
                          },
                        ]}
                      />
                    </>
                  )}
                />

                {/* Email */}
                {/* <Controller
                  control={control}
                  name="email"
                  render={({ field: { value } }) => (
                    <>
                      <ThemedText style={[styles.inputLabel, { color: COLORS.muted }]}>
                        Email (Read Only)
                      </ThemedText>

                      <TextInput
                        value={value}
                        editable={false}
                        style={[
                          styles.editInput,
                          {
                            backgroundColor: isDark ? "#2a2f3a" : "#f1f5f9",
                            color: COLORS.text,
                            borderColor: COLORS.border,
                            opacity: 0.7,
                          },
                        ]}
                      />
                    </>
                  )}
                /> */}
              </VStack>
            ) : (
              <VStack style={{ gap: 18 }}>
                <DetailRow
                  icon={<User size={21} color="#dc2626" />}
                  label="Username"
                  value={displayName}
                />

                <Divider />

                <DetailRow
                  icon={<Mail size={20} color="#dc2626" />}
                  label="Email"
                  value={email}
                />

                <Divider />

                <DetailRow
                  icon={<Briefcase size={20} color="#dc2626" />}
                  label="Organisation"
                  value={organisation}
                />

                <Divider />

                <DetailRow
                  icon={<Ionicons name="call-outline" size={20} color="#dc2626" />}
                  label="Mobile Number"
                  value={profileUser?.mobile ?? "-"}
                />
              </VStack>
            )}
          </Box>

          <VStack style={styles.actions}>
            {showEditProfile ? (
              <HStack style={{ gap: 12 }}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    reset({
                      firstName: userData?.firstName || "",
                      lastName: userData?.lastName || "",
                      mobile: userData?.mobile || "",
                      email:
                        userData?.organisation?.email ||
                        userData?.email ||
                        "",
                    });

                    setEditProfile(false);
                  }}
                >
                  <ThemedText
                    style={{ color: COLORS.text, fontWeight: "600" }}
                  >
                    Cancel
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={handleSubmit(
                    onSubmit,
                    (errors) => {
                      if (errors.firstName) {
                        Toast.show({
                          type: "error",
                          text1: errors.firstName.message || "First name is required",
                        });
                      }
                    }
                  )}                >
                  {isSaving ? (       
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <UserPen size={20} color="white" />
                      <ThemedText
                        style={{ color: "white", fontWeight: "600" }}
                      >
                        Save Changes
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </HStack>
            ) : (
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => setEditProfile(true)}
              >
                <UserPen size={20} color="white" />
                <ThemedText
                  style={{ color: "white", fontWeight: "600" }}
                >
                  Edit Profile
                </ThemedText>
              </TouchableOpacity>
            )}
          </VStack>
        </ScrollView>
  </KeyboardAvoidingView>

      </ThemedView>

    </>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 18,
  },
  backButton: {
    alignItems: "center",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  profileHeader: {
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: 56,
    height: 112,
    justifyContent: "center",
    marginBottom: 6,
    width: 112,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "800",
  },
  name: {
    fontSize: 25,
    fontWeight: "800",
    textAlign: "center",
  },
  email: {
    fontSize: 14,
    textAlign: "center",
  },
  detailsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  detailRow: {
    alignItems: "center",
    gap: 12,
  },
  detailIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  actions: {
    gap: 12,
    marginTop: 24,
    paddingBottom: 32,
  },
  primaryAction: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  modalHeaderRow: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeModalButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    // marginBottom: 6,
  },
  customInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIconWrapper: {
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  modalActions: {
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveBtn: {
    flex: 2,
    backgroundColor: "#dc2626",
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  editInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    // paddingHorizontal: 14,
    // marginTop: 6,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
});
