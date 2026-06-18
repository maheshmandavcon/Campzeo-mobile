import { View, Text } from "react-native";

export interface InvoiceRecord {
  id: number;
  organisation: string;
  plan: string;
  amount: string;
  status: "paid" | "pending";
  invoiceDate: string;
  dueDate: string;
}

export default function InvoiceCard({ invoice }: { invoice: InvoiceRecord }) {
  const statusColor =
    invoice.status === "paid"
      ? { bg: "#d1fae5", color: "#065f46" } // green
      : { bg: "#fef9c3", color: "#92400e" }; // yellow

  return (
    <View
      style={{
        backgroundColor: "white",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      {/* Organisation Name */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>
          {invoice.organisation}
        </Text>

        {/* Status Badge */}
        <View
          style={{
            backgroundColor: statusColor.bg,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: statusColor.color,
              fontWeight: "bold",
              textTransform: "capitalize",
            }}
          >
            {invoice.status}
          </Text>
        </View>
      </View>

      {/* Plan */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <Text style={{ fontWeight: "bold", color: "#111827" }}>Plan</Text>
        <Text style={{ color: "#374151" }}>{invoice.plan}</Text>
      </View>

      {/* Amount */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <Text style={{ fontWeight: "bold", color: "#111827" }}>Amount</Text>
        <Text style={{ color: "#374151" }}>{invoice.amount}</Text>
      </View>

      {/* Invoice Date */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <Text style={{ fontWeight: "bold", color: "#111827" }}>
          Invoice Date
        </Text>
        <Text style={{ color: "#374151" }}>{invoice.invoiceDate}</Text>
      </View>

      {/* Due Date */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <Text style={{ fontWeight: "bold", color: "#111827" }}>Due Date</Text>
        <Text style={{ color: "#374151" }}>{invoice.dueDate}</Text>
      </View>
    </View>
  );
}




// import { View } from "react-native";
// import { Skeleton, VStack, HStack } from "@gluestack-ui/themed";

// export function InvoiceCardSkeleton() {
//   return (
//     <View
//       style={{
//         backgroundColor: "white",
//         padding: 16,
//         borderRadius: 12,
//         marginBottom: 12,
//       }}
//     >
//       <VStack space="lg">
//         {/* Organisation + Status */}
//         <HStack
//           justifyContent="space-between"
//           alignItems="center"
//           mb="$2"
//         >
//           {/* Organisation Name */}
//           <Skeleton h={20} w={180} rounded="$md" />

//           {/* Status Badge */}
//           <Skeleton h={20} w={70} rounded="$sm" />
//         </HStack>

//         {/* Plan */}
//         <HStack justifyContent="space-between">
//           <Skeleton h={16} w={100} rounded="$md" />
//           <Skeleton h={16} w={120} rounded="$md" />
//         </HStack>

//         {/* Amount */}
//         <HStack justifyContent="space-between">
//           <Skeleton h={16} w={100} rounded="$md" />
//           <Skeleton h={16} w={90} rounded="$md" />
//         </HStack>

//         {/* Invoice Date */}
//         <HStack justifyContent="space-between">
//           <Skeleton h={16} w={110} rounded="$md" />
//           <Skeleton h={16} w={130} rounded="$md" />
//         </HStack>

//         {/* Due Date */}
//         <HStack justifyContent="space-between">
//           <Skeleton h={16} w={100} rounded="$md" />
//           <Skeleton h={16} w={130} rounded="$md" />
//         </HStack>
//       </VStack>
//     </View>
//   );
// }
