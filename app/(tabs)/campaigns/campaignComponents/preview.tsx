import React, { useRef, useState } from "react";
import { View, Text, Image, Dimensions, ScrollView, TouchableOpacity, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from 'expo-av';

type PreviewProps = {
  profilePic?: string;
  platform: string;
  text: string;
  images?: string[];
  timestamp?: string;
  username: string;
};

const SCREEN_WIDTH = Dimensions.get("window").width;

const Preview: React.FC<PreviewProps> = ({
  profilePic,
  platform,
  username,
  text,
  images = [],
  timestamp,
}) => {

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

  const renderMedia = () => {
    if (!images.length) return null;

    switch (platform) {
      case "facebook":
      case "linkedin":
        return renderFacebookPreview(images);
      case "instagram":
        return <InstagramPreview media={images} />;
      case "whatsapp":
        return renderWhatsAppPreview();
      case "email":
        return renderEmailPreview();
      case "sms":
        return renderSmsPreview();
      case "pinterest":
        return renderPinterestPreview();
      case "youtube":
        return renderYouTubePreview();
      default:
        return null;
    }
  };

  const platformConfig = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];

  // Facebook & LinkedIn style media renderer
  const renderFacebookPreview = (images: string[]) => (
    <View className="overflow-hidden mt-2">
      {images.length === 1 && (
        images[0].match(/\.(mp4|mov|mkv)$/i) ? (
          <Video
            source={{ uri: images[0] }}
            style={{ width: "100%", height: 300 }}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />
        ) : (
          <Image source={{ uri: images[0] }} className="w-full h-[300px]" />
        )
      )}

      {images.length === 2 && (
        <View className="w-full h-[300px] flex-row">
          {images.map((uri, index) => (
            uri.match(/\.(mp4|mov|mkv)$/i) ? (
              <Video
                key={index}
                source={{ uri }}
                style={{ width: "50%", height: "100%" }}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                isMuted
              />
            ) : (
              <Image key={index} source={{ uri }} className="w-1/2 h-full" />
            )
          ))}
        </View>
      )}

      {images.length === 3 && (
        <View>
          <View className="flex-row h-[150px]">
            {images.slice(0, 2).map((uri, index) =>
              uri.match(/\.(mp4|mov|mkv)$/i) ? (
                <Video
                  key={index}
                  source={{ uri }}
                  style={{ width: "50%", height: "100%" }}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                  isMuted
                />
              ) : (
                <Image key={index} source={{ uri }} className="w-1/2 h-full" />
              )
            )}
          </View>
          {images[2].match(/\.(mp4|mov|mkv)$/i) ? (
            <Video
              source={{ uri: images[2] }}
              style={{ width: "100%", height: 150 }}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
          ) : (
            <Image source={{ uri: images[2] }} className="w-full h-[150px]" />
          )}
        </View>
      )}

      {images.length >= 4 && (
        <View className="flex-row flex-wrap h-[300px]">
          {images.slice(0, 4).map((uri, index) => {
            const remaining = images.length - 4;
            const isLast = index === 3;
            return (
              <View key={index} className="w-1/2 h-1/2 relative">
                {uri.match(/\.(mp4|mov|mkv)$/i) ? (
                  <Video
                    source={{ uri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay
                    isLooping
                    isMuted
                  />
                ) : (
                  <Image source={{ uri }} className="w-full h-full" />
                )}
                {isLast && remaining > 0 && (
                  <View className="absolute inset-0 bg-black/60 items-center justify-center">
                    <Text className="text-white text-3xl font-bold">
                      +{remaining}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  // Instagram style media renderer
  const InstagramPreview: React.FC<{ media: string[] }> = ({ media }) => {
    const scrollRef = useRef<ScrollView>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const onScroll = (event: any) => {
      const index = Math.round(
        event.nativeEvent.contentOffset.x / SCREEN_WIDTH
      );
      setActiveIndex(index);
    };

    const isVideo = (uri: string) =>
      uri.endsWith(".mp4") || uri.endsWith(".mov") || uri.endsWith(".mkv");

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
          {media.map((uri, index) => (
            <View
              key={index}
              style={{
                width: SCREEN_WIDTH,
                height: SCREEN_WIDTH,
                overflow: "hidden",
              }}
            >
              {isVideo(uri) ? (
                <Video
                  source={{ uri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                  isMuted
                />
              ) : (
                <Image
                  source={{ uri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              )}
            </View>
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

  // WhatsApp style media renderer 
  const renderWhatsAppPreview = () => {
    const isVideo = (uri: string) => /\.(mp4|mov|mkv)$/i.test(uri);
    const media = images.slice(0, 4);
    const remaining = images.length - 4;

    const MediaItem = ({
      uri,
      style,
      showOverlay,
    }: {
      uri: string;
      style: any;
      showOverlay?: boolean;
    }) => {
      const video = isVideo(uri);

      return (
        <View style={[style, { overflow: "hidden" }]}>
          {video ? (
            <Video
              source={{ uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode={ResizeMode.COVER}
              useNativeControls
            />
          ) : (
            <Image
              source={{ uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          )}

          {/* ▶ PLAY ICON FOR VIDEO */}
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
        </View>
      );
    };

    return (
      <View className="px-3 py-4 bg-[#efeae2]" style={{
        backgroundColor: isDark ? "#161618" : "#efeae2",
      }}>
        <View className="self-end max-w-[85%] bg-[#dcf8c6] rounded-xl p-2">
          {/* MEDIA */}
          {images.length === 1 && (
            <MediaItem
              uri={images[0]}
              style={{ width: 220, height: 220, borderRadius: 12 }}
            />
          )}

          {images.length === 2 && (
            <View>
              {media.map((uri, i) => (
                <MediaItem
                  key={i}
                  uri={uri}
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

          {images.length === 3 && (
            <View className="flex-row">
              <MediaItem
                uri={media[0]}
                style={{
                  width: 110,
                  height: 220,
                  borderRadius: 10,
                  marginRight: 4,
                }}
              />
              <View>
                <MediaItem
                  uri={media[1]}
                  style={{
                    width: 110,
                    height: 108,
                    borderRadius: 10,
                    marginBottom: 4,
                  }}
                />
                <MediaItem
                  uri={media[2]}
                  style={{
                    width: 110,
                    height: 108,
                    borderRadius: 10,
                  }}
                />
              </View>
            </View>
          )}

          {images.length >= 4 && (
            <View className="flex-row flex-wrap">
              {media.slice(0, 4).map((uri, i) => (
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
                    uri={uri}
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

          {/* TEXT */}
          {!!text && (
            <Text className="text-gray-900 mt-2">{text}</Text>
          )}

          {/* TIME + TICKS */}
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

  // Email style media renderer
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

      {images.length > 0 && renderFacebookPreview(images)}
    </View>
  );

  // SMS style preview
  const renderSmsPreview = () => {
    return (
      <View className="px-3 py-4 bg-[#f2f2f7]" style={{ backgroundColor: isDark ? "#161618" : "#f2f2f7" }}>
        {/* Message bubble */}
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

  // Pinterest style preview
  const renderPinterestPreview = () => {
    if (!images || images.length === 0) return null; // early exit

    const isVideo = (uri: string) => /\.(mp4|mov|mkv)$/i.test(uri);

    return (
      <View className="p-3 bg-white" style={{ backgroundColor: isDark ? "#161618" : "#fff" }}>
        {images.map((uri, index) => (
          <View
            key={index}
            className="mb-4 rounded-lg overflow-hidden border border-gray-200"
            style={{ minHeight: 200, position: "relative" }}
          >
            {/* MEDIA */}
            {isVideo(uri) ? (
              <Video
                source={{ uri }}
                style={{ width: "100%", height: 200 }}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
                isLooping
                isMuted
              />
            ) : (
              <Image
                source={{ uri }}
                style={{ width: "100%", height: 200 }}
                resizeMode="cover"
              />
            )}

            {/* Play icon overlay */}
            {isVideo(uri) && (
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

            {/* TOP-RIGHT SAVE BUTTON */}
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

            {/* BOTTOM-RIGHT UPLOAD + 3-DOT BUTTONS */}
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

  // YouTube style media renderer
  const renderYouTubePreview = () => {
    if (!images || images.length === 0) return null;

    const thumbnail = images[0]; // first image as thumbnail

    return (
      <View className="px-3 py-4 bg-black rounded-lg">
        <View className="relative w-full h-56 overflow-hidden rounded-lg">
          <Image
            source={{ uri: thumbnail }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />

          {/* Play button overlay */}
          <View className="absolute inset-0 items-center justify-center">
            <View className="bg-black/50 rounded-full p-4">
              <Ionicons name="play" size={32} color="white" />
            </View>
          </View>
        </View>

        {/* Optional text */}
        {!!text && (
          <Text className="text-white mt-2">{text}</Text>
        )}

        {/* Timestamp */}
        <Text className="text-xs text-gray-300 mt-1">{timestamp || "Just now"}</Text>
      </View>
    );
  };

  // Determine which action buttons to render
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

  return (
    <View
      className={`my-2 bg-white border border-gray-300 rounded-lg pb-2 ${platform === "sms" ? "" : "overflow-hidden"
        } ${platform === "facebook" ? "p-3" : ""}`}
      style={{ backgroundColor: isDark ? "#161618" : "#fff" }}>
      {/* HEADER */}
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

      {/* TEXT */}
      {/* {(platform === "facebook" || platform === "linkedin") && (
        <Text
          className={`mt-2 text-gray-900 ${platform === "linkedin" ? "pl-3" : ""}`}
        >
          {text}
        </Text>
      )} */}
      {platformConfig?.showTextAboveMedia && (
        <Text
          className="mt-2 text-gray-900"
          style={{ color: isDark ? "#f2f2f7" : "#111827" }}
        >
          {text}
        </Text>
      )}

      {/* MEDIA */}
      {/* {(platform === "facebook" || platform === "linkedin") && images.length > 0 && renderFacebookPreview(images)}
      {platform === "instagram" && images.length > 0 && ( <InstagramPreview media={images}/> )}
      {platform === "whatsapp" && renderWhatsAppPreview()}
      {platform === "email" && renderEmailPreview()}
      {platform === "sms" && renderSmsPreview()}
      {platform === "pinterest" && renderPinterestPreview()}
      {platform === "youtube" && renderYouTubePreview()} */}

      {/* MEDIA */}
      {renderMedia()}
      {/* ACTIONS */}
      {platformConfig?.showActions && renderActions()}
    </View>
  );
};

export default Preview;
