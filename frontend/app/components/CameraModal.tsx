import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  Animated,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as Constants from "@/constants/Constants";

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (media: any) => void;
  setPickedAssetType: (type: "photo" | "video") => void;
  activeClub?: any;
  activeEvent?: any;
  navigation?: any;
}

export default function CameraModal({
  visible,
  onClose,
  onCapture,
  setPickedAssetType,
  activeClub,
  activeEvent,
  navigation,
}: CameraModalProps) {
  const cameraRef = useRef<any>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [recording, setRecording] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "friends">("friends");
  const [zoom, setZoom] = useState(0);
  const [lastTap, setLastTap] = useState(0);
  const [recordingAnimation] = useState(new Animated.Value(0));

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "black",
          }}
        >
          <Text style={{ color: "white", marginBottom: 20 }}>
            We need your permission to show the camera
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            style={{ backgroundColor: "white", padding: 16, borderRadius: 8 }}
          >
            <Text>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
            <Text style={{ color: "white" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
      });

      // Navigate to story creation screen
      if (navigation) {
        navigation.navigate("StoryCreationScreen", {
          mediaUri: photo.uri,
          mediaType: "photo",
        });
        onClose(); // Close the camera modal
      } else {
        // Fallback to old behavior
        setPickedAssetType("photo");
        onCapture(photo);
      }
    }
  };

  const startRecording = async () => {
    if (cameraRef.current && !recording) {
      setRecording(true);

      // Animate to red background
      Animated.timing(recordingAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();

      const video = await cameraRef.current.recordAsync();
      setRecording(false);

      // Navigate to story creation screen
      if (navigation) {
        navigation.navigate("StoryCreationScreen", {
          mediaUri: video.uri,
          mediaType: "video",
        });
        onClose(); // Close the camera modal
      } else {
        // Fallback to old behavior
        setPickedAssetType("video");
        onCapture(video);
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && recording) {
      await cameraRef.current.stopRecording();
      setRecording(false);

      // Animate back to white background
      Animated.timing(recordingAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleZoom = (event: any) => {
    // Simple zoom implementation
    const { scale } = event.nativeEvent;
    if (scale > 1) {
      // Zoom in
      setZoom(Math.min(1, zoom + 0.1));
    } else if (scale < 1) {
      // Zoom out
      setZoom(Math.max(0, zoom - 0.1));
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (now - lastTap < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      setFacing(facing === "back" ? "front" : "back");
    }

    setLastTap(now);
  };

  const handleLibrarySelection = async () => {
    // Request media library permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Media library permission is required!",
        "Please enable permissions in your device settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      const asset = result.assets[0];
      const mediaType = asset.type === "video" ? "video" : "photo";

      // Navigate to story creation screen
      if (navigation) {
        navigation.navigate("StoryCreationScreen", {
          mediaUri: asset.uri,
          mediaType: mediaType,
        });
        onClose(); // Close the camera modal
      } else {
        // Fallback to old behavior
        setPickedAssetType(mediaType);
        onCapture(asset);
      }
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          ref={cameraRef}
          facing={facing}
          mode="video"
          zoom={zoom}
          onTouchStart={handleZoom}
          onTouchMove={handleZoom}
        />

        {/* Double tap overlay for camera flip - only on camera area, not bottom */}
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 120, // Leave space for record button
            zIndex: 5,
          }}
          onPress={handleDoubleTap}
        />

        {/* Top Controls - Instagram Style */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 50,
            paddingHorizontal: 20,
            zIndex: 10,
          }}
        >
          {/* Left Controls */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFacing(facing === "back" ? "front" : "back")}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Right Controls */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {/* Club Button */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                gap: 4,
              }}
            >
              <Ionicons name="location" size={16} color="white" />
              <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
                {activeClub?.Name || "No Club"}
              </Text>
            </TouchableOpacity>

            {/* Visibility Toggle */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor:
                  visibility === "public"
                    ? Constants.purpleCOLOR
                    : "rgba(0, 0, 0, 0.5)",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                gap: 4,
              }}
              onPress={() =>
                setVisibility(visibility === "public" ? "friends" : "public")
              }
            >
              <Ionicons
                name={visibility === "public" ? "globe" : "people"}
                size={16}
                color="white"
              />
              <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
                {visibility === "public" ? "Public" : "Friends"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Zoom Indicator */}
        {zoom > 0 && (
          <View
            style={{
              position: "absolute",
              top: 100,
              left: 20,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
              {Math.round(zoom * 100)}%
            </Text>
          </View>
        )}

        {/* Bottom Controls */}
        <View
          style={{
            position: "absolute",
            bottom: 40,
            left: 0,
            right: 0,
            alignItems: "center",
            zIndex: 10, // Higher z-index to ensure it's above double-tap overlay
          }}
        >
          {/* Library Button - Bottom Left */}
          <TouchableOpacity
            onPress={handleLibrarySelection}
            style={{
              position: "absolute",
              left: 20,
              bottom: 0,
              width: 50,
              height: 50,
              borderRadius: 8,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="images" size={24} color="white" />
          </TouchableOpacity>
          <Animated.View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: recordingAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ["white", "red"],
              }),
              borderWidth: 4,
              borderColor: recordingAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ["white", "red"],
              }),
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Pressable
              onPress={takePicture}
              onLongPress={startRecording}
              onPressOut={stopRecording}
              style={{
                width: "100%",
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Animated.View
                style={{
                  width: recordingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [60, 30],
                  }),
                  height: recordingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [60, 30],
                  }),
                  backgroundColor: "white",
                  borderRadius: recordingAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 4],
                  }),
                }}
              />
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
