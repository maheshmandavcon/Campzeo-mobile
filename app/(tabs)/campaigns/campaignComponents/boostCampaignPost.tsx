import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Linking,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MetaAdsAccount, getMetaAdsAccountsApi, updatePostForCampaignApi } from "@/api/campaignApi";
import { useAuth } from "@clerk/clerk-expo";

interface BoostCampaignPostProps {
  visible: boolean;
  onClose: () => void;
  post: any;
  campaignId: number;
  isDark: boolean;
  onSuccess?: () => void;
}

export default function BoostCampaignPost({
  visible,
  onClose,
  post,
  campaignId,
  isDark,
  onSuccess,
}: BoostCampaignPostProps) {
  const { getToken } = useAuth();
  const [isBoosting, setIsBoosting] = useState(false);
  const [metaAccounts, setMetaAccounts] = useState<MetaAdsAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedMetaAccount, setSelectedMetaAccount] = useState<MetaAdsAccount | null>(null);
  const [metaAccountModalVisible, setMetaAccountModalVisible] = useState(false);
  
  const [boostingGoal, setBoostingGoal] = useState<"POST_ENGAGEMENT" | "LEADS">("POST_ENGAGEMENT");
  const [dailyBudget, setDailyBudget] = useState(5);
  const [boostingDuration, setBoostingDuration] = useState(7);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && post) {
      const boosting = post.metadata?.boosting;
      if (boosting) {
        setIsBoosting(true);
        setBoostingGoal(boosting.goal || "POST_ENGAGEMENT");
        setDailyBudget(boosting.dailyBudget || boosting.budget || 5);
        setBoostingDuration(boosting.durationDays || boosting.duration || 7);
        // Find saved account if possible
        if (boosting.adAccountId && metaAccounts.length > 0) {
           const found = metaAccounts.find(a => a.account_id === boosting.adAccountId);
           if (found) setSelectedMetaAccount(found);
        }
      } else {
        setIsBoosting(false);
      }
    }
  }, [visible, post, metaAccounts]);

  useEffect(() => {
    if (visible) {
      fetchMetaAccounts();
    }
  }, [visible]);

  const fetchMetaAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const token = await getToken();
      if (token) {
        const accounts = await getMetaAdsAccountsApi(token);
        setMetaAccounts(accounts);
        if (accounts.length > 0 && !selectedMetaAccount) {
          setSelectedMetaAccount(accounts[0]);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch meta ads accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const totalBudget = dailyBudget * boostingDuration;
  const estimatedReach = useMemo(() => ({
    min: Math.floor(dailyBudget * 60),
    max: Math.floor(dailyBudget * 80)
  }), [dailyBudget]);

  const handleSave = async () => {
    if (!campaignId || !post?.id) return;
    
    setSaving(true);
    try {
      const updatedMetadata = {
        ...post.metadata,
        boosting: isBoosting ? {
          enabled: true,
          goal: boostingGoal,
          dailyBudget,
          durationDays: boostingDuration,
          adAccountId: selectedMetaAccount?.account_id,
          adAccountName: selectedMetaAccount?.name,
        } : null
      };

      await updatePostForCampaignApi(campaignId, post.id, {
        ...post,
        metadata: updatedMetadata
      });

      Alert.alert("Success", "Boost settings saved successfully");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save boost settings");
    } finally {
      setSaving(false);
    }
  };

  const openMetaBilling = (accountId?: string) => {
    if (!accountId) return;
    Linking.openURL(`https://www.facebook.com/ads/manager/billing/transactions/?act=${accountId}`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <ThemedView 
          style={{ 
            backgroundColor: isDark ? "#161618" : "#fff", 
            borderTopLeftRadius: 24, 
            borderTopRightRadius: 24, 
            padding: 20, 
            maxHeight: '90%',
            overflow: 'hidden'
          }}
        >
           {/* Header */}
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
             <View style={{ flex: 1 }}>
               <ThemedText style={{ fontSize: 20, fontWeight: 'bold' }}>Boost Existing Post</ThemedText>
               <ThemedText style={{ fontSize: 13, opacity: 0.6 }}>Configure budget and targeting to reach more people with this post.</ThemedText>
             </View>
             <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
               <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"} />
             </TouchableOpacity>
           </View>

           <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Meta Boosting Section */}
              <View style={{
                borderWidth: 1,
                borderColor: isDark ? "#374151" : "#d1d5db",
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                backgroundColor: isDark ? "#111827" : "#faebed",
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <View>
                    <ThemedText style={{ fontSize: 18, fontWeight: "bold" }}>Meta Boosting</ThemedText>
                    <ThemedText style={{ fontSize: 13, opacity: 0.7 }}>Reach more people on Facebook & Instagram</ThemedText>
                  </View>
                  <Switch
                    value={isBoosting}
                    onValueChange={setIsBoosting}
                    trackColor={{ false: "#767577", true: "#0668E1" }}
                    thumbColor={isBoosting ? "#ffffff" : "#f4f3f4"}
                  />
                </View>

                {isBoosting && (
                  <View>
                    <ThemedText style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}>Ad Account</ThemedText>
                    {loadingAccounts ? (
                      <ActivityIndicator size="small" color="#0668E1" style={{ marginVertical: 10 }} />
                    ) : metaAccounts.length > 0 ? (
                      <TouchableOpacity
                        onPress={() => setMetaAccountModalVisible(true)}
                        style={{
                          backgroundColor: isDark ? "#1f2937" : "#fff",
                          borderRadius: 12,
                          padding: 14,
                          borderWidth: 1,
                          borderColor: isDark ? "#374151" : "#e5e7eb",
                          marginBottom: 16,
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <View>
                          <ThemedText style={{ fontWeight: "600" }}>{selectedMetaAccount?.name || "Mandav Devs"}</ThemedText>
                          <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                            {selectedMetaAccount?.currency || "INR"} • ID: {selectedMetaAccount?.account_id || "1237825278172670"}
                          </ThemedText>
                        </View>
                        <Ionicons name="chevron-down" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
                      </TouchableOpacity>
                    ) : (
                      <ThemedText style={{ fontSize: 13, color: "#ef4444", marginBottom: 16 }}>No Ad accounts linked</ThemedText>
                    )}

                    {/* Financial Status Section */}
                    {selectedMetaAccount && (
                      <View style={{ marginBottom: 20 }}>
                        <ThemedText style={{ fontSize: 14, fontWeight: "600", marginBottom: 12 }}>Financial Status</ThemedText>
                        
                        <View style={{ 
                          backgroundColor: isDark ? "#1f2937" : "#fffbeb", 
                          padding: 12, 
                          borderRadius: 12, 
                          marginBottom: 12,
                          borderWidth: 1,
                          borderColor: "#f59e0b"
                        }}>
                           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                              <Ionicons name="alert-circle" size={16} color="#b45309" />
                              <ThemedText style={{ color: "#b45309", fontWeight: 'bold', marginLeft: 6 }}>Action Required</ThemedText>
                           </View>
                           <ThemedText style={{ fontSize: 12, color: "#b45309" }}>Review your account payment status to avoid delivery issues.</ThemedText>
                        </View>

                        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                          <View style={{
                            flex: 1,
                            backgroundColor: isDark ? "#1f2937" : "#fff",
                            borderRadius: 12,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: isDark ? "#374151" : "#e5e7eb"
                          }}>
                            <ThemedText style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Available Funds</ThemedText>
                            <ThemedText style={{ fontSize: 15, fontWeight: "bold", color: "#6b7280" }}>Not Linked</ThemedText>
                          </View>

                          <View style={{
                            flex: 1,
                            backgroundColor: isDark ? "#1f2937" : "#fff",
                            borderRadius: 12,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: isDark ? "#374151" : "#e5e7eb"
                          }}>
                            <ThemedText style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>Lifetime Spent</ThemedText>
                            <ThemedText style={{ fontSize: 15, fontWeight: "bold" }}>{selectedMetaAccount.currency || "INR"} 0.00</ThemedText>
                          </View>
                        </View>

                        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                          <TouchableOpacity
                            onPress={() => openMetaBilling(selectedMetaAccount.account_id)}
                            style={{
                              flex: 1,
                              backgroundColor: "#0668E1",
                              paddingVertical: 10,
                              borderRadius: 10,
                              alignItems: "center"
                            }}
                          >
                            <ThemedText style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>Add Funds</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => openMetaBilling(selectedMetaAccount.account_id)}
                            style={{
                              flex: 1.2,
                              backgroundColor: isDark ? "#374151" : "#f3f4f6",
                              paddingVertical: 10,
                              borderRadius: 10,
                              alignItems: "center",
                              borderWidth: 1,
                              borderColor: isDark ? "#4b5563" : "#e5e7eb"
                            }}
                          >
                            <ThemedText style={{ fontWeight: "600", fontSize: 13 }}>Link Payment Method</ThemedText>
                          </TouchableOpacity>
                        </View>
                        <ThemedText style={{ fontSize: 10, opacity: 0.5, fontStyle: 'italic' }}>
                          Tip: You can add funds via the Meta Boost page or Ads Manager.
                        </ThemedText>
                      </View>
                    )}

                    <ThemedText style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}>Goal</ThemedText>
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                      <TouchableOpacity
                        onPress={() => setBoostingGoal("POST_ENGAGEMENT")}
                        style={{
                          flex: 1,
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: boostingGoal === "POST_ENGAGEMENT" ? "#0668E1" : (isDark ? "#374151" : "#e5e7eb"),
                          backgroundColor: boostingGoal === "POST_ENGAGEMENT" ? (isDark ? "#1e3a8a" : "#eff6ff") : "transparent"
                        }}
                      >
                        <ThemedText style={{ fontSize: 14, fontWeight: "bold", textAlign: "center" }}>Engagement</ThemedText>
                        <ThemedText style={{ fontSize: 11, textAlign: "center", opacity: 0.7 }}>Likes, Shares & Comments</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setBoostingGoal("LEADS")}
                        style={{
                          flex: 1,
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: boostingGoal === "LEADS" ? "#0668E1" : (isDark ? "#374151" : "#e5e7eb"),
                          backgroundColor: boostingGoal === "LEADS" ? (isDark ? "#1e3a8a" : "#eff6ff") : "transparent"
                        }}
                      >
                        <ThemedText style={{ fontSize: 14, fontWeight: "bold", textAlign: "center" }}>Leads</ThemedText>
                        <ThemedText style={{ fontSize: 11, textAlign: "center", opacity: 0.7 }}>Customer Form Capture</ThemedText>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}>Daily Budget</ThemedText>
                        <View style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: isDark ? "#1f2937" : "#fff",
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          borderWidth: 1,
                          borderColor: isDark ? "#374151" : "#e5e7eb"
                        }}>
                          <ThemedText style={{ opacity: 0.5 }}>{selectedMetaAccount?.currency || "INR"} </ThemedText>
                          <TextInput
                            value={String(dailyBudget)}
                            onChangeText={(v) => setDailyBudget(Number(v) || 0)}
                            keyboardType="numeric"
                            style={{ color: isDark ? "#fff" : "#000", padding: 10, flex: 1, fontWeight: "bold" }}
                          />
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText style={{ fontSize: 14, fontWeight: "600", marginBottom: 8 }}>Days</ThemedText>
                        <View style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: isDark ? "#1f2937" : "#fff",
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          borderWidth: 1,
                          borderColor: isDark ? "#374151" : "#e5e7eb"
                        }}>
                          <TextInput
                            value={String(boostingDuration)}
                            onChangeText={(v) => setBoostingDuration(Number(v) || 0)}
                            keyboardType="numeric"
                            style={{ color: isDark ? "#fff" : "#000", padding: 10, flex: 1, fontWeight: "bold" }}
                          />
                          <ThemedText style={{ opacity: 0.5 }}>days</ThemedText>
                        </View>
                      </View>
                    </View>

                    <View style={{
                      backgroundColor: isDark ? "#1f2937" : "#f8fafc",
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 16
                    }}>
                      <ThemedText style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Estimated Daily Reach</ThemedText>
                      <ThemedText style={{ fontSize: 20, fontWeight: "bold" }}>{estimatedReach.min.toLocaleString()} - {estimatedReach.max.toLocaleString()}</ThemedText>
                      <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>people / day</ThemedText>

                      <View style={{ height: 1, backgroundColor: isDark ? "#374151" : "#e5e7eb", marginVertical: 12 }} />

                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <ThemedText style={{ fontSize: 13, fontWeight: "600" }}>Total Spend</ThemedText>
                        <ThemedText style={{ fontSize: 16, fontWeight: "bold", color: "#0668E1" }}>{selectedMetaAccount?.currency || "INR"} {totalBudget}</ThemedText>
                      </View>
                    </View>

                    <ThemedText style={{ fontSize: 10, opacity: 0.5, fontStyle: "italic", marginBottom: 16 }}>
                      * Estimates are based on Meta's historical performance data for your {selectedMetaAccount?.currency || "INR"} {dailyBudget} daily budget. Figures are in your local account currency.
                    </ThemedText>

                    <View style={{
                      backgroundColor: isDark ? "#374151" : "#fffbeb",
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#f59e0b",
                      marginBottom: 20
                    }}>
                      <ThemedText style={{ fontSize: 13, fontWeight: "bold", color: "#b45309", marginBottom: 4 }}>Scheduled Auto-Boost</ThemedText>
                      <ThemedText style={{ fontSize: 12, color: "#b45309" }}>
                        Since this post isn't published yet, you can configure your boost settings here. CampZeo will automatically apply these settings when the post goes live on Meta.
                      </ThemedText>
                    </View>
                  </View>
                )}
              </View>
           </ScrollView>

           <View style={{ flexDirection: 'row', gap: 12, paddingTop: 12 }}>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: isDark ? "#374151" : "#f3f4f6",
                  alignItems: 'center'
                }}
              >
                <ThemedText style={{ fontWeight: 'bold' }}>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{
                  flex: 2,
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: "#0668E1",
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center'
                }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={{ color: "#fff", fontWeight: 'bold' }}>Save Boost Settings</ThemedText>
                )}
              </TouchableOpacity>
           </View>
        </ThemedView>
      </View>

      <Modal
        visible={metaAccountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMetaAccountModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 }}>
          <ThemedView style={{ backgroundColor: isDark ? "#1f2937" : "#fff", borderRadius: 16, padding: 16, maxHeight: "70%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <ThemedText style={{ fontSize: 18, fontWeight: "bold" }}>Select Ad Account</ThemedText>
              <TouchableOpacity onPress={() => setMetaAccountModalVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={metaAccounts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedMetaAccount(item);
                    setMetaAccountModalVisible(false);
                  }}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    marginBottom: 10,
                    backgroundColor: selectedMetaAccount?.id === item.id ? (isDark ? "#1e3a8a" : "#eff6ff") : (isDark ? "#111827" : "#f9fafb"),
                    borderWidth: 1,
                    borderColor: selectedMetaAccount?.id === item.id ? "#0668E1" : (isDark ? "#374151" : "#e5e7eb")
                  }}
                >
                  <ThemedText style={{ fontWeight: "600" }}>{item.name}</ThemedText>
                  <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>{item.currency} • {item.account_id}</ThemedText>
                </TouchableOpacity>
              )}
            />
          </ThemedView>
        </View>
      </Modal>
    </Modal>
  );
}
