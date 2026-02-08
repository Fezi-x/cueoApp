import { StatusBar } from 'expo-status-bar';
import {
  Camera,
  CameraType,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

const SCROLL_SPEED_PX_PER_SEC = 18;

export default function App() {
  const [cameraType, setCameraType] = useState<CameraType>(CameraType.back);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [script, setScript] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const cameraRef = useRef<Camera | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollOffset = useRef(0);
  const lastFrame = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);
  const recordSound = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    if (cameraPermission == null) {
      requestCameraPermission();
    }
  }, [cameraPermission, requestCameraPermission]);

  useEffect(() => {
    return () => {
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
      }
      if (recordSound.current) {
        recordSound.current.unloadAsync();
      }
    };
  }, []);

  const isLoading = cameraPermission == null;
  const isDenied = cameraPermission != null && !cameraPermission.granted;
  const isGranted = cameraPermission?.granted === true;
  const maxOffset = Math.max(contentHeight - viewportHeight, 0);

  const playRecordSound = async () => {
    try {
      if (!recordSound.current) {
        const sound = new Audio.Sound();
        await sound.loadAsync(require('./assets/record.wav'));
        recordSound.current = sound;
      }
      await recordSound.current.replayAsync();
    } catch {
      // Ignore sound failures to avoid blocking recording.
    }
  };

  const resetScroll = () => {
    scrollOffset.current = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const startAutoScroll = () => {
    if (maxOffset <= 0) {
      return;
    }
    lastFrame.current = null;
    const tick = (timestamp: number) => {
      if (!isRecording) {
        return;
      }
      if (lastFrame.current == null) {
        lastFrame.current = timestamp;
      }
      const deltaMs = timestamp - lastFrame.current;
      lastFrame.current = timestamp;
      const nextOffset = Math.min(
        scrollOffset.current + (SCROLL_SPEED_PX_PER_SEC * deltaMs) / 1000,
        maxOffset
      );
      scrollOffset.current = nextOffset;
      scrollRef.current?.scrollTo({ y: nextOffset, animated: false });
      if (nextOffset < maxOffset) {
        rafId.current = requestAnimationFrame(tick);
      }
    };
    rafId.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (isRecording) {
      resetScroll();
      startAutoScroll();
    } else {
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      resetScroll();
    }
  }, [isRecording, maxOffset]);

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) {
      return;
    }

    const ensuredCamera = cameraPermission?.granted
      ? { granted: true }
      : await requestCameraPermission();
    if (!ensuredCamera.granted) {
      return;
    }

    const ensuredMic = micPermission?.granted
      ? { granted: true }
      : await requestMicPermission();
    if (!ensuredMic.granted) {
      return;
    }

    const mediaPermission = await MediaLibrary.requestPermissionsAsync();
    if (!mediaPermission.granted) {
      return;
    }

    setIsRecording(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await playRecordSound();
    try {
      const recording = await cameraRef.current.recordAsync();
      if (recording?.uri) {
        await MediaLibrary.createAssetAsync(recording.uri);
      }
    } finally {
      setIsRecording(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const stopRecording = () => {
    if (!cameraRef.current || !isRecording) {
      return;
    }
    cameraRef.current.stopRecording();
  };

  return (
    <View className="flex-1 bg-black px-5 pt-10">
      <StatusBar style="light" />

      <View className="bg-[#242424] rounded-[32px] h-[400px] mt-6 overflow-hidden">
        {isLoading && (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-white text-base text-center">
              Checking camera permission...
            </Text>
          </View>
        )}

        {isDenied && (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-white text-base text-center">
              Camera access is required to preview your shot.
            </Text>
            <Pressable
              onPress={() => requestCameraPermission()}
              className="mt-4 rounded-full border border-white/40 px-5 py-2"
            >
              <Text className="text-white text-sm">Grant Permission</Text>
            </Pressable>
          </View>
        )}

        {isGranted && (
          <View className="flex-1">
            <Camera
              ref={cameraRef}
              className="h-full w-full"
              type={cameraType}
            />
            <Pressable
              onPress={() =>
                setCameraType((prev) =>
                  prev === CameraType.back ? CameraType.front : CameraType.back
                )
              }
              className="absolute right-3 top-3 h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-black/40"
            >
              <Text className="text-white text-lg">R</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Pressable
        onPress={() => setIsEditing(true)}
        className={script.length === 0 ? 'bg-[#242424] rounded-[20px] px-6 py-5 mt-6' : 'mt-6'}
      >
        {script.length === 0 ? (
          <Text className="text-white text-xl text-center">Tap to add your script</Text>
        ) : (
          <View className="h-[200px]">
            <ScrollView
              ref={(ref) => {
                scrollRef.current = ref;
              }}
              className="flex-1"
              contentContainerStyle={{
                justifyContent: isRecording ? 'flex-start' : 'center',
              }}
              showsVerticalScrollIndicator={false}
              bounces={false}
              scrollEnabled={false}
              onContentSizeChange={(_, height) => setContentHeight(height)}
              onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
            >
              <Text className="text-white text-2xl leading-[34px] font-bold text-center">
                {script}
              </Text>
            </ScrollView>
          </View>
        )}
      </Pressable>

      <View className="flex-1 items-center justify-end pb-12">
        <Pressable
          onPress={isRecording ? stopRecording : startRecording}
          className="h-20 w-20 items-center justify-center rounded-full border-2 border-white"
        >
          <View
            className={
              isRecording
                ? 'h-10 w-10 bg-red-600'
                : 'h-14 w-14 rounded-full bg-red-600'
            }
          />
        </Pressable>
      </View>

      <Modal visible={isEditing} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-5 pt-8 pb-3">
            <Text className="text-white text-lg">Edit Script</Text>
            <Pressable
              onPress={() => setIsEditing(false)}
              className="px-3 py-1 rounded-full border border-white/30"
            >
              <Text className="text-white text-sm">Done</Text>
            </Pressable>
          </View>
          <View className="flex-1 px-5 pb-10">
            <TextInput
              value={script}
              onChangeText={setScript}
              multiline
              placeholder="Paste your script..."
              placeholderTextColor="#7A7A7A"
              className="flex-1 text-white text-2xl leading-[34px]"
              textAlignVertical="top"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
