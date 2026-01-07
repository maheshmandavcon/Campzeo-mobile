import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
    changePasswordSchema,
    ChangePasswordSchemaType,
} from "@/validations/profileSchema";
import { useUser } from "@clerk/clerk-expo";
import { Input, InputField, VStack } from "@gluestack-ui/themed";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text, ToastAndroid
} from "react-native";

type closeCPType = {
  closeCP: () => void;
};

type ChangePasswordField = {
  name: "currentPassword" | "newPassword" | "reEnterNewPassword";
  label: string;
  placeholder: string;
  icon: React.ReactNode;
};

export default function ChangePassword({ closeCP }: closeCPType) {
  const { user } = useUser();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordSchemaType>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      reEnterNewPassword: "",
    },
  });

  // ========= UI States =========
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Show/hide password per field
  const [visible, setVisible] = useState({
    currentPassword: false,
    newPassword: false,
    reEnterNewPassword: false,
  });

  const toggleVisibility = (field: keyof typeof visible) => {
    setVisible((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const fields: ChangePasswordField[] = [
    {
      name: "currentPassword",
      label: "Current Password",
      placeholder: "Enter current password",
      icon: <Lock size={18} color="#dc2626" />,
    },
    {
      name: "newPassword",
      label: "New Password",
      placeholder: "Enter new password",
      icon: <Lock size={18} color="#dc2626" />,
    },
    {
      name: "reEnterNewPassword",
      label: "Re-enter New Password",
      placeholder: "Re-enter new password",
      icon: <Lock size={18} color="#dc2626" />,
    },
  ];

  // ========= Submit Password Change =========
  const onSubmit = async (data: ChangePasswordSchemaType) => {
    setLoading(true);
    setServerError(null);

    try {
      await user?.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      ToastAndroid.show("Password updated successfully!", ToastAndroid.SHORT);
      closeCP();
    } catch (err: any) {
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Something went wrong";

      setServerError(message);
      console.log("Password update error:", message);
    }

    setLoading(false);
  };

  return (
    <ThemedView className="flex-1 p-5 rounded-lg">
      <ScrollView showsVerticalScrollIndicator={false}>
        <ThemedText
          style={{
            fontSize: 23,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Change Password
        </ThemedText>
        <VStack space="lg" className="mt-4">
          {fields.map((field, idx) => (
            <VStack space="xs" key={idx}>
              <ThemedText className="text-gray-400">{field.label}</ThemedText>

              <Controller
                control={control}
                name={field.name}
                render={({ field: { value, onChange } }) => (
                  <>
                    <Input className="bg-white/10 rounded-xl px-3 py-2 flex-row items-center">
                      {field.icon}

                      <InputField
                        placeholder={field.placeholder}
                        secureTextEntry={!visible[field.name]}
                        value={value}
                        onChangeText={onChange}
                        className="ml-2 flex-1"
                      />

                      {/* Show/Hide Eye Icon */}
                      <Pressable onPress={() => toggleVisibility(field.name)}>
                        {visible[field.name] ? (
                          <Eye size={20} color="#555" />
                        ) : (
                          <EyeOff size={20} color="#555" />
                        )}
                      </Pressable>
                    </Input>

                    {/* Zod Error */}
                    {errors[field.name] && (
                      <Text className="text-red-500 text-sm mt-1">
                        *{errors[field.name]?.message}
                      </Text>
                    )}
                  </>
                )}
              />
            </VStack>
          ))}

          {/* Server Error from Clerk */}
          {serverError && (
            <Text className="text-red-500 text-center mt-2">
              *{serverError}
              (Maybe)
            </Text>
          )}

          {/* Buttons */}
          <VStack>
            <Pressable
              disabled={loading}
              className={`rounded-xl py-4 mt-4 items-center ${
                loading ? "bg-gray-500" : "bg-black"
              }`}
              onPress={handleSubmit(onSubmit)}
            >
              {loading ? (
                <ActivityIndicator color="#dc2626" />
              ) : (
                <ThemedText style={{ color: "white", fontWeight: "600" }}>
                  Save Changes
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              className="bg-slate-500 rounded-xl py-4 mt-4 items-center"
              onPress={closeCP}
            >
              <ThemedText style={{ color: "white", fontWeight: "600" }}>
                Cancel
              </ThemedText>
            </Pressable>
          </VStack>
        </VStack>
      </ScrollView>
    </ThemedView>
  );
}
