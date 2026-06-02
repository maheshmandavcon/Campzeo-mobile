import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
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
  status?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactCompany?: string;
  youtubeContentType?: "VIDEO" | "SHORT" | "PLAYLIST";
};


const SCREEN_WIDTH = Dimensions.get("window").width;
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
  status,
  contactName,
  contactEmail,
  contactPhone,
  contactCompany,
  youtubeContentType,
}) => {

  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [videoCountdown, setVideoCountdown] = useState<string>("0:00");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  const normalizedMedia: { uri: string; type: string; name?: string; size?: string }[] =
    media ? media : (images || []).map(uri => ({
      uri,
      type: uri.match(/\.(mp4|mov|mkv)($|\?)/i) ? "video/mp4" : "image/jpeg",
      name: uri.split('/').pop()?.split('?')[0] || 'File',
      size: undefined
    }));

  const isVideo = (item: { uri: string; type: string; name?: string; size?: string }) =>
    item.type.startsWith("video/") || item.uri.match(/\.(mp4|mov|mkv)($|\?)/i);


  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const PLATFORM_CONFIG = {
    facebook: {
      showHeaderMenu: true,
      showActions: true,
      showTextAboveMedia: true,
    },
    linkedin: {
      showHeaderMenu: true,
      showActions: true,
      showTextAboveMedia: true,
    },
    instagram: {
      showHeaderMenu: false,
      showActions: true,
      showTextAboveMedia: false,
    },
    whatsapp: {
      showHeaderMenu: false,
      showActions: false,
      showTextAboveMedia: false,
    },
    sms: {
      showHeaderMenu: false,
      showActions: false,
      showTextAboveMedia: false,
    },
    email: {
      showHeaderMenu: false,
      showActions: false,
      showTextAboveMedia: false,
    },
    pinterest: {
      showHeaderMenu: false,
      showActions: false,
      showTextAboveMedia: false,
    },
    youtube: {
      showHeaderMenu: false,
      showActions: false,
      showTextAboveMedia: false,
    },
  } as const;


  const platformConfig = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];

  const isInstagramReel = platform === "instagram" && normalizedMedia.length === 1 && isVideo(normalizedMedia[0]);
  // SHORT: vertical video ≤ 180s (auto-set by hook); show reel-style immersive preview
  const isYouTubeShort = platform === "youtube" && youtubeContentType === "SHORT" && normalizedMedia.length === 1 && isVideo(normalizedMedia[0]);
  // Standard YouTube video — single video, not a Short
  const isYouTubeVideo = platform === "youtube" && normalizedMedia.length === 1 && isVideo(normalizedMedia[0]) && !isYouTubeShort;
  // Hide outer card header/border for Reels, Shorts, and standard YT videos (they render their own metadata)
  const isVerticalFull = isInstagramReel || isYouTubeShort || isYouTubeVideo;



  const renderFacebookPreview = (media: { uri: string; type: string }[]) => (
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

  const InstagramPreview: React.FC<{ media: { uri: string; type: string }[]; coverImage?: string }> = ({ media, coverImage }) => {
    const scrollRef = useRef<ScrollView>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const onScroll = (event: any) => {
      const index = Math.round(
        event.nativeEvent.contentOffset.x / SCREEN_WIDTH
      );
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
            <TouchableOpacity
              key={index}
              onPress={() => setFullscreenIndex(index)}
              style={{
                width: SCREEN_WIDTH,
                height: SCREEN_WIDTH,
                overflow: "hidden",
              }}
            >
              {isVideo(item) ? (
                <Video
                  source={{ uri: item.uri }}
                  posterSource={index === 0 && coverImage ? { uri: coverImage } : undefined}
                  usePoster={index === 0 && !!coverImage}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                  isMuted
                />
              ) : (
                <Image
                  source={{ uri: item.uri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {media.length > 1 && (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 8,
            }}
          >
            {media.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor:
                    activeIndex === index ? "#3b82f6" : "#d1d5db",
                  marginHorizontal: 4,
                }}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderWhatsAppPreview = () => {
    const media = normalizedMedia.slice(0, 4);
    const remaining = normalizedMedia.length - 4;

    const MediaItem = ({
      item,
      index,
      style,
      showOverlay,
    }: {
      item: { uri: string; type: string };
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

          {/* +N OVERLAY */}
          {showOverlay && remaining > 0 && (
            <View className="absolute inset-0 bg-black/60 items-center justify-center">
              <Text className="text-white text-2xl font-bold">
                +{remaining}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      );
    };

    return (
      <View className="px-3 py-4 bg-[#efeae2]" style={{
        backgroundColor: isDark ? "#161618" : "#efeae2",
      }}>
        <View className="self-end max-w-[85%] bg-[#dcf8c6] rounded-xl p-2">
          {/* MEDIA */}
          {normalizedMedia.length === 1 && (
            <MediaItem
              item={normalizedMedia[0]}
              index={0}
              style={{ width: 220, height: 220, borderRadius: 12 }}
            />
          )}

          {normalizedMedia.length === 2 && (
            <View>
              {media.map((item, i) => (
                <MediaItem
                  key={i}
                  item={item}
                  index={i}
                  style={{
                    width: 220,
                    height: 110,
                    borderRadius: 10,
                    marginBottom: i === 0 ? 4 : 0,
                  }}
                />
              ))}
            </View>
          )}

          {normalizedMedia.length === 3 && (
            <View className="flex-row">
              <MediaItem
                item={media[0]}
                index={0}
                style={{
                  width: 110,
                  height: 220,
                  borderRadius: 10,
                  marginRight: 4,
                }}
              />
              <View>
                <MediaItem
                  item={media[1]}
                  index={1}
                  style={{
                    width: 110,
                    height: 108,
                    borderRadius: 10,
                    marginBottom: 4,
                  }}
                />
                <MediaItem
                  item={media[2]}
                  index={2}
                  style={{
                    width: 110,
                    height: 108,
                    borderRadius: 10,
                  }}
                />
              </View>
            </View>
          )}

          {normalizedMedia.length >= 4 && (
            <View className="flex-row flex-wrap">
              {media.slice(0, 4).map((item, i) => (
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
                    style={{
                      width: "100%",
                      height: 110,
                      borderRadius: 10,
                    }}
                  />
                </View>
              ))}
            </View>
          )}

          {!!text && (
            <Text className="text-gray-900 mt-2">
              {(() => {
                let displayedText = text;
                const normalizedStatus = status?.toUpperCase();
                if (normalizedStatus === "SENT") {
                  displayedText = displayedText
                    .replace(/\{\{\s*name\s*\}\}/g, contactName || "{{name}}")
                    .replace(/\{\{\s*email\s*\}\}/g, contactEmail || "{{email}}")
                    .replace(/\{\{\s*phone\s*\}\}/g, contactPhone || "{{phone}}")
                    .replace(/\{\{\s*contact\s*\}\}/g, contactPhone || "{{contact}}")
                    .replace(/\{\{\s*mobile\s*\}\}/g, contactPhone || "{{mobile}}")
                    .replace(/\{\{\s*company\s*\}\}/g, contactCompany || "{{company}}");
                }
                return displayedText;
              })()}
            </Text>
          )}

          <View className="flex-row justify-end items-center mt-1">
            <Text className="text-[10px] text-gray-500 mr-1">
              {timestamp || "12:30 PM"}
            </Text>
            <Ionicons name="checkmark-done" size={14} color="#34B7F1" />
          </View>
        </View>
      </View>
    );
  };

  const renderEmailPreview = () => (
    <View
      className="border border-gray-300 rounded-lg p-4 bg-white"
      style={{
        backgroundColor: isDark ? "#161618" : "#f2f2f7",
        marginHorizontal: 8,
      }}
    >
      <View className="flex-row justify-between mb-2">
        <Text className="text-xs text-gray-500">
          From: {senderEmail || `${username.toLowerCase().replace(/\s+/g, '.')}@company.com`}
        </Text>
        <Text className="text-xs text-gray-500">
          {timestamp || "Now"}
        </Text>
      </View>

      <Text className="text-xs text-gray-500 mb-1">
        To: Customer {"<"}customer@example.com{">"}
      </Text>

      <Text className="font-semibold text-gray-900 mt-1 mb-2"
        style={{ color: isDark ? "#f2f2f7" : "#111827" }}>
        Subject: {(() => {
          let displayedSubject = subject || "No Subject";
          const normalizedStatus = status?.toUpperCase();
          if (normalizedStatus === "SENT") {
            displayedSubject = displayedSubject
              .replace(/\{\{\s*name\s*\}\}/g, contactName || "{{name}}")
              .replace(/\{\{\s*email\s*\}\}/g, contactEmail || "{{email}}")
              .replace(/\{\{\s*phone\s*\}\}/g, contactPhone || "{{phone}}")
              .replace(/\{\{\s*contact\s*\}\}/g, contactPhone || "{{contact}}")
              .replace(/\{\{\s*mobile\s*\}\}/g, contactPhone || "{{mobile}}")
              .replace(/\{\{\s*company\s*\}\}/g, contactCompany || "{{company}}");
          }
          return displayedSubject;
        })()}
      </Text>

      <View className="h-[1px] bg-gray-200 w-full mb-3" />
      {(() => {
        let displayedText = text;
        const normalizedStatus = status?.toUpperCase();
        if (normalizedStatus === "SENT") {
          displayedText = displayedText
            .replace(/\{\{\s*name\s*\}\}/g, contactName || "{{name}}")
            .replace(/\{\{\s*email\s*\}\}/g, contactEmail || "{{email}}")
            .replace(/\{\{\s*phone\s*\}\}/g, contactPhone || "{{phone}}")
            .replace(/\{\{\s*contact\s*\}\}/g, contactPhone || "{{contact}}")
            .replace(/\{\{\s*mobile\s*\}\}/g, contactPhone || "{{mobile}}")
            .replace(/\{\{\s*company\s*\}\}/g, contactCompany || "{{company}}");
        }
        return <Text className="text-gray-900 mb-3">{displayedText}</Text>;
      })()}

      {normalizedMedia.length > 0 && (
        <View className="mt-2">
          {normalizedMedia.map((item, index) => {
            const isPdf = item.type === "application/pdf" || item.uri.match(/\.pdf($|\?)/i);
            const isImg = !isPdf && (item.type.startsWith("image/") || item.uri.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i));
            const isVid = item.type.startsWith("video/") || item.uri.match(/\.(mp4|mov|mkv)($|\?)/i);

            const fullName = item.name || item.uri.split('/').pop()?.split('?')[0] || `File ${index + 1}`;
            const lastDotIndex = fullName.lastIndexOf('.');
            const nameOnly = lastDotIndex > 0 ? fullName.substring(0, lastDotIndex) : fullName;
            const extension = lastDotIndex > 0 ? fullName.substring(lastDotIndex + 1).toUpperCase() : "";

            if (isPdf) {
              return (
                <View key={index} className="mb-4 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                  <View className="w-full h-40 bg-white items-center justify-center border-b border-gray-100">
                    <View className="items-center">
                      <Ionicons name="document-text" size={64} color="#ef4444" />
                      <Text className="text-gray-400 mt-2 text-xs uppercase font-bold tracking-widest">{extension || 'PDF'}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center justify-between p-3 bg-white">
                    <View className="flex-row items-center flex-1">
                      <Ionicons name="document" size={24} color="#ef4444" />
                      <View className="ml-3 flex-1">
                        <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
                          {nameOnly}
                        </Text>
                        {item.size && (
                          <Text className="text-xs text-gray-500">
                            Size: {item.size}
                          </Text>
                        )}
                      </View>
                    </View>
                    {onRemoveMedia && (
                      <TouchableOpacity onPress={() => onRemoveMedia?.(item.uri)}>
                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                      </TouchableOpacity>
                    )}
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
                        <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
                          {nameOnly}
                        </Text>
                        {extension && (
                          <Text className="text-xs text-gray-500">
                            {extension} File
                          </Text>
                        )}
                      </View>
                    </View>
                    {onRemoveMedia && (
                      <TouchableOpacity onPress={() => onRemoveMedia?.(item.uri)}>
                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                      </TouchableOpacity>
                    )}
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
                        <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
                          {nameOnly}
                        </Text>
                        {extension && (
                          <Text className="text-xs text-gray-500">
                            {extension} Video
                          </Text>
                        )}
                      </View>
                    </View>
                    {onRemoveMedia && (
                      <TouchableOpacity onPress={() => onRemoveMedia?.(item.uri)}>
                        <Ionicons name="close-circle" size={24} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }

            // Fallback for other files
            return (
              <View key={index} className="mb-4 bg-white rounded-lg p-3 border border-gray-200 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-gray-100 p-2 rounded-lg">
                    <Ionicons name="document-outline" size={24} color="#6b7280" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
                      {fullName}
                    </Text>
                    {item.size && (
                      <Text className="text-xs text-gray-500">
                        {item.size}
                      </Text>
                    )}
                  </View>
                </View>
                {onRemoveMedia && (
                  <TouchableOpacity onPress={() => onRemoveMedia?.(item.uri)}>
                    <Ionicons name="close-circle" size={24} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>

  );

  const renderSmsPreview = () => {
    return (
      <View className="px-3 py-4 bg-[#f2f2f7]" style={{ backgroundColor: isDark ? "#161618" : "#f2f2f7" }}>
        <View className="self-end max-w-[85%] bg-[#007AFF] rounded-2xl px-3 py-2">
          <Text className="text-white text-[15px] leading-5">
            {(() => {
              let displayedText = text || "Your SMS message will appear here";
              const normalizedStatus = status?.toUpperCase();
              if (normalizedStatus === "SENT") {
                displayedText = displayedText
                  .replace(/\{\{\s*name\s*\}\}/g, contactName || "{{name}}")
                  .replace(/\{\{\s*email\s*\}\}/g, contactEmail || "{{email}}")
                  .replace(/\{\{\s*phone\s*\}\}/g, contactPhone || "{{phone}}")
                  .replace(/\{\{\s*contact\s*\}\}/g, contactPhone || "{{contact}}")
                  .replace(/\{\{\s*mobile\s*\}\}/g, contactPhone || "{{mobile}}")
                  .replace(/\{\{\s*company\s*\}\}/g, contactCompany || "{{company}}");
              }
              return displayedText;
            })()}
          </Text>

          <Text className="text-[10px] text-white/70 text-right mt-1">
            {timestamp || "12:30 PM"}
          </Text>
        </View>
      </View>
    );
  };

  const renderPinterestPreview = () => {
    if (!normalizedMedia || normalizedMedia.length === 0) return null; // early exit

    return (
      <View className="p-3 bg-white" style={{ backgroundColor: isDark ? "#161618" : "#fff" }}>
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
                <Image
                  source={{ uri: item.uri }}
                  style={{ width: "100%", height: 200 }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}

            {isVideo(item) && (

              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(0,0,0,0.2)",
                }}
              >
                <Ionicons name="play-circle" size={36} color="white" />
              </View>
            )}

            <View
              style={{
                position: "absolute",
                top: 8,
                right: 8,
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: "#E60023",
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>Save</Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                flexDirection: "row",
                gap: 8,
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: "#fff",
                  padding: 6,
                  borderRadius: 8,
                }}
              >
                <Ionicons name="cloud-upload-outline" size={20} color="black" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#fff",
                  padding: 6,
                  borderRadius: 8,
                }}
              >
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

    if (isYouTubeShort) {
      return renderYouTubeShort(normalizedMedia[0]);
    }

    const videoItem = normalizedMedia[0];
    const bgColor = isDark ? "#0f0f0f" : "#ffffff";
    const metaColor = isDark ? "#aaaaaa" : "#606060";
    const titleColor = isDark ? "#ffffff" : "#0f0f0f";

    return (
      <View style={{ backgroundColor: bgColor, borderRadius: 0, overflow: "hidden" }}>

        {/* Thumbnail / Video */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (!hasStarted && coverImage) {
              setHasStarted(true);
              setIsPlaying(true);
            } else {
              setIsPlaying(!isPlaying);
            }
          }}
          style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", position: "relative" }}
        >
          {isVideo(videoItem) ? (
            <Video
              source={{ uri: videoItem.uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode={ResizeMode.COVER}
              shouldPlay={isPlaying && (hasStarted || !coverImage)}
              isLooping
              isMuted
              useNativeControls={false}
              onPlaybackStatusUpdate={(status: any) => {
                if (status.isLoaded && status.durationMillis) {
                  const remaining = Math.max(0, Math.ceil((status.durationMillis - (status.positionMillis ?? 0)) / 1000));
                  const mins = Math.floor(remaining / 60);
                  const secs = remaining % 60;
                  setVideoCountdown(`${mins}:${secs.toString().padStart(2, "0")}`);
                }
              }}
            />
          ) : (
            <Image
              source={{ uri: videoItem.uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          )}

          {(!isPlaying || (!hasStarted && coverImage)) && (
            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.2)", zIndex: 5 }}>
              <Ionicons name={hasStarted ? (isPlaying ? "pause" : "play") : "play-circle"} size={hasStarted ? 48 : 64} color="white" />
            </View>
          )}

          {!!coverImage && !hasStarted && (
            <Image
              source={{ uri: coverImage }}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1 }}
              resizeMode="cover"
              onError={(e) => console.log("Thumbnail Image Load Error:", e.nativeEvent.error)}
              onLoad={() => console.log("Thumbnail Image Loaded Successfully")}
            />
          )}

          <View style={{
            position: "absolute", bottom: 8, right: 8,
            backgroundColor: "rgba(0,0,0,0.82)",
            borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2
          }}>
            <Text style={{ color: "white", fontSize: 12, fontWeight: "600", letterSpacing: 0.3 }}>
              {videoCountdown}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Info Area */}
        <View style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 14 }}>
          {/* Row 1: Title */}
          <View style={{ marginBottom: 4 }}>
            {onChangeText ? (
              <TextInput
                value={text}
                onChangeText={onChangeText}
                placeholder="Video title..."
                placeholderTextColor={metaColor}
                multiline
                numberOfLines={2}
                style={{ color: titleColor, fontSize: 16, fontWeight: "600", padding: 0 }}
              />
            ) : (
              <Text style={{ color: titleColor, fontSize: 16, fontWeight: "600" }} numberOfLines={2}>
                {text || "Video title..."}
              </Text>
            )}
          </View>

          {/* Row 2: Channel Name • Views • Time • Hastags ...more */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ color: metaColor, fontSize: 12 }}>
              1.2K views • {timestamp || "Just now"} • 
            </Text>
            <Text style={{ color: isDark ? "#aaa" : "#065fd4", fontSize: 12 }}> #youtube #video </Text>
            <Text style={{ color: titleColor, fontSize: 12, fontWeight: "600" }}>...more</Text>
          </View>

          {/* Row 3: Profile, Subscribe, Action Buttons */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            
            {/* Profile + Subscribe */}
            <View style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={{ width: 34, height: 34, borderRadius: 17, marginRight: 8 }} />
              ) : (
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#CC0000", alignItems: "center", justifyContent: "center", marginRight: 8 }}>
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                    {username ? username[0].toUpperCase() : "Y"}
                  </Text>
                </View>
              )}
              <Text style={{ color: titleColor, fontWeight: "bold", fontSize: 14, marginRight: 12 }}>
                {username || "Channel"}
              </Text>
              <TouchableOpacity style={{ backgroundColor: isDark ? "white" : "black", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
                <Text style={{ color: isDark ? "black" : "white", fontWeight: "bold", fontSize: 13 }}>Subscribe</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Actions */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: "center", gap: 8, paddingRight: 20 }}>
              {/* Like / Dislike Group */}
              <View style={{ flexDirection: "row", backgroundColor: isDark ? "#272727" : "#0000000D", borderRadius: 20, alignItems: "center" }}>
                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRightWidth: 1, borderRightColor: isDark ? "#3f3f3f" : "#0000001A" }}>
                  <Ionicons name="thumbs-up-outline" size={18} color={titleColor} />
                  <Text style={{ color: titleColor, fontSize: 13, fontWeight: "600", marginLeft: 6 }}>12K</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Ionicons name="thumbs-down-outline" size={18} color={titleColor} />
                </TouchableOpacity>
              </View>

              {/* Share */}
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDark ? "#272727" : "#0000000D", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
                <Ionicons name="share-social-outline" size={18} color={titleColor} />
                <Text style={{ color: titleColor, fontSize: 13, fontWeight: "600", marginLeft: 6 }}>Share</Text>
              </TouchableOpacity>

              {/* Remix */}
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDark ? "#272727" : "#0000000D", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
                <Ionicons name="cut-outline" size={18} color={titleColor} />
                <Text style={{ color: titleColor, fontSize: 13, fontWeight: "600", marginLeft: 6 }}>Remix</Text>
              </TouchableOpacity>

              {/* Download */}
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDark ? "#272727" : "#0000000D", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
                <Ionicons name="download-outline" size={18} color={titleColor} />
                <Text style={{ color: titleColor, fontSize: 13, fontWeight: "600", marginLeft: 6 }}>Download</Text>
              </TouchableOpacity>

              {/* Save */}
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDark ? "#272727" : "#0000000D", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
                <Ionicons name="bookmark-outline" size={18} color={titleColor} />
                <Text style={{ color: titleColor, fontSize: 13, fontWeight: "600", marginLeft: 6 }}>Save</Text>
              </TouchableOpacity>

              {/* Report */}
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDark ? "#272727" : "#0000000D", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
                <Ionicons name="flag-outline" size={18} color={titleColor} />
                <Text style={{ color: titleColor, fontSize: 13, fontWeight: "600", marginLeft: 6 }}>Report</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </View>
    );
  };


  const renderYouTubeShort = (videoItem: any) => {
    return (
      <View style={{ width: "100%", height: 550, backgroundColor: "#000", borderRadius: 12, overflow: "hidden" }}>

        {/* Header Overlay */}
        <View style={{ position: "absolute", top: 16, left: 16, right: 16, zIndex: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16, textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 4 }}>Shorts</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Ionicons name="search-outline" size={22} color="white" />
            <Ionicons name="ellipsis-vertical" size={22} color="white" />
          </View>
        </View>

        {/* Core Video Player */}
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          {isVideo(videoItem) ? (
            <Video
              source={{ uri: videoItem.uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode={ResizeMode.COVER}
              shouldPlay={!coverImage}
              isLooping
              isMuted
              useNativeControls={false}
              posterSource={coverImage ? { uri: coverImage } : undefined}
              usePoster={!!coverImage}
            />
          ) : (
            <Image
              source={{ uri: videoItem.uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          )}

          {/* Custom thumbnail overlay for Shorts */}
          {!!coverImage && (
            <Image
              source={{ uri: coverImage }}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          )}
        </View>

        {/* Bottom overlay */}
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10 }}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 220 }}
          />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 24, paddingTop: 60 }}>

            {/* Left: profile + caption */}
            <View style={{ flex: 1, paddingRight: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                {profilePic ? (
                  <Image source={{ uri: profilePic }} style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: "white" }} />
                ) : (
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#444", borderWidth: 1, borderColor: "white" }} />
                )}
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 14, marginLeft: 10, textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 4 }}>
                  @{username ? username.toLowerCase().replace(/\s+/g, "") : "user"}
                </Text>
                <TouchableOpacity style={{ borderColor: 'white', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 10 }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>Subscribe</Text>
                </TouchableOpacity>
              </View>

              {onChangeText ? (
                <TextInput
                  value={text}
                  onChangeText={onChangeText}
                  placeholder="Add a caption..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  multiline
                  numberOfLines={2}
                  style={{ color: "white", fontSize: 13, marginBottom: 10, textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 4, padding: 0, textAlignVertical: 'top' }}
                />
              ) : (
                <Text style={{ color: "white", fontSize: 13, marginBottom: 10, textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 4, opacity: text ? 1 : 0.6 }} numberOfLines={2}>
                  {text || "Add a caption..."}
                </Text>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, alignSelf: 'flex-start' }}>
                <Ionicons name="musical-note" size={12} color="white" />
                <Text style={{ color: 'white', fontSize: 12, marginLeft: 6, fontWeight: '500' }}>Original Audio</Text>
              </View>
            </View>

            {/* Right: action icons */}
            <View style={{ alignItems: "center" }}>
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <Ionicons name="thumbs-up" size={28} color="white" />
                <Text style={{ color: "white", fontSize: 11, fontWeight: "600", marginTop: 4 }}>12K</Text>
              </View>
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <Ionicons name="thumbs-down" size={28} color="white" />
                <Text style={{ color: "white", fontSize: 11, fontWeight: "600", marginTop: 4 }}>Dislike</Text>
              </View>
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <Ionicons name="chatbubble-ellipses" size={28} color="white" />
                <Text style={{ color: "white", fontSize: 11, fontWeight: "600", marginTop: 4 }}>456</Text>
              </View>
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <Ionicons name={"share-social" as any} size={28} color="white" />
                <Text style={{ color: "white", fontSize: 11, fontWeight: "600", marginTop: 4 }}>Share</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Ionicons name="sync" size={26} color="white" />
                <Text style={{ color: "white", fontSize: 11, fontWeight: "600", marginTop: 4 }}>Remix</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tap to fullscreen */}
        <TouchableOpacity
          style={{ position: 'absolute', top: 50, left: 0, right: 80, bottom: 0, zIndex: 5 }}
          onPress={() => setFullscreenIndex(0)}
        />
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
            <Text className="px-3 pt-1 pb-3 text-xs text-gray-500">
              {timestamp}
            </Text>
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
        if (normalizedMedia.length === 1 && isVideo(normalizedMedia[0])) {
          return renderInstagramReel(normalizedMedia[0]);
        }
        return <InstagramPreview media={normalizedMedia} coverImage={coverImage} />;

      case "whatsapp":
        return renderWhatsAppPreview();
      case "sms":
        return renderSmsPreview();
      case "email":
        return renderEmailPreview();
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

  const renderInstagramReel = (videoItem: any) => {
    return (
      <View style={{ width: "100%", height: 550, backgroundColor: "#000", borderRadius: 12, overflow: "hidden" }}>

        <View style={{ position: "absolute", top: 16, left: 16, right: 16, zIndex: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: "white", fontWeight: "bold", fontSize: 16, textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 4 }}>Reels</Text>
          <Ionicons name="camera-outline" size={24} color="white" />
        </View>

        <View style={{ flex: 1, backgroundColor: "#111" }}>
          {isVideo(videoItem) ? (
            <Video
              source={{ uri: videoItem.uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
              useNativeControls={false}
              posterSource={coverImage ? { uri: coverImage } : undefined}
              usePoster={!!coverImage}
            />
          ) : (
            <Image
              source={{ uri: videoItem.uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          )}
        </View>

        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10 }}>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 200 }}
          />


          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 24, paddingTop: 60 }}>
            <View style={{ flex: 1, paddingRight: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                {profilePic ? (
                  <Image source={{ uri: profilePic }} style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: "white" }} />
                ) : (
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "gray", borderWidth: 1, borderColor: "white" }} />
                )}
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 14, marginLeft: 10, textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 4 }}>
                  {username || "User"}
                </Text>
                <TouchableOpacity style={{ borderColor: 'white', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 12 }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>Follow</Text>
                </TouchableOpacity>
              </View>

              {onChangeText ? (
                <TextInput
                  value={text}
                  onChangeText={onChangeText}
                  placeholder="Write a caption..."
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  multiline
                  numberOfLines={2}
                  style={{
                    color: "white",
                    fontSize: 13,
                    marginBottom: 12,
                    textShadowColor: "rgba(0,0,0,0.8)",
                    textShadowRadius: 4,
                    padding: 0,
                    margin: 0,
                    textAlignVertical: 'top'
                  }}
                />
              ) : (
                <Text style={{ color: "white", fontSize: 13, marginBottom: 12, textShadowColor: "rgba(0,0,0,0.8)", textShadowRadius: 4, opacity: text ? 1 : 0.6 }} numberOfLines={2}>
                  {text || "Write a caption..."}
                </Text>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' }}>
                <Ionicons name="musical-note" size={14} color="white" />
                <Text style={{ color: 'white', fontSize: 12, marginLeft: 6, fontWeight: '500' }}>Original Audio</Text>
              </View>
            </View>

            <View style={{ alignItems: "center" }}>
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <Ionicons name="heart-outline" size={32} color="white" />
                <Text style={{ color: "white", fontSize: 12, fontWeight: "600", marginTop: 4 }}>12.5k</Text>
              </View>
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <Ionicons name="chatbubble-outline" size={30} color="white" />
                <Text style={{ color: "white", fontSize: 12, fontWeight: "600", marginTop: 4 }}>1,024</Text>
              </View>
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <Ionicons name="paper-plane-outline" size={30} color="white" />
                <Text style={{ color: "white", fontSize: 12, fontWeight: "600", marginTop: 4 }}>456</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Ionicons name="ellipsis-vertical" size={24} color="white" />
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={{ position: 'absolute', top: 50, left: 0, right: 80, bottom: 0, zIndex: 100 }}
          onPress={() => setFullscreenIndex(0)}
        />
      </View>
    );
  };

  return (

    <View
      className={`${isVerticalFull ? "" : "my-2 bg-white border border-gray-300 rounded-lg pb-2"} ${platform === "sms" || platform === "email" ? "" : "overflow-hidden"}`}
      style={{ backgroundColor: isVerticalFull ? "transparent" : (isDark ? "#161618" : "#fff") }}>
      {!isVerticalFull && (

        <View className="flex-row items-center px-4 py-4">

          {profilePic && (
            <Image
              source={{ uri: profilePic }}
              className="w-10 h-10 rounded-full"
            />
          )}

          <View className="flex-1 ml-3 justify-center">
            <Text className="font-bold text-gray-900 leading-5" style={{ color: isDark ? "#f2f2f7" : "#111827" }}>
              {platform === "email" ? "" : username}
            </Text>

            {(platform === "facebook" ||
              platform === "linkedin" ||
              platform === "youtube") && (
                <Text className="text-xs text-gray-500 mt-0.5">
                  {timestamp || "Just now"}
                </Text>
              )}

            {platform === "email" && (
              <Text className="text-xs text-gray-500 mt-0.5">
                Email Campaign Preview
              </Text>
            )}
          </View>

          {platformConfig?.showHeaderMenu && (
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color="#555"
            />
          )}
        </View>
      )}

      {platformConfig?.showTextAboveMedia && (
        platform === "facebook" && onChangeText ? (
          <TextInput
            value={text}
            onChangeText={onChangeText}
            placeholder="What's on your mind?"
            placeholderTextColor={isDark ? "#9ca3af" : "#9ca3af"}
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
              className={`mt-2 text-gray-900 ${platform === "facebook" || platform === "linkedin" ? "px-4 mb-2" : ""}`}
              style={{ color: isDark ? "#f2f2f7" : "#111827" }}
            >
              {text}
            </Text>
          )
        )
      )}

      {renderMedia()}

      {platformConfig?.showActions && !isInstagramReel && renderActions()}
      <Modal
        visible={fullscreenIndex !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullscreenIndex(null)}
      >
        <SafeAreaView className="flex-1 bg-black">
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 50,
              right: 20,
              zIndex: 10,
              padding: 10,
            }}
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
              onScrollToIndexFailed={() => { }}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                if (platform === "facebook") {
                  return (
                    <View style={{ width: SCREEN_WIDTH, height: "100%", backgroundColor: 'black', justifyContent: "center" }}>
                      <View style={{ width: SCREEN_WIDTH, height: "80%" }}>
                        {isVideo(item) ? (
                          <Video
                            source={{ uri: item.uri }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode={ResizeMode.CONTAIN}
                            useNativeControls
                            shouldPlay={true}
                          />
                        ) : (
                          <Image
                            source={{ uri: item.uri }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                      <View className="flex-row items-center px-4" style={{ height: 60, position: 'absolute', bottom: 40, left: 0, width: SCREEN_WIDTH }}>
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
