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
import { View } from 'react-native';
import type { ScrollView } from 'react-native';
import CameraPreview from './components/CameraPreview';
import RecordingControls from './components/RecordingControls';
import ScriptEditor from './components/ScriptEditor';

const SCROLL_SPEED_PX_PER_SEC = 18;

export default function App() {
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [script, setScript] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordStatus, setRecordStatus] = useState<'idle' | 'pending' | 'recording' | 'error'>(
    'idle'
  );
  const [recordError, setRecordError] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const [recordElapsedMs, setRecordElapsedMs] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const cameraRef = useRef<CameraView | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollOffset = useRef(0);
  const lastFrame = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);
  const recordSound = useRef<Audio.Sound | null>(null);
  const isRecordingRef = useRef(false);
  const recordStartRef = useRef<number | null>(null);
  const recordTimerId = useRef<NodeJS.Timeout | null>(null);

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

  const requestMediaPermissionWithTimeout = async (timeoutMs: number) => {
    try {
      const result = await Promise.race([
        MediaLibrary.requestPermissionsAsync(),
        new Promise<MediaLibrary.PermissionResponse>((resolve) =>
          setTimeout(
            () =>
              resolve({
                granted: false,
                canAskAgain: true,
                status: 'denied',
                expires: 'never',
              }),
            timeoutMs
          )
        ),
      ]);
      return result;
    } catch {
      return {
        granted: false,
        canAskAgain: true,
        status: 'denied',
        expires: 'never',
      } as MediaLibrary.PermissionResponse;
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

  useEffect(() => {
    if (isRecording) {
      recordStartRef.current = Date.now();
      setRecordElapsedMs(0);
      if (recordTimerId.current) {
        clearInterval(recordTimerId.current);
      }
      recordTimerId.current = setInterval(() => {
        if (recordStartRef.current) {
          setRecordElapsedMs(Date.now() - recordStartRef.current);
        }
      }, 250);
    } else {
      if (recordTimerId.current) {
        clearInterval(recordTimerId.current);
        recordTimerId.current = null;
      }
      recordStartRef.current = null;
      setRecordElapsedMs(0);
    }
  }, [isRecording]);

  const formatElapsed = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const mm = minutes.toString().padStart(2, '0');
    const ss = seconds.toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

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

    setRecordError('');
    setSaveNotice('');
    console.log('2. checking camera permission:', cameraPermission?.granted);
    const ensuredCamera = cameraPermission?.granted
      ? { granted: true }
      : await requestCameraPermission();
    if (!ensuredCamera.granted) {
      console.log('BAIL: camera permission denied');
      setRecordStatus('error');
      setRecordError('Camera permission is required to record.');
      return;
    }

    console.log('3. checking mic permission:', micPermission?.granted);
    const ensuredMic = micPermission?.granted
      ? { granted: true }
      : await requestMicPermission();
    if (!ensuredMic.granted) {
      console.log('BAIL: mic permission denied');
      setRecordStatus('error');
      setRecordError('Microphone permission is required to record.');
      return;
    }

    console.log('4. checking media library permission');
    const mediaPermission = await requestMediaPermissionWithTimeout(2500);
    console.log('4a. media permission result:', JSON.stringify(mediaPermission));
    if (!mediaPermission.granted) {
      console.log(
        'Media library permission denied or timed out. Recording will continue, but save will be skipped.'
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
      setRecordStatus('recording');
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
      setRecordStatus('error');
      setRecordError('Recording failed to start. Check permissions and try again.');
    } finally {
      isRecordingRef.current = false;
      setIsRecording(false);
      setRecordStatus((prev) => (prev === 'error' ? 'error' : 'idle'));
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

      <CameraPreview
        cameraType={cameraType}
        setCameraType={setCameraType}
        requestCameraPermission={requestCameraPermission}
        cameraRef={cameraRef}
        isLoading={isLoading}
        isDenied={isDenied}
        isGranted={isGranted}
      />

      <ScriptEditor
        script={script}
        setScript={setScript}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        isRecording={isRecording}
        scrollRef={scrollRef}
        setContentHeight={setContentHeight}
        setViewportHeight={setViewportHeight}
      />

      <RecordingControls
        isRecording={isRecording}
        recordStatus={recordStatus}
        recordError={recordError}
        saveNotice={saveNotice}
        recordElapsedMs={recordElapsedMs}
        onRecordPressIn={() => {
          console.log('record pressed');
          setRecordStatus('pending');
          setRecordError('');
        }}
        onRecordPress={startRecording}
        onStopPress={stopRecording}
        formatElapsed={formatElapsed}
      />
    </View>
  );
}
