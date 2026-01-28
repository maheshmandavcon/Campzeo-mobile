import { Stack } from "expo-router";

export default function CampaignsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="CampaignsDetails"
        options={{ title: "Back to campaign list", headerShown: true }}
      />
      <Stack.Screen
        name="CampaignPost"
        options={{ title: "Create New Campaign", headerShown: true }}
      />
    </Stack>
  );
}
