import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { ScrollView, TextInput as RNTextInput } from 'react-native';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import TeleprompterOverlay from './TeleprompterOverlay';

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
  const [draft, setDraft] = useState(script);
  const [selection, setSelection] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });
  const inputRef = useRef<RNTextInput | null>(null);
  const hasScript = script.trim().length > 0;

  useEffect(() => {
    if (isEditing) {
      setDraft(script);
    }
  }, [isEditing, script]);

  const handleSave = () => {
    setScript(draft);
    setIsEditing(false);
  };

  const handleSelectAll = () => {
    const next = { start: 0, end: draft.length };
    setSelection(next);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setDraft('');
    setSelection({ start: 0, end: 0 });
    inputRef.current?.focus();
  };

  const handlePaste = async () => {
    const clip = await Clipboard.getStringAsync();
    if (clip.length === 0) return;
    const start = selection.start ?? draft.length;
    const end = selection.end ?? draft.length;
    const nextText = `${draft.slice(0, start)}${clip}${draft.slice(end)}`;
    const nextCursor = start + clip.length;
    setDraft(nextText);
    setSelection({ start: nextCursor, end: nextCursor });
    inputRef.current?.focus();
  };

  return (
    <>
      <Pressable
        onPress={() => setIsEditing(true)}
        className={[
          'mx-4 mt-6 rounded-2xl border border-white/20',
          hasScript ? 'px-5 py-4' : 'px-6 py-5',
          isRecording ? 'opacity-60 border border-white/0' : '',
        ].join(' ')}
        disabled={isRecording}
      >
        {!hasScript ? (
          <Text className="text-white/50 text-[16px] leading-relaxed text-center">
            Tap to add your script
          </Text>
        ) : (
          <TeleprompterOverlay
            script={script}
            isRecording={isRecording}
            scrollRef={scrollRef}
            setContentHeight={setContentHeight}
            setViewportHeight={setViewportHeight}
          />
        )}
      </Pressable>

      <Modal visible={isEditing} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-[#0D0D0D] px-4 pt-6">
          <View className="flex-row items-center justify-between px-1 py-2">
            <Text className="text-white text-[17px] font-semibold">Edit Script</Text>
            <Pressable
              onPress={handleSave}
              className="flex-row items-center rounded-full bg-cueoLime px-6 py-2 active:scale-95"
            >
              <Text className="text-black text-[14px] font-bold tracking-wide">Save</Text>
            </Pressable>
          </View>
          <View className="mt-2 flex-row items-center space-x-2 px-1">
            <Pressable
              onPress={handleSelectAll}
              className="flex-row items-center rounded-full border border-cueoLime/30 bg-cueoLime/10 px-3 py-2 active:scale-95"
            >
              <Text className="text-cueoLime text-[13px] font-semibold tracking-wide">Select All</Text>
            </Pressable>
            <Pressable
              onPress={handleClear}
              className="flex-row items-center rounded-full border border-white/10 bg-white/5 px-3 py-2 active:scale-95"
            >
              <Text className="text-white/70 text-[13px] font-semibold tracking-wide">Clear</Text>
            </Pressable>
            <Pressable
              onPress={handlePaste}
              className="flex-row items-center rounded-full border border-white/10 bg-white/5 px-3 py-2 active:scale-95"
            >
              <Text className="text-white/70 text-[13px] font-semibold tracking-wide">Paste All</Text>
            </Pressable>
          </View>
          <View className="mt-4 flex-1 rounded-3xl border border-white/5 bg-[#121212] p-6">
            <TextInput
              ref={(ref) => {
                inputRef.current = ref;
              }}
              value={draft}
              onChangeText={setDraft}
              multiline
              placeholder="Paste your script..."
              placeholderTextColor="#555555"
              className="flex-1 text-white text-[18px] leading-[1.6]"
              textAlignVertical="top"
              selection={selection}
              onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
