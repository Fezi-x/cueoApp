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
import { View, Linking, Platform } from 'react-native';
import type { ScrollView } from 'react-native';
import CameraPreview from './components/CameraPreview';
import RecordingControls from './components/RecordingControls';
import ScriptEditor from './components/ScriptEditor';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { SafeAreaProvider } from 'react-native-safe-area-context';


export default function App() {
  const [scrollSpeed, setScrollSpeed] = useState(20);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [script, setScript] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordStatus, setRecordStatus] = useState<
    'idle' | 'pending' | 'recording' | 'saving' | 'error'
  >('idle');
  const [recordError, setRecordError] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const [recordElapsedMs, setRecordElapsedMs] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [lastThumbnailUri, setLastThumbnailUri] = useState<string | null>(null);
  const [lastVideoUri, setLastVideoUri] = useState<string | null>(null);

  const cameraRef = useRef<CameraView | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollOffset = useRef(0);
  const lastFrame = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);
  const recordSound = useRef<Audio.Sound | null>(null);
  const isRecordingRef = useRef(false);
  const recordStartRef = useRef<number | null>(null);
  const recordTimerId = useRef<NodeJS.Timeout | null>(null);

  // Refresh latest video thumbnail
  const refreshLatestVideo = async () => {
    // Permission guard: don't even try if not granted or limited
    if (
      mediaPermission?.status !== 'granted' &&
      mediaPermission?.accessPrivileges !== 'all' &&
      mediaPermission?.accessPrivileges !== 'limited'
    ) {
      return;
    }

    try {
      const albums = await MediaLibrary.getAlbumsAsync();
      console.log('FOUND ALBUMS:', albums.map(a => a.title).join(', '));
      const cueoAlbum = albums.find((a) => a.title === 'CUEO');

      if (!cueoAlbum) {
        console.log('ALBUM CUEO NOT FOUND');
        setLastVideoUri(null);
        setLastThumbnailUri(null);
        return;
      }

      const { assets } = await MediaLibrary.getAssetsAsync({
        album: cueoAlbum.id,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        first: 1,
        mediaType: [MediaLibrary.MediaType.video],
      });

      console.log(`ASSETS IN CUEO: ${assets.length}`);

      if (assets.length > 0) {
        const videoAsset = assets[0];
        console.log('LATEST VIDEO:', videoAsset.uri);
        setLastVideoUri(videoAsset.uri);
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoAsset.uri, {
            time: 0,
          });
          console.log('THUMBNAIL GEN:', uri);
          setLastThumbnailUri(uri);
        } catch (e) {
          console.log('Thumbnail generation failed:', e);
        }
      } else {
        setLastVideoUri(null);
        setLastThumbnailUri(null);
      }
    } catch (e) {
      console.log('Error refreshing latest video:', e);
    }
    console.log('REFRESH DONE: lastVideoUri=', lastVideoUri);
  };

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

  // Refresh gallery when permission status is resolved or changes
  useEffect(() => {
    if (mediaPermission?.status === 'granted' || mediaPermission?.accessPrivileges === 'all' || mediaPermission?.accessPrivileges === 'limited') {
      refreshLatestVideo();
    }
  }, [mediaPermission?.status, mediaPermission?.accessPrivileges]);

  const isLoading = cameraPermission == null;
  const isGranted = cameraPermission?.granted === true;
  const isDenied = cameraPermission?.status === 'denied';
  const isPrompt = cameraPermission?.status === 'undetermined';
  const canAskCamera = cameraPermission?.canAskAgain ?? false;
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
        scrollOffset.current + (scrollSpeed * deltaMs) / 1000,
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
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
      }
      startAutoScroll(maxOffset);
    } else {
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      resetScroll();
    }
  }, [isRecording, maxOffset, scrollSpeed]);

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
      if (!recording?.uri) {
        console.log('9. No recording URI found');
        return;
      }

      console.log('8. recordAsync finished:', recording.uri);

      try {
        setRecordStatus('saving');
        const asset = await MediaLibrary.createAssetAsync(recording.uri);
        await MediaLibrary.createAlbumAsync('CUEO', asset, false);

        console.log('10. Saved successfully');
        setSaveNotice('Saved to Photos');
        setRecordStatus('idle');

        // Refresh thumbnail after save
        refreshLatestVideo();
      } catch (e: any) {
        console.log('SAVE ERROR:', e.message);
        setRecordStatus('error');

        if (e.message.includes('permission') || e.message.includes('Permission')) {
          setRecordError('Save failed: Missing Photos permission.');
        } else {
          setRecordError('Save failed: Could not write to gallery.');
        }
      }
    } catch (e) {
      console.log('CRITICAL ERROR in recording flow:', e);
      setRecordStatus('error');
      setRecordError('Recording failed. Please try again.');
    } finally {
      isRecordingRef.current = false;
      setIsRecording(false);
      setRecordStatus((prev) => (prev === 'saving' ? 'idle' : prev));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const stopRecording = () => {
    if (!cameraRef.current || !isRecordingRef.current) return;
    cameraRef.current.stopRecording();
  };

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-black pt-8">
        <StatusBar style="light" />

        <CameraPreview
          cameraType={cameraType}
          setCameraType={setCameraType}
          requestCameraPermission={requestCameraPermission}
          cameraRef={cameraRef}
          isLoading={isLoading}
          isDenied={isDenied}
          isGranted={isGranted}
          isRecording={isRecording}
          canAskAgain={canAskCamera}
          isPrompt={isPrompt}
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
          canSaveMedia={
            mediaPermission?.granted === true ||
            mediaPermission?.accessPrivileges === 'all' ||
            mediaPermission?.accessPrivileges === 'limited'
          }
          onRequestMediaPermission={requestMediaPermission}
          onRecordPressIn={() => {
            console.log('record pressed');
            setRecordStatus('pending');
            setRecordError('');
          }}
          onRecordPress={startRecording}
          onStopPress={stopRecording}
          onOpenSaved={async () => {
            console.log('GALLERY CLICK: Opening system gallery');
            if (Platform.OS === 'ios') {
              Linking.openURL('photos-redirect://');
            } else {
              // Android uses a content URI to trigger the media gallery
              Linking.openURL('content://media/internal/images/media');
            }
          }}
          formatElapsed={formatElapsed}
          lastThumbnailUri={lastThumbnailUri}
          scrollSpeed={scrollSpeed}
          setScrollSpeed={setScrollSpeed}
        />
      </View>
    </SafeAreaProvider>
  );
}
