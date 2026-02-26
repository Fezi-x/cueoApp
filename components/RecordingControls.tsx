import { Pressable, Text, View } from 'react-native';

type RecordStatus = 'idle' | 'pending' | 'recording' | 'error';

type RecordingControlsProps = {
  isRecording: boolean;
  recordStatus: RecordStatus;
  recordError: string;
  saveNotice: string;
  recordElapsedMs: number;
  onRecordPressIn: () => void;
  onRecordPress: () => void;
  onStopPress: () => void;
  formatElapsed: (ms: number) => string;
};

export default function RecordingControls({
  isRecording,
  recordStatus,
  recordError,
  saveNotice,
  recordElapsedMs,
  onRecordPressIn,
  onRecordPress,
  onStopPress,
  formatElapsed,
}: RecordingControlsProps) {
  return (
    <View className="flex-1 items-center justify-end pb-12">
      {isRecording && (
        <View className="mb-4 flex-row items-center" pointerEvents="none">
          <View className="mr-2 h-2.5 w-2.5 rounded-full bg-red-500" />
          <Text className="text-red-500 text-xl tracking-widest">
            {formatElapsed(recordElapsedMs)}
          </Text>
        </View>
      )}
      <Pressable
        onPressIn={onRecordPressIn}
        onPress={isRecording ? onStopPress : onRecordPress}
        hitSlop={12}
        className="h-20 w-20 items-center justify-center rounded-full border-2 border-white/90 bg-white/10"
      >
        <View
          className={
            isRecording
              ? 'h-10 w-10 bg-red-600 rounded-[10px]'
              : 'h-14 w-14 rounded-full bg-red-600'
          }
        />
      </Pressable>
      {recordStatus === 'pending' && (
        <Text className="mt-3 text-white/70 text-sm">Starting...</Text>
      )}
      {recordError.length > 0 && (
        <Text className="mt-3 text-red-400 text-sm text-center px-6">
          {recordError}
        </Text>
      )}
      {saveNotice.length > 0 && recordError.length === 0 && (
        <Text className="mt-2 text-yellow-400/70 text-xs text-center px-6">
          {saveNotice}
        </Text>
      )}
    </View>
  );
}
