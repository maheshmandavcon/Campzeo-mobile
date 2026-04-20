import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from 'expo-av';
import React, { useRef, useState } from "react";
import { Dimensions, Image, ScrollView, Text, TextInput, TouchableOpacity, useColorScheme, View, Modal, SafeAreaView, FlatList } from "react-native";

type PreviewProps = {
  profilePic?: string;
  platform: string;
  text: string;
  onChangeText?: (value: string) => void;
  onRemoveMedia?: (uri: string) => void;
  coverImage?: string;
  images?: string[];
  media?: { uri: string; type: string; name?: string; size?: string }[];
  timestamp?: string;
  username: string;
  senderEmail?: string;
  subject?: string;
};

const SCREEN_WIDTH = Dimensions.get("window").width;

type MediaItem = { uri: string; type: string; name?: string; size?: string };

const isVideo = (item: MediaItem) =>
  item.type.startsWith("video/") || !!item.uri.match(/\.(mp4|mov|mkv)($|\?)/i);

// ✅ InstagramPreview is fully outside Preview — this is the key fix
type InstagramPreviewProps = {
  media: MediaItem[];
  coverImage?: string;
  profilePic?: string;
  username: string;
  text: string;
  setFullscreenIndex: (index: number) => void;
};

const InstagramPreview: React.FC<InstagramPreviewProps> = ({
  media,
  coverImage,
  profilePic,
  username,
  text,
  setFullscreenIndex,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const videoRef = useRef<Video>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const isReel = media.length === 1 && isVideo(media[0]);

  const onScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View style={{ marginTop: 10 }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ width: SCREEN_WIDTH }}
      >
        {media.map((item, index) => (
          <View
            key={index}
            style={{
              width: SCREEN_WIDTH,
              height: isReel ? 500 : SCREEN_WIDTH,
              overflow: "hidden",
              backgroundColor: "#000",
            }}
          >
            {isVideo(item) ? (
              <View style={{ flex: 1 }}>
                <Video
                  ref={videoRef}
                  source={{ uri: item.uri }}
                  posterSource={index === 0 && coverImage ? { uri: coverImage } : undefined}
                  usePoster={!!coverImage}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: SCREEN_WIDTH,
                    height: isReel ? 500 : SCREEN_WIDTH,
                  }}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={isPlaying}
                  isLooping
                  isMuted
                  useNativeControls={false}
                  onReadyForDisplay={() => {
                    videoRef.current?.playAsync();
                  }}
                />

                {isReel && (
                  <View
                    style={{
                      position: "absolute",
                      top: 0, left: 0, right: 0, bottom: 0,
                      zIndex: 99,
                    }}
                  >
                    {/* Bottom gradient */}
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0, left: 0, right: 0,
                        height: 220,
                        backgroundColor: "rgba(0,0,0,0.55)",
                      }}
                    />

                    <View
                      style={{ flex: 1, flexDirection: "row", justifyContent: "space-between" }}
                      pointerEvents="box-none"
                    >
                      {/* Left — tap to play/pause + caption */}
                      <TouchableOpacity
                        style={{ flex: 1, justifyContent: "flex-end", paddingLeft: 12, paddingBottom: 20 }}
                        activeOpacity={1}
                        onPress={() => {
                          if (isPlaying) {
                            videoRef.current?.pauseAsync();
                            setIsPlaying(false);
                          } else {
                            videoRef.current?.playAsync();
                            setIsPlaying(true);
                          }
                        }}
                      >
                        {/* Play icon when paused */}
                        {!isPlaying && (
                          <View
                            style={{
                              position: "absolute",
                              top: "40%",
                              left: "38%",
                              backgroundColor: "rgba(0,0,0,0.45)",
                              borderRadius: 40,
                              padding: 14,
                            }}
                          >
                            <Ionicons name="play" size={36} color="white" />
                          </View>
                        )}

                        {/* Username row */}
                        <View
                          style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}
                          pointerEvents="none"
                        >
                          {profilePic ? (
                            <Image
                              source={{ uri: profilePic }}
                              style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: "white" }}
                            />
                          ) : (
                            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#555", borderWidth: 1.5, borderColor: "white" }} />
                          )}
                          <Text style={{ color: "white", fontWeight: "bold", marginLeft: 8, fontSize: 13 }}>
                            {username || "User"}
                          </Text>
                          <View style={{ paddingHorizontal: 10, paddingVertical: 3, marginLeft: 10, borderRadius: 6, borderWidth: 1, borderColor: "white", backgroundColor: "rgba(0,0,0,0.3)" }}>
                            <Text style={{ color: "white", fontSize: 11, fontWeight: "bold" }}>Follow</Text>
                          </View>
                        </View>

                        {/* Caption */}
                        {!!text ? (
                          <Text
                            style={{ color: "white", fontSize: 13, marginBottom: 10 }}
                            numberOfLines={2}
                            pointerEvents="none"
                          >
                            {text}
                          </Text>
                        ) : (
                          <View style={{ height: 10 }} />
                        )}

                        {/* Audio pill */}
                        <View
                          style={{
                            flexDirection: "row", alignItems: "center", alignSelf: "flex-start",
                            backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10,
                            paddingVertical: 5, borderRadius: 12,
                          }}
                          pointerEvents="none"
                        >
                          <Ionicons name="musical-note" size={13} color="white" />
                          <Text style={{ color: "white", fontSize: 11, marginLeft: 5, fontWeight: "bold" }}>Original Audio</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Right — action icons */}
                      <View style={{ width: 56, justifyContent: "flex-end", alignItems: "center", paddingBottom: 24 }}>
                        <TouchableOpacity style={{ alignItems: "center", marginBottom: 20 }}>
                          <Ionicons name="heart-outline" size={30} color="white" />
                          <Text style={{ color: "white", fontSize: 11, marginTop: 2 }}>0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ alignItems: "center", marginBottom: 20 }}>
                          <Ionicons name="chatbubble-outline" size={28} color="white" />
                          <Text style={{ color: "white", fontSize: 11, marginTop: 2 }}>0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ alignItems: "center", marginBottom: 20 }}>
                          <Ionicons name="paper-plane-outline" size={28} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ alignItems: "center" }}>
                          <Ionicons name="ellipsis-vertical" size={24} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <>
                <Image
                  source={{ uri: item.uri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
                  onPress={() => setFullscreenIndex(index)}
                />
              </>
            )}
          </View>
        ))}
      </ScrollView>

      {media.length > 1 && (
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8 }}>
          {media.map((_, index) => (
            <View
              key={index}
              style={{
                width: 8, height: 8, borderRadius: 4,
                backgroundColor: activeIndex === index ? "#3b82f6" : "#d1d5db",
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// ─────────────────────────────────────────────
// Main Preview component
// ─────────────────────────────────────────────
const Preview: React.FC<PreviewProps> = ({
  profilePic,
  platform,
  username,
  text,
  onChangeText,
  onRemoveMedia,
  coverImage,
  images = [],
  media,
  timestamp,
  senderEmail,
  subject,
}) => {
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  const normalizedMedia: MediaItem[] =
    media || images.map(uri => ({
      uri,
      type: uri.match(/\.(mp4|mov|mkv)($|\?)/i) ? "video/mp4" : "image/jpeg",
      name: uri.split('/').pop() || 'File',
      size: undefined,
    }));

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const PLATFORM_CONFIG = {
    facebook:  { showHeaderMenu: true,  showActions: true,  showTextAboveMedia: true  },
    linkedin:  { showHeaderMenu: true,  showActions: true,  showTextAboveMedia: true  },
    instagram: { showHeaderMenu: false, showActions: true,  showTextAboveMedia: false },
    whatsapp:  { showHeaderMenu: false, showActions: false, showTextAboveMedia: false },
    sms:       { showHeaderMenu: false, showActions: false, showTextAboveMedia: false },
    email:     { showHeaderMenu: false, showActions: false, showTextAboveMedia: false },
    pinterest: { showHeaderMenu: false, showActions: false, showTextAboveMedia: false },
    youtube:   { showHeaderMenu: true,  showActions: false, showTextAboveMedia: false },
  } as const;

  const platformConfig = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];

  const renderFacebookPreview = (media: MediaItem[]) => (
    <View className="overflow-hidden mt-2" style={{ backgroundColor: "#fff" }}>
      {media.length === 1 && (
        isVideo(media[0]) ? (
          <TouchableOpacity onPress={() => setFullscreenIndex(0)}>
            <Video
              source={{ uri: media[0].uri }}
              style={{ width: "100%", height: 300 }}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setFullscreenIndex(0)}>
            <Image source={{ uri: media[0].uri }} className="w-full h-[300px]" />
          </TouchableOpacity>
        )
      )}

      {media.length === 2 && (
        <View className="w-full h-[300px] flex-row" style={{ gap: 4 }}>
          {media.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setFullscreenIndex(index)}
              style={{ flex: 1, height: "100%" }}
            >
              {isVideo(item) ? (
                <Video
                  source={{ uri: item.uri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                  isMuted
                />
              ) : (
                <Image source={{ uri: item.uri }} className="w-full h-full" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {media.length === 3 && (
        <View className="w-full h-[300px] flex-row" style={{ gap: 4 }}>
          <TouchableOpacity
            onPress={() => setFullscreenIndex(0)}
            style={{ flex: 1.5, height: "100%" }}
          >
            {isVideo(media[0]) ? (
              <Video
                source={{ uri: media[0].uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
              />
            ) : (
              <Image source={{ uri: media[0].uri }} className="w-full h-full" />
            )}
          </TouchableOpacity>

          <View style={{ flex: 1, height: "100%", gap: 4 }}>
            {media.slice(1, 3).map((item, index) => (
              <TouchableOpacity
                key={index + 1}
                onPress={() => setFullscreenIndex(index + 1)}
                style={{ flex: 1 }}
              >
                {isVideo(item) ? (
                  <Video
                    source={{ uri: item.uri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay
                    isLooping
                    isMuted
                  />
                ) : (
                  <Image source={{ uri: item.uri }} className="w-full h-full" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {media.length === 4 && (
        <View className="w-full h-[300px] flex-row" style={{ gap: 4 }}>
          <TouchableOpacity
            onPress={() => setFullscreenIndex(0)}
            style={{ flex: 1.5, height: "100%" }}
          >
            {isVideo(media[0]) ? (
              <Video
                source={{ uri: media[0].uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
              />
            ) : (
              <Image source={{ uri: media[0].uri }} className="w-full h-full" />
            )}
          </TouchableOpacity>

          <View style={{ flex: 1, height: "100%", gap: 4 }}>
            {media.slice(1, 4).map((item, index) => (
              <TouchableOpacity
                key={index + 1}
                onPress={() => setFullscreenIndex(index + 1)}
                style={{ flex: 1 }}
              >
                {isVideo(item) ? (
                  <Video
                    source={{ uri: item.uri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay
                    isLooping
                    isMuted
                  />
                ) : (
                  <Image source={{ uri: item.uri }} className="w-full h-full" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {media.length >= 5 && (
        <View className="w-full h-[300px]" style={{ gap: 4 }}>
          <View className="flex-row flex-1" style={{ gap: 4 }}>
            {media.slice(0, 2).map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setFullscreenIndex(index)}
                style={{ flex: 1, position: "relative" }}
              >
                {isVideo(item) ? (
                  <Video
                    source={{ uri: item.uri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay
                    isLooping
                    isMuted
                  />
                ) : (
                  <Image source={{ uri: item.uri }} className="w-full h-full" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row flex-1" style={{ gap: 4 }}>
            {media.slice(2, 5).map((item, index) => {
              const actualIndex = index + 2;
              const isLast = actualIndex === 4;
              const remaining = media.length - 4;

              return (
                <TouchableOpacity
                  key={actualIndex}
                  onPress={() => setFullscreenIndex(actualIndex)}
                  style={{ flex: 1, position: "relative" }}
                >
                  {isVideo(item) ? (
                    <Video
                      source={{ uri: item.uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay
                      isLooping
                      isMuted
                    />
                  ) : (
                    <Image source={{ uri: item.uri }} className="w-full h-full" />
                  )}
                  {isLast && media.length > 5 && (
                    <View className="absolute inset-0 bg-black/60 items-center justify-center">
                      <Text className="text-white text-3xl font-bold">
                        +{remaining}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );

  const renderWhatsAppPreview = () => {
    const mediaSlice = normalizedMedia.slice(0, 4);
    const remaining = normalizedMedia.length - 4;

    const MediaItem = ({
      item,
      index,
      style,
      showOverlay,
    }: {
      item: MediaItem;
      index: number;
      style: any;
      showOverlay?: boolean;
    }) => {
      const video = isVideo(item);

      return (
        <TouchableOpacity onPress={() => setFullscreenIndex(index)} style={[style, { overflow: "hidden" }]}>
          {video ? (
            <Video
              source={{ uri: item.uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode={ResizeMode.COVER}
              useNativeControls
            />
          ) : (
            <Image
              source={{ uri: item.uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          )}

          {video && (
            <View className="absolute inset-0 items-center justify-center">
              <View className="bg-black/50 rounded-full p-3">
                <Ionicons name="play" size={28} color="white" />
              </View>
            </View>
          )}

          {showOverlay && remaining > 0 && (
            <View className="absolute inset-0 bg-black/60 items-center justify-center">
              <Text className="text-white text-2xl font-bold">+{remaining}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    };

    return (
      <View className="px-3 py-4" style={{ backgroundColor: isDark ? "#161618" : "#efeae2" }}>
        <View className="self-end max-w-[85%] bg-[#dcf8c6] rounded-xl p-2">
          {normalizedMedia.length === 1 && (
            <MediaItem item={normalizedMedia[0]} index={0} style={{ width: 220, height: 220, borderRadius: 12 }} />
          )}

          {normalizedMedia.length === 2 && (
            <View>
              {mediaSlice.map((item, i) => (
                <MediaItem
                  key={i}
                  item={item}
                  index={i}
                  style={{ width: 220, height: 110, borderRadius: 10, marginBottom: i === 0 ? 4 : 0 }}
                />
              ))}
            </View>
          )}

          {normalizedMedia.length === 3 && (
            <View className="flex-row">
              <MediaItem item={mediaSlice[0]} index={0} style={{ width: 110, height: 220, borderRadius: 10, marginRight: 4 }} />
              <View>
                <MediaItem item={mediaSlice[1]} index={1} style={{ width: 110, height: 108, borderRadius: 10, marginBottom: 4 }} />
                <MediaItem item={mediaSlice[2]} index={2} style={{ width: 110, height: 108, borderRadius: 10 }} />
              </View>
            </View>
          )}

          {normalizedMedia.length >= 4 && (
            <View className="flex-row flex-wrap">
              {mediaSlice.slice(0, 4).map((item, i) => (
                <View
                  key={i}
                  style={{
                    width: "50%",
                    paddingRight: i % 2 === 0 ? 4 : 0,
                    paddingLeft: i % 2 === 1 ? 4 : 0,
                    paddingBottom: i < 2 ? 4 : 0,
                  }}
                >
                  <MediaItem
                    item={item}
                    index={i}
                    showOverlay={i === 3}
                    style={{ width: "100%", height: 110, borderRadius: 10 }}
                  />
                </View>
              ))}
            </View>
          )}

          {!!text && <Text className="text-gray-900 mt-2">{text}</Text>}

          <View className="flex-row justify-end items-center mt-1">
            <Text className="text-[10px] text-gray-500 mr-1">{timestamp || "12:30 PM"}</Text>
            <Ionicons name="checkmark-done" size={14} color="#34B7F1" />
          </View>
        </View>
      </View>
    );
  };

  const renderEmailPreview = () => (
    <View
      className="border border-gray-300 rounded-lg p-4"
      style={{ backgroundColor: isDark ? "#161618" : "#f2f2f7", marginHorizontal: 8 }}
    >
      <View className="flex-row justify-between mb-2">
        <Text className="text-xs text-gray-500">
          From: {senderEmail || `${username.toLowerCase().replace(/\s+/g, '.')}@company.com`}
        </Text>
        <Text className="text-xs text-gray-500">{timestamp || "Now"}</Text>
      </View>

      <Text className="text-xs text-gray-500 mb-1">
        To: Customer {"<"}customer@example.com{">"}
      </Text>

      <Text
        className="font-semibold mt-1 mb-2"
        style={{ color: isDark ? "#f2f2f7" : "#111827" }}
      >
        Subject: {subject || "No Subject"}
      </Text>

      <View className="h-[1px] bg-gray-200 w-full mb-3" />

      <Text className="text-gray-900 mb-3">{text}</Text>

      {normalizedMedia.length > 0 && (
        <View className="mt-2">
          {normalizedMedia.map((item, index) => {
            const isPdf = item.type === "application/pdf" || !!item.uri.match(/\.pdf($|\?)/i);
            const isImg = !isPdf && (item.type.startsWith("image/") || !!item.uri.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i));
            const isVid = item.type.startsWith("video/") || !!item.uri.match(/\.(mp4|mov|mkv)($|\?)/i);

            const fullName = item.name || item.uri.split('/').pop()?.split('?')[0] || `File ${index + 1}`;
            const lastDotIndex = fullName.lastIndexOf('.');
            const nameOnly = lastDotIndex > 0 ? fullName.substring(0, lastDotIndex) : fullName;
            const extension = lastDotIndex > 0 ? fullName.substring(lastDotIndex + 1).toUpperCase() : "";

            if (isPdf) {
              return (
                <View key={index} className="mb-4 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                  <View className="w-full h-40 bg-white items-center justify-center border-b border-gray-100">
                    <Ionicons name="document-text" size={64} color="#ef4444" />
                    <Text className="text-gray-400 mt-2 text-xs uppercase font-bold tracking-widest">{extension || 'PDF'}</Text>
                  </View>
                  <View className="flex-row items-center justify-between p-3 bg-white">
                    <View className="flex-row items-center flex-1">
                      <Ionicons name="document" size={24} color="#ef4444" />
                      <View className="ml-3 flex-1">
                        <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>{nameOnly}</Text>
                        {item.size && <Text className="text-xs text-gray-500">Size: {item.size}</Text>}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => onRemoveMedia?.(item.uri)}>
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            if (isImg) {
              return (
                <View key={index} className="mb-4 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <Image source={{ uri: item.uri }} style={{ width: "100%", height: 200 }} resizeMode="cover" />
                  <View className="flex-row items-center justify-between p-3 bg-white">
                    <View className="flex-row items-center flex-1">
                      <Ionicons name="image" size={24} color="#3b82f6" />
                      <View className="ml-3 flex-1">
                        <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>{nameOnly}</Text>
                        {extension && <Text className="text-xs text-gray-500">{extension} File</Text>}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => onRemoveMedia?.(item.uri)}>
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            if (isVid) {
              return (
                <View key={index} className="mb-4 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <Video
                    source={{ uri: item.uri }}
                    style={{ width: "100%", height: 200 }}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                    useNativeControls
                  />
                  <View className="flex-row items-center justify-between p-3 bg-white">
                    <View className="flex-row items-center flex-1">
                      <Ionicons name="videocam" size={24} color="#ef4444" />
                      <View className="ml-3 flex-1">
                        <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>{nameOnly}</Text>
                        {extension && <Text className="text-xs text-gray-500">{extension} Video</Text>}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => onRemoveMedia?.(item.uri)}>
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            return (
              <View key={index} className="mb-4 bg-white rounded-lg p-3 border border-gray-200 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-gray-100 p-2 rounded-lg">
                    <Ionicons name="document-outline" size={24} color="#6b7280" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>{fullName}</Text>
                    {item.size && <Text className="text-xs text-gray-500">{item.size}</Text>}
                  </View>
                </View>
                <TouchableOpacity onPress={() => onRemoveMedia?.(item.uri)}>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderSmsPreview = () => (
    <View className="px-3 py-4" style={{ backgroundColor: isDark ? "#161618" : "#f2f2f7" }}>
      <View className="self-end max-w-[85%] bg-[#007AFF] rounded-2xl px-3 py-2">
        <Text className="text-white text-[15px] leading-5">
          {text || "Your SMS message will appear here"}
        </Text>
        <Text className="text-[10px] text-white/70 text-right mt-1">
          {timestamp || "12:30 PM"}
        </Text>
      </View>
    </View>
  );

  const renderPinterestPreview = () => {
    if (!normalizedMedia || normalizedMedia.length === 0) return null;

    return (
      <View className="p-3" style={{ backgroundColor: isDark ? "#161618" : "#fff" }}>
        {normalizedMedia.map((item, index) => (
          <View
            key={index}
            className="mb-4 rounded-lg overflow-hidden border border-gray-200"
            style={{ minHeight: 200, position: "relative" }}
          >
            {isVideo(item) ? (
              <TouchableOpacity onPress={() => setFullscreenIndex(index)}>
                <Video
                  source={{ uri: item.uri }}
                  style={{ width: "100%", height: 200 }}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={false}
                  isLooping
                  isMuted
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setFullscreenIndex(index)}>
                <Image source={{ uri: item.uri }} style={{ width: "100%", height: 200 }} resizeMode="cover" />
              </TouchableOpacity>
            )}

            {isVideo(item) && (
              <View
                style={{
                  position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                  justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.2)",
                }}
              >
                <Ionicons name="play-circle" size={36} color="white" />
              </View>
            )}

            <View style={{ position: "absolute", top: 8, right: 8 }}>
              <TouchableOpacity
                style={{ backgroundColor: "#E60023", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>Save</Text>
              </TouchableOpacity>
            </View>

            <View style={{ position: "absolute", bottom: 8, right: 8, flexDirection: "row", gap: 8 }}>
              <TouchableOpacity style={{ backgroundColor: "#fff", padding: 6, borderRadius: 8 }}>
                <Ionicons name="cloud-upload-outline" size={20} color="black" />
              </TouchableOpacity>
              <TouchableOpacity style={{ backgroundColor: "#fff", padding: 6, borderRadius: 8 }}>
                <Ionicons name="ellipsis-horizontal" size={20} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderYouTubePreview = () => {
    if (!normalizedMedia || normalizedMedia.length === 0) return null;
    const thumbnail = normalizedMedia[0].uri;

    return (
      <View className="px-3 py-4 bg-black rounded-lg">
        <TouchableOpacity
          onPress={() => setFullscreenIndex(0)}
          className="relative w-full h-56 overflow-hidden rounded-lg"
        >
          <Image source={{ uri: thumbnail }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          <View className="absolute inset-0 items-center justify-center">
            <View className="bg-black/50 rounded-full p-4">
              <Ionicons name="play" size={32} color="white" />
            </View>
          </View>
        </TouchableOpacity>
        {!!text && <Text className="text-white mt-2">{text}</Text>}
        <Text className="text-xs text-gray-300 mt-1">{timestamp || "Just now"}</Text>
      </View>
    );
  };

  const renderActions = () => {
    if (platform === "facebook") {
      return (
        <View className="flex-row items-center border-t border-gray-200 pt-2 mt-2 px-4">
          <TouchableOpacity>
            <Ionicons name="thumbs-up-outline" size={22} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity className="ml-4">
            <Ionicons name="chatbubble-outline" size={22} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity className="ml-4">
            <Ionicons name="share-social-outline" size={22} color="#555" />
          </TouchableOpacity>
        </View>
      );
    }

    if (platform === "linkedin") {
      return (
        <View className="flex-row justify-around border-t border-gray-200 pt-2 mt-2">
          <View className="flex-row items-center">
            <Ionicons name="thumbs-up-outline" size={16} color="#555" />
            <Text className="ml-1 text-gray-500 font-medium">Like</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="chatbubble-outline" size={16} color="#555" />
            <Text className="ml-1 text-gray-500 font-medium">Comment</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="repeat-outline" size={16} color="#555" />
            <Text className="ml-1 text-gray-500 font-medium">Repost</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="paper-plane-outline" size={16} color="#555" />
            <Text className="ml-1 text-gray-500 font-medium">Send</Text>
          </View>
        </View>
      );
    }

    if (platform === "instagram") {
      return (
        <>
          <View className="flex-row justify-between items-center px-3 py-2">
            <View className="flex-row items-center">
              <Ionicons name="heart-outline" size={22} />
              <Ionicons name="chatbubble-outline" size={22} style={{ marginLeft: 12 }} />
              <Ionicons name="paper-plane-outline" size={22} style={{ marginLeft: 12 }} />
            </View>
            <TouchableOpacity>
              <Ionicons name="bookmark-outline" size={22} />
            </TouchableOpacity>
          </View>

          <Text className="px-3 pt-1 text-gray-900">
            <Text className="font-bold">{username} </Text>
            {text}
          </Text>

          {timestamp && (
            <Text className="px-3 pt-1 pb-3 text-xs text-gray-500">{timestamp}</Text>
          )}
        </>
      );
    }

    return null;
  };

  const renderMedia = () => {
    switch (platform) {
      case "facebook":
      case "linkedin":
        if (!normalizedMedia.length) return null;
        return renderFacebookPreview(normalizedMedia);

      case "instagram":
        if (!normalizedMedia.length) return null;
        return (
          <InstagramPreview
            media={normalizedMedia}
            coverImage={coverImage}
            profilePic={profilePic}
            username={username}
            text={text}
            setFullscreenIndex={setFullscreenIndex}
          />
        );

      case "whatsapp":  return renderWhatsAppPreview();
      case "sms":       return renderSmsPreview();
      case "email":     return renderEmailPreview();
      case "pinterest":
        if (!normalizedMedia.length) return null;
        return renderPinterestPreview();
      case "youtube":
        if (!normalizedMedia.length) return null;
        return renderYouTubePreview();
      default:
        return null;
    }
  };

  const isInstagramReel =
    platform === "instagram" &&
    normalizedMedia.length === 1 &&
    isVideo(normalizedMedia[0] || { uri: "", type: "" });

  return (
    <View
      className={`my-2 ${isInstagramReel ? "bg-black rounded-xl" : "bg-white border border-gray-300 rounded-lg pb-2"} ${platform === "sms" ? "" : "overflow-hidden"}`}
      style={{ backgroundColor: isInstagramReel ? "#000" : (isDark ? "#161618" : "#fff") }}
    >
      {!isInstagramReel && (
        <View className="flex-row items-center px-4 py-4">
          {profilePic && (
            <Image source={{ uri: profilePic }} className="w-10 h-10 rounded-full" />
          )}
          <View className="flex-1 ml-3 justify-center">
            <Text
              className="font-bold leading-5"
              style={{ color: isDark ? "#f2f2f7" : "#111827" }}
            >
              {platform === "email" ? "From: " : ""}
              {username}
            </Text>

            {(platform === "facebook" || platform === "linkedin" || platform === "youtube") && (
              <Text className="text-xs text-gray-500 mt-0.5">{timestamp || "Just now"}</Text>
            )}

            {platform === "email" && (
              <Text className="text-xs text-gray-500 mt-0.5">
                To: client@example.com · {timestamp || "Now"}
              </Text>
            )}
          </View>

          {platformConfig?.showHeaderMenu && (
            <Ionicons name="ellipsis-horizontal" size={20} color="#555" />
          )}
        </View>
      )}

      {!isInstagramReel && platformConfig?.showTextAboveMedia && (
        platform === "facebook" && onChangeText ? (
          <TextInput
            value={text}
            onChangeText={onChangeText}
            placeholder="What's on your mind?"
            placeholderTextColor="#9ca3af"
            multiline
            className="px-4 mb-2"
            style={{
              color: isDark ? "#f2f2f7" : "#111827",
              fontSize: 15,
              minHeight: 40,
              textAlignVertical: "top",
            }}
          />
        ) : (
          !!text?.trim() && (
            <Text
              className={`mt-2 ${platform === "facebook" || platform === "linkedin" ? "px-4 mb-2" : ""}`}
              style={{ color: isDark ? "#f2f2f7" : "#111827" }}
            >
              {text}
            </Text>
          )
        )
      )}

      {renderMedia()}

      {!isInstagramReel && platformConfig?.showActions && renderActions()}

      <Modal
        visible={fullscreenIndex !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenIndex(null)}
      >
        <SafeAreaView className="flex-1 bg-black">
          <TouchableOpacity
            style={{ position: "absolute", top: 50, right: 20, zIndex: 10, padding: 10 }}
            onPress={() => setFullscreenIndex(null)}
          >
            <Ionicons name="close" size={32} color="white" />
          </TouchableOpacity>

          <View className="flex-1 items-center justify-center">
            <FlatList
              data={normalizedMedia}
              horizontal
              pagingEnabled
              keyExtractor={(_, i) => i.toString()}
              initialScrollIndex={fullscreenIndex ?? 0}
              onScrollToIndexFailed={() => {}}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                if (platform === "facebook") {
                  return (
                    <View style={{ width: SCREEN_WIDTH, height: "100%", backgroundColor: "black", justifyContent: "center" }}>
                      <View style={{ width: SCREEN_WIDTH, height: "80%" }}>
                        {isVideo(item) ? (
                          <Video
                            source={{ uri: item.uri }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode={ResizeMode.CONTAIN}
                            useNativeControls
                            shouldPlay
                          />
                        ) : (
                          <Image
                            source={{ uri: item.uri }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                      <View
                        className="flex-row items-center px-4"
                        style={{ height: 60, position: "absolute", bottom: 40, left: 0, width: SCREEN_WIDTH }}
                      >
                        <TouchableOpacity>
                          <Ionicons name="thumbs-up-outline" size={26} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity className="ml-6">
                          <Ionicons name="chatbubble-outline" size={26} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity className="ml-6">
                          <Ionicons name="share-social-outline" size={26} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }

                return (
                  <View style={{ width: SCREEN_WIDTH, height: "100%", justifyContent: "center" }}>
                    {isVideo(item) ? (
                      <Video
                        source={{ uri: item.uri }}
                        style={{ width: "100%", height: "80%" }}
                        resizeMode={ResizeMode.CONTAIN}
                        useNativeControls
                        shouldPlay
                      />
                    ) : (
                      <Image
                        source={{ uri: item.uri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="contain"
                      />
                    )}
                  </View>
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default Preview;