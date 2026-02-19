import { StatusBar } from 'expo-status-bar';
import {
  CameraView,
  CameraType,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCROLL_SPEED_PX_PER_SEC = 18;

export default function App() {
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [script, setScript] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const cameraRef = useRef<CameraView | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollOffset = useRef(0);
  const lastFrame = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);
  const recordSound = useRef<Audio.Sound | null>(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    if (cameraPermission == null) {
      requestCameraPermission();
    }
  }, [cameraPermission, requestCameraPermission]);

  // Preload sound on mount + cleanup on unmount
  useEffect(() => {
    const loadSound = async () => {
      try {
        const sound = new Audio.Sound();
        await sound.loadAsync(require('./assets/record.wav'));
        recordSound.current = sound;
      } catch {
        // Ignore sound load failures
      }
    };
    loadSound();

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
      await recordSound.current?.replayAsync();
    } catch {
      // Ignore sound failures to avoid blocking recording.
    }
  };

  const resetScroll = () => {
    scrollOffset.current = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const startAutoScroll = (currentMaxOffset: number) => {
    if (currentMaxOffset <= 0) return;

    lastFrame.current = null;

    const tick = (timestamp: number) => {
      if (!isRecordingRef.current) {
        rafId.current = null;
        return;
      }
      if (lastFrame.current == null) {
        lastFrame.current = timestamp;
      }
      const deltaMs = timestamp - lastFrame.current;
      lastFrame.current = timestamp;
      const nextOffset = Math.min(
        scrollOffset.current + (SCROLL_SPEED_PX_PER_SEC * deltaMs) / 1000,
        currentMaxOffset
      );
      scrollOffset.current = nextOffset;
      scrollRef.current?.scrollTo({ y: nextOffset, animated: false });
      if (nextOffset < currentMaxOffset) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        rafId.current = null;
      }
    };

    rafId.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (isRecording) {
      resetScroll();
      startAutoScroll(maxOffset);
    } else {
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      resetScroll();
    }
  }, [isRecording, maxOffset]);

  const startRecording = async () => {
    console.log('1. startRecording called');
    if (!cameraRef.current) {
      console.log('BAIL: no cameraRef');
      return;
    }
    if (isRecordingRef.current) {
      console.log('BAIL: already recording');
      return;
    }

    console.log('2. checking camera permission:', cameraPermission?.granted);
    const ensuredCamera = cameraPermission?.granted
      ? { granted: true }
      : await requestCameraPermission();
    if (!ensuredCamera.granted) {
      console.log('BAIL: camera permission denied');
      return;
    }

    console.log('3. checking mic permission:', micPermission?.granted);
    const ensuredMic = micPermission?.granted
      ? { granted: true }
      : await requestMicPermission();
    if (!ensuredMic.granted) {
      console.log('BAIL: mic permission denied');
      return;
    }

    console.log('4. checking media library permission');
    const mediaPermission = await MediaLibrary.requestPermissionsAsync();
    console.log('4a. media permission result:', JSON.stringify(mediaPermission));
    if (!mediaPermission.granted) {
      console.log(
        'Media library permission denied. Recording will continue, but save will be skipped.'
      );
    }

    console.log('5. all permissions granted, starting recording');
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('6. haptics done, playing sound');
      await playRecordSound();
      console.log('7. sound done, calling recordAsync');
      let recordingPromise: Promise<{ uri: string } | undefined>;
      try {
        recordingPromise = cameraRef.current.recordAsync();
      } catch (e) {
        console.log('ERROR: recordAsync failed to start:', e);
        return;
      }
      isRecordingRef.current = true;
      setIsRecording(true);
      console.log('7a. recordAsync started');
      const recording = await recordingPromise;
      console.log('8. recordAsync returned:', recording?.uri);
      if (recording?.uri && mediaPermission.granted) {
        await MediaLibrary.createAssetAsync(recording.uri);
        console.log('9. saved to media library');
      } else if (recording?.uri && !mediaPermission.granted) {
        console.log('9. save skipped (no media permission).');
      }
    } catch (e) {
      console.log('ERROR in recording:', e);
    } finally {
      isRecordingRef.current = false;
      setIsRecording(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const stopRecording = () => {
    if (!cameraRef.current || !isRecordingRef.current) return;
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
            <CameraView
              ref={cameraRef}
              className="h-full w-full"
              facing={cameraType}
              mode="video"
              onMountError={(event) => {
                console.log('Camera mount error:', event?.message);
              }}
            />
            <Pressable
              onPress={() =>
                setCameraType((prev) => (prev === 'back' ? 'front' : 'back'))
              }
              className="absolute right-3 top-3 h-10 w-10 items-center justify-center rounded-full"
            >
              <Ionicons name="camera-reverse" size={30} color="white" />
            </Pressable>
          </View>
        )}
      </View>

      <Pressable
        onPress={() => setIsEditing(true)}
        className={script.length === 0 ? 'bg-[#242424] rounded-[20px] px-6 py-5 mt-6' : 'mt-6'}
      >
        {script.length === 0 ? (
          <Text className="text-yellow-500/30 text-xl text-center">Tap to add your script</Text>
        ) : (
          <View className="h-[120px]">
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
          className="h-20 w-20 items-center justify-center rounded-full border border-white"
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
              className="px-3 py-1 rounded-full border border-yellow-500"
            >
              <Text className="text-yellow-500 text-sm">Done</Text>
            </Pressable>
          </View>
          <View className="flex-1 px-5 pb-10">
            <TextInput
              value={script}
              onChangeText={setScript}
              multiline
              placeholder="Paste your script..."
              placeholderTextColor="#7A7A7A"
              className="flex-1 text-white text-xl leading-[34px]"
              textAlignVertical="top"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
