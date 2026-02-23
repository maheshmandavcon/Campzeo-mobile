import { Input, InputField } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import {
  changePasswordSchema,
  ChangePasswordSchemaType,
} from "@/validations/profileSchema";
import { useUser } from "@clerk/clerk-expo";
import { View } from "@gluestack-ui/themed";
// import { Input, InputField, VStack } from "@gluestack-ui/themed";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Pressable, Text, ToastAndroid, useColorScheme } from "react-native";

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

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const COLORS = {
    bg: isDark ? "#161618" : "#ffffff",
    // card: isDark ? "#020617" : "#ffffff",
    border: isDark ? "#fff" : "#d1d5db",
    textPrimary: isDark ? "#ffffff" : "#111827",
    textSecondary: isDark ? "#9ca3af" : "#6b7280",
    label: isDark ? "#e5e7eb" : "#374151",
    placeholder: isDark ? "#64748b" : "#9ca3af",
    icon: isDark ? "#e5e7eb" : "#555",
  };

  return (
    // <View className="p-5 rounded-lg">
    <View
      className="p-5 rounded-lg"
      style={{ backgroundColor: COLORS.bg }}
    >
      <VStack space="lg" className="mt-4">
        {/* <Text
          style={{
            fontSize: 23,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          Change Password
        </Text> */}
        <Text
          style={{
            fontSize: 23,
            fontWeight: "700",
            textAlign: "center",
            color: COLORS.textPrimary,
          }}
        >
          Change Password
        </Text>
        <VStack space="lg" className="mt-4">
          {fields.map((field, idx) => (
            <VStack space="xs" key={idx}>
              {/* <Text className="text-gray-700">{field.label}</Text> */}
              <Text style={{ color: COLORS.label }}>
                {field.label}
              </Text>

              <Controller
                control={control}
                name={field.name}
                render={({ field: { value, onChange } }) => (
                  <>
                    {/* <Input className="rounded-lg px-3 py-2 flex-row items-center">
                      {field.icon}

                      <InputField
                        placeholder={field.placeholder}
                        secureTextEntry={!visible[field.name]}
                        value={value}
                        onChangeText={onChange}
                        className="ml-2 flex-1"
                      /> */}

                    {/* Show/Hide Eye Icon */}
                    {/* <Pressable onPress={() => toggleVisibility(field.name)}>
                        {visible[field.name] ? (
                          <Eye size={20} color="#555" />
                        ) : (
                          <EyeOff size={20} color="#555" />
                        )}
                      </Pressable>
                    </Input> */}
                    <Input
                      className="rounded-lg px-3 py-2 flex-row items-center"
                      style={{
                        backgroundColor: COLORS.bg,
                        borderColor: COLORS.border,
                        borderWidth: 1,
                      }}
                    >
                      {/* <Lock size={18} color="#dc2626" /> */}
                      <Lock size={18} color={isDark ? "#ffffff" : "#dc2626"} />

                      <InputField
                        placeholder={field.placeholder}
                        placeholderTextColor={COLORS.placeholder}
                        secureTextEntry={!visible[field.name]}
                        value={value}
                        onChangeText={onChange}
                        className="ml-2 flex-1"
                        style={{
                          color: COLORS.textPrimary,
                        }}
                      />

                      <Pressable onPress={() => toggleVisibility(field.name)}>
                        {visible[field.name] ? (
                          <Eye size={20} color={COLORS.icon} />
                        ) : (
                          <EyeOff size={20} color={COLORS.icon} />
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
            {/* <Pressable
              disabled={loading}
              className={`rounded-xl py-4 mt-4 items-center ${loading ? "bg-gray-500" : "bg-black"
                }`}
              onPress={handleSubmit(onSubmit)}
            > */}
            <Pressable
              disabled={loading}
              className="bg-[#dc2626] rounded-xl py-4 mt-4 items-center"

              onPress={handleSubmit(onSubmit)}
            >
              {loading ? (
                <ActivityIndicator color="#dc2626" />
              ) : (
                <Text style={{ color: "white", fontWeight: "600" }}>
                  Save Changes
                </Text>
              )}
            </Pressable>

            <Pressable
              className="bg-slate-500 rounded-xl py-4 mt-4 items-center"
              onPress={closeCP}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>Cancel</Text>
            </Pressable>
          </VStack>
        </VStack>
      </VStack>
    </View>
  );
}
