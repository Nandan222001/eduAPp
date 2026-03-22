import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/theme';

// Lazy load ImagePicker only on native platforms
let ExpoImagePicker: any = null;
if (Platform.OS !== 'web') {
  ExpoImagePicker = require('expo-image-picker');
}

interface ImagePickerProps {
  label?: string;
  onImageSelect: (uri: string) => void;
  error?: string;
  currentImage?: string;
  aspectRatio?: [number, number];
  quality?: number;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  label,
  onImageSelect,
  error,
  currentImage,
  aspectRatio,
  quality = 0.8,
}) => {
  const { theme } = useTheme();
  const [imageUri, setImageUri] = useState<string | undefined>(currentImage);

  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      return true; // No permissions needed on web
    }

    const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access your photos.');
      return false;
    }
    return true;
  };

  const pickImageWeb = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          const uri = event.target.result;
          setImageUri(uri);
          onImageSelect(uri);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      pickImageWeb();
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio,
        quality,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        onImageSelect(uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Camera is not available on web platform');
      return;
    }

    const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access your camera.');
      return;
    }

    try {
      const result = await ExpoImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: aspectRatio,
        quality,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        onImageSelect(uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showOptions = () => {
    if (Platform.OS === 'web') {
      pickImage();
      return;
    }

    Alert.alert('Select Image', 'Choose an option', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: error ? theme.colors.error : theme.colors.border,
      borderRadius: theme.borderRadius.md,
      borderStyle: 'dashed',
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.md,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: 200,
      borderRadius: theme.borderRadius.md,
    },
    placeholderContent: {
      alignItems: 'center',
    },
    icon: {
      marginBottom: theme.spacing.sm,
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
      <TouchableOpacity style={styles.button} onPress={showOptions}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderContent}>
            <MaterialCommunityIcons
              name="image-plus"
              size={48}
              color={theme.colors.primary}
              style={styles.icon}
            />
            <Text style={styles.buttonText}>Select Image</Text>
          </View>
        )}
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};
