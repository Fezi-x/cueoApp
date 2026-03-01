import { Ionicons } from '@expo/vector-icons';
import type { PermissionResponse } from 'expo-camera';
import { CameraView, CameraType } from 'expo-camera';
import type { RefObject } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

type CameraPreviewProps = {
  cameraType: CameraType;
  setCameraType: (value: CameraType | ((prev: CameraType) => CameraType)) => void;
  requestCameraPermission: () => Promise<PermissionResponse>;
  cameraRef: RefObject<CameraView | null>;
  isLoading: boolean;
  isDenied: boolean;
  isGranted: boolean;
  isRecording: boolean;
  canAskAgain: boolean;
  isPrompt: boolean;
};

export default function CameraPreview({
  cameraType,
  setCameraType,
  requestCameraPermission,
  cameraRef,
  isLoading,
  isDenied,
  isGranted,
  isRecording,
  canAskAgain,
  isPrompt,
}: CameraPreviewProps) {
  return (
    <View
      className="mx-4 mt-6 h-[45%] rounded-[40px] bg-[#1A1A1A] shadow-sm overflow-hidden"
      pointerEvents="box-none"
    >
      {isLoading && (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-cueoLime text-[24px] font-bold leading-tight text-center">
            You don’t need more content.
          </Text>
          <Text className="text-white/50 text-[14px] mt-2 text-center">
            Camera access is required to preview your shot.
          </Text>
          <Pressable
            onPress={() => requestCameraPermission()}
            className="mt-6 rounded-full bg-cueoLime px-8 py-3 active:scale-95"
          >
            <Text className="text-black text-[15px] font-bold tracking-wide">Enable Camera</Text>
          </Pressable>
        </View>
      )}

      {(isDenied || isPrompt) && (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-cueoLime text-[24px] font-bold leading-tight text-center">
            You don’t need more content.
          </Text>
          <Text className="text-white/50 text-[14px] mt-2 text-center">
            Camera access is required to preview your shot.
          </Text>
          <Pressable
            onPress={async () => {
              if (canAskAgain) {
                const result = await requestCameraPermission();
                if (!result.granted && result.canAskAgain === false) {
                  Linking.openSettings();
                }
              } else {
                Linking.openSettings();
              }
            }}
            className="mt-6 rounded-full bg-cueoLime px-8 py-3 active:scale-95"
          >
            <Text className="text-black text-[15px] font-bold tracking-wide">
              {canAskAgain ? 'Enable Camera' : 'Open Settings'}
            </Text>
          </Pressable>
        </View>
      )}

      {isGranted && (
        <View className="flex-1" pointerEvents="box-none">
          <CameraView
            ref={cameraRef}
            className="h-full w-full bg-transparent"
            facing={cameraType}
            mode="video"
            mirror={cameraType === 'front'}
            onCameraReady={() => {
              console.log('Camera ready');
            }}
            onMountError={(event) => {
              console.log('Camera mount error:', event?.message);
            }}
          />
          {!isRecording && (
            <Pressable
              onPress={() =>
                setCameraType((prev) => (prev === 'back' ? 'front' : 'back'))
              }
              className="absolute bottom-3 right-3 h-10 w-10 items-center justify-center rounded-full bg-black/50 active:scale-95"
            >
              <Ionicons name="camera-reverse-outline" size={24} color="white" />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
