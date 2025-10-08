import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Auth from "./screens/Auth";
import Main from "./screens/Main";

export type AppState = "auth" | "main";

export default function App() {
  const [appState, setAppState] = useState<AppState>("auth");
  const [userLogin, setUserLogin] = useState<string>("");

  const handleLogin = (login: string) => {
    setUserLogin(login);
    setAppState("main");
  };

  const handleLogout = async () => {
    // Очищаем сохраненные данные при выходе
    try {
      const { deleteItemAsync } = await import("expo-secure-store");
      await deleteItemAsync("user_login");
      await deleteItemAsync("user_password");
    } catch (error) {
      console.log("Ошибка при очистке данных:", error);
    }
    
    setUserLogin("");
    setAppState("auth");
  };

  return (
    <View style={styles.container}>
      {appState === "auth" && <Auth setAppState={handleLogin} />}
      {appState === "main" && <Main setAppState={handleLogout} userLogin={userLogin} />}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
