import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import Insights from "./dashboardComponents/insights";
import CalendarWrapper from "@/app/(common)/calendarWrapper";
import { ThemedView } from "@/components/themed-view";

const DashboardTabs = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP TABS */}
      <ThemedView style={styles.tabsContainer}>
        {/* DASHBOARD TAB */}
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab("dashboard")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "dashboard" && styles.activeTabText,
            ]}
          >
            Dashboard
          </Text>

          {activeTab === "dashboard" && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        {/* CALENDAR TAB */}
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab("calendar")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "calendar" && styles.activeTabText,
            ]}
          >
            Calendar
          </Text>

          {activeTab === "calendar" && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </ThemedView>

      {/* TAB CONTENT */}
      <View style={styles.content}>
        {activeTab === "dashboard" ? (
          <Insights />
        ) : (
          <CalendarWrapper />
        )}
      </View>
    </SafeAreaView>
  );
};

export default DashboardTabs;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  tab: {
    flex: 1,
    alignItems: "center",
    // paddingVertical: 14,
  },

  tabText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "400",
    paddingVertical: 10,
  },

  activeTabText: {
    color: "#dc2626",
    fontWeight: "600",
  },

  activeIndicator: {
    // marginTop: 6,
    height: 2,
    width: "100%",
    backgroundColor: "#dc2626",
    borderRadius: 2,
  },

  content: {
    flex: 1,
  },

  contentText: {
    fontSize: 16,
    color: "#111827",
  },
});
