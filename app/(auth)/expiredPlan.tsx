import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { clearSubscriptionCache } from "@/hooks/useSubscriptionCheck";
import * as Linking from 'expo-linking';
import { useRouter } from "expo-router";

export default function ExpiredPlan() {
  const { signOut } = useAuth();

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleRenew = async () => {
    try {
      Linking.openURL('https://campzeo.com');
      // clearSubscriptionCache();
      // await signOut();
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  const COLORS = {
    screenBg: isDark ? "#0f0f11" : "#f1f5f9",
    cardBg: isDark ? "#16161a" : "#ffffff",
    cardBorder: isDark ? "#24242b" : "#e2e8f0",
    textPrimary: isDark ? "#ffffff" : "#0f172a",
    textSecondary: isDark ? "#94a3b8" : "#64748b",
    infoBoxBg: isDark ? "#0f0f11" : "#f8fafc",
    expiredBg: isDark ? "rgba(225, 29, 72, 0.15)" : "#fff1f2",
    expiredText: "#e11d48",
    badgeBg: isDark ? "rgba(225, 29, 72, 0.15)" : "rgba(225, 29, 72, 0.08)",
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: COLORS.screenBg }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={COLORS.screenBg}
      />

      <View
        style={[
          styles.card,
          {
            backgroundColor: COLORS.cardBg,
            borderColor: COLORS.cardBorder,
            shadowColor: isDark ? "#000000" : "#64748b",
          },
        ]}
      >
        {/* Top Premium Red/Orange Gradient border */}
        <LinearGradient
          colors={["#e11d48", "#f97316"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topGradientBar}
        />

        {/* Diamond Icon Circle */}
        <View style={[styles.iconCircle, { backgroundColor: COLORS.badgeBg }]}>
          <FontAwesome5 name="gem" size={38} color="#e11d48" />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: COLORS.textPrimary }]}>
          Your Journey Paused
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: COLORS.textSecondary }]}>
          Your organization's plan has expired. Unlock CampZeo's features and
          continue growing your brand with our premium plans.
        </Text>

        {/* Info Table Box */}
        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: COLORS.infoBoxBg,
              borderColor: COLORS.cardBorder,
            },
          ]}
        >
          {/* Row 1 */}
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: COLORS.textSecondary }]}>
              Current Status:
            </Text>
            <View
              style={[
                styles.expiredBadge,
                { backgroundColor: COLORS.expiredBg },
              ]}
            >
              <Text
                style={[styles.expiredBadgeText, { color: COLORS.expiredText }]}
              >
                EXPIRED
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View
            style={[styles.rowDivider, { backgroundColor: COLORS.cardBorder }]}
          />

          {/* Row 2 */}
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: COLORS.textSecondary }]}>
              Restricted Features:
            </Text>
            <Text style={[styles.rowValue, { color: COLORS.textPrimary }]}>
              Campaigns, Analytics, Contacts & more
            </Text>
          </View>
        </View>

        {/* Primary Premium Action button */}
        <View style={styles.buttonWrapper}>
          <LinearGradient
            colors={["#e11d48", "#f97316"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Pressable
              onPress={handleRenew}
              style={styles.pressableButton}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}
            >
              <Text style={styles.buttonText}>Renew Subscription ➔</Text>
            </Pressable>
          </LinearGradient>
        </View>
        {/* Already have an account? */}
       <View style={{
        marginTop: 10,
       }}>
        <Text style={[styles.instructionText, { color: COLORS.textSecondary }]}>Already Purchased? <Pressable onPress={()=>{router.replace("/(auth)/login")}}><Text style={styles.linkText}>Sign In</Text></Pressable></Text>
       </View>

        {/* Redirection / Web Instruction text under the button */}
        <Text style={[styles.instructionText, { color: COLORS.textSecondary }]}>
          Login to <Text style={styles.linkText}>https://campzeo.com</Text> to
          renew your subscription.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    paddingBottom: 32,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  topGradientBar: {
    height: 6,
    width: "100%",
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: 36,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 28,
    marginBottom: 24,
  },
  infoBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 24,
    marginBottom: 28,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowDivider: {
    height: 1,
    marginVertical: 12,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  rowValue: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
    paddingLeft: 12,
  },
  expiredBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  expiredBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  buttonWrapper: {
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#e11d48",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  gradientButton: {
    borderRadius: 16,
  },
  pressableButton: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.2,
  },
  instructionText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 18,
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  linkText: {
    fontWeight: "700",
    color: "#e11d48",
    textDecorationLine: "underline",
  },
});
