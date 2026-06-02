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
import Video from "react-native-video";
import { router } from "expo-router";

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

  // ✅ ADD LOG HERE
  // console.log("[ShareCampaignPost] render", {
  //   visible,
  //   postId: post?.id,
  //   postType: post?.type,
  //   mediaUrls: post?.mediaUrls,
  // });

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
          {/* {isManual && (
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
          )} */}
          {isManual && (
            <>
              {loadingContacts ? (
                <ActivityIndicator size="large" />
              ) : contacts.length === 0 ? (
                // ✅ EMPTY STATE UI
                <ThemedView
                  style={{
                    borderWidth: 1,
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                    borderRadius: 10,
                    padding: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <ThemedText
                    style={{
                      color: isDark ? "#fff" : "#111",
                      marginBottom: 12,
                      fontWeight: "600",
                    }}
                  >
                    No contacts found
                  </ThemedText>

                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/contacts/createContact",
                        params: {
                          fromCampaign: "true",
                        },
                      })
                    }
                    style={{
                      backgroundColor: "#10b981",
                      paddingVertical: 10,
                      paddingHorizontal: 20,
                      borderRadius: 8,
                    }}
                  >
                    <ThemedText style={{ color: "#fff", fontWeight: "600" }}>
                      + Create Contact
                    </ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              ) : (
                // ✅ CONTACT LIST
                <ThemedView
                  style={{
                    borderWidth: 1,
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                    borderRadius: 10,
                    marginBottom: 12,
                    maxHeight: 260,
                  }}
                >
                  <ThemedView>
                    {contacts.map((item) => {
                      const checked = selectedContacts.includes(item.id);

                      return (
                        <TouchableOpacity
                          key={item.id}
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
                    })}
                  </ThemedView>
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

            {(post.mediaUrls?.length > 0 ||
              post.attachments?.length > 0 ||
              !!post.videoUrl ||
              post.metadata?.mediaUrls?.length > 0) && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 12 }}
              >
                {/* COMBINE ALL MEDIA SOURCES WITH TYPE INTEL */}
                {(() => {
                  const items: { url: string; type?: string }[] = [
                    ...(post.mediaUrls || []).map((url: string) => ({
                      url,
                      type: undefined,
                    })),
                    ...(post.metadata?.mediaUrls || []).map((url: string) => ({
                      url,
                      type: undefined,
                    })),
                    ...(post.attachments || []).map((a: any) => ({
                      url: a.uploadedUrl || a.fileUrl || a.uri,
                      type: a.mimeType || a.type,
                    })),
                    { url: post.videoUrl, type: "video/mp4" },
                  ];

                  return items
                    .filter((item) => typeof item.url === "string" && !!item.url)
                    .filter(
                      (item, index, self) =>
                        self.findIndex((t) => t.url === item.url) === index,
                    ) // Unique by URL
                    .filter((item) => {
                      // 🔥 Remove thumbnail from preview if it's same as metadata.thumbnailUrl
                      if (post.metadata?.thumbnailUrl) {
                        return item.url !== post.metadata.thumbnailUrl;
                      }
                      return true;
                    })
                    .map((item, idx) => {
                      const normalizedUrl = normalizeUrl(item.url);
                      let mime = item.type;
                      if (!mime || (!mime.startsWith("image/") && !mime.startsWith("video/"))) {
                        mime = inferMediaType(item.url);
                      }
                      const isVideo = mime.startsWith("video/");

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
                        <Video
                          source={{ uri: url }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                          paused
                          repeat
                          controls={false}
                        />

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
                        <ThemedView
                          key={idx}
                          style={{
                            width: 120,
                            height: 120,
                            borderRadius: 8,
                            marginRight: 8,
                            overflow: "hidden",
                            backgroundColor: isDark ? "#1f2937" : "#e5e7eb",
                          }}
                        >
                          <Image
                            source={{ uri: normalizedUrl }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        </ThemedView>
                      );
                    });
                })()}
              </ScrollView>
            )}

            {/* FOOTER */}
            <ThemedView
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 12,
                paddingTop: 12,
                marginTop: 12,
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
                // onPress={onPublish}
                onPress={() => {
                  console.log("[ShareCampaignPost] Publish pressed", {
                    postId: post?.id,
                    postType: post?.type,
                    selectedContacts,
                    mediaUrls: post?.mediaUrls,
                  });
                  onPublish();
                }}
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

  function normalizeUrl(url: string) {
    if (!url) return "";
    if (
      url.startsWith("http") ||
      url.startsWith("data:") ||
      url.startsWith("file:")
    ) {
      return getMediaPreviewUrl(url);
    }
    const baseUrl =
      process.env.EXPO_PUBLIC_API_BASE_URL?.replace("/api/", "") ||
      "https://campzeo.com";
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  }

  function getMediaPreviewUrl(url: string): string {
    if (!url) return "";

    const id = extractGoogleDriveId(url);
    if (id) {
      const fileName = "media";
      return `https://storage.campzeo.com/api/upload/google-drive/view?id=${id}&file=${encodeURIComponent(
        fileName,
      )}`;
    }

    return url;
  }

  function extractGoogleDriveId(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
      if (
        url.includes("googleusercontent.com") ||
        url.includes("drive.google.com")
      ) {
        if (url.includes("/d/")) {
          const parts = url.split("/d/")[1]?.split(/[/?=]/);
          if (parts && parts[0]) return parts[0];
        }
        const urlObj = new URL(url);
        const id = urlObj.searchParams.get("id");
        if (id) return id;
      }
    } catch {
      const dMatch = url.match(/\/d\/([^/?=]+)/);
      if (dMatch) return dMatch[1];
      const idMatch = url.match(/[?&]id=([^?&]+)/);
      if (idMatch) return idMatch[1];
    }
    return null;
  }

  function inferMediaType(uri: string) {
    if (!uri) return "application/octet-stream";

    // Check for Google Drive direct links or common storage patterns
    if (
      uri.includes("googleusercontent.com") ||
      uri.includes("lh3.googleusercontent.com") ||
      uri.includes("drive.google.com") ||
      uri.includes("storage.campzeo.com")
    ) {
      // If it's explicitly in an image list, it's an image
      const isStoredInImageField =
        post?.mediaUrls?.includes(uri) ||
        post?.metadata?.mediaUrls?.includes(uri) ||
        post?.attachments?.some((a: any) => (a.uploadedUrl === uri || a.uri === uri || a.fileUrl === uri) && a.type?.startsWith("image/"));

      if (uri === post?.videoUrl && !isStoredInImageField) return "video/mp4";
      return "image/jpeg";
    }

    const ext = uri.split(".").pop()?.toLowerCase();
    if (!ext || ext.length > 5) return "image/jpeg";

    if (["jpg", "jpeg"].includes(ext)) return "image/jpeg";
    if (ext === "png") return "image/png";
    if (ext === "gif") return "image/gif";
    if (ext === "webp") return "image/webp";
    if (ext === "mp4") return "video/mp4";
    if (ext === "mov") return "video/quicktime";

    return "image/jpeg"; 
  }
}
