import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from 'expo-av';
import React, { useRef, useState } from "react";
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, useColorScheme, View, Modal, SafeAreaView, FlatList } from "react-native";

type PreviewProps = {
  profilePic?: string;
  platform: string;
  text: string;
  coverImage?: string;
  images?: string[]; 
  media?: { uri: string; type: string }[];
  timestamp?: string;
  username: string;
};

const SCREEN_WIDTH = Dimensions.get("window").width;

const Preview: React.FC<PreviewProps> = ({
  profilePic,
  platform,
  username,
  text,
  coverImage,
  images = [],
  media,
  timestamp,
}) => {
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  
  // Normalize media for internal use
  const normalizedMedia = media || images.map(uri => ({
    uri,
    type: uri.match(/\.(mp4|mov|mkv)($|\?)/i) ? "video/mp4" : "image/jpeg"
  }));

  const isVideo = (item: { uri: string; type: string }) => 
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
      showHeaderMenu: true,
      showActions: false,
      showTextAboveMedia: false,
    },
  } as const;


  const platformConfig = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];

  // Facebook & LinkedIn style media renderer
  const renderFacebookPreview = (media: { uri: string; type: string }[]) => (
    <View className="overflow-hidden mt-2">
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
        <View className="w-full h-[300px] flex-row">
          {media.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => setFullscreenIndex(index)}
              style={{ width: "50%", height: "100%" }}
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
        <View>
          <View className="flex-row h-[150px]">
            {media.slice(0, 2).map((item, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => setFullscreenIndex(index)}
                style={{ width: "50%", height: "100%" }}
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
          <TouchableOpacity onPress={() => setFullscreenIndex(2)}>
            {isVideo(media[2]) ? (
              <Video
                source={{ uri: media[2].uri }}
                style={{ width: "100%", height: 150 }}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
              />
            ) : (
              <Image source={{ uri: media[2].uri }} className="w-full h-[150px]" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {media.length >= 4 && (
        <View className="flex-row flex-wrap h-[300px]">
          {media.slice(0, 4).map((item, index) => {
            const remaining = media.length - 4;
            const isLast = index === 3;
            return (
              <TouchableOpacity 
                key={index} 
                onPress={() => setFullscreenIndex(index)}
                className="w-1/2 h-1/2 relative"
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
                {isLast && remaining > 0 && (
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
            <Text className="text-gray-900 mt-2">{text}</Text>
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
        <Text className="font-semibold text-gray-900"
          style={{ color: isDark ? "#f2f2f7" : "#111827" }}>
          Subject: Campaign Update
        </Text>
        <Text className="text-xs text-gray-500">
          {timestamp || "Now"}
        </Text>
      </View>

      <Text className="text-xs text-gray-500 mb-1">
        From: {username}@company.com
      </Text>
      <Text className="text-xs text-gray-500 mb-3">
        To: client@example.com
      </Text>

      <Text className="text-gray-900 mb-3">{text}</Text>

      {normalizedMedia.length > 0 && renderFacebookPreview(normalizedMedia)}
    </View>

  );

  const renderSmsPreview = () => {
    return (
      <View className="px-3 py-4 bg-[#f2f2f7]" style={{ backgroundColor: isDark ? "#161618" : "#f2f2f7" }}>
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
    const thumbnail = normalizedMedia[0].uri;

    return (
      <View className="px-3 py-4 bg-black rounded-lg">
        <TouchableOpacity
          onPress={() => setFullscreenIndex(0)}
          className="relative w-full h-56 overflow-hidden rounded-lg"
        >
          <Image
            source={{ uri: thumbnail }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />

          <View className="absolute inset-0 items-center justify-center">
            <View className="bg-black/50 rounded-full p-4">
              <Ionicons name="play" size={32} color="white" />
            </View>
          </View>
        </TouchableOpacity>

        {!!text && (
          <Text className="text-white mt-2">{text}</Text>
        )}

        <Text className="text-xs text-gray-300 mt-1">{timestamp || "Just now"}</Text>
      </View>
    );
  };

  const renderActions = () => {
    if (platform === "facebook") {
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
            <Ionicons name="share-social-outline" size={16} color="#555" />
            <Text className="ml-1 text-gray-500 font-medium">Share</Text>
          </View>
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
              <Ionicons name="chatbubble-outline" size={22} className="ml-3" />
              <Ionicons name="paper-plane-outline" size={22} className="ml-3" />
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

  return (

    <View
      className={`my-2 bg-white border border-gray-300 rounded-lg pb-2 ${platform === "sms" ? "" : "overflow-hidden"
        } ${platform === "facebook" ? "p-3" : ""}`}
      style={{ backgroundColor: isDark ? "#161618" : "#fff" }}>
      <View className="flex-row items-center px-4 py-4">

        {profilePic && (
          <Image
            source={{ uri: profilePic }}
            className="w-10 h-10 rounded-full"
          />
        )}

        <View className="flex-1 ml-3 justify-center">
          <Text className="font-bold text-gray-900 leading-5" style={{ color: isDark ? "#f2f2f7" : "#111827" }}>
            {platform === "email" ? "From: " : ""}
            {username}
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
              To: client@example.com · {timestamp || "Now"}
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

      {platformConfig?.showTextAboveMedia && (
        <Text
          className="mt-2 text-gray-900"
          style={{ color: isDark ? "#f2f2f7" : "#111827" }}
        >
          {text}
        </Text>
      )}

      {renderMedia()}

      {platformConfig?.showActions && renderActions()}

      {/* Fullscreen Media Modal */}
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
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
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
              )}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default Preview;
