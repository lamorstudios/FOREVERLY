import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

/** Vereinfachter Zugriff auf Galerie und Kamera mit Rechte-Abfrage. */
export function useImagePicker() {
  const pickFromLibrary = useCallback(async (): Promise<PickedImage | null> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Zugriff benötigt',
        'Bitte erlaube den Zugriff auf deine Fotos in den Einstellungen.',
      );
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    return toPicked(result);
  }, []);

  const takePhoto = useCallback(async (): Promise<PickedImage | null> => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Zugriff benötigt',
        'Bitte erlaube den Zugriff auf die Kamera in den Einstellungen.',
      );
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    return toPicked(result);
  }, []);

  return { pickFromLibrary, takePhoto };
}

function toPicked(
  result: ImagePicker.ImagePickerResult,
): PickedImage | null {
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, width: asset.width, height: asset.height };
}
