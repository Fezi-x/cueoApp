import type { RefObject } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

type ScriptEditorProps = {
  script: string;
  setScript: (value: string) => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  isRecording: boolean;
  scrollRef: RefObject<ScrollView | null>;
  setContentHeight: (value: number) => void;
  setViewportHeight: (value: number) => void;
};

export default function ScriptEditor({
  script,
  setScript,
  isEditing,
  setIsEditing,
  isRecording,
  scrollRef,
  setContentHeight,
  setViewportHeight,
}: ScriptEditorProps) {
  return (
    <>
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
    </>
  );
}
