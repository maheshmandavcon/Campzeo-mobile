        {/* ================= AVAILABLE PLANS ================= */}
        {/* <ThemedText
          style={{
            fontSize: 25,
            fontWeight: "700",
            textAlign: "center",
            marginVertical: 20,
          }}
        >
          Available Plans
        </ThemedText>

        {plansData?.plans?.map((plan: any) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlanName={currentPlanName}
            hasPaidPlan={hasPaidPlan}
            onChangePlan={(planName) => {
              console.log("User wants to change to:", planName);
            }}
          />
        ))} */}



// import { ThemedText } from "@/components/themed-text";
// import { ThemedView } from "@/components/themed-view";
// import { Divider, HStack } from "@gluestack-ui/themed";
// import { Check, CheckCheck } from "lucide-react-native";
// import { Pressable, useColorScheme } from "react-native";

// const ACCENT = "#dc2626";
// const MUTED = "#6b7280";
// const DISABLED = "#9ca3af";

// type PlanCardProps = {
//   plan: any;
//   currentPlanName: string | null;
//   hasPaidPlan: boolean;  
//   onChangePlan?: (planName: string) => void;
// };


// export default function PlanCard(
//   {
//   plan,
//   currentPlanName,
//   hasPaidPlan,
//   onChangePlan,
// }: PlanCardProps
// ) 
// {
//   const isDark = useColorScheme() === "dark";

//   // ✅ normalize names (CRITICAL)
//   const normalizedPlanName = plan.name?.toUpperCase();
//   const normalizedCurrentPlan = currentPlanName?.toUpperCase() ?? null;

//   const isCurrentPlan = normalizedPlanName === normalizedCurrentPlan;
//   const isPopular = normalizedPlanName === "PROFESSIONAL";
//   const isFreeTrial = normalizedPlanName === "FREE_TRIAL";

//   const isFreeTrialDisabled = isFreeTrial && hasPaidPlan;

//   const cardStyle = {
//     backgroundColor: isPopular
//       ? isDark
//         ? "#020617"
//         : "#fff7f4"
//       : isDark
//       ? "#020617"
//       : "#ffffff",
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 16,
//     borderWidth: isPopular ? 2 : 1,
//     borderColor: isPopular ? ACCENT : isDark ? "#1e293b" : "#e5e7eb",
//   };

//   return (
//     <ThemedView style={cardStyle}>
//       {/* POPULAR BADGE */}
//       {isPopular && (
//         <ThemedView
//           style={{
//             alignSelf: "flex-start",
//             backgroundColor: ACCENT,
//             paddingHorizontal: 10,
//             paddingVertical: 4,
//             borderRadius: 999,
//             marginBottom: 10,
//           }}
//         >
//           <ThemedText
//             style={{
//               fontSize: 12,
//               fontWeight: "700",
//               color: "#ffffff",
//             }}
//           >
//             MOST POPULAR
//           </ThemedText>
//         </ThemedView>
//       )}

//       {/* PLAN NAME */}
//       <ThemedText
//         style={{
//           fontSize: 20,
//           fontWeight: "600",
//           color: isPopular ? ACCENT : undefined,
//         }}
//       >
//         {plan.name.replace("_", " ")}
//       </ThemedText>

//       {/* PRICE */}
//       <ThemedText style={{ fontSize: 14, marginBottom: 4 }}>
//         <ThemedText
//           style={{
//             fontWeight: "700",
//             fontSize: 22,
//             color: ACCENT,
//           }}
//         >
//           {plan.price === 0 ? "Free" : `₹${plan.price}`}
//         </ThemedText>
//         / month
//       </ThemedText>

//       {/* DESCRIPTION */}
//       {plan.description && (
//         <ThemedText
//           style={{
//             fontSize: 13,
//             color: MUTED,
//             marginBottom: 8,
//           }}
//         >
//           {plan.description}
//         </ThemedText>
//       )}

//       <Divider style={{ marginVertical: 12 }} />

//       {/* FEATURES */}
//       {plan.features?.map((feature: string, index: number) => (
//         <HStack
//           key={index}
//           style={{ alignItems: "center", marginBottom: 8 }}
//         >
//           {isFreeTrial ? (
//             <Check size={18} color={ACCENT} />
//           ) : (
//             <CheckCheck size={18} color={ACCENT} />
//           )}

//           <ThemedText style={{ marginLeft: 8 }}>
//             {feature}
//           </ThemedText>
//         </HStack>
//       ))}

//       {/* CTA */}
//       {isCurrentPlan ? (
//         <Pressable
//           disabled
//           style={{
//             marginTop: 14,
//             paddingVertical: 10,
//             borderRadius: 10,
//             borderWidth: 1,
//             borderColor: "#e5e7eb",
//             backgroundColor: isDark ? "#020617" : "#f9fafb",
//             opacity: 0.6,
//           }}
//         >
//           <ThemedText
//             style={{
//               textAlign: "center",
//               fontSize: 14,
//               fontWeight: "600",
//               color: MUTED,
//             }}
//           >
//             Current Plan
//           </ThemedText>
//         </Pressable>
//       ) : isFreeTrialDisabled ? (
//         <Pressable
//           disabled
//           style={{
//             marginTop: 14,
//             paddingVertical: 10,
//             borderRadius: 10,
//             borderWidth: 1,
//             borderColor: "#e5e7eb",
//             backgroundColor: isDark ? "#020617" : "#f9fafb",
//           }}
//         >
//           <ThemedText
//             style={{
//               textAlign: "center",
//               fontSize: 14,
//               fontWeight: "600",
//               color: DISABLED,
//             }}
//           >
//             Free Trial (One-time)
//           </ThemedText>
//         </Pressable>
//       ) : (
//         <Pressable
//           style={{
//             marginTop: 14,
//             paddingVertical: 10,
//             borderRadius: 10,
//             borderWidth: 1,
//             borderColor: ACCENT,
//           }}
//           onPress={() => onChangePlan?.(plan.name)}
//         >
//           <ThemedText
//             style={{
//               textAlign: "center",
//               fontSize: 14,
//               fontWeight: "600",
//               color: ACCENT,
//             }}
//           >
//             Change to {plan.name.replace("_", " ")}
//           </ThemedText>
//         </Pressable>
//       )}
//     </ThemedView>
//   );
// }
