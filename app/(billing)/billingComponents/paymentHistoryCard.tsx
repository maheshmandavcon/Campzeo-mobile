import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Divider } from "@gluestack-ui/themed";
import { useColorScheme } from "react-native";

const ACCENT = "#dc2626";
const MUTED = "#6b7280";

type PaymentHistoryCardProps = {
  payment: any;
};

export default function PaymentHistoryCard({
  payment,
}: PaymentHistoryCardProps) {
  const isDark = useColorScheme() === "dark";

  // Format date
  const formattedDate = new Date(payment.createdAt).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  // Status color logic
  const statusColor =
    payment.status === "COMPLETED"
      ? ACCENT
      : payment.status === "PENDING"
      ? "#f59e0b"
      : "#ef4444";

  const cardStyle = {
    backgroundColor: isDark ? "#020617" : "#ffffff",
  };
  return (
    <ThemedView style={cardStyle}>
      <HStack style={{ justifyContent: "space-between" }}>
        {/* LEFT SIDE */}
        <VStack style={cardStyle}>
          <ThemedText style={{ fontSize: 15, fontWeight: "600" }}>
            {payment.plan.replace("_", " ")}
          </ThemedText>

          <ThemedText
            style={{
              fontSize: 13,
              color: MUTED,
              marginTop: 2,
            }}
          >
            {formattedDate}
          </ThemedText>
        </VStack>

        {/* RIGHT SIDE */}
        <VStack style={{ alignItems: "flex-end" }}>
          <ThemedText style={{ fontSize: 16, fontWeight: "700" }}>
            ₹{payment.amount}
          </ThemedText>

          <ThemedText
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: statusColor,
              marginTop: 2,
            }}
          >
            {payment.status}
          </ThemedText>
        </VStack>
      </HStack>

      <Divider style={{ marginVertical: 13 }} />
    </ThemedView>
  );
}
