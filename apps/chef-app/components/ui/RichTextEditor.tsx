import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { Bold, Italic, List, Link, Image as ImageIcon, AlignLeft, AlignCenter, Heading1, Heading2 } from 'lucide-react-native';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  style?: any;
}

export function RichTextEditor({ value, onChange, placeholder, style }: RichTextEditorProps) {
  const richText = useRef<RichEditor>(null);
  const [selectedColor, setSelectedColor] = useState('#000000');

  const handleCursorPosition = (scrollY: number) => {
    // Handle cursor position if needed
  };

  return (
    <View style={[styles.container, style]}>
      <RichToolbar
        editor={richText}
        actions={[
          actions.setBold,
          actions.setItalic,
          actions.insertBulletsList,
          actions.insertOrderedList,
          actions.setHeading,
          actions.insertLink,
          actions.insertImage,
          actions.setStrikethrough,
          actions.foreColor,
          actions.hiliteColor,
          actions.undo,
          actions.redo,
        ]}
        iconTint="#094327"
        selectedIconTint="#0B9E58"
        selectedButtonStyle={styles.selectedButton}
        style={styles.toolbar}
      />
      <ScrollView style={styles.editorContainer}>
        <RichEditor
          ref={richText}
          onChange={onChange}
          placeholder={placeholder || 'Start writing...'}
          initialContentHTML={value}
          useContainer={true}
          containerStyle={styles.editor}
          editorStyle={styles.editorStyle}
          onCursorPosition={handleCursorPosition}
          initialHeight={200}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  toolbar: {
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
  },
  selectedButton: {
    backgroundColor: '#E5E7EB',
  },
  editorContainer: {
    flex: 1,
  },
  editor: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    minHeight: 200,
  },
  editorStyle: {
    backgroundColor: '#FFFFFF',
    color: '#111827',
    fontSize: 16,
    fontFamily: 'Inter',
    lineHeight: 24,
  },
});

