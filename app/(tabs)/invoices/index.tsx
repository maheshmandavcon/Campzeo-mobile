import { fetchInvoices, getInvoiceById } from "@/api/invoicesApi";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeletons";
import { Invoice } from "@/types/types";
import { useUser } from "@/context/AuthContext";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  FileText,
  Calendar,
  Receipt,
} from "lucide-react-native";

export default function Invoices() {
  const { user, isLoaded } = useUser();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const isDark = useColorScheme() === "dark";

  const COLORS = {
    bg: isDark ? "#0f1115" : "#f8fafc",
    card: isDark ? "#171a20" : "#ffffff",
    border: isDark ? "#2a2f3a" : "#e2e8f0",
    text: isDark ? "#f8fafc" : "#0f172a",
    muted: isDark ? "#9ca3af" : "#64748b",
    subtle: isDark ? "#20242c" : "#f1f5f9",
    successBg: isDark ? "#14532d" : "#dcfce7",
    successText: isDark ? "#4ade80" : "#166534",
    pendingBg: isDark ? "#713f12" : "#fef9c3",
    pendingText: isDark ? "#facc15" : "#854d0e",
    accent: "#dc2626",
    white: "#ffffff",
  };

  const loadInvoices = async () => {
    try {
      const data = await fetchInvoices();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.log("Error loading invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!isLoaded || !user) return;
      setLoading(true);
      loadInvoices();
    }, [isLoaded, user])
  );

  const openInvoiceDetails = async (id: number) => {
    try {
      setModalLoading(true);
      setShowDetailModal(true);
      const data = await getInvoiceById(id.toString());
      if (data && data.invoice) {
        setSelectedInvoice(data.invoice);
      } else {
        Toast.show({
          type: "error",
          text1: "Invoice detail not found",
        });
        setShowDetailModal(false);
      }
    } catch (error) {
      console.log("Error loading invoice detail:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load invoice details",
      });
      setShowDetailModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  const renderInvoiceShimmerCard = () => (
    <View
      style={[
        styles.invoiceCard,
        { backgroundColor: COLORS.card, borderColor: COLORS.border, elevation: 0 },
      ]}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <ShimmerSkeleton height={40} width={40} borderRadius={12} />
          <View style={{ gap: 6 }}>
            <ShimmerSkeleton height={16} width={120} />
            <ShimmerSkeleton height={12} width={80} />
          </View>
        </View>
        <ShimmerSkeleton height={24} width={70} borderRadius={8} />
      </View>
      <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 12 }} />
      <View style={{ gap: 6 }}>
        <ShimmerSkeleton height={14} width="90%" />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <ShimmerSkeleton height={14} width={80} />
          <ShimmerSkeleton height={20} width={70} />
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: COLORS.bg }]}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={index}>{renderInvoiceShimmerCard()}</View>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 40,
          flexGrow: 1,
          justifyContent: invoices.length === 0 ? "center" : "flex-start",
        }}
        showsVerticalScrollIndicator={false}
      >
        {invoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBg, { backgroundColor: isDark ? "#20242c" : "#fee2e2" }]}>
              <Receipt size={40} color="#dc2626" />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: COLORS.text }]}>
              No Invoices Found
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: COLORS.muted }]}>
              Your invoice list is currently empty. Generated invoices will show up here.
            </ThemedText>
          </View>
        ) : (
          invoices.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              onPress={() => openInvoiceDetails(item.id)}
              style={[
                styles.invoiceCard,
                { backgroundColor: COLORS.card, borderColor: COLORS.border },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeft}>
                  <View
                    style={[
                      styles.cardIconWrapper,
                      { backgroundColor: isDark ? "#2a1515" : "#fee2e2" },
                    ]}
                  >
                    <FileText size={20} color="#dc2626" />
                  </View>
                  <View style={{ gap: 4 }}>
                    <ThemedText style={[styles.cardId, { color: COLORS.text }]}>
                      {item.invoiceNumber || `INV-${item.id}`}
                    </ThemedText>
                    <View style={styles.cardDateRow}>
                      <Calendar size={13} color={COLORS.muted} />
                      <ThemedText style={[styles.cardDate, { color: COLORS.muted }]}>
                        {new Date(item.invoiceDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.status === "PAID" ? COLORS.successBg : COLORS.pendingBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color:
                          item.status === "PAID" ? COLORS.successText : COLORS.pendingText,
                      },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: COLORS.border }]} />

              <View style={{ gap: 8 }}>
                <ThemedText
                  style={[styles.cardDesc, { color: COLORS.muted }]}
                  numberOfLines={1}
                >
                  {item.description || "Subscription Package"}
                </ThemedText>

                <View style={styles.cardFooterRow}>
                  <ThemedText style={[styles.cardPriceLabel, { color: COLORS.text }]}>
                    Amount:
                  </ThemedText>
                  <ThemedText style={styles.cardPrice}>₹{item.amount}</ThemedText>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Invoice Details Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent
        onRequestClose={() => !modalLoading && setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? "#171a20" : "#ffffff" }]}>
            {/* Modal Navigation */}
            <View style={styles.modalHeaderRow}>
              <TouchableOpacity
                disabled={modalLoading}
                onPress={() => setShowDetailModal(false)}
                style={[
                  styles.closeModalButton,
                  { backgroundColor: isDark ? "#2a2f3a" : "#f1f5f9" },
                ]}
              >
                <Ionicons name="arrow-back" size={22} color={COLORS.text} />
              </TouchableOpacity>
              <ThemedText style={[styles.modalTitle, { color: COLORS.text }]}>
                Invoice Details
              </ThemedText>
              <View style={{ width: 40 }} />
            </View>

            {modalLoading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#dc2626" />
                <ThemedText style={{ marginTop: 12, color: COLORS.muted }}>
                  Fetching secure details...
                </ThemedText>
              </View>
            ) : (
              selectedInvoice && (
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  <View style={styles.invoiceSheet}>
                    {/* Invoice Brand Row */}
                    <View style={styles.invoiceBrandRow}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <View style={styles.brandIconBg}>
                          <Receipt size={18} color="white" />
                        </View>
                        <Text style={styles.brandName}>CampZeo FnMgr</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[styles.sheetInvoiceTitle, { color: COLORS.text }]}>
                          INVOICE
                        </Text>
                        <Text style={[styles.sheetInvoiceNum, { color: COLORS.muted }]}>
                          #{selectedInvoice.invoiceNumber}
                        </Text>
                      </View>
                    </View>

                    {/* Meta info & Status pill */}
                    <View style={styles.metaBadgeRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              selectedInvoice.status === "PAID"
                                ? COLORS.successBg
                                : COLORS.pendingBg,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color:
                                selectedInvoice.status === "PAID"
                                  ? COLORS.successText
                                  : COLORS.pendingText,
                            },
                          ]}
                        >
                          {selectedInvoice.status}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: COLORS.border, marginVertical: 16 }]} />

                    {/* Address / Business Details */}
                    <View style={{ marginBottom: 20 }}>
                      <Text style={[styles.addressText, { color: COLORS.muted }]}>
                        123 Innovation Drive
                      </Text>
                      <Text style={[styles.addressText, { color: COLORS.muted }]}>
                        Tech City, TC 90210
                      </Text>
                      <Text style={[styles.addressLink, { color: COLORS.accent }]}>
                        support@campzeo.com
                      </Text>
                    </View>

                    {/* Client & Date Details */}
                    <View style={styles.detailsGrid}>
                      <View style={{ flex: 1.2, marginRight: 12 }}>
                        <Text style={[styles.sectionLabel, { color: COLORS.muted }]}>
                          BILL TO
                        </Text>
                        <Text style={[styles.clientName, { color: COLORS.text }]}>
                          {selectedInvoice.subscription?.organization?.name || "Amit Jamwal"}
                        </Text>
                        <Text style={[styles.clientSub, { color: COLORS.muted }]}>
                          Mandi, Himachal Pradesh, India
                        </Text>
                        <Text style={[styles.clientEmail, { color: COLORS.accent }]}>
                          {selectedInvoice.subscription?.organization?.email || "ak7719869@gmail.com"}
                        </Text>
                      </View>

                      <View style={{ flex: 0.8, gap: 10 }}>
                        <View>
                          <Text style={[styles.sectionLabel, { color: COLORS.muted }]}>
                            INVOICE DATE
                          </Text>
                          <Text style={[styles.detailValueText, { color: COLORS.text }]}>
                            {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}
                          </Text>
                        </View>
                        <View>
                          <Text style={[styles.sectionLabel, { color: COLORS.muted }]}>
                            DUE DATE
                          </Text>
                          <Text style={[styles.detailValueText, { color: COLORS.text }]}>
                            {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                          </Text>
                        </View>
                        <View>
                          <Text style={[styles.sectionLabel, { color: COLORS.muted }]}>
                            PAYMENT METHOD
                          </Text>
                          <Text style={[styles.detailValueText, { color: COLORS.text }]}>
                            {selectedInvoice.paymentMethod || "RAZORPAY"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: COLORS.border, marginVertical: 20 }]} />

                    {/* Line Items Table */}
                    <View>
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.tableHeaderLabel, { color: COLORS.muted, flex: 3 }]}>
                          DESCRIPTION
                        </Text>
                        <Text
                          style={[
                            styles.tableHeaderLabel,
                            { color: COLORS.muted, flex: 1, textAlign: "right" },
                          ]}
                        >
                          AMOUNT
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.tableItemRow,
                          { backgroundColor: isDark ? "#1c1f26" : "#f8fafc" },
                        ]}
                      >
                        <View style={{ flex: 3 }}>
                          <Text style={[styles.itemName, { color: COLORS.text }]}>
                            {selectedInvoice.description || "Subscription Package"}
                          </Text>
                          {selectedInvoice.subscription && (
                            <Text style={styles.itemPeriod}>
                              Period:{" "}
                              {new Date(
                                selectedInvoice.subscription.startDate
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(
                                selectedInvoice.subscription.endDate
                              ).toLocaleString()}
                            </Text>
                          )}
                        </View>
                        <Text style={[styles.itemPrice, { color: COLORS.text, flex: 1 }]}>
                          ₹{selectedInvoice.amount}
                        </Text>
                      </View>
                    </View>

                    {/* Final Totals Table */}
                    <View style={styles.totalsSection}>
                      <View style={styles.totalRowLine}>
                        <Text style={[styles.totalLabel, { color: COLORS.muted }]}>Subtotal</Text>
                        <Text style={[styles.totalVal, { color: COLORS.text }]}>
                          ₹{selectedInvoice.amount}
                        </Text>
                      </View>

                      <View style={[styles.divider, { backgroundColor: COLORS.border, marginVertical: 10 }]} />

                      <View style={styles.totalRowLine}>
                        <Text style={[styles.grandTotalLabel, { color: COLORS.text }]}>Total</Text>
                        <Text style={styles.grandTotalVal}>₹{selectedInvoice.amount}</Text>
                      </View>
                    </View>

                    {/* Receipt Footnotes */}
                    <View style={styles.footnoteBlock}>
                      <Text style={[styles.footnoteHeader, { color: COLORS.text }]}>
                        Thank you for your business!
                      </Text>
                      <Text style={[styles.footnoteSub, { color: COLORS.muted }]}>
                        If you have any questions concerning this invoice, please contact
                        support@campzeo.com
                      </Text>
                      <Text style={styles.generatedLabel}>GENERATED BY CAMPZEO PLATFORM</Text>
                    </View>
                  </View>
                </ScrollView>
              )
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  invoiceCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardId: {
    fontSize: 16,
    fontWeight: "800",
  },
  cardDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  cardDesc: {
    fontSize: 14,
    fontWeight: "500",
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  cardPriceLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#dc2626",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 80,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: "90%",
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  closeModalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  modalLoadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Invoice Sheet Styles
  invoiceSheet: {
    paddingBottom: 32,
  },
  invoiceBrandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#dc2626",
  },
  sheetInvoiceTitle: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  sheetInvoiceNum: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  metaBadgeRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  addressText: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  addressLink: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  clientName: {
    fontSize: 16,
    fontWeight: "800",
  },
  clientSub: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 2,
  },
  clientEmail: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  detailValueText: {
    fontSize: 13,
    fontWeight: "700",
  },
  tableHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#dc2626",
    marginBottom: 10,
  },
  tableHeaderLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  tableItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
  },
  itemPeriod: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 3,
    fontWeight: "500",
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "800",
    textAlign: "right",
  },
  totalsSection: {
    alignItems: "flex-end",
    marginTop: 24,
  },
  totalRowLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  totalVal: {
    fontSize: 13,
    fontWeight: "700",
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  grandTotalVal: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#dc2626",
  },
  footnoteBlock: {
    alignItems: "center",
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  footnoteHeader: {
    fontSize: 15,
    fontWeight: "800",
  },
  footnoteSub: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 20,
  },
  generatedLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#9ca3af",
    letterSpacing: 1,
    marginTop: 20,
    textTransform: "uppercase",
  },
});
