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
import { useAuth, useUser } from "@/context/AuthContext";

import { VStack } from "@/components/ui/vstack";
import { Divider } from "@/components/ui/divider";
import { Pressable } from "@/components/ui/pressable";
import { Button, ButtonText } from "@/components/ui/button";
import { ThemedText } from "@/components/themed-text";
import { View, Text } from "@gluestack-ui/themed";
import { Ionicons } from "@expo/vector-icons";
import { getDisplayName, getInitials } from "@/utils/userDisplay";
import { useUserDetails } from "@/hooks/useUserDetails";

export default function Sidebar() {
  const sidebarOpen = useSidebarStore((state) => state.sidebarOpen);
  const closeSidebar = useSidebarStore((state) => state.closeSidebar);

  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const { userData } = useUserDetails(Boolean(user));

  if (!user) return null;

  const displayUser = userData || user;
  const displayName = getDisplayName(displayUser);
  const initials = getInitials(displayUser);
  const email = displayUser?.email ?? user.primaryEmailAddress?.emailAddress;

  /**
   * IMPORTANT:
   * The type below makes this function compatible with `typedRoutes: true`
   * and prevents invalid routes at compile time.
   */
  const navigate = (pathname: Parameters<typeof router.push>[0]) => {
    closeSidebar();
    router.push(pathname);
  };

  const handleLogout = async () => {
    try {
      closeSidebar();
      await signOut();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const TEXT_COLOR = "#000000";

  return (
    <Drawer isOpen={sidebarOpen} onClose={closeSidebar} anchor="right">
      <DrawerBackdrop />

      <DrawerContent className="w-[270px] md:w-[300px] bg-white">
        {/* HEADER */}
        <DrawerHeader className="justify-center flex-col gap-2">
          <View style={styles.headerContent}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <VStack style={styles.userInfo}>
              <ThemedText
                style={{
                  color: TEXT_COLOR,
                  fontSize: 21,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                {displayName}
              </ThemedText>
              {email ? (
                <ThemedText style={styles.emailText}>{email}</ThemedText>
              ) : null}
            </VStack>
          </View>
        </DrawerHeader>

        <Divider style={styles.divider} />

        {/* BODY */}
        <DrawerBody>
          <View style={styles.menuContainer}>
            <Pressable
              style={styles.menuItem}
              onPress={() => navigate("/userProfile")}
            >
              <User size={24} color={"#dc2626"} />
              <Text style={styles.menuText}>My Profile</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => navigate("/accounts")}
            >
              <Notebook size={24} color={"#dc2626"} />
              <Text style={styles.menuText}>Accounts</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => navigate("/calendarPage")}
            >
              <Calendar size={24} color={"#dc2626"} />
              <Text style={styles.menuText}>Calendar</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => navigate("/billingPage")}
            >
              <Wallet size={24} color={"#dc2626"} />
              <Text style={styles.menuText}>Billing History</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => navigate("/templet")}
            >
              {/* <Wallet size={24} color={"#dc2626"} /> */}
              {/* <Ionicons name="grid-outline" size={24} color="#dc2626" /> */}
              {/* <Ionicons name="copy-outline" size={24} color="#dc2626" /> */}
              <Ionicons name="layers-outline" size={24} color="#dc2626" />
              {/* <Ionicons name="document-text-outline" size={24} color="#dc2626" /> */}
              <Text style={styles.menuText}>Templates</Text>
            </Pressable>
          </View>
        </DrawerBody>

        {/* FOOTER */}
        <DrawerFooter>
          <Button
            style={styles.logoutButton}
            variant="outline"
            action="secondary"
            onPress={handleLogout}
          >
            <LogOut size={20} color={"#dc2626"} />
            <ButtonText style={{ color: "#dc2626" }}>
              Logout
            </ButtonText>
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
  avatar: {
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: 44,
    height: 88,
    justifyContent: "center",
    width: 88,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
  },
  emailText: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 3,
    textAlign: "center",
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
    borderColor: "#dc2626"
  },
});
