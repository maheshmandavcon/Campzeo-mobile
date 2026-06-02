import { Ionicons, Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import React, { useRef, useState, useEffect } from "react";
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, useColorScheme, View } from "react-native";

const Video = ({
  source,
  style,
  poster,
  controls = false,
  muted = true,
  playLimit = 0,
  playTrigger = 0,
  onPlayLimitReached,
  onMetadata,
  ...rest
}: {
  source: { uri: string };
  style?: any;
  poster?: string;
  controls?: boolean;
  muted?: boolean;
  playLimit?: number;
  playTrigger?: number;
  onPlayLimitReached?: () => void;
  onMetadata?: (data: { width: number; height: number; duration: number }) => void;
  [key: string]: any;
}) => {
  const webViewRef = useRef<WebView>(null);

  const htmlSource = React.useMemo(() => {
    return `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            html, body {
              margin: 0; padding: 0; width: 100%; height: 100%;
              background: #000000;
              display: flex; align-items: center; justify-content: center;
              overflow: hidden;
            }
            video { width: 100%; height: 100%; object-fit: cover; }
          </style>
        </head>
        <body>
          ${poster ? `<img id="poster-overlay" src="${poster}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; pointer-events: none;" />` : ""}
          <video
            src="${source.uri}"
            ${poster ? `poster="${poster}"` : ""}
            preload="metadata"
            autoplay
            ${playLimit === 0 ? "loop" : ""}
            ${muted ? "muted" : ""}
            playsinline
            ${controls ? "controls" : ""}
          />
          <script>
            var v = document.querySelector('video');
            var posterOverlay = document.getElementById('poster-overlay');
            var playLimit = ${playLimit};
            var playCount = 0;
            var metadataSent = false;
            
            function checkMetadata() {
              if (!metadataSent && v && v.videoWidth > 0 && v.videoHeight > 0 && v.duration > 0) {
                metadataSent = true;
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'metadata',
                  width: v.videoWidth,
                  height: v.videoHeight,
                  duration: v.duration
                }));
              }
            }
            
            if (v) {
              v.addEventListener('loadedmetadata', checkMetadata);
              // Fallback interval in case loadedmetadata fires before bridge is ready or is skipped
              var metaInterval = setInterval(function() {
                checkMetadata();
                if (metadataSent) clearInterval(metaInterval);
              }, 250);

              v.addEventListener('play', function() {
                if (posterOverlay) posterOverlay.style.display = 'none';
              });
              v.addEventListener('pause', function() {
                if (posterOverlay) posterOverlay.style.display = 'block';
              });
            }
            if (playLimit > 0 && v) {
              v.addEventListener('ended', function() {
                playCount++;
                if (playCount < playLimit) {
                  v.play();
                } else {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'limitReached' }));
                }
              });
            }
          </script>
        </body>
      </html>
    `;
  }, [source.uri, poster, controls, playLimit]);

  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        var v = document.querySelector('video');
        if (v) { v.muted = ${muted ? "true" : "false"}; }
        true;
      `);
    }
  }, [muted]);

  useEffect(() => {
    if (webViewRef.current && playTrigger > 0) {
      webViewRef.current.injectJavaScript(`
        playCount = 0;
        var v = document.querySelector('video');
        if (v) { v.play(); }
        true;
      `);
    }
  }, [playTrigger]);

  return (
    <View style={[{ overflow: "hidden" }, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlSource }}
        style={{ flex: 1, backgroundColor: "#000000" }}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'limitReached' && onPlayLimitReached) onPlayLimitReached();
            else if (data.type === 'metadata' && onMetadata)
              onMetadata({ width: data.width, height: data.height, duration: data.duration });
          } catch {
            if (event.nativeEvent.data === 'limitReached' && onPlayLimitReached) onPlayLimitReached();
          }
        }}
      />
    </View>
  );
};

type PreviewProps = {
  profilePic?: string;
  platform: string;
  text: string;
  coverImage?: string;
  images?: string[];
  timestamp?: string;
  username: string;
  youTubeContentType?: string;
};

const SCREEN_WIDTH = Dimensions.get("window").width;

const Preview: React.FC<PreviewProps> = ({
  profilePic,
  platform,
  username,
  text,
  coverImage,
  images = [],
  timestamp,
  youTubeContentType,
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [showWatchAgain, setShowWatchAgain] = useState(false);
  const [playTrigger, setPlayTrigger] = useState(0);
  const [isYTShort, setIsYTShort] = useState(false);

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
    switch (platform) {
      case "facebook":
      case "linkedin":
        if (!images.length) return null;
        return renderFacebookPreview(images);
      case "instagram":
        if (!images.length) return null;
        return <InstagramPreview media={images} coverImage={coverImage} />;
      case "whatsapp":
        return renderWhatsAppPreview();
      case "sms":
        return renderSmsPreview(); 
      case "email":
        return renderEmailPreview(); 
      case "pinterest":
        if (!images.length) return null;
        return renderPinterestPreview();
      case "youtube":
        if (!images.length) return null;
        return renderYouTubePreview();
      default:
        return null;
    }
  };

  const platformConfig = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];

  const renderFacebookPreview = (images: string[]) => (
    <View className="overflow-hidden">
      {images.length === 1 && (
        images[0].match(/\.(mp4|mov|mkv)$/i) ? (
          <Video
            source={{ uri: images[0] }}
            style={{ width: "100%", height: 300 }}
            resizeMode="cover"
            paused={false}
            repeat
            muted={false}
            controls={false}
          />
        ) : (
          <Image source={{ uri: images[0] }} className="w-full h-[300px]" />
        )
      )}

      {images.length === 2 && (
        <View style={{ flexDirection: "row", height: 300, gap: 4 }}>
          {images.map((uri, index) =>
            uri.match(/\.(mp4|mov|mkv)$/i) ? (
              <Video
                key={index}
                source={{ uri }}
                style={{ flex: 1, height: "100%" }}
                resizeMode="cover"
                paused={false}
                repeat
                muted
                controls={false}
              />
            ) : (
              <Image
                key={index}
                source={{ uri }}
                style={{ flex: 1, height: "100%" }}
                resizeMode="cover"
              />
            )
          )}
        </View>
      )}

      {images.length === 3 && (
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", gap: 4, height: 160 }}>
            {images.slice(0, 2).map((uri, index) =>
              uri.match(/\.(mp4|mov|mkv)$/i) ? (
                <Video
                  key={index}
                  source={{ uri }}
                  style={{ flex: 1, height: "100%" }}
                  resizeMode="cover"
                  paused={false}
                  repeat
                  muted
                  controls={false}
                />
              ) : (
                <Image
                  key={index}
                  source={{ uri }}
                  style={{ flex: 1, height: "100%" }}
                  resizeMode="cover"
                />
              )
            )}
          </View>
          {images[2].match(/\.(mp4|mov|mkv)$/i) ? (
            <Video
              source={{ uri: images[2] }}
              style={{ width: "100%", height: 140 }}
              resizeMode="cover"
              paused={false}
              repeat
              muted
              controls={false}
            />
          ) : (
            <Image
              source={{ uri: images[2] }}
              style={{ width: "100%", height: 140 }}
              resizeMode="cover"
            />
          )}
        </View>
      )}

      {images.length === 4 && (
        <View style={{ gap: 4 }}>
          {images[0].match(/\.(mp4|mov|mkv)$/i) ? (
            <Video
              source={{ uri: images[0] }}
              style={{ width: "100%", height: 200 }}
              resizeMode="cover"
              paused={false}
              repeat
              muted
              controls={false}
            />
          ) : (
            <Image
              source={{ uri: images[0] }}
              style={{ width: "100%", height: 200 }}
              resizeMode="cover"
            />
          )}
          <View style={{ flexDirection: "row", gap: 4, height: 120 }}>
            {images.slice(1, 4).map((uri, index) =>
              uri.match(/\.(mp4|mov|mkv)$/i) ? (
                <Video
                  key={index}
                  source={{ uri }}
                  style={{ flex: 1, height: "100%" }}
                  resizeMode="cover"
                  paused={false}
                  repeat
                  muted
                  controls={false}
                />
              ) : (
                <Image
                  key={index}
                  source={{ uri }}
                  style={{ flex: 1, height: "100%" }}
                  resizeMode="cover"
                />
              )
            )}
          </View>
        </View>
      )}

      {images.length === 5 && (
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", gap: 4, height: 160 }}>
            {images.slice(0, 2).map((uri, index) =>
              uri.match(/\.(mp4|mov|mkv)$/i) ? (
                <Video
                  key={index}
                  source={{ uri }}
                  style={{ flex: 1, height: "100%" }}
                  resizeMode="cover"
                  paused={false}
                  repeat
                  muted
                  controls={false}
                />
              ) : (
                <Image
                  key={index}
                  source={{ uri }}
                  style={{ flex: 1, height: "100%" }}
                  resizeMode="cover"
                />
              )
            )}
          </View>
          <View style={{ flexDirection: "row", gap: 4, height: 130 }}>
            {images.slice(2, 5).map((uri, index) =>
              uri.match(/\.(mp4|mov|mkv)$/i) ? (
                <Video
                  key={index}
                  source={{ uri }}
                  style={{ flex: 1, height: "100%" }}
                  resizeMode="cover"
                  paused={false}
                  repeat
                  muted
                  controls={false}
                />
              ) : (
                <Image
                  key={index}
                  source={{ uri }}
                  style={{ flex: 1, height: "100%" }}
                  resizeMode="cover"
                />
              )
            )}
          </View>
        </View>
      )}

      {images.length >= 6 && (() => {
        const remaining = images.length - 4;
        return (
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", gap: 4, height: 160 }}>
              {images.slice(0, 2).map((uri, index) =>
                uri.match(/\.(mp4|mov|mkv)$/i) ? (
                  <Video
                    key={index}
                    source={{ uri }}
                    style={{ flex: 1, height: "100%" }}
                    resizeMode="cover"
                    paused={false}
                    repeat
                    muted
                    controls={false}
                  />
                ) : (
                  <Image
                    key={index}
                    source={{ uri }}
                    style={{ flex: 1, height: "100%" }}
                    resizeMode="cover"
                  />
                )
              )}
            </View>
            <View style={{ flexDirection: "row", gap: 4, height: 130 }}>
              {images.slice(2, 5).map((uri, index) => {
                const isLast = index === 2;
                return (
                  <View key={index} style={{ flex: 1, height: "100%", position: "relative" }}>
                    {uri.match(/\.(mp4|mov|mkv)$/i) ? (
                      <Video
                        source={{ uri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                        paused={false}
                        repeat
                        muted
                        controls={false}
                      />
                    ) : (
                      <Image
                        source={{ uri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    )}
                    {isLast && remaining > 0 && (
                      <View
                        style={{
                          position: "absolute",
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: "rgba(0,0,0,0.6)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
                          +{remaining}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })()}
    </View>
  );

  const InstagramPreview: React.FC<{ media: string[]; coverImage?: string }> = ({ media, coverImage }) => {
    const scrollRef = useRef<ScrollView>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const onScroll = (event: any) => {
      const index = Math.round(
        event.nativeEvent.contentOffset.x / SCREEN_WIDTH
      );
      setActiveIndex(index);
    };

    const isVideo = (uri: string) =>
      /\.(mp4|mov|mkv)$/i.test(uri);

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
                  poster={index === 0 && coverImage ? coverImage : undefined}
                  posterResizeMode="cover"
                  resizeMode="cover"
                  paused={false}
                  repeat
                  muted
                  controls={false}
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
              position: "absolute",
              top: 12,
              right: 12,
              backgroundColor: "rgba(0,0,0,0.65)",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {activeIndex + 1}/{media.length}
            </Text>
          </View>
        )}

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
                  width: 4,
                  height: 4,
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
              resizeMode="cover"
              controls
            />
          ) : (
            <Image
              source={{ uri }}
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

      <Text className="text-gray-900 mb-3" style={{ color: isDark ? "#fff" : "#111827" }}>{text}</Text>

      {images.map((uri, index) => {
        const isVideo = /\.(mp4|mov|mkv)$/i.test(uri);
        const isPdf = /\.pdf$/i.test(uri);

        let filename = uri.split('/').pop() || "file";
        if (filename.includes('?')) filename = filename.split('?')[0];
        const sizeStr = isVideo ? "14.2 MB" : isPdf ? "1.1 MB" : "2.4 MB";
        const iconName = isVideo ? "videocam-outline" : isPdf ? "document-text-outline" : "image-outline";

        return (
          <View
            key={index}
            className="mb-3 border rounded-lg overflow-hidden"
            style={{ borderColor: isDark ? "#333" : "#e5e7eb" }}
          >
            <View
              className="flex-row items-center p-3"
              style={{ backgroundColor: isDark ? "#2c2c2e" : "#fff" }}
            >
              <Ionicons name={iconName} size={24} color={isDark ? "#ccc" : "#555"} />
              
              <View className="flex-1 px-3">
                <Text
                  className="font-medium text-sm"
                  numberOfLines={1}
                  style={{ color: isDark ? "#fff" : "#111827" }}
                >
                  {filename}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {sizeStr}
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  padding: 4,
                  borderRadius: 12,
                  backgroundColor: isDark ? "#444" : "#f3f4f6"
                }}
              >
                <Ionicons name="close" size={16} color={isDark ? "#ccc" : "#555"} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
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
    if (!images || images.length === 0) return null;

    const isVideo = (uri: string) => /\.(mp4|mov|mkv)$/i.test(uri);

    return (
      <View className="p-3 bg-white" style={{ backgroundColor: isDark ? "#161618" : "#fff" }}>
        {images.map((uri, index) => (
          <View
            key={index}
            className="mb-4 rounded-lg overflow-hidden border border-gray-200"
            style={{ minHeight: 200, position: "relative" }}
          >
            {isVideo(uri) ? (
              <Video
                source={{ uri }}
                style={{ width: "100%", height: 200 }}
                resizeMode="cover"
                paused
                repeat
                muted
                controls={false}
              />
            ) : (
              <Image
                source={{ uri }}
                style={{ width: "100%", height: 200 }}
                resizeMode="cover"
              />
            )}

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
    const isDemo = !images || images.length === 0;
    const thumbnail   = isDemo ? "" : images[0];
    const isVideoFile = thumbnail ? /\.(mp4|mov|mkv)$/i.test(thumbnail) : false;
    const bgColor   = isDark ? "#0f0f0f" : "#ffffff";
    const textColor = isDark ? "#ffffff" : "#0f0f0f";
    const subColor  = isDark ? "#aaaaaa" : "#606060";
    const chipBg    = isDark ? "#272727" : "#f2f2f2";
    const divColor  = isDark ? "#333333" : "#e5e5e5";
    const iconColor = isDark ? "#ffffff" : "#0f0f0f";

    const handleMeta = ({ width, height, duration }: { width: number; height: number; duration: number }) => {
      setIsYTShort(height > width && duration <= 180);
    };

    const displayAsShort = youTubeContentType === "SHORT" || (isYTShort && isVideoFile);

    if (displayAsShort) {
      const shortH = SCREEN_WIDTH * 1.65;
      const actions = [
        { icon: "thumbs-up",           label: "48K"    },
        { icon: "thumbs-down",         label: "Dislike" },
        { icon: "chatbubble-ellipses", label: "250"    },
        { icon: "arrow-redo",          label: "Share"  },
        { icon: "repeat",              label: "Repost" },
      ] as const;
      return (
        <View style={{ backgroundColor: "#000", width: "100%", height: shortH, position: "relative", overflow: "hidden" }}>
          {isDemo ? (
            <View style={{ width: "100%", height: "100%", backgroundColor: "#222", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="play-circle-outline" size={64} color="#555" />
              <Text style={{ color: "#555", marginTop: 8 }}>Upload a vertical video</Text>
            </View>
          ) : isVideoFile ? (
            <Video
              source={{ uri: thumbnail }}
              poster={coverImage || undefined}
              style={{ width: "100%", height: "100%" }}
              controls={false}
              muted={false}
              onMetadata={handleMeta}
            />
          ) : (
            <Image source={{ uri: thumbnail }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          )}

          <View style={{ position: "absolute", right: 10, bottom: 130, alignItems: "center", gap: 22 }}>
            {actions.map((btn, i) => (
              <View key={i} style={{ alignItems: "center" }}>
                <TouchableOpacity style={{ padding: 4 }}>
                  <Ionicons name={btn.icon as any} size={30} color="white" />
                </TouchableOpacity>
                <Text style={{ color: "white", fontSize: 11, fontWeight: "600", marginTop: 2 }}>{btn.label}</Text>
              </View>
            ))}
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#333", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#888", marginTop: 4 }}>
              <Ionicons name="musical-notes" size={16} color="white" />
            </View>
          </View>

          <View style={{ position: "absolute", bottom: 0, left: 0, right: 56, paddingHorizontal: 12, paddingBottom: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={{ width: 34, height: 34, borderRadius: 17, marginRight: 8, borderWidth: 1.5, borderColor: "white" }} />
              ) : (
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#FF0000", alignItems: "center", justifyContent: "center", marginRight: 8, borderWidth: 1.5, borderColor: "white" }}>
                  <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>{username?.charAt(0)?.toUpperCase() || "Y"}</Text>
                </View>
              )}
              <Text style={{ color: "white", fontWeight: "700", fontSize: 13, flex: 1 }}>@{username}</Text>
              <TouchableOpacity style={{ borderWidth: 1.5, borderColor: "white", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>Subscribe</Text>
              </TouchableOpacity>
            </View>
            {/* Caption */}
            {!!text && (
              <Text style={{ color: "white", fontSize: 13, lineHeight: 18, marginBottom: 6 }} numberOfLines={2}>{text}</Text>
            )}
            {/* Audio row */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Ionicons name="musical-notes" size={13} color="white" />
              <Text style={{ color: "white", fontSize: 12 }} numberOfLines={1}>Original audio · @{username}</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={{ backgroundColor: bgColor }}>

        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 5 }}>
            <View style={{ backgroundColor: "#FF0000", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 }}>
              <Ionicons name="play" size={11} color="white" />
            </View>
            <Text style={{ fontWeight: "900", fontSize: 16, color: textColor, letterSpacing: -0.5 }}>YouTube</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
            <Ionicons name="notifications-outline" size={22} color={iconColor} />
            <Ionicons name="search-outline"        size={22} color={iconColor} />
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={{ width: 28, height: 28, borderRadius: 14 }} />
            ) : (
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#FF0000", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>{username?.charAt(0)?.toUpperCase() || "Y"}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ width: "100%", height: 210 }}>
          {isDemo ? (
            <View style={{ width: "100%", height: "100%", backgroundColor: isDark ? "#222" : "#eee", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="play-circle-outline" size={48} color={subColor} />
              <Text style={{ color: subColor, marginTop: 8 }}>Video thumbnail</Text>
            </View>
          ) : isVideoFile ? (
            <Video
              source={{ uri: thumbnail }}
              style={{ width: "100%", height: "100%" }}
              controls={true}
              muted={false}
              onMetadata={handleMeta}
            />
          ) : (
            <>
              <Image source={{ uri: thumbnail }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
                <View style={{ backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 40, padding: 14 }}>
                  <Ionicons name="play" size={30} color="white" />
                </View>
              </View>
              <View style={{ position: "absolute", bottom: 8, right: 8, backgroundColor: "rgba(0,0,0,0.82)", borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 }}>
                <Text style={{ color: "white", fontSize: 11, fontWeight: "700" }}>4:32</Text>
              </View>
            </>
          )}
        </View>

        <View style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 }}>

          {!!text && (
            <Text style={{ fontSize: 15, fontWeight: "700", color: textColor, lineHeight: 21, marginBottom: 5 }} numberOfLines={2}>
              {text}
            </Text>
          )}

          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 5, marginBottom: 10 }}>
            <Text style={{ fontSize: 12, color: subColor }}>1.2M views</Text>
            <Text style={{ fontSize: 12, color: subColor }}>·</Text>
            <Text style={{ fontSize: 12, color: "#3EA6FF" }}>#trending</Text>
            <Text style={{ fontSize: 12, color: "#3EA6FF" }}>#shorts</Text>
            <Text style={{ fontSize: 12, color: subColor }}>·</Text>
            <Text style={{ fontSize: 12, color: subColor }}>{timestamp || "2 days ago"}</Text>
          </View>

          <View style={{ height: 1, backgroundColor: divColor, marginBottom: 10 }} />

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
            ) : (
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#FF0000", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                <Text style={{ color: "white", fontWeight: "700", fontSize: 15 }}>{username?.charAt(0)?.toUpperCase() || "Y"}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: textColor }}>{username}</Text>
              <Text style={{ fontSize: 11, color: subColor }}>248K subscribers</Text>
            </View>
            <TouchableOpacity style={{ backgroundColor: "#FF0000", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 }}>
              <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>Subscribe</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 1, backgroundColor: divColor, marginBottom: 10 }} />

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: chipBg, borderRadius: 20, overflow: "hidden" }}>
              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, gap: 5 }}>
                <Ionicons name="thumbs-up-outline" size={16} color={iconColor} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: textColor }}>48K</Text>
              </TouchableOpacity>
              <View style={{ width: 1, height: 22, backgroundColor: isDark ? "#444" : "#ccc" }} />
              <TouchableOpacity style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
                <Ionicons name="thumbs-down-outline" size={16} color={iconColor} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", backgroundColor: chipBg, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 6 }}>
              <Ionicons name="arrow-redo-outline" size={16} color={iconColor} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: textColor }}>Share</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 1, backgroundColor: divColor, marginBottom: 10 }} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: textColor }}>
              Comments{" "}
              <Text style={{ color: subColor, fontWeight: "400" }}>1,482</Text>
            </Text>
            <Ionicons name="swap-vertical-outline" size={18} color={iconColor} />
          </View>

          {[
            { user: "Alex M.",  avatar: "#3EA6FF", comment: "Absolutely love this! 🔥",           time: "2h" },
            { user: "Sarah K.", avatar: "#FF7043", comment: "Really helpful, thanks for sharing!", time: "5h" },
          ].map((c, i) => (
            <View key={i} style={{ flexDirection: "row", marginBottom: 12, gap: 8 }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.avatar, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>{c.user.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: textColor }}>{c.user}</Text>
                  <Text style={{ fontSize: 11, color: subColor }}>{c.time}</Text>
                </View>
                <Text style={{ fontSize: 12, color: textColor, marginTop: 2 }}>{c.comment}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 5 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="thumbs-up-outline" size={13} color={subColor} />
                    <Text style={{ fontSize: 11, color: subColor }}>142</Text>
                  </View>
                  <Ionicons name="thumbs-down-outline" size={13} color={subColor} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderActions = () => {
    if (platform === "facebook") {
      return (
  <View className="border-t border-gray-200 pt-2 mt-2">
    <View className="flex-row items-center px-3">
      
      <View className="flex-row items-center mr-4">
        <Ionicons name="thumbs-up" size={16} color="#1877F2" />
        <Text className="ml-1 text-xs text-gray-500">12K</Text>
      </View>

      <View className="flex-row items-center mr-4">
        <Ionicons name="chatbubble-outline" size={16} color="#555" />
        <Text className="ml-1 text-xs text-gray-500">250</Text>
      </View>

      <View className="flex-row items-center">
        <Ionicons name="arrow-redo-outline" size={16} color="#555" />
        <Text className="ml-1 text-xs text-gray-500">100</Text>
      </View>

    </View>
  </View>
);
    }

    if (platform === "linkedin") {
      return (
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ flexDirection: "row" }}>
                <Text style={{ fontSize: 14 }}>👍</Text>
                <Text style={{ fontSize: 14, marginLeft: -4 }}>❤️</Text>
                <Text style={{ fontSize: 14, marginLeft: -4 }}>💡</Text>
              </View>
              <Text style={{ fontSize: 12, color: "#666", marginLeft: 4 }}>12,482</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 12, color: "#666" }}>250 comments</Text>
              <Text style={{ fontSize: 12, color: "#666" }}>·</Text>
              <Text style={{ fontSize: 12, color: "#666" }}>100 reposts</Text>
            </View>
          </View>

          <View
            className="flex-row justify-around border-t border-gray-200 pt-2 mt-1"
            style={{ paddingBottom: 4 }}
          >
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
        </View>
      );
    }

    if (platform === "instagram") {
      return (
        <>
          <View className="flex-row justify-between items-center px-3 py-2">
            <View className="flex-row items-center">
              <View className="flex-row items-center">
                <Feather name="heart" size={22} color={isDark ? "white" : "black"} />
                <Text className="ml-1 text-xs font-bold" style={{ color: isDark ? "white" : "black" }}>12k</Text>
              </View>

              <View className="flex-row items-center ml-4">
                <Feather name="message-circle" size={22} color={isDark ? "white" : "black"} />
                <Text className="ml-1 text-xs font-bold" style={{ color: isDark ? "white" : "black" }}>250</Text>
              </View>

              <View className="flex-row items-center ml-4">
                <Feather name="repeat" size={22} color={isDark ? "white" : "black"} />
                <Text className="ml-1 text-xs font-bold" style={{ color: isDark ? "white" : "black" }}>100</Text>
              </View>

              <View className="flex-row items-center ml-4">
                <Feather name="send" size={22} color={isDark ? "white" : "black"} />
                <Text className="ml-1 text-xs font-bold" style={{ color: isDark ? "white" : "black" }}>5k</Text>
              </View>
            </View>

            <TouchableOpacity>
              <Feather name="bookmark" size={22} color={isDark ? "white" : "black"} />
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

  const isInstagramSingleVideo =
    platform === "instagram" &&
    images.length === 1 &&
    /\.(mp4|mov|mkv)$/i.test(images[0]);

  return (
    <View
      className={`my-2 bg-white border border-gray-300 rounded-lg pb-2 ${platform === "sms" ? "" : "overflow-hidden"
        } ${platform === "facebook" ? "p-0" : ""}`}
      style={{ backgroundColor: isDark ? "#161618" : "#fff" }}>
      {isInstagramSingleVideo ? (
        <>
          <View style={{ position: "relative" }}>
            <Video
              source={{ uri: images[0] }}
              style={{ width: "100%", height: SCREEN_WIDTH * 1.4 }}
              poster={coverImage}
              posterResizeMode="cover"
              resizeMode="cover"
              paused={false}
              muted={isMuted}
              controls={false}
              playLimit={2}
              playTrigger={playTrigger}
              onPlayLimitReached={() => setShowWatchAgain(true)}
            />

            {showWatchAgain && (
              <View
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setShowWatchAgain(false);
                    setPlayTrigger((prev) => prev + 1);
                  }}
                  style={{
                    backgroundColor: "rgba(0,0,0,0.7)",
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 30,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "white",
                  }}
                >
                  <Ionicons name="refresh" size={24} color="white" />
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 16, marginLeft: 8 }}>
                    Watch Again
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setIsMuted(!isMuted)}
              style={{
                position: "absolute",
                bottom: 16,
                right: 12,
                backgroundColor: "rgba(0,0,0,0.5)",
                padding: 8,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons 
                name={isMuted ? "volume-mute" : "volume-medium"} 
                size={20} 
                color="white" 
              />
            </TouchableOpacity>

            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                paddingVertical: 12,
                // backgroundColor: "rgba(0,0,0,0.35)",
              }}
            >
              {profilePic ? (
                <Image
                  source={{ uri: profilePic }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: "white",
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#555",
                    borderWidth: 2,
                    borderColor: "white",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="person" size={20} color="white" />
                </View>
              )}

              <Text
                style={{
                  color: "white",
                  fontWeight: "bold",
                  marginLeft: 10,
                  flex: 1,
                  fontSize: 14,
                }}
                numberOfLines={1}
              >
                {username}
              </Text>

              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: "white",
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  marginRight: 10,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600", fontSize: 13 }}>
                  Follow
                </Text>
              </TouchableOpacity>

              <Ionicons name="ellipsis-horizontal" size={22} color="white" />
            </View>
          </View>

          {platformConfig?.showActions && renderActions()}
        </>
      ) : platform === "youtube" ? (
        <>{renderYouTubePreview()}</>
      ) : (
        <>
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

            {platform === "instagram" ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TouchableOpacity
                  style={{
                    borderWidth: 1,
                    borderColor: "#3b82f6",
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ color: "#3b82f6", fontWeight: "600", fontSize: 13 }}>
                    Follow
                  </Text>
                </TouchableOpacity>
                <Ionicons name="ellipsis-vertical" size={20} color={isDark ? "#aaa" : "#555"} />
              </View>
            ) : platformConfig?.showHeaderMenu ? (
              <Ionicons
                name="ellipsis-vertical"
                size={20}
                color="#555"
              />
            ) : null}
          </View>

          {platformConfig?.showTextAboveMedia && !!text && (
            <Text
              className="px-4 pt-2 pb-2 text-gray-900"
              style={{ color: isDark ? "#f2f2f7" : "#111827" }}
            >
              {text}
            </Text>
          )}

          {renderMedia()}

          {platformConfig?.showActions && renderActions()}
        </>
      )}
    </View>
  );
};

export default Preview;
