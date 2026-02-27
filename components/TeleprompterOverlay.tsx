import type { RefObject } from 'react';
import type { ScrollView as RNScrollView } from 'react-native';
import { ScrollView, Text, View } from 'react-native';

type TeleprompterOverlayProps = {
  script: string;
  isRecording: boolean;
  scrollRef: RefObject<RNScrollView | null>;
  setContentHeight: (value: number) => void;
  setViewportHeight: (value: number) => void;
};

export default function TeleprompterOverlay({
  script,
  isRecording,
  scrollRef,
  setContentHeight,
  setViewportHeight,
}: TeleprompterOverlayProps) {
  return (
    <View className="h-[160px]">
      <ScrollView
        ref={(ref) => {
          scrollRef.current = ref;
        }}
        className="flex-1"
        contentContainerStyle={{ justifyContent: isRecording ? 'flex-start' : 'center' }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEnabled={false}
        onContentSizeChange={(_, height) => setContentHeight(height)}
        onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
      >
        <View className="pt-16">
          <Text className="text-white text-[22px] leading-[34px] font-semibold tracking-wide text-center">
            {script}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
