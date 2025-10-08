import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Image,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { AppState } from "../App";

interface MainProps {
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  userLogin: string;
}

interface ImageItem {
  id: string;
  uri: string;
  name: string;
  type?: 'image' | 'file';
  size?: number;
  mimeType?: string;
}

export default function Main({ setAppState, userLogin }: MainProps) {
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);

  // Проверяем разрешения при загрузке компонента
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const permission = await ImagePicker.getCameraPermissionsAsync();
      console.log('Проверка разрешений при загрузке:', permission.status);
      setCameraPermission(permission.status === 'granted');
    } catch (error) {
      console.error('Ошибка при проверке разрешений:', error);
      setCameraPermission(false);
    }
  };

  // Функция для съемки фото с камеры
  const takePhoto = async () => {
    try {
      console.log('Начинаем процесс съемки фото...');
      
      // Сначала запрашиваем разрешение
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Статус разрешения камеры:', permission.status);
      
      if (permission.status !== 'granted') {
        Alert.alert(
          "Нет разрешения", 
          "Для съемки фото необходимо разрешение на использование камеры. Пожалуйста, разрешите доступ к камере в настройках приложения.",
          [
            { text: "Отмена", style: "cancel" },
            { text: "Попробовать снова", onPress: () => takePhoto() }
          ]
        );
        setCameraPermission(false);
        return;
      }

      setCameraPermission(true);
      console.log('Разрешение получено, запускаем камеру...');

      // Запускаем камеру
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false, // Отключаем EXIF данные для конфиденциальности
      });

      console.log('Результат камеры:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        const newImage: ImageItem = {
          id: `camera_${Date.now()}`,
          uri: imageUri,
          name: `Фото ${selectedImages.length + 1}`,
          type: 'image',
          size: result.assets[0].fileSize,
          mimeType: 'image/jpeg'
        };
        console.log('Добавляем изображение:', newImage);
        setSelectedImages(prev => [...prev, newImage]);
      } else {
        console.log('Пользователь отменил съемку или не выбрал фото');
      }
    } catch (error) {
      console.error('Ошибка при съемке фото:', error);
      Alert.alert(
        "Ошибка", 
        "Не удалось сделать фото. Убедитесь, что камера доступна и не используется другим приложением."
      );
    }
  };

  const pickImages = async () => {
    try {
      // Запрашиваем разрешения
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Разрешение отклонено', 'Для выбора изображений нужно разрешение на доступ к галерее.');
        return;
      }

      // Выбираем изображения (можно выбрать много)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages: ImageItem[] = result.assets.map((asset, index) => ({
          id: `gallery_${Date.now()}_${index}`,
          uri: asset.uri,
          name: `Фото ${selectedImages.length + index + 1}`,
          type: 'image',
          size: asset.fileSize,
          mimeType: 'image/jpeg'
        }));
        
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выбрать изображения');
      console.error('Error picking images:', error);
    }
  };

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
        type: '*/*', // Разрешаем все типы файлов
      });

      if (!result.canceled && result.assets) {
        const newFiles: ImageItem[] = result.assets.map((asset, index) => ({
          id: `file_${Date.now()}_${index}`,
          uri: asset.uri,
          name: asset.name || `Файл ${selectedImages.length + index + 1}`,
          type: 'file',
          size: asset.size,
          mimeType: asset.mimeType || 'application/octet-stream'
        }));
        
        setSelectedImages(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выбрать файлы');
      console.error('Error picking files:', error);
    }
  };

  const removeImage = (id: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAllImages = () => {
    setSelectedImages([]);
  };

  const updateImageName = (id: string, newName: string) => {
    setSelectedImages(prev => 
      prev.map(img => img.id === id ? { ...img, name: newName } : img)
    );
  };

  const startEditing = (id: string) => {
    setEditingImageId(id);
  };

  const finishEditing = () => {
    setEditingImageId(null);
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>TechForge</Text>
      </View>

      {/* User Profile */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Ionicons 
            name="person" 
            size={40} 
            color="#16A34A" 
          />
        </View>
        <Text style={styles.userLogin}>{userLogin}</Text>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => setAppState("auth")}
        >
          <Ionicons name="log-out-outline" size={20} color="#16A34A" />
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      {/* Upload Form */}
      <View style={styles.uploadSection}>
        <Text style={styles.sectionTitle}>Загрузка файлов</Text>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[
              styles.uploadButton, 
              styles.firstButton,
              cameraPermission === false && styles.disabledButton
            ]} 
            onPress={takePhoto}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons 
                name={cameraPermission === false ? "camera-outline" : "camera"} 
                size={24} 
                color="#FFFFFF" 
              />
            </View>
            <Text style={styles.buttonText}>
              {cameraPermission === false ? "Камера (нажмите для разрешения)" : "Камера"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadButton} onPress={pickImages}>
            <View style={styles.buttonIconContainer}>
              <Ionicons name="images" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.buttonText}>Фото из галереи</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.uploadButton, styles.lastButton]} 
            onPress={pickFiles}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="document" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.buttonText}>Файлы</Text>
          </TouchableOpacity>
        </View>

        {selectedImages.length > 0 && (
          <View style={styles.imagesSection}>
            <View style={styles.imagesHeader}>
              <Text style={styles.imagesTitle}>Выбранные файлы ({selectedImages.length})</Text>
              <TouchableOpacity onPress={clearAllImages}>
                <Text style={styles.clearButton}>Очистить все</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.imagesList}>
              {selectedImages.map((image) => (
                <View key={image.id} style={styles.imageListItem}>
                  {image.type === 'file' ? (
                    <View style={[styles.imageListPreview, styles.filePreview]}>
                      <Ionicons name="document" size={32} color="#666666" />
                      <Text style={styles.fileExtension}>
                        {image.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                      </Text>
                    </View>
                  ) : (
                    <Image 
                      source={{ uri: image.uri }} 
                      style={styles.imageListPreview}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.imageInfo}>
                    {editingImageId === image.id ? (
                      <TextInput
                        style={styles.imageNameInput}
                        value={image.name}
                        onChangeText={(text) => updateImageName(image.id, text)}
                        onBlur={finishEditing}
                        autoFocus
                        selectTextOnFocus
                      />
                    ) : (
                      <TouchableOpacity 
                        style={styles.imageNameContainer}
                        onPress={() => startEditing(image.id)}
                      >
                        <Text style={styles.imageName}>{image.name}</Text>
                        <Ionicons name="pencil" size={16} color="#16A34A" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeImage(image.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#16A34A",
    textAlign: "center",
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#16A34A",
  },
  userLogin: {
    fontSize: 18,
    fontWeight: "600",
    color: "#166534",
    marginBottom: 12,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F0FDF4",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#16A34A",
  },
  logoutText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "600",
  },
  uploadSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  buttonsContainer: {
    width: "100%",
    marginBottom: 40,
    paddingHorizontal: 0,
  },
  uploadButton: {
    backgroundColor: "#16A34A",
    borderRadius: 0,
    padding: 18,
    alignItems: "center",
    marginBottom: 2,
    flexDirection: "row",
    justifyContent: "flex-start",
    width: "100%",
    shadowColor: "#16A34A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    flexShrink: 0,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  disabledButton: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
  },
  firstButton: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastButton: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 0,
  },
  imagesSection: {
    marginTop: 20,
    paddingHorizontal: 24,
  },
  imagesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    gap: 16,
  },
  imagesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#166534",
  },
  clearButton: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },
  imagesList: {
    gap: 12,
  },
  imageListItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  imageListPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F0FDF4",
  },
  imageInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  imageNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  imageName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#166534",
    flex: 1,
  },
  imageNameInput: {
    fontSize: 16,
    fontWeight: "600",
    color: "#166534",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#16A34A",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeImageButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#FEF2F2",
  },
  filePreview: {
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  fileExtension: {
    fontSize: 10,
    color: "#666666",
    fontWeight: "600",
    marginTop: 4,
  },
});
