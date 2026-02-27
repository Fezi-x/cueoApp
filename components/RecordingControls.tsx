import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

type RecordStatus = 'idle' | 'pending' | 'recording' | 'saving' | 'error';

type RecordingControlsProps = {
  isRecording: boolean;
  recordStatus: RecordStatus;
  recordError: string;
  saveNotice: string;
  recordElapsedMs: number;
  canSaveMedia: boolean;
  onRequestMediaPermission: () => Promise<unknown>;
  onRecordPressIn: () => void;
  onRecordPress: () => void;
  onStopPress: () => void;
  onOpenSaved?: () => void;
  formatElapsed: (ms: number) => string;
};

export default function RecordingControls({
  isRecording,
  recordStatus,
  recordError,
  saveNotice,
  recordElapsedMs,
  canSaveMedia,
  onRequestMediaPermission,
  onRecordPressIn,
  onRecordPress,
  onStopPress,
  onOpenSaved,
  formatElapsed,
}: RecordingControlsProps) {
  const isSaving = recordStatus === 'saving';
  const isBusy = recordStatus === 'pending' || isSaving;
  const statusText =
    recordError.length > 0
      ? recordError
      : !canSaveMedia && recordStatus === 'idle'
        ? 'Enable Photos to save videos.'
        : isSaving
          ? 'Saving...'
          : recordStatus === 'pending'
            ? 'Starting...'
            : saveNotice;
  const statusTone =
    recordError.length > 0
      ? 'text-red-400'
      : saveNotice.length > 0
        ? 'text-white/50'
        : 'text-white/70';
  return (
    <View className="absolute bottom-12 w-full items-center px-2">
      <View className="mb-3 h-5 flex-row items-center justify-center" pointerEvents="none">
        {isRecording && (
          <>
            <View className="mr-2 h-2.5 w-2.5 rounded-full bg-red-500" />
            <Text className="text-red-500 text-[17px] tracking-widest font-semibold">
              {formatElapsed(recordElapsedMs)}
            </Text>
          </>
        )}
      </View>
      <View className="w-full items-center justify-center">
        <Pressable
          onPress={() => { }}
          hitSlop={10}
          className={[
            'absolute left-6 h-10 w-10 items-center justify-center rounded-lg',
            isBusy ? 'opacity-50' : 'active:scale-95',
          ].join(' ')}
          disabled={isBusy}
        >
          <Ionicons name="speedometer-outline" size={25} color="white" />
        </Pressable>
        <Pressable
          onPress={canSaveMedia ? onOpenSaved : onRequestMediaPermission}
          hitSlop={10}
          className={[
            'absolute right-6 h-10 w-10 items-center justify-center rounded-lg border border-white/50',
            isBusy ? 'opacity-50' : 'active:scale-95',
          ].join(' ')}
          disabled={isBusy}
        >
          <Ionicons name="images-outline" size={20} color="white" />
        </Pressable>
        <Pressable
          onPressIn={onRecordPressIn}
          onPress={isRecording ? onStopPress : onRecordPress}
          hitSlop={12}
          className={[
            'h-16 w-16 items-center justify-center rounded-full border-4 shadow-sm active:scale-95',
            isRecording ? 'bg-red-500' : 'bg-white',
            isBusy ? 'opacity-60' : '',
          ].join(' ')}
          disabled={isBusy}
        >
          <Ionicons
            name={isRecording ? 'stop-circle-outline' : 'radio-button-on-outline'}
            size={32}
            color={isRecording ? 'white' : '#EF4444'}
          />
        </Pressable>
      </View>
      <View className="mt-3 min-h-[18px] px-6">
        {statusText.length > 0 && (
          <Text className={`${statusTone} text-[13px] text-center`}>{statusText}</Text>
        )}
      </View>
    </View>
  );
}
