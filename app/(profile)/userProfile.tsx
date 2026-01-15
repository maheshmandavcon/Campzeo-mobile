import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
// import {
//     Avatar,
//     AvatarImage,
//     Box,
//     Divider,
//     HStack,
//     Modal,
//     ModalBackdrop,
//     ModalContent,
//     Pressable,
//     VStack,
// } from "@gluestack-ui/themed";
import {
  Briefcase,
  LockKeyhole,
  Mail,
  User,
  UserPen,
} from "lucide-react-native";
import { ScrollView, TouchableOpacity, useColorScheme } from "react-native";

// import { ModalBody, ModalCloseButton, ModalHeader } from "@gluestack-ui/themed";
import { useEffect, useState } from "react";
import ChangePassword from "../(auth)/changePassword";
import EditProfile from "../(auth)/editProfile";

import { getUser } from "@/api/dashboardApi";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Divider } from "@/components/ui/divider";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
} from "@/components/ui/modal";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

export default function UserProfile() {
  const [userData, setUserData] = useState<any>(null);

  const colorScheme = useColorScheme();

  const [ShowEditProfile, setEditProfile] = useState(false);

  const [showChangePas, setChangePas] = useState(false);

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
    <ThemedView className="flex-1 p-5 pt-20">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ---------- Profile Header ---------- */}
        <HStack>
          <Pressable
            onPress={() => {
              routePage.back();
            }}
          >
            <Ionicons
              name="arrow-back-outline"
              size={22}
              color={colorScheme === "dark" ? "#ffffff" : "#020617"}
            />
          </Pressable>
        </HStack>
        <VStack className="items-center mb-8">
          <Avatar size="xl" className="mb-4">
            <AvatarImage
              source={{
                uri: user.imageUrl,
              }}
              alt="Profile Picture"
            />
            {/* <AvatarFallbackText>A</AvatarFallbackText> */}
          </Avatar>

          <ThemedText
            style={{
              fontSize: 23,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {user.firstName} {user.lastName}
          </ThemedText>

          {/* <ThemedText className="text-base text-gray-500">
            {userData?.organisation?.name ?? "-"}
          </ThemedText> */}
        </VStack>

        {/* ---------- Details Card ---------- */}
        <Box className="bg-white/10 px-4 py-5 rounded-2xl border border-gray-200">
          <VStack space="md">
            {/* UserName */}
            <HStack className="items-center gap-3">
              <User size={22} color="#dc2626" />

              <VStack>
                <ThemedText className="text-sm text-gray-400">
                  Username
                </ThemedText>
                <ThemedText className="text-base font-medium">
                  {user.username}
                </ThemedText>
              </VStack>
            </HStack>

            <Divider style={{
    backgroundColor: "#e5e7eb",
    height: 1
  }}/>

            {/* EMAIL */}
            <HStack className="items-center gap-3">
              <Mail size={20} color="#dc2626" />
              <VStack>
                <ThemedText className="text-sm text-gray-400">Email</ThemedText>
                <ThemedText className="text-base font-medium">
                  {user.primaryEmailAddress?.emailAddress}
                </ThemedText>
              </VStack>
            </HStack>

            <Divider style={{
    backgroundColor: "#e5e7eb",
    height: 1
  }}/>

            {/* PHONE */}
            {/* <HStack className="items-center gap-3">
              <Phone size={20} color="#dc2626" />
              <VStack>
                <ThemedText className="text-sm text-gray-400">Phone</ThemedText>
                <ThemedText className="text-base font-medium">
                  +91 78072 71261 
                </ThemedText>
              </VStack>
            </HStack>
            <Divider /> 
            */}

            {/* Organisation */}
            <HStack className="items-center gap-3">
              <Briefcase size={20} color="#dc2626" />
              <VStack>
                <ThemedText className="text-sm text-gray-400">
                  Organisation
                </ThemedText>
                <ThemedText className="text-base font-medium">
                  {userData?.organisation?.name ?? "-"}
                </ThemedText>
              </VStack>
            </HStack>
            <Divider
              style={{
                backgroundColor: "#e5e7eb",
                height: 1
              }}
            />
          </VStack>
        </Box>

        {/* ---------- Buttons ---------- */}
        <VStack className="mt-8" space="md">
          {/* EDIT PROFILE */}
          <TouchableOpacity
            className="bg-[#dc2626] rounded-xl py-4 flex-row items-center justify-center gap-2"
            onPress={() => setEditProfile(true)}
          >
            <UserPen size={20} color="white" />
            <ThemedText style={{ color: "white", fontWeight: "600" }}>
              Edit Profile
            </ThemedText>
          </TouchableOpacity>

          <Modal
            isOpen={ShowEditProfile}
            onClose={() => {
              setEditProfile(false);
            }}
            size="lg"
          >
            <ModalBackdrop />
            <ModalContent>
              <ModalHeader>
                <ModalCloseButton></ModalCloseButton>
              </ModalHeader>
              <ModalBody>
                {/* =====EPF Form Child====== */}
                <EditProfile
                  closeEPF={() => {
                    setEditProfile(false);
                  }}
                />
              </ModalBody>

              {/* <ModalFooter>
                <Button
                  variant="outline"
                  action="secondary"
                  className="mr-3"
                  onPress={() => {
                    setEditProfile(false);
                  }}
                >
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <Button
                  onPress={() => {
                    setEditProfile(false);
                  }}
                >
                  <ButtonText>Save</ButtonText>
                </Button>
              </ModalFooter> */}
            </ModalContent>
          </Modal>

          {/* CHANGE PASSWORD */}
          <TouchableOpacity
            className="bg-black rounded-xl py-4 flex-row items-center justify-center gap-2"
            onPress={() => setChangePas(true)}
          >
            <LockKeyhole size={20} color="white" />
            <ThemedText style={{ color: "white", fontWeight: "600" }}>
              Change Password
            </ThemedText>
          </TouchableOpacity>

          <Modal
            isOpen={showChangePas}
            onClose={() => {
              setChangePas(false);
            }}
            size="lg"
          >
            <ModalBackdrop />
            <ModalContent>
              <ModalHeader>
                <ModalCloseButton>
                  {/* <Icon as={CloseIcon} /> */}
                </ModalCloseButton>
              </ModalHeader>
              <ModalBody>
                {/* <ThemedText>
                  This is the Change Password body. You can add any content
                  here.
                </ThemedText> */}

                <ChangePassword
                  closeCP={() => {
                    setChangePas(false);
                  }}
                />
              </ModalBody>

              {/* <ModalFooter>
                <Button
                  variant="outline"
                  action="secondary"
                  className="mr-3"
                  onPress={() => {
                    setChangePas(false);
                  }}
                >
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <Button
                  onPress={() => {
                    setChangePas(false);
                  }}
                >
                  <ButtonText>Save</ButtonText>
                </Button>
              </ModalFooter> */}
            </ModalContent>
          </Modal>
        </VStack>
      </ScrollView>
    </ThemedView>
  );
}
