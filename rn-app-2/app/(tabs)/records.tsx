import { Image } from "expo-image";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";

import { Collapsible } from "@/components/ui/collapsible";
import { ExternalLink } from "@/components/external-link";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { HelloWave } from "@/components/hello-wave";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TabTwoScreen() {
  const [responses, setResponses] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem("responses").then((res) => setResponses(res));
  }, []);

  return (
    <ThemedView style={{ minHeight: "100%" }}>
      <SafeAreaView>
        <ScrollView>
          <View style={styles.content}>
            <View style={styles.topBar}>
              <View style={styles.titleContainer}>
                <ThemedText type="title">Отчеты</ThemedText>
                <HelloWave />
              </View>
            </View>

            <View style={{ height: 36 }} />

            <View
              style={{
                flexDirection: "column",
              }}
            >
              {responses !== null && responses.map((response: any) => (
                <View
                  style={{
                    backgroundColor: "#b7d2b7ff",
                    borderRadius: 8,
                  }}
                >
                  <View>
                    <ThemedText type="subtitle">{response.name}</ThemedText>
                  </View>

                  <View>
                    <ThemedText>Класс: {response.name}</ThemedText>
                  </View>

                  <View>
                    <ThemedText>
                      Класс: {JSON.stringify(response.class_name)}
                    </ThemedText>
                  </View>

                  <View>
                    <ThemedText>
                      Дефекты: {JSON.stringify(response.defects)}
                    </ThemedText>
                  </View>

                  <View>
                    <ThemedText>Hue: {JSON.stringify(response.hue)}</ThemedText>
                  </View>

                  <View>
                    <ThemedText>
                      Цвет: {JSON.stringify(response.color)}
                    </ThemedText>
                  </View>

                  <View>
                    <ThemedText>
                      Яркость:{" "}
                      {JSON.stringify(response.additional_info.brightness)}
                    </ThemedText>
                  </View>

                  <View>
                    <ThemedText>
                      Насыщенность:{" "}
                      {JSON.stringify(response.additional_info.saturation)}
                    </ThemedText>
                  </View>
                </View>
              ))}
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
});
