
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import AISparkles from './ui/AISparkles';

interface SearchAreaProps {
  loading?: boolean;
  error?: string;
  value?: string;
  onChange?: (text: string) => void;
  maxLength?: number;
  placeholder?: string;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  autoFocus?: boolean;
  editable?: boolean;
  pointerEvents?: 'none' | 'auto';
  onSparklesPress?: () => void;
}

const DEFAULT_MAX_LENGTH = 100;

const SearchArea = React.forwardRef<TextInput, SearchAreaProps>(({
  loading = false,
  error = '',
  value: controlledValue,
  onChange,
  maxLength = DEFAULT_MAX_LENGTH,
  placeholder = "I want to eat Eba",
  returnKeyType = "default",
  onSubmitEditing,
  autoFocus = false,
  editable = true,
  pointerEvents = 'auto',
  onSparklesPress,
}, ref) => {
  const [internalValue, setInternalValue] = useState('');
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (text: string) => {
    // Trim leading whitespace, limit length
    let trimmed = text.replace(/^\s+/, '');
    if (trimmed.length > maxLength) trimmed = trimmed.slice(0, maxLength);
    if (onChange) onChange(trimmed);
    else setInternalValue(trimmed);
  };

  return (
    <View style={styles.row}>
      <View 
        style={[styles.searchContainer, error ? styles.errorBorder : null]}
        pointerEvents={editable ? 'auto' : 'none'}
      >
        <TextInput
          ref={ref}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={error ? '#FF6B6B' : '#C4C4C4'}
          value={value}
          onChangeText={handleChange}
          editable={editable && !loading}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          accessibilityLabel="Search input"
        />
        {loading && (
          <ActivityIndicator size="small" color="#fff" style={styles.loading} />
        )}
      </View>
      <View style={styles.iconContainer}>
        <AISparkles 
          size={35} 
          color="#E6FFE8" 
          onPress={onSparklesPress}
          enableShimmer={true}
          autoPlay={true}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

SearchArea.displayName = 'SearchArea';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
    marginBottom: 8,
    flex: 1,
  },
  searchContainer: {
    flex: 1,
    height: 42,
    backgroundColor: '#134E3A',
    borderRadius: 10,
    justifyContent: 'center',
    paddingLeft: 8,
    paddingRight: 8,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  loading: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -10,
  },
  errorBorder: {
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginLeft: 8,
  },
  iconContainer: {
    width: 42,
    height: 42,
    backgroundColor: '#134E3A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: 42,
    fontFamily: 'SF Pro',
    fontWeight: '400',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.43,
    color: '#C4C4C4',
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingLeft: 8,
  },
});

export default SearchArea;
