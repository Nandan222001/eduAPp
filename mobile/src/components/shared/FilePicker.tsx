import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme';

// Lazy load DocumentPicker only on native platforms
let DocumentPicker: any = null;
if (Platform.OS !== 'web') {
  DocumentPicker = require('expo-document-picker');
}

interface DocumentPickerAsset {
  uri: string;
  name: string;
  size?: number;
  mimeType?: string;
}

interface FilePickerProps {
  label?: string;
  onFileSelect: (file: DocumentPickerAsset) => void;
  acceptedTypes?: string[];
  error?: string;
  multiple?: boolean;
}

export const FilePicker: React.FC<FilePickerProps> = ({
  label,
  onFileSelect,
  acceptedTypes = ['*/*'],
  error,
  multiple = false,
}) => {
  const { theme } = useTheme();

  const pickDocumentWeb = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = acceptedTypes.join(',');
    input.multiple = multiple;
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          onFileSelect({
            uri: event.target.result,
            name: file.name,
            size: file.size,
            mimeType: file.type,
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const pickDocument = async () => {
    if (Platform.OS === 'web') {
      pickDocumentWeb();
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: acceptedTypes,
        multiple,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onFileSelect(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: theme.typography.label.fontSize,
      fontWeight: theme.typography.label.fontWeight,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: error ? theme.colors.error : theme.colors.border,
      borderRadius: theme.borderRadius.md,
      borderStyle: 'dashed',
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.md,
    },
    icon: {
      marginRight: theme.spacing.sm,
    },
    buttonText: {
      fontSize: theme.typography.body.fontSize,
      color: theme.colors.primary,
      fontWeight: theme.fontWeights.medium,
    },
    errorText: {
      fontSize: theme.typography.caption.fontSize,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.button} onPress={pickDocument}>
        <MaterialCommunityIcons
          name="file-upload"
          size={24}
          color={theme.colors.primary}
          style={styles.icon}
        />
        <Text style={styles.buttonText}>Choose File</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};
