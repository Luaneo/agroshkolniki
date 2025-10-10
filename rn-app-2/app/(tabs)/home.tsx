import { HelloWave } from "@/components/hello-wave";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SERVER_IP } from "@/constants/env";
import { destructiveAccent, lightAccent } from "@/constants/theme";
import { useThemeColor } from "@/hooks/use-theme-color";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { navigate } from "expo-router/build/global-state/routing";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { ScrollView, StyleSheet, TouchableHighlight, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import InlineEdit from "../../components/ui/inline-edit";

export default function Home() {
  const [pressed, setPressed] = useState(false);
  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");

  const [status, requestPermission] = ImagePicker.useCameraPermissions();
  const [images, setImages] = useState<
    ({ name: string } & (
      | {
          type: "image";
          asset: ImagePicker.ImagePickerAsset;
        }
      | {
          type: "file";
          asset: DocumentPicker.DocumentPickerAsset;
        }
    ))[]
  >([]);

  const takePictureFromCamera = async () => {
    if (!status?.granted) {
      if (status?.canAskAgain) {
        const result = await requestPermission();
        if (!result.granted) {
          return;
        }
      } else {
        return;
      }
    }
    setPressed(true);
    const result = await ImagePicker.launchCameraAsync();
    if (result.canceled) return;
    setImages([
      ...images,
      ...result.assets.map((asset) => ({
        asset: asset,
        name: asset.fileName ?? asset.uri.split("/").pop() ?? "Name",
        type: "image" as const,
      })),
    ]);
  };

  const pickImagesFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
    });
    if (result.canceled) return;
    setImages([
      ...images,
      ...result.assets.map((asset) => ({
        asset: asset,
        name: asset.fileName ?? asset.uri.split("/").pop() ?? "Name",
        type: "image" as const,
      })),
    ]);
  };

  const pickImagesFromFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      type: "image/*",
    });
    if (result.canceled) return;
    setImages([
      ...images,
      ...result.assets.map((asset) => ({
        asset,
        name: asset.name ?? asset.uri.split("/").pop() ?? "Name",
        type: "file" as const,
      })),
    ]);
  };

  const sendImages = async () => {
    navigate("/modal");
    const sendImage = async (image: (typeof images)[number]) => {
      const { asset, name, type } = image;
      const ext = asset.uri.split(".").pop();
      const body = new FormData();
      // @ts-ignore
      body.append("file", {
        uri: asset.uri,
        name: name.replace(" ", "-") + asset.uri.split(".").pop(),
        type: "image/" + ext,
      });
      try {
        console.log(`${SERVER_IP}/images/`);
        const response = await fetch(`${SERVER_IP}/images/`, {
          method: "POST",
          body,
          headers: {
            Authorization: `Basic ${btoa("login:password")}`,
          },
        });
        return response.ok;
      } catch (e) {
        console.log(e);
        return false;
      }
    };
    for (const image of images) {
      while (!await sendImage(image))
      await new Promise((resolve) => setTimeout(() => resolve(0), 15000));
    }
    navigate("..");
    setImages([]);
  };

  return (
    <ThemedView style={{ minHeight: "100%" }}>
      <SafeAreaView>
        <ScrollView>
          <View style={styles.content}>
            <View style={styles.topBar}>
              <View style={styles.titleContainer}>
                <ThemedText type="title">Seed Classifier</ThemedText>
                <HelloWave />
              </View>
              <TouchableHighlight onPress={() => setPressed(true)}>
                <SymbolView
                  name="rectangle.portrait.and.arrow.right"
                  size={36}
                  tintColor={lightAccent}
                />
              </TouchableHighlight>
            </View>

            <View style={{ height: 36 }} />

            <View>
              <ThemedText type="subtitle">
                Добрый день, user {pressed ? "yes" : null}
              </ThemedText>
            </View>

            <View style={styles.inputContainer}>
              <TouchableHighlight
                style={{ flex: 1 }}
                onPress={takePictureFromCamera}
              >
                <View style={styles.inputItem}>
                  <SymbolView
                    name="camera.fill"
                    size={48}
                    tintColor={backgroundColor}
                  />
                  <ThemedText
                    type="defaultSemiBold"
                    style={{ color: backgroundColor }}
                  >
                    Камера
                  </ThemedText>
                </View>
              </TouchableHighlight>
              <TouchableHighlight
                style={{ flex: 1 }}
                onPress={pickImagesFromGallery}
              >
                <View style={styles.inputItem}>
                  <SymbolView
                    name="photo.on.rectangle.angled.fill"
                    size={48}
                    tintColor={backgroundColor}
                  />
                  <ThemedText
                    type="defaultSemiBold"
                    style={{ color: backgroundColor }}
                  >
                    Галерея
                  </ThemedText>
                </View>
              </TouchableHighlight>
              <TouchableHighlight
                style={{ flex: 1 }}
                onPress={pickImagesFromFiles}
              >
                <View style={styles.inputItem}>
                  <SymbolView
                    name="folder.fill"
                    size={48}
                    tintColor={backgroundColor}
                  />
                  <ThemedText
                    type="defaultSemiBold"
                    style={{ color: backgroundColor }}
                  >
                    Файлы
                  </ThemedText>
                </View>
              </TouchableHighlight>
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 36,
              }}
            >
              <ThemedText>Загружено: {images.length}</ThemedText>
              <TouchableHighlight onPress={() => setImages([])}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <ThemedText style={{ color: destructiveAccent }}>
                    Удалить все
                  </ThemedText>
                  <SymbolView
                    name="xmark.circle"
                    size={24}
                    tintColor={destructiveAccent}
                  />
                </View>
              </TouchableHighlight>
            </View>

            <TouchableHighlight style={{ flex: 1 }} onPress={sendImages}>
              <View
                style={{ ...styles.inputItem, flexDirection: "row", gap: 8 }}
              >
                <SymbolView
                  name="paperplane.fill"
                  size={36}
                  tintColor={backgroundColor}
                />
                <ThemedText
                  type="defaultSemiBold"
                  style={{ color: backgroundColor }}
                >
                  Отправить
                </ThemedText>
              </View>
            </TouchableHighlight>

            <View>
              {images.length === 0 ? (
                <ThemedText style={{ textAlign: "center", color: "#888" }}>
                  Нет загруженных изображений
                </ThemedText>
              ) : (
                <View>
                  {images.map(({ asset, name }, idx) => (
                    <View
                      key={asset.uri ?? idx}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 12,
                        width: "100%",
                      }}
                    >
                      <Image
                        source={{ uri: asset.uri }}
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 8,
                          backgroundColor: "#eee",
                          marginRight: 16,
                        }}
                        contentFit="cover"
                      />
                      <InlineEdit
                        value={name}
                        textStyle={{
                          fontSize: 14,
                          flexShrink: 1,
                          paddingVertical: 4,
                          color: textColor,
                        }}
                        onCommit={(newName: string) => {
                          const trimmed = newName?.trim?.();
                          if (trimmed && trimmed.length > 0) {
                            // update the images array once on commit
                            setImages(
                              images.map((img, i) =>
                                i === idx ? { ...img, name: trimmed } : img
                              )
                            );
                          }
                        }}
                      />
                      <TouchableHighlight
                        style={{ marginLeft: 12, borderRadius: 16 }}
                        underlayColor="#eee"
                        onPress={() => {
                          setImages(images.filter((_, i) => i !== idx));
                        }}
                      >
                        <View>
                          <SymbolView
                            name="xmark.circle"
                            size={24}
                            tintColor={destructiveAccent}
                          />
                        </View>
                      </TouchableHighlight>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputContainer: {
    flexDirection: "row",
    gap: 8,
  },
  inputItem: {
    flex: 1,
    padding: 16,
    textAlign: "center",
    borderRadius: 8,
    backgroundColor: lightAccent,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
});
