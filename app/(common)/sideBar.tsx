import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer";

import { LogOut, User, Calendar, Notebook, Wallet } from "lucide-react-native";
import { StyleSheet } from "react-native";

import { useSidebarStore } from "../../store/sidebarStore";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";

import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";
import { VStack } from "@/components/ui/vstack";
import { Divider } from "@/components/ui/divider";
import { Pressable } from "@/components/ui/pressable";
import { Button, ButtonText } from "@/components/ui/button";
// import { View } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { View } from "@gluestack-ui/themed";
import { Text } from "@gluestack-ui/themed";

export default function Sidebar() {
  const sidebarOpen = useSidebarStore((state) => state.sidebarOpen);
  const closeSidebar = useSidebarStore((state) => state.closeSidebar);

  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // HARD OVERRIDE — ALWAYS BLACK
  const TEXT_COLOR = "#000000";

  return (
    <Drawer isOpen={sidebarOpen} onClose={closeSidebar} anchor="right">
      <DrawerBackdrop />

      <DrawerContent className="w-[270px] md:w-[300px] bg-white">
        {/* HEADER */}
        <DrawerHeader className="justify-center flex-col gap-2">
          <View style={styles.headerContent}>
            <Avatar size="xl">
              <AvatarFallbackText style={{ color: TEXT_COLOR }}>
                {user.username ?? "User"}
              </AvatarFallbackText>
              <AvatarImage source={{ uri: user.imageUrl }} />
            </Avatar>

            <VStack style={styles.userInfo}>
              <ThemedText
                style={{
                  color: TEXT_COLOR,
                  fontSize: 23,
                  fontWeight: "600",
                }}
              >
                {user.username}
              </ThemedText>
            </VStack>
          </View>
        </DrawerHeader>

        <Divider style={styles.divider} />

        {/* BODY */}
        <DrawerBody>
          <View style={styles.menuContainer}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                closeSidebar();
                router.push("/(profile)/userProfile");
              }}
            >
              <User size={24} color={TEXT_COLOR} />
              <Text style={styles.menuText}>My Profile</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                closeSidebar();
                router.push("/(accounts)/accounts");
              }}
            >
              <Notebook size={24} color={TEXT_COLOR} />
              <Text style={styles.menuText}>Accounts</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                closeSidebar();
                router.push("/(calendar)/calendarPage");
              }}
            >
              <Calendar size={24} color={TEXT_COLOR} />
              <Text style={styles.menuText}>Calendar</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                closeSidebar();
                router.push("/(billing)/billingPage");
              }}
            >
              <Wallet size={24} color={TEXT_COLOR} />
              <Text style={styles.menuText}>Billing</Text>
            </Pressable>
          </View>
        </DrawerBody>

        {/* FOOTER */}
        <DrawerFooter>
          <Button
            style={styles.logoutButton}
            variant="outline"
            action="secondary"
            onPress={() => {
              closeSidebar();
              handleLogout();
            }}
          >
            <LogOut size={20} color={TEXT_COLOR} />
            <ButtonText style={{ color: TEXT_COLOR }}>Logout</ButtonText>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  headerContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  userInfo: {
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    marginVertical: 16,
  },
  menuContainer: {
    gap: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 8,
  },
  menuText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "500",
  },
  logoutButton: {
    width: "100%",
    gap: 8,
  },
});
