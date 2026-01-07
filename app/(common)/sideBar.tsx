import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
  Button,
  ButtonIcon,
  ButtonText,
  Divider,
  Icon,
  Pressable,
  VStack,
  View,
  Text,
} from "@gluestack-ui/themed";
import { LogOut, User, Calendar, Notebook, Wallet } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { useSidebarStore } from "../../store/sidebarStore";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/clerk-expo";

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

  //  HARD OVERRIDE — ALWAYS BLACK
  const TEXT_COLOR = "#000000";

  return (
    <Drawer isOpen={sidebarOpen} onClose={closeSidebar} anchor="right">
      <DrawerBackdrop />

      <DrawerContent className="w-[270px] md:w-[300px] bg-white">
        {/* HEADER */}
        <DrawerHeader className="justify-center flex-col gap-2">
          <View style={styles.headerContent}>
            <Avatar size="xl">
              <AvatarFallbackText sx={{ color: TEXT_COLOR }}>
                {user.username ?? "User"}
              </AvatarFallbackText>
              <AvatarImage source={{ uri: user.imageUrl }} />
            </Avatar>

            <VStack style={styles.userInfo}>
              <Text
                sx={{
                  color: TEXT_COLOR,
                  fontSize: 23,
                  fontWeight: "600",
                }}
              >
                {user.username}
              </Text>
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
              <Icon as={User} size="lg" color={TEXT_COLOR} />
              <Text sx={styles.menuText}>My Profile</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                closeSidebar();
                router.push("/(accounts)/accounts");
              }}
            >
              <Icon as={Notebook} size="lg" color={TEXT_COLOR} />
              <Text sx={styles.menuText}>Accounts</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                closeSidebar();
                router.push("/(calendar)/calendarPage");
              }}
            >
              <Icon as={Calendar} size="lg" color={TEXT_COLOR} />
              <Text sx={styles.menuText}>Calendar</Text>
            </Pressable>

            <Pressable
              style={styles.menuItem}
              onPress={() => {
                closeSidebar();
                router.push("/(billing)/billingPage");
              }}
            >
              <Icon as={Wallet} size="lg" color={TEXT_COLOR} />
              <Text sx={styles.menuText}>Billing</Text>
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
            <ButtonText sx={{ color: TEXT_COLOR }}>Logout</ButtonText>
            <ButtonIcon as={LogOut} color={TEXT_COLOR} />
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
