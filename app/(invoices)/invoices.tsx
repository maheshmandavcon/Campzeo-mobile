import { fetchInvoices, getInvoiceById } from "@/api/invoicesApi";
import { getCurrentSubscription } from "@/api/billingApi";
import { ThemedText } from "@/components/themed-text";
import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeletons";
import { Invoice } from "@/types/types";
import { useUser } from "@/context/AuthContext";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
  Image,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  FileText,
  Calendar,
  Receipt,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  Download,
} from "lucide-react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Expandable Invoice Card ──────────────────────────────────────────────────
function InvoiceCard({
  item,
  isDark,
  COLORS,
  currentPlanDueDate,
}: {
  item: Invoice;
  isDark: boolean;
  COLORS: Record<string, string>;
  currentPlanDueDate: string | null;
}) {
const [expanded, setExpanded] = useState(false);

useEffect(() => {
  const loadDetail = async () => {
    if (!detail) {
      setLoadingDetail(true);
      try {
        const data = await getInvoiceById(item.id.toString());
        if (data?.invoice) {
          setDetail(data.invoice);
        }
      } catch {
        Toast.show({
          type: "error",
          text1: "Failed to load invoice details",
        });
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  loadDetail();
}, []);  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isPaid = item.status === "PAID";

  const toggle = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !expanded;
    setExpanded(next);

    if (next && !detail) {
      setLoadingDetail(true);
      try {
        const data = await getInvoiceById(item.id.toString());
        if (data?.invoice) {
          setDetail(data.invoice);
        }
      } catch {
        Toast.show({ type: "error", text1: "Failed to load invoice details" });
        setExpanded(false);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const downloadPDF = async () => {
    if (!detail) return;
    setDownloading(true);
    try {
      let planPrice = detail.subscription?.billingPlan?.price || 0;
      const isAddOnInvoice = Number(planPrice) === 0;

      const invoiceDate = new Date(detail.invoiceDate).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
      const dueDateVal = isAddOnInvoice && currentPlanDueDate ? currentPlanDueDate : (detail.subscription?.endDate || detail.dueDate);
      const dueDate = new Date(dueDateVal).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
      const amount = Number(detail.amount).toLocaleString("en-IN");
      const orgName = detail.organization?.name || detail.subscription?.organization?.name || "—";
      const orgEmail = detail.organization?.email || detail.subscription?.organization?.email || "—";
      const description = detail.description || "Subscription Package";
      const paymentMethod = detail.paymentMethod || "Razorpay";
      const statusColor = isPaid ? "#166534" : "#854d0e";
      const statusBg = isPaid ? "#dcfce7" : "#fef9c3";
      const statusLabel = isPaid ? "✓ Paid Successfully" : "⏳ Payment Pending";

      let addOnsList: any[] = [];
      try {
        if (detail.subscription?.addOns) {
          addOnsList = JSON.parse(detail.subscription.addOns);
        }
      } catch (e) {}

      let addOnTotal = 0;
      let addOnsHtml = "";
      addOnsList.forEach((addon: any) => {
        const itemTotal = Number(addon.quantity || 1) * Number(addon.amount || 0);
        addOnTotal += itemTotal;
        addOnsHtml += `
          <div class="table-row" style="margin-top: 4px;">
            <span class="table-desc" style="font-size: 13px; color: #475569;">+ ${addon.name} (x${addon.quantity})</span>
            <span class="table-amt" style="font-size: 13px;">&#8377;${itemTotal.toLocaleString("en-IN")}</span>
          </div>
        `;
      });
      const planName = detail.subscription?.billingPlan?.name || "Subscription Plan";

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                   background: #f8fafc; padding: 32px 24px; color: #0f172a; }
            .card { background: #fff; border-radius: 20px; border: 1.5px solid #e2e8f0;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.07); max-width: 480px;
                    margin: 0 auto; overflow: hidden; }
            .brand-row { display: flex; justify-content: space-between;
                         align-items: center; padding: 20px 24px 16px; }
            .brand { display: flex; align-items: center; gap: 8px; }
            .brand-dot { width: 28px; height: 28px; border-radius: 8px;
                         background: #dc2626; display: flex; align-items: center;
                         justify-content: center; color: #fff; font-size: 14px; font-weight: 900; }
            .brand-name { font-size: 18px; font-weight: 900; color: #dc2626;
                          letter-spacing: 1px; }
            .inv-num { font-size: 12px; color: #64748b; font-weight: 600; }
            .divider { height: 1px; background: #e2e8f0; }
            .section { padding: 14px 24px; }
            .label { font-size: 10px; font-weight: 800; color: #64748b;
                     letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
            .value { font-size: 15px; font-weight: 700; color: #0f172a; }
            .sub-value { font-size: 13px; color: #dc2626; font-weight: 600; margin-top: 2px; }
            .row { display: flex; justify-content: space-between; align-items: center;
                   margin-bottom: 8px; }
            .row-key { font-size: 13px; color: #64748b; }
            .row-val { font-size: 13px; font-weight: 700; color: #0f172a; }
            .table-head { display: flex; justify-content: space-between;
                          border-bottom: 1.5px solid #fee2e2; padding-bottom: 8px;
                          margin-bottom: 10px; }
            .table-head span { font-size: 10px; font-weight: 800; color: #64748b;
                               letter-spacing: 0.8px; text-transform: uppercase; }
            .table-row { display: flex; justify-content: space-between; align-items: center; }
            .table-desc { font-size: 14px; font-weight: 600; color: #0f172a; }
            .table-amt { font-size: 14px; font-weight: 700; color: #0f172a; }
            .total-row { display: flex; justify-content: space-between;
                         align-items: center; margin-bottom: 6px; }
            .total-label { font-size: 16px; font-weight: 800; color: #0f172a; }
            .total-val { font-size: 20px; font-weight: 900; color: #dc2626; }
            .status-footer { display: flex; align-items: center; justify-content: center;
                             gap: 8px; padding: 14px 24px;
                             background: ${statusBg}; }
            .status-text { font-size: 14px; font-weight: 800; color: ${statusColor}; }
            .footer-note { text-align: center; font-size: 10px; color: #9ca3af;
                           letter-spacing: 1px; text-transform: uppercase;
                           padding: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand-row">
              <div class="brand">
                <div class="brand-dot">C</div>
                <span class="brand-name">CAMPZEO</span>
              </div>
              <span class="inv-num">Invoice #${detail.invoiceNumber}</span>
            </div>

            <div class="divider"></div>
            <div class="section">
              <div class="label">Bill To</div>
              <div class="value">${orgName}</div>
              <div class="sub-value">${orgEmail}</div>
            </div>

            <div class="divider"></div>
            <div class="section">
              <div class="row"><span class="row-key">Invoice Date</span><span class="row-val">${invoiceDate}</span></div>
              <div class="row"><span class="row-key">Due Date</span><span class="row-val">${dueDate}</span></div>
              <div class="row"><span class="row-key">Payment</span><span class="row-val">${paymentMethod}</span></div>
            </div>

            <div class="divider"></div>
            <div class="section">
              <div class="table-head"><span>Description</span><span>Amount</span></div>
              ${!detail.subscription ? `
              <div class="table-row">
                <span class="table-desc">${description}</span>
                <span class="table-amt">&#8377;${Number(detail.amount || 0).toLocaleString("en-IN")}</span>
              </div>
              ` : `
                ${isAddOnInvoice ? "" : `
                <div class="table-row">
                  <span class="table-desc">${planName}</span>
                  <span class="table-amt">&#8377;${Number(planPrice).toLocaleString("en-IN")}</span>
                </div>
                `}
                ${addOnsHtml}
              `}
            </div>

            ${(!detail.subscription || isAddOnInvoice) ? "" : `<div class="divider"></div>`}
            <div class="section">
              ${(!detail.subscription || isAddOnInvoice) ? "" : `
              <div class="row"><span class="row-key">Plan Subtotal</span><span class="row-val">&#8377;${Number(planPrice).toLocaleString("en-IN")}</span></div>
              ${addOnTotal > 0 ? `<div class="row"><span class="row-key">Add-ons Total</span><span class="row-val">&#8377;${addOnTotal.toLocaleString("en-IN")}</span></div>` : ""}
              `}
              ${(!detail.subscription || !isAddOnInvoice) ? (() => {
                let gstPercentage = 0;
                const tAmt = Number(detail.taxAmount || 0);
                const totAmt = Number(detail.amount || 0);
                const taxable = totAmt - tAmt;
                if (tAmt > 0 && taxable > 0) {
                  gstPercentage = Math.round((tAmt / taxable) * 100);
                }
                const gstLabel = gstPercentage > 0 ? `GST (${gstPercentage}%)` : "GST";
                return `
              <div class="row"><span class="row-key">${gstLabel}</span><span class="row-val">&#8377;${tAmt.toLocaleString("en-IN")}</span></div>
              <div class="row"><span class="row-key">Discount</span><span class="row-val">&#8377;${Number(detail.discountAmount || 0).toLocaleString("en-IN")}</span></div>
              `;
              })() : ""}
              <div class="total-row" style="margin-top:6px;">
                <span class="total-label">Grand Total</span>
                <span class="total-val">&#8377;${amount}</span>
              </div>
            </div>

            <div class="divider"></div>
            <div class="status-footer">
              <span class="status-text">${statusLabel}</span>
            </div>

            <div class="footer-note">Generated by Campzeo Platform</div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Invoice ${detail.invoiceNumber}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        Toast.show({ type: "error", text1: "Sharing not available on this device" });
      }
    } catch (e) {
      console.log("PDF error:", e);
      Toast.show({ type: "error", text1: "Failed to generate PDF" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: COLORS.card,
          borderColor: expanded ? COLORS.accent : COLORS.border,
        },
      ]}
    >
      {/* ── Collapsed header (always visible) ── */}
      <TouchableOpacity activeOpacity={0.8} onPress={toggle} style={styles.cardCollapsed}>
        <View style={styles.cardLeft}>
          <View style={[styles.cardIcon, { backgroundColor: isDark ? "#2a1515" : "#fee2e2" }]}>
            <FileText size={20} color={COLORS.accent} />
          </View>
          <View style={{ gap: 3, flex: 1 }}>
            <Text style={[styles.invoiceNum, { color: COLORS.text }]}>
              {item.invoiceNumber || `INV-${item.id}`}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Calendar size={12} color={COLORS.muted} />
              <Text style={[styles.invoiceDate, { color: COLORS.muted }]}>
                {new Date(item.invoiceDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardRight}>
          {expanded ? (
            <ChevronUp size={16} color={COLORS.muted} />
          ) : (
            <ChevronDown size={16} color={COLORS.muted} />
          )}
          <Text style={[styles.amountText, { color: COLORS.accent }]}>
            ₹{Number(item.amount).toLocaleString("en-IN")}
          </Text>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: isPaid ? COLORS.successBg : COLORS.pendingBg },
            ]}
          >
            {isPaid ? (
              <CheckCircle size={10} color={COLORS.successText} />
            ) : (
              <Clock size={10} color={COLORS.pendingText} />
            )}
            <Text
              style={[
                styles.statusPillText,
                { color: isPaid ? COLORS.successText : COLORS.pendingText },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View>
          <View style={[styles.expandDivider, { backgroundColor: COLORS.border }]} />

          {loadingDetail ? (
            <View style={styles.detailLoader}>
              <ActivityIndicator size="small" color={COLORS.accent} />
              <Text style={[styles.loadingText, { color: COLORS.muted }]}>
                Fetching details…
              </Text>
            </View>
          ) : detail ? (
            <View style={styles.detailBody}>
              {/* CAMPZEO header */}
              <View style={styles.detailBrandRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Image 
                    source={require("../../assets/app-images/camp-logo.png")} 
                    style={{ width: 120, height: 35 }} 
                    resizeMode="contain" 
                  />
                </View>
                <Text style={[styles.detailInvoiceNum, { color: COLORS.muted }]}>
                  Invoice #{detail.invoiceNumber}
                </Text>
              </View>

              <View style={[styles.sectionDivider, { backgroundColor: COLORS.border }]} />

              {/* Bill To */}
              <View style={styles.detailSection}>
                <Text style={[styles.sectionLabel, { color: COLORS.muted }]}>BILL TO</Text>
                <Text style={[styles.clientName, { color: COLORS.text }]}>
                  {detail.organization?.name || detail.subscription?.organization?.name || "—"}
                </Text>
                <Text style={[styles.clientEmail, { color: COLORS.accent }]}>
                  {detail.organization?.email || detail.subscription?.organization?.email || "—"}
                </Text>
              </View>

              <View style={[styles.sectionDivider, { backgroundColor: COLORS.border }]} />

              {/* Date / Payment info */}
              <View style={styles.detailSection}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailKey, { color: COLORS.muted }]}>Invoice Date</Text>
                  <Text style={[styles.detailValue, { color: COLORS.text }]}>
                    {new Date(detail.invoiceDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailKey, { color: COLORS.muted }]}>Due Date</Text>
                  <Text style={[styles.detailValue, { color: COLORS.text }]}>
                    {new Date(Number(detail.subscription?.billingPlan?.price || 0) === 0 && currentPlanDueDate ? currentPlanDueDate : (detail.subscription?.endDate || detail.dueDate)).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailKey, { color: COLORS.muted }]}>Payment</Text>
                  <Text style={[styles.detailValue, { color: COLORS.text }]}>
                    {detail.paymentMethod || "Razorpay"}
                  </Text>
                </View>
              </View>

              <View style={[styles.sectionDivider, { backgroundColor: COLORS.border }]} />

              {/* Description / Amount table */}
              <View style={styles.detailSection}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { color: COLORS.muted }]}>
                    DESCRIPTION
                  </Text>
                  <Text style={[styles.tableHeaderText, { color: COLORS.muted }]}>AMOUNT</Text>
                </View>

                {!detail.subscription ? (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableDesc, { color: COLORS.text }]}>
                      {detail.description || "Invoice Item"}
                    </Text>
                    <Text style={[styles.tableAmount, { color: COLORS.text }]}>
                      ₹{Number(detail.amount || 0).toLocaleString("en-IN")}
                    </Text>
                  </View>
                ) : (
                  <>
                    {Number(detail.subscription?.billingPlan?.price || 0) !== 0 && (
                      <View style={styles.tableRow}>
                        <Text style={[styles.tableDesc, { color: COLORS.text }]}>
                          {detail.subscription?.billingPlan?.name || "Subscription Plan"}
                        </Text>
                        <Text style={[styles.tableAmount, { color: COLORS.text }]}>
                          ₹{Number(detail.subscription?.billingPlan?.price || 0).toLocaleString("en-IN")}
                        </Text>
                      </View>
                    )}
                    {/* AddOns */}
                    {(() => {
                      try {
                        const addOnsList = detail.subscription?.addOns ? JSON.parse(detail.subscription.addOns) : [];
                        return addOnsList.map((addon: any, idx: number) => (
                          <View style={[styles.tableRow, { marginTop: 8 }]} key={idx}>
                            <Text style={[styles.tableDesc, { color: COLORS.text, fontSize: 13 }]}>
                              + {addon.name} (x{addon.quantity})
                            </Text>
                            <Text style={[styles.tableAmount, { color: COLORS.text, fontSize: 13 }]}>
                              ₹{(Number(addon.quantity || 1) * Number(addon.amount || 0)).toLocaleString("en-IN")}
                            </Text>
                          </View>
                        ));
                      } catch (e) {
                        return null;
                      }
                    })()}
                  </>
                )}
              </View>

              {(Number(detail.subscription?.billingPlan?.price || 0) !== 0 || !detail.subscription) && (
                <View style={[styles.sectionDivider, { backgroundColor: COLORS.border }]} />
              )}

              {/* Totals */}
              <View style={styles.detailSection}>
                {(() => {
                  let addOnTotal = 0;
                  try {
                    const addOnsList = detail.subscription?.addOns ? JSON.parse(detail.subscription.addOns) : [];
                    addOnsList.forEach((addon: any) => {
                      addOnTotal += Number(addon.quantity || 1) * Number(addon.amount || 0);
                    });
                  } catch (e) {}

                  return (
                    <>
                      {Number(detail.subscription?.billingPlan?.price || 0) !== 0 && (
                        <>
                          <View style={styles.detailRow}>
                            <Text style={[styles.detailKey, { color: COLORS.muted }]}>Plan Subtotal</Text>
                            <Text style={[styles.detailValue, { color: COLORS.text }]}>
                              ₹{Number(detail.subscription?.billingPlan?.price || 0).toLocaleString("en-IN")}
                            </Text>
                          </View>
                          {addOnTotal > 0 && (
                            <View style={[styles.detailRow, { marginTop: 4 }]}>
                              <Text style={[styles.detailKey, { color: COLORS.muted }]}>Add-ons Total</Text>
                              <Text style={[styles.detailValue, { color: COLORS.text }]}>
                                ₹{addOnTotal.toLocaleString("en-IN")}
                              </Text>
                            </View>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}
                
                {(Number(detail.subscription?.billingPlan?.price || 0) !== 0 || !detail.subscription) && (() => {
                  let gstPercentage = 0;
                  const tAmt = Number(detail.taxAmount || 0);
                  const totAmt = Number(detail.amount || 0);
                  const taxable = totAmt - tAmt;
                  if (tAmt > 0 && taxable > 0) {
                    gstPercentage = Math.round((tAmt / taxable) * 100);
                  }
                  const gstLabel = gstPercentage > 0 ? `GST (${gstPercentage}%)` : "GST";
                  
                  return (
                  <>
                    <View style={[styles.detailRow, { marginTop: 4 }]}>
                      <Text style={[styles.detailKey, { color: COLORS.muted }]}>{gstLabel}</Text>
                      <Text style={[styles.detailValue, { color: COLORS.text }]}>₹{tAmt.toLocaleString("en-IN")}</Text>
                    </View>
                    <View style={[styles.detailRow, { marginTop: 4 }]}>
                      <Text style={[styles.detailKey, { color: COLORS.muted }]}>Discount</Text>
                      <Text style={[styles.detailValue, { color: COLORS.text }]}>₹{Number(detail.discountAmount || 0).toLocaleString("en-IN")}</Text>
                    </View>
                  </>
                  );
                })()}

                <View style={[styles.detailRow, { marginTop: 8 }]}>
                  <Text style={[styles.totalLabel, { color: COLORS.text }]}>Grand Total</Text>
                  <Text style={[styles.totalValue, { color: COLORS.accent }]}>
                    ₹{Number(detail.amount).toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>

              <View style={[styles.sectionDivider, { backgroundColor: COLORS.border }]} />

              {/* Download Button */}
              <TouchableOpacity
                onPress={downloadPDF}
                disabled={downloading}
                style={[styles.downloadBtn, { opacity: downloading ? 0.6 : 1 }]}
                activeOpacity={0.8}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Download size={16} color="#fff" />
                )}
                <Text style={styles.downloadBtnText}>
                  {downloading ? "Generating PDF…" : "Download Receipt"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function Invoices() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentPlanDueDate, setCurrentPlanDueDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (loading || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const [data, subData] = await Promise.all([
        fetchInvoices(),
        getCurrentSubscription()
      ]);
      setInvoices(data.invoices || []);
      if (subData?.subscription?.endDate) {
        setCurrentPlanDueDate(subData.subscription.endDate);
      }
    } catch (error) {
      console.log("Error refreshing invoices:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isDark = useColorScheme() === "dark";
  const { width: screenWidth } = useWindowDimensions();

  const titleFontSize = Math.min(26, Math.max(18, screenWidth * 0.062));

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
      const [data, subData] = await Promise.all([
        fetchInvoices(),
        getCurrentSubscription()
      ]);
      setInvoices(data.invoices || []);
      if (subData?.subscription?.endDate) {
        setCurrentPlanDueDate(subData.subscription.endDate);
      }
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

  const renderShimmer = () => (
  <View
    style={[
      styles.card,
      {
        backgroundColor: COLORS.card,
        borderColor: COLORS.border,
      },
    ]}
  >
    {/* Header */}
    <View style={styles.cardCollapsed}>
      <View style={styles.cardLeft}>
        <ShimmerSkeleton height={44} width={44} borderRadius={14} />
        <View style={{ flex: 1, gap: 6 }}>
          <ShimmerSkeleton height={15} width={140} />
          <ShimmerSkeleton height={12} width={100} />
        </View>
      </View>

      <View style={styles.cardRight}>
        <ShimmerSkeleton height={16} width={16} borderRadius={8} />
        <ShimmerSkeleton height={18} width={80} />
        <ShimmerSkeleton height={24} width={70} borderRadius={8} />
      </View>
    </View>

  </View>
);

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Back button — fixed width so title never crowds it */}
      <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
        <Ionicons name="arrow-back-outline" size={22} color={COLORS.text} />
      </TouchableOpacity>

      {/* Title — flex: 1 so it fills remaining space, shrinks if needed */}
      <Text
        style={[
          styles.headerTitle,
          { color: COLORS.text, fontSize: titleFontSize },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        Invoices
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
        {renderHeader()}
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i}>{renderShimmer()}</View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.bg }]}>
      {renderHeader()}
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 40,
          flexGrow: 1,
          justifyContent: invoices.length === 0 ? "center" : "flex-start",
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#dc2626" />}
      >
        {invoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBg, { backgroundColor: isDark ? "#20242c" : "#fee2e2" }]}>
              <Receipt size={40} color="#dc2626" />
            </View>
            <Text style={[styles.emptyTitle, { color: COLORS.text }]}>No Invoices Found</Text>
            <Text style={[styles.emptySubtitle, { color: COLORS.muted }]}>
              Your invoice list is currently empty. Generated invoices will show up here.
            </Text>
          </View>
        ) : (
          invoices.map((item) => (
            <InvoiceCard key={item.id} item={item} isDark={isDark} COLORS={COLORS} currentPlanDueDate={currentPlanDueDate} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 30,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,          // never shrink the icon buttons
  },
  headerTitle: {
    flex: 1,               // fill remaining space between the two icon buttons
    fontWeight: "800",
    // fontSize is set dynamically via titleFontSize
  },

  // Card shell
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  // Collapsed row
  cardCollapsed: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    gap: 10,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 5,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  invoiceNum: {
    fontSize: 15,
    fontWeight: "800",
  },
  invoiceDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "800",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  // Expand divider
  expandDivider: {
    height: 1,
  },

  // Detail loading
  detailLoader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 20,
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "500",
  },

  // Detail body
  detailBody: {
    paddingBottom: 4,
  },
  detailBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  brandDot: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
  },
  brandLabel: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 1,
  },
  detailInvoiceNum: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionDivider: {
    height: 1,
    marginHorizontal: 0,
  },
  detailSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  clientName: {
    fontSize: 15,
    fontWeight: "700",
  },
  clientEmail: {
    fontSize: 13,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailKey: {
    fontSize: 13,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "700",
  },

  // Table
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#dc262630",
    paddingBottom: 6,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tableDesc: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  tableAmount: {
    fontSize: 14,
    fontWeight: "700",
  },

  // Totals
  totalLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "900",
  },

  // Status footer
  statusFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 0,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  statusFooterText: {
    fontSize: 13,
    fontWeight: "800",
  },

  // Download button
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#dc2626",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.3,
  },

  // Empty state
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
});
