import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  Briefcase,
  Mail,
  User,
  UserPen,
} from "lucide-react-native";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { ReactNode, useState } from "react";
import { useUser } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Divider } from "@/components/ui/divider";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeletons";
import EditProfile from "../(auth)/editProfile";
import { getDisplayName, getInitials } from "@/utils/userDisplay";
import { useUserDetails } from "@/hooks/useUserDetails";

export default function UserProfile() {
  const [showEditProfile, setEditProfile] = useState(false);

  const colorScheme = useColorScheme();
  const routePage = useRouter();
  const { user } = useUser();
  const isDark = colorScheme === "dark";
  const { userData, loading } = useUserDetails(Boolean(user));

  if (!user) return null;

  const profileUser = userData || user;
  const displayName = getDisplayName(profileUser);
  const initials = getInitials(profileUser);
  const email = profileUser?.email ?? user.primaryEmailAddress?.emailAddress ?? "-";
  const organisation = userData?.organisation?.name ?? "-";

  const COLORS = {
    bg: isDark ? "#0f1115" : "#f8fafc",
    card: isDark ? "#171a20" : "#ffffff",
    border: isDark ? "#2a2f3a" : "#e5e7eb",
    text: isDark ? "#f8fafc" : "#0f172a",
    muted: isDark ? "#9ca3af" : "#64748b",
    subtle: isDark ? "#20242c" : "#f1f5f9",
  };

  const DetailRow = ({
    icon,
    label,
    value,
  }: {
    icon: ReactNode;
    label: string;
    value: string;
  }) => (
    <HStack style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: isDark ? "#2a1515" : "#fee2e2" }]}>
        {icon}
      </View>
      <VStack style={{ flex: 1 }}>
        <ThemedText style={[styles.detailLabel, { color: COLORS.muted }]}>
          {label}
        </ThemedText>
        <ThemedText style={[styles.detailValue, { color: COLORS.text }]}>
          {value}
        </ThemedText>
      </VStack>
    </HStack>
  );

  const ProfileSkeleton = () => (
    <ThemedView style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <HStack style={styles.header}>
        <Pressable onPress={() => routePage.back()} style={styles.backButton}>
          <Ionicons
            name="arrow-back-outline"
            size={22}
            color={COLORS.text}
          />
        </Pressable>
      </HStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack style={styles.profileHeader}>
          <ShimmerSkeleton height={112} width={112} borderRadius={56} />
          <ShimmerSkeleton height={24} width={190} />
          <ShimmerSkeleton height={14} width={220} />
        </VStack>

        <Box style={[styles.detailsCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
          <VStack style={{ gap: 18 }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <HStack key={index} style={styles.detailRow}>
                <ShimmerSkeleton height={44} width={44} borderRadius={14} />
                <VStack style={{ flex: 1, gap: 8 }}>
                  <ShimmerSkeleton height={12} width={90} />
                  <ShimmerSkeleton height={16} width={index === 1 ? "90%" : "60%"} />
                </VStack>
              </HStack>
            ))}
          </VStack>
        </Box>
      </ScrollView>
    </ThemedView>
  );

  if (loading) return <ProfileSkeleton />;

  return (
    <>
      <ThemedView style={[styles.container, { backgroundColor: COLORS.bg }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <HStack style={styles.header}>
            <Pressable onPress={() => routePage.back()} style={styles.backButton}>
              <Ionicons
                name="arrow-back-outline"
                size={22}
                color={COLORS.text}
              />
            </Pressable>
          </HStack>

          <VStack style={styles.profileHeader}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>{initials}</ThemedText>
            </View>

            <ThemedText style={[styles.name, { color: COLORS.text }]}>
              {displayName}
            </ThemedText>
            <ThemedText style={[styles.email, { color: COLORS.muted }]}>
              {email}
            </ThemedText>
          </VStack>

          <Box style={[styles.detailsCard, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
            <VStack style={{ gap: 18 }}>
              <DetailRow
                icon={<User size={21} color="#dc2626" />}
                label="Username"
                value={displayName}
              />

              <Divider />

              <DetailRow
                icon={<Mail size={20} color="#dc2626" />}
                label="Email"
                value={email}
              />

              <Divider />

              <DetailRow
                icon={<Briefcase size={20} color="#dc2626" />}
                label="Organisation"
                value={organisation}
              />
            </VStack>
          </Box>

          <VStack style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.primaryAction}
              onPress={() => setEditProfile(true)}
            >
              <UserPen size={20} color="white" />
              <ThemedText style={{ color: "white", fontWeight: "600" }}>
                Edit Profile
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
          {/* <View
            style={{
              width: "90%",
              backgroundColor: "white",
              borderRadius: 16,
              padding: 20,
            }}
          >

            <EditProfile closeEPF={() => setEditProfile(false)} />

          </View> */}
          <View
            style={{
              width: "95%",
              borderRadius: 16,
              overflow: "hidden",
              backgroundColor: isDark ? "#161618" : "#ffffff",
              borderWidth: 1.5,
              borderColor: "#ffffff",
              elevation: 0,
            }}
          >
            <EditProfile
            // userDetails = {userData}
             closeEPF={() => setEditProfile(false)} />
          </View>
        </View>
      </Modal>

    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 64,
  },
  header: {
    marginBottom: 18,
  },
  backButton: {
    alignItems: "center",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  profileHeader: {
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: 56,
    height: 112,
    justifyContent: "center",
    marginBottom: 6,
    width: 112,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "800",
  },
  name: {
    fontSize: 25,
    fontWeight: "800",
    textAlign: "center",
  },
  email: {
    fontSize: 14,
    textAlign: "center",
  },
  detailsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  detailRow: {
    alignItems: "center",
    gap: 12,
  },
  detailIcon: {
    alignItems: "center",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  actions: {
    gap: 12,
    marginTop: 24,
    paddingBottom: 32,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 15,
  },
});
