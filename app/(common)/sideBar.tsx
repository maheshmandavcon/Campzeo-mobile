import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer";

import { StyleSheet, View, Text, TouchableOpacity, useColorScheme, Appearance, ScrollView } from "react-native";
import { useColorScheme as useNativewindColorScheme } from "nativewind";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSidebarStore } from "../../store/sidebarStore";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@/context/AuthContext";
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

  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === "dark";
  const { setColorScheme } = useNativewindColorScheme();

  if (!user) return null;

  const displayUser = userData || user;
  const displayName = getDisplayName(displayUser);
  const initials = getInitials(displayUser);
  const email = displayUser?.email ?? user.primaryEmailAddress?.emailAddress;

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

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    Appearance.setColorScheme(nextTheme);
    setColorScheme(nextTheme);
  };

  const themeBg = isDark ? "#121212" : "#FFF5F5";

  return (
    <Drawer isOpen={sidebarOpen} onClose={closeSidebar} anchor="right">
      <DrawerBackdrop />

      <DrawerContent className="w-[300px]">
        <LinearGradient
          colors={isDark ? ["#121212", "#1a1a1a"] : ["#FFF5F5", "#FFE3E3"]}
          style={styles.container}
        >
          <SafeAreaView style={{ flex: 1 }}>
            {/* HEADER SECTION */}
            <View style={styles.topSection}>
              <LinearGradient
                colors={["#dc2626", "#991b1b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerCard}
              >
                <View style={styles.avatarWrapper}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{initials}</Text>
                  </View>
                </View>

                <View style={styles.headerInfo}>
                  <Text numberOfLines={1} style={styles.userName}>
                    {displayName}
                  </Text>
                  <Text numberOfLines={1} style={styles.userRole}>
                    {email || "Administrator"}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* DRAWER ITEMS */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.drawerItemsContainer}>
                {/* My Profile */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigate("/userProfile")}
                  style={styles.drawerItem}
                >
                  <View style={[styles.iconContainer, { backgroundColor: isDark ? "rgba(220, 38, 38, 0.15)" : "rgba(220, 38, 38, 0.08)" }]}>
                    <Ionicons name="person-outline" size={22} color="#dc2626" />
                  </View>
                  <Text style={styles.drawerText}>My Profile</Text>
                  <Ionicons name="chevron-forward" size={18} color="#dc2626" style={styles.chevron} />
                </TouchableOpacity>
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor: isDark ? "#fff" : "#000",
                      opacity: isDark ? 0.2 : 0.08,
                    },
                  ]}
                />

                {/* Accounts */}
                {/* <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigate("/accounts")}
                  style={styles.drawerItem}
                >
                  <View style={[styles.iconContainer, { backgroundColor: isDark ? "rgba(220, 38, 38, 0.15)" : "rgba(220, 38, 38, 0.08)" }]}>
                    <Ionicons name="book-outline" size={22} color="#dc2626" />
                  </View>
                  <Text style={styles.drawerText}>Accounts</Text>
                  <Ionicons name="chevron-forward" size={18} color="#dc2626" style={styles.chevron} />
                </TouchableOpacity>
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor: isDark ? "#fff" : "#000",
                      opacity: isDark ? 0.2 : 0.08,
                    },
                  ]}
                /> */}

                {/* Calendar */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigate("/calendarPage")}
                  style={styles.drawerItem}
                >
                  <View style={[styles.iconContainer, { backgroundColor: isDark ? "rgba(220, 38, 38, 0.15)" : "rgba(220, 38, 38, 0.08)" }]}>
                    <Ionicons name="calendar-outline" size={22} color="#dc2626" />
                  </View>
                  <Text style={styles.drawerText}>Calendar</Text>
                  <Ionicons name="chevron-forward" size={18} color="#dc2626" style={styles.chevron} />
                </TouchableOpacity>
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor: isDark ? "#fff" : "#000",
                      opacity: isDark ? 0.2 : 0.08,
                    },
                  ]}
                />

                {/* Billing History */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigate("/billingPage")}
                  style={styles.drawerItem}
                >
                  <View style={[styles.iconContainer, { backgroundColor: isDark ? "rgba(220, 38, 38, 0.15)" : "rgba(220, 38, 38, 0.08)" }]}>
                    <Ionicons name="card-outline" size={22} color="#dc2626" />
                  </View>
                  <Text style={styles.drawerText}>Billing History</Text>
                  <Ionicons name="chevron-forward" size={18} color="#dc2626" style={styles.chevron} />
                </TouchableOpacity>
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor: isDark ? "#fff" : "#000",
                      opacity: isDark ? 0.2 : 0.08,
                    },
                  ]}
                />

                {/* Invoices */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigate("/invoices")}
                  style={styles.drawerItem}
                >
                  <View style={[styles.iconContainer, { backgroundColor: isDark ? "rgba(220, 38, 38, 0.15)" : "rgba(220, 38, 38, 0.08)" }]}>
                    <Ionicons name="receipt-outline" size={22} color="#dc2626" />
                  </View>
                  <Text style={styles.drawerText}>Invoices</Text>
                  <Ionicons name="chevron-forward" size={18} color="#dc2626" style={styles.chevron} />
                </TouchableOpacity>
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor: isDark ? "#fff" : "#000",
                      opacity: isDark ? 0.2 : 0.08,
                    },
                  ]}
                />

                {/* Templates */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigate("/templet")}
                  style={styles.drawerItem}
                >
                  <View style={[styles.iconContainer, { backgroundColor: isDark ? "rgba(220, 38, 38, 0.15)" : "rgba(220, 38, 38, 0.08)" }]}>
                    <Ionicons name="layers-outline" size={22} color="#dc2626" />
                  </View>
                  <Text style={styles.drawerText}>Templates</Text>
                  <Ionicons name="chevron-forward" size={18} color="#dc2626" style={styles.chevron} />
                </TouchableOpacity>
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor: isDark ? "#fff" : "#000",
                      opacity: isDark ? 0.2 : 0.08,
                    },
                  ]}
                />

                {/* Theme Mode Toggle */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={toggleTheme}
                  style={styles.drawerItem}
                >
                  <View style={[styles.iconContainer, { backgroundColor: isDark ? "rgba(220, 38, 38, 0.15)" : "rgba(220, 38, 38, 0.08)" }]}>
                    <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={22} color="#dc2626" />
                  </View>
                  <Text style={styles.drawerText}>
                    {isDark ? "Light Mode" : "Dark Mode"}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#dc2626" style={styles.chevron} />
                </TouchableOpacity>
                <View
                  style={[
                    styles.divider,
                    {
                      backgroundColor: isDark ? "#fff" : "#000",
                      opacity: isDark ? 0.2 : 0.08,
                    },
                  ]}
                />
              </View>
            </ScrollView>

            {/* LOGOUT CONTAINER */}
            <View style={styles.logoutContainer}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleLogout}
                style={styles.logoutButton}
              >
                <Ionicons name="log-out-outline" size={22} color="#fff" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </DrawerContent>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderBottomLeftRadius: 32,
    borderLeftWidth: 2,
    borderLeftColor: "#dc2626",
    overflow: "hidden",
  },
  topSection: {
    padding: 16,
    marginTop: 10,
  },
  headerCard: {
    padding: 20,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  userRole: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
    fontWeight: "500",
  },
  drawerItemsContainer: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 16,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  drawerText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#dc2626",
  },
  chevron: {
    opacity: 0.5,
  },
  divider: {
    height: 1.5,
    marginHorizontal: 4,
  },
  logoutContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(220, 38, 38, 0.05)",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc2626",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
