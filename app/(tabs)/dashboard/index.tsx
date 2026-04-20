import { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import PagerView from "react-native-pager-view";

import Insights from "./dashboardComponents/insights";
import CalendarWrapper from "@/app/(common)/calendarWrapper";
import { ThemedView } from "@/components/themed-view";
import CalendarParent from "@/app/(calendar)/calendarTabs/calendarParent";
import { ScrollView } from "react-native-gesture-handler";

const DashboardTabs = () => {
  const [activeTab, setActiveTab] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const onTabPress = (index: number) => {
    setActiveTab(index);
    pagerRef.current?.setPage(index);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP TABS */}
      <ThemedView style={styles.tabsContainer}>
        {["Dashboard", "Calendar"].map((label, index) => (
          <TouchableOpacity
            key={label}
            style={styles.tab}
            onPress={() => onTabPress(index)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === index && styles.activeTabText,
              ]}
            >
              {label}
            </Text>

            {activeTab === index && (
              <View style={styles.activeIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </ThemedView>

      {/* SWIPE CONTENT */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setActiveTab(e.nativeEvent.position)}
      >
        <View key="dashboard">
          <Insights />
        </View>

        <ScrollView key="calendar">
          <CalendarParent />
          {/* <CalendarWrapper /> */}
        </ScrollView>
      </PagerView>
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
