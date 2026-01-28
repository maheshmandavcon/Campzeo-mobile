import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import {
  editProfileSchema,
  EditProfileSchemaType,
} from "@/validations/profileSchema";
import { useUser } from "@clerk/clerk-expo";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { Controller, useForm } from "react-hook-form";
import { Image, Pressable, ScrollView, Text } from "react-native";

type closeEPFType = {
  closeEPF: () => void;
};

export default function EditProfile({ closeEPF }: closeEPFType) {
  const { user } = useUser();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EditProfileSchemaType>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.username || "",
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

    if (!res.canceled) {
      const asset = res.assets[0];

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      await user?.setProfileImage({ file: blob });
    }
  };

  // =====================
  // SUBMIT → CLERK UPDATE
  // =====================
  const onSubmit = async (data: EditProfileSchemaType) => {
    try {
      await user?.update({
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        username: data.username,
      });

      closeEPF();
    } catch (err: any) {
      console.log("Clerk update error:", err);
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
      name: "username",
      label: "Username",
      placeholder: "Enter your username",
    },
  ];

  return (
    <ThemedView className="p-5 rounded-lg">
      <VStack space="lg" className="my-5">
        <ThemedText
          style={{
            fontSize: 23,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Edit Profile
        </ThemedText>
        <VStack space="lg" className="my-5">
          {/* =====================
              PROFILE IMAGE PICKER
          ====================== */}
          <VStack>
            <Pressable onPress={pickImage} className="self-center mb-4">
              <Image
                source={{ uri: user?.imageUrl }}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 100,
                  borderWidth: 2,
                  borderColor: "#dc2626",
                }}
              />
            </Pressable>
            <ThemedText className="text-center text-gray-600 mt-1">
              Tap to change picture
            </ThemedText>
          </VStack>

          {/* =====================
              FORM FIELDS
          ====================== */}
          {fields.map((field, idx) => (
            <VStack space="xs" key={idx}>
              <ThemedText className="text-gray-400">{field.label}</ThemedText>

              <Controller
                control={control}
                name={field.name as any}
                render={({ field: { value, onChange } }) => (
                  <>
                    <Input className="bg-white/10 rounded-xl px-1 py-2">
                      <InputField
                        placeholder={field.placeholder}
                        value={value}
                        onChangeText={onChange}
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
              <ThemedText style={{ color: "white", fontWeight: "600" }}>
                Save Changes
              </ThemedText>
            </Pressable>

            <Pressable
              className="bg-slate-500 rounded-xl py-4 mt-4 items-center"
              onPress={closeEPF}
            >
              <ThemedText style={{ color: "white", fontWeight: "600" }}>
                Cancel
              </ThemedText>
            </Pressable>
          </VStack>
        </VStack>
      </VStack>
    </ThemedView>
  );
}
