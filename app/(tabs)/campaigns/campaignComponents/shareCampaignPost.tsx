import {
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { ContactsRecord } from "../../contacts/contactComponents/contactCard";
import { Video, ResizeMode } from "expo-av";

type Props = {
  visible: boolean;
  isDark: boolean;
  post: any | null;
  contacts: ContactsRecord[];
  selectedContacts: number[];
  loadingContacts: boolean;
  publishing: boolean;
  onClose: () => void;
  onToggleContact: (id: number) => void;
  onPublish: () => void;
};

export default function ShareCampaignPost({
  visible,
  isDark,
  post,
  contacts,
  selectedContacts,
  loadingContacts,
  publishing,
  onClose,
  onToggleContact,
  onPublish,
}: Props) {
  if (!visible || !post) return null;

  const isManual = ["SMS", "EMAIL", "WHATSAPP"].includes(post.type);

  return (
    <ThemedView
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 50,
      }}
    >
      <ThemedView
        style={{
          width: "90%",
          height: "80%",
          backgroundColor: isDark ? "#161618" : "#fff",
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: isDark ? "#fff" : "#e5e7eb",
        }}
      >
        {/* HEADER */}
        <ThemedText
          style={{
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 10,
            color: isDark ? "#fff" : "#111",
          }}
        >
          {isManual ? "Share Post - Select Contacts" : "Publish Post"}
        </ThemedText>

        {/* CONTENT */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {isManual && (
            <>
              {loadingContacts ? (
                <ActivityIndicator size="large" />
              ) : (
                <ThemedView
                  style={{
                    borderWidth: 1,
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                    borderRadius: 10,
                    marginBottom: 12,
                    maxHeight: 260,
                  }}
                >
                  <FlatList
                    data={contacts}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={({ item }) => {
                      const checked = selectedContacts.includes(item.id);

                      return (
                        <TouchableOpacity
                          onPress={() => onToggleContact(item.id)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            padding: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: isDark
                              ? "#ffffff33"
                              : "#e5e7eb",
                          }}
                        >
                          <ThemedView
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              borderWidth: 1.5,
                              borderColor: checked
                                ? "#10b981"
                                : "#9ca3af",
                              backgroundColor: checked
                                ? "#10b981"
                                : "transparent",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 12,
                            }}
                          >
                            {checked && (
                              <Ionicons
                                name="checkmark"
                                size={14}
                                color="#fff"
                              />
                            )}
                          </ThemedView>

                          <ThemedView style={{ flex: 1 }}>
                            <ThemedText
                              style={{
                                color: isDark ? "#fff" : "#111",
                                fontWeight: "600",
                              }}
                            >
                              {item.name}
                            </ThemedText>
                            {!!item.email && (
                              <ThemedText
                                style={{ fontSize: 12, color: "#9ca3af" }}
                              >
                                {item.email}
                              </ThemedText>
                            )}
                          </ThemedView>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </ThemedView>
              )}
            </>
          )}

          {/* MESSAGE PREVIEW */}
          <ThemedText style={{ fontWeight: "bold", marginBottom: 6 }}>
            Message Preview
          </ThemedText>

          <ThemedView
            style={{
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isDark ? "#374151" : "#e5e7eb",
            }}
          >
            {!!post.subject && (
              <ThemedText style={{ fontWeight: "bold", marginBottom: 6 }}>
                {post.subject}
              </ThemedText>
            )}

            {!!post.message && (
              <ThemedText style={{ lineHeight: 18 }}>
                {post.message}
              </ThemedText>
            )}

            {post.mediaUrls?.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {post.mediaUrls.map((url: string, idx: number) => {
                  const isVideo = /\.(mp4|mov|webm|mkv)$/i.test(url);

                  return isVideo ? (
                    <ThemedView
                      key={idx}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 8,
                        marginRight: 8,
                        overflow: "hidden",
                        position: "relative",
                        backgroundColor: "#000",
                      }}
                    >
                      {/* VIDEO */}
                      <Video
                        source={{ uri: url }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode={ResizeMode.COVER}
                        isLooping
                        shouldPlay={false}
                      />

                      {/* PLAY ICON OVERLAY */}
                      <ThemedView
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: "rgba(0,0,0,0.25)",
                        }}
                      >
                        <Ionicons name="play-circle" size={44} color="#fff" />
                      </ThemedView>
                    </ThemedView>
                  ) : (
                    <Image
                      key={idx}
                      source={{ uri: url }}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 8,
                        marginRight: 8,
                      }}
                    />
                  );
                })}
              </ScrollView>
            )}

            {/* FOOTER */}
            <ThemedView
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderColor: isDark ? "#374151" : "#e5e7eb",
              }}
            >
              <TouchableOpacity
                onPress={onClose}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderRadius: 8,
                  backgroundColor: "#ef4444",
                }}
              >
                <ThemedText style={{ color: "#fff", fontWeight: "bold" }}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onPublish}
                disabled={publishing}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderRadius: 8,
                  backgroundColor: "#10b981",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {publishing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={{ color: "#fff", fontWeight: "bold" }}>
                    {isManual ? "Send Now" : "Publish Now"}
                  </ThemedText>
                )}
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ScrollView>
      </ThemedView>
    </ThemedView>
  );
}
