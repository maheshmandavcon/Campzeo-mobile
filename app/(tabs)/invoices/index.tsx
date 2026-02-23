import { fetchInvoices } from "@/api/invoicesApi";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ShimmerSkeleton } from "@/components/ui/ShimmerSkeletons";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Invoice } from "@/types/types";
import { useUser } from "@clerk/clerk-expo";
import { HStack } from "@gluestack-ui/themed";
import { View } from "@gluestack-ui/themed";
import { VStack } from "@gluestack-ui/themed";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, useColorScheme } from "react-native";

export default function Invoices() {
  const { user, isLoaded } = useUser();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = useColorScheme() === "dark";
  

  useEffect(() => {
    if (!isLoaded || !user) return;

    const loadInvoices = async () => {
      try {
        const data = await fetchInvoices(user.id);
        setInvoices(data.invoices);
      } catch (error) {
        console.log("Error loading invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [isLoaded, user]);

  const renderInvoiceShimmerCard = () => (
    <ThemedView className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
      <VStack space="sm">
        {/* Top row: Invoice ID + Status */}
        <HStack justifyContent="space-between" alignItems="center">
          <ShimmerSkeleton height={18} width={140} />
          <ShimmerSkeleton height={18} width={70} borderRadius={6} />
        </HStack>

        {/* Date */}
        <ShimmerSkeleton height={14} width={180} />

        {/* Description */}
        <ShimmerSkeleton height={14} width="100%" />

        {/* Amount */}
        <ShimmerSkeleton height={20} width={120} />
      </VStack>
    </ThemedView>
  );

  if (loading) {
    return (
      // <ThemedView className="flex-1 items-center justify-center">
      //   <ActivityIndicator size="large" color="#dc2626" />
      //   <ThemedText
      //     style={{
      //       marginTop: 12,
      //       fontSize: 14,
      //       color: "#6b7280",
      //     }}
      //   >
      //     Loading Invoices…
      //   </ThemedText>
      // </ThemedView>

      <ScrollView className="flex-1 px-4 py-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <View key={index}>{renderInvoiceShimmerCard()}</View>
        ))}
      </ScrollView>
    );
  }

  // return (
  //   <ScrollView className="flex-1 px-4 py-4">
  //     {invoices.length === 0 ? (
  //       <ThemedView className="items-center mt-10">
  //         <ThemedText>No invoices found</ThemedText>
  //       </ThemedView>
  //     ) : (
  //       invoices.map((item) => (
  //         <ThemedView
  //           key={item.id}
  //           className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200"
  //         >
  //           <ThemedView className="flex-row justify-between mb-2">
  //             <ThemedText className="font-semibold text-gray-800">
  //               Invoice ID: #{item.id}
  //             </ThemedText>
  //             <Text
  //               className={`font-semibold ${
  //                 item.status === "PAID" ? "text-green-600" : "text-yellow-600"
  //               }`}
  //             >
  //               {item.status}
  //             </Text>
  //           </ThemedView>

  //           <ThemedText className="text-sm text-gray-600 mb-1">
  //             Date: {new Date(item.invoiceDate).toLocaleDateString()}
  //           </ThemedText>

  //           <ThemedText className="text-sm text-gray-600 mb-1">
  //             Description: {item.description}
  //           </ThemedText>

  //           <ThemedText className="text-base font-bold text-gray-900 mt-2">
  //             Amount: ₹{item.amount}
  //           </ThemedText>
  //         </ThemedView>
  //       ))
  //     )}
  //   </ScrollView>
  // );
  return (
    <ScrollView
      className="flex-1 px-4 py-4"
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: invoices.length === 0 ? "center" : "flex-start",
      }}
      showsVerticalScrollIndicator
    >
      {invoices.length === 0 ? (
        <ThemedView className="items-center" style={{ backgroundColor: isDark ? "#000" : "#f3f4f6" }}>
          <ThemedText style={{ fontSize: 16, fontWeight: "600" }}>
            No invoices yet
          </ThemedText>
          <ThemedText style={{ marginTop: 6, opacity: 0.7, textAlign: "center" }}>
            Your invoices will appear here once they’re generated.
          </ThemedText>
        </ThemedView>
      ) : (
        invoices.map((item) => (
          <ThemedView
            key={item.id}
            className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200"
          >
            <ThemedView className="flex-row justify-between mb-2">
              <ThemedText className="font-semibold text-gray-800">
                Invoice ID: #{item.id}
              </ThemedText>
              <Text
                className={`font-semibold ${item.status === "PAID"
                    ? "text-green-600"
                    : "text-yellow-600"
                  }`}
              >
                {item.status}
              </Text>
            </ThemedView>

            <ThemedText className="text-sm text-gray-600 mb-1">
              Date: {new Date(item.invoiceDate).toLocaleDateString()}
            </ThemedText>

            <ThemedText className="text-sm text-gray-600 mb-1">
              Description: {item.description}
            </ThemedText>

            <ThemedText className="text-base font-bold text-gray-900 mt-2">
              Amount: ₹{item.amount}
            </ThemedText>
          </ThemedView>
        ))
      )}
    </ScrollView>
  );

}
