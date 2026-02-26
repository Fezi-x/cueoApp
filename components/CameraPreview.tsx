import { Ionicons } from '@expo/vector-icons';
import type { CameraPermissionResponse } from 'expo-camera';
import { CameraView, CameraType } from 'expo-camera';
import type { RefObject } from 'react';
import { Pressable, Text, View } from 'react-native';

type CameraPreviewProps = {
  cameraType: CameraType;
  setCameraType: (value: CameraType | ((prev: CameraType) => CameraType)) => void;
  requestCameraPermission: () => Promise<CameraPermissionResponse>;
  cameraRef: RefObject<CameraView | null>;
  isLoading: boolean;
  isDenied: boolean;
  isGranted: boolean;
};

export default function CameraPreview({
  cameraType,
  setCameraType,
  requestCameraPermission,
  cameraRef,
  isLoading,
  isDenied,
  isGranted,
}: CameraPreviewProps) {
  return (
    <View className="bg-[#242424] rounded-[32px] h-[400px] mt-6" pointerEvents="box-none">
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
        <View className="flex-1" pointerEvents="box-none">
          <CameraView
            ref={cameraRef}
            className="h-full w-full rounded-[32px]"
            style={{ flex: 1, backgroundColor: 'transparent' }}
            facing={cameraType}
            mode="video"
            onCameraReady={() => {
              console.log('Camera ready');
            }}
            onMountError={(event) => {
              console.log('Camera mount error:', event?.message);
            }}
          />
          <View className="absolute inset-0" pointerEvents="none" />
          <Pressable
            onPress={() =>
              setCameraType((prev) => (prev === 'back' ? 'front' : 'back'))
            }
            className="absolute bottom-3 right-3 h-10 w-10 items-center justify-center rounded-full bg-black/55"
            style={{ mixBlendMode: 'difference' }}
          >
            <Ionicons name="camera-reverse-outline" size={20} color="white" />
          </Pressable>
        </View>
      )}
    </View>
  );
}
