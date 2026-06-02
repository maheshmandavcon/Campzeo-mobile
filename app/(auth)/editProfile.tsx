import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import {
  editProfileSchema,
  EditProfileSchemaType,
} from "@/validations/profileSchema";
import { useUser } from "@/context/AuthContext";
import { View } from "@gluestack-ui/themed";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { Controller, useForm } from "react-hook-form";
import { Image, Pressable, Text, useColorScheme } from "react-native";
import { useEffect } from "react";
import { updateProfile } from "@/api/dashboardApi";
import Toast from "react-native-toast-message";

type closeEPFType = {
  closeEPF: () => void;
};

export default function EditProfile({
  closeEPF,
  userData,
}: closeEPFType & { userData: any }) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProfileSchemaType>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: userData?.firstName || "",
      lastName: userData?.lastName || "",
      mobile: userData?.mobile || "",
      email: userData?.organisation?.email || "",
    },
  });

  // =====================
  // PICK PROFILE IMAGE
  // =====================
  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
  };

  // =====================
  // SUBMIT → CLERK UPDATE
  // =====================
  const onSubmit = async (data: EditProfileSchemaType) => {
    try {
      const payload = {
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        mobile: data.mobile || null,
      };
      console.log("pppp", payload);
      await updateProfile(payload);
      closeEPF();
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
    }
  };

  const fields = [
    {
      name: "firstName",
      label: "First Name",
      placeholder: "Enter your first name",
    },
    {
      name: "lastName",
      label: "Last Name",
      placeholder: "Enter your last name",
    },
    {
      name: "mobile",
      label: "Mobile Number",
      placeholder: "Enter your mobile number",
    },
    {
      name: "email",
      label: "Email (READ ONLY)",
      placeholder: "Enter your email",
    },
  ];

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const COLORS = {
    bg: isDark ? "#161618" : "#ffffff",
    // card: isDark ? "#161618" : "#ffffff",
    border: isDark ? "#fff" : "#d1d5db",
    textPrimary: isDark ? "#ffffff" : "#111827",
    textSecondary: isDark ? "#9ca3af" : "#6b7280",
    label: isDark ? "#e5e7eb" : "#374151",
    placeholder: isDark ? "#64748b" : "#9ca3af",
  };

  return (
    // <View className="p-5 rounded-lg">
    <View className="p-5 rounded-lg" style={{ backgroundColor: COLORS.bg }}>
      <VStack space="lg" className="my-5">
        {/* <Text
          style={{
            fontSize: 23,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Edit Profile
        </Text> */}
        <Text
          style={{
            fontSize: 23,
            fontWeight: "700",
            textAlign: "center",
            color: COLORS.textPrimary,
          }}
        >
          Edit Profile
        </Text>
        <VStack space="lg" className="my-5">
          {/* =====================
              PROFILE IMAGE PICKER
          ====================== */}
          <VStack>
            {/* <Pressable onPress={pickImage} className="self-center mb-4">
              <Image
                source={{ uri: user?.imageUrl }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 100,
                  borderWidth: 2,
                  // borderColor: "#dc2626",
                  padding: 3,
                  borderColor: isDark ? "#ffffff" : "#dc2626",
                }}
              />
            </Pressable> */}

            {/* <Text
              style={{
                textAlign: "center",
                marginTop: 4,
                color: COLORS.textSecondary,
              }}
            >
              Tap to change picture
            </Text> */}
          </VStack>

          {/* =====================
              FORM FIELDS
          ====================== */}
          {fields.map((field, idx) => (
            <VStack space="xs" key={idx}>
              {/* <Text className="text-gray-700">{field.label}</Text> */}
              <Text style={{ color: COLORS.label }}>{field.label}</Text>
              <Controller
                control={control}
                name={field.name as any}
                render={({ field: { value, onChange } }) => (
                  <>
                    {/* <Input className="rounded-lg px-1 py-2">
                      <InputField
                        placeholder={field.placeholder}
                        value={value}
                        onChangeText={onChange}
                      />
                    </Input> */}
                    <Input
                      className="rounded-lg px-1 py-2"
                      style={{
                        backgroundColor: COLORS.bg,
                        borderColor: COLORS.border,
                        borderWidth: 1,
                      }}
                    >
                      <InputField
                        placeholder={field.placeholder}
                        placeholderTextColor={COLORS.placeholder}
                        value={value}
                        onChangeText={onChange}
                        keyboardType={
                          field.name === "mobile"
                            ? "phone-pad"
                            : field.name === "email"
                              ? "email-address"
                              : "default"
                        }
                        editable={field.name !== "email"}
                        style={{
                          color: COLORS.textPrimary,
                          opacity: field.name === "email" ? 0.6 : 1,
                        }}
                      />
                    </Input>
                    {/* Show validation error */}
                    {errors[field.name as keyof EditProfileSchemaType] && (
                      <Text className="text-red-500 text-sm mt-1">
                        *
                        {
                          errors[field.name as keyof EditProfileSchemaType]
                            ?.message
                        }
                      </Text>
                    )}
                  </>
                )}
              />
            </VStack>
          ))}

          {/* =====================
              BUTTONS
          ====================== */}
          <VStack>
            <Pressable
              className="bg-[#dc2626] rounded-xl py-4 mt-4 items-center"
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>
                Save Changes
              </Text>
            </Pressable>

            {/* <Pressable
              className="bg-slate-500 rounded-xl py-4 mt-4 items-center"
              onPress={closeEPF}
            > */}
            <Pressable
              style={{
                backgroundColor: isDark ? "#334155" : "#64748b",
              }}
              className="rounded-xl py-4 mt-4 items-center"
              onPress={closeEPF}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>Cancel</Text>
            </Pressable>
          </VStack>
        </VStack>
      </VStack>
    </View>
  );
}
