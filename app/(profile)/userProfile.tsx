import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  Briefcase,
  LockKeyhole,
  Mail,
  User,
  UserPen,
} from "lucide-react-native";
import {
  Modal,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import { getUser } from "@/api/dashboardApi";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Divider } from "@/components/ui/divider";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeletons";
import ChangePassword from "../(auth)/changePassword";
import EditProfile from "../(auth)/editProfile";

export default function UserProfile() {
  const [userData, setUserData] = useState<any>(null);
  const [showChangePas, setChangePas] = useState(false);

  const [showEditProfile, setEditProfile] = useState(false);

  const colorScheme = useColorScheme();
  const routePage = useRouter();
  const { user } = useUser();

  if (!user) return null;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUser();
        setUserData(data);
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };
    fetchUser();
  }, []);

  return (
    <>
      <ThemedView className="flex-1 p-5 pt-20">
        {/* ================= SCROLL CONTENT ================= */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <HStack>
            <Pressable onPress={() => routePage.back()}>
              <Ionicons
                name="arrow-back-outline"
                size={22}
                color={colorScheme === "dark" ? "#ffffff" : "#020617"}
              />
            </Pressable>
          </HStack>

          {/* PROFILE */}
          <VStack className="items-center mb-8">
            <Avatar size="xl" className="mb-4">
              <AvatarImage source={{ uri: user.imageUrl }} />
            </Avatar>

            <ThemedText style={{ fontSize: 23, fontWeight: "700" }}>
              {user.firstName} {user.lastName}
            </ThemedText>
          </VStack>

          {/* DETAILS */}
          <Box className="bg-white/10 px-4 py-5 rounded-2xl border border-gray-200">
            <VStack space="md">
              <HStack className="items-center gap-3">
                <User size={22} color="#dc2626" />
                <VStack>
                  <ThemedText className="text-sm text-gray-400">
                    Username
                  </ThemedText>
                  <ThemedText>{user.username}</ThemedText>
                </VStack>
              </HStack>

              <Divider />

              <HStack className="items-center gap-3">
                <Mail size={20} color="#dc2626" />
                <VStack>
                  <ThemedText className="text-sm text-gray-400">
                    Email
                  </ThemedText>
                  <ThemedText>
                    {user.primaryEmailAddress?.emailAddress}
                  </ThemedText>
                </VStack>
              </HStack>

              <Divider />

              <HStack className="items-center gap-3">
                <Briefcase size={20} color="#dc2626" />
                <VStack>
                  <ThemedText className="text-sm text-gray-400">
                    Organisation
                  </ThemedText>
                  <ThemedText>
                    {userData?.organisation?.name ?? (
                      <ShimmerSkeleton height={15} width={130} />
                    )}
                  </ThemedText>
                </VStack>
              </HStack>
            </VStack>
          </Box>

          {/* BUTTONS */}
          
          <VStack className="mt-8" space="md">
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                backgroundColor: "#dc2626",
                paddingVertical: 16,
                borderRadius: 12,
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
              onPress={() => setEditProfile(true)}
            >
              <UserPen size={20} color="white" />
              <ThemedText style={{ color: "white", fontWeight: "600" }}>
                Edit Profile
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-black rounded-xl py-4 flex-row justify-center gap-2"
              onPress={() => setChangePas(true)}
            >
              <LockKeyhole size={20} color="white" />
              <ThemedText style={{ color: "white", fontWeight: "600" }}>
                Change Password
              </ThemedText>
            </TouchableOpacity>
          </VStack>
        </ScrollView>
        
      </ThemedView>

      {/* test modal edit profile */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        transparent
        onRequestClose={() => setEditProfile(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "90%",
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
            }}
          >
            
            <EditProfile closeEPF={() => setEditProfile(false)} />

          </View>
        </View>
      </Modal>


      {/* test modal change password*/}
      <Modal
        visible={showChangePas}
        animationType="slide"
        transparent
        onRequestClose={() => setChangePas(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "90%",
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
            }}
          >
            
            <ChangePassword closeCP={() => setChangePas(false)} />

          </View>
        </View>
      </Modal>
    </>
  );
}
