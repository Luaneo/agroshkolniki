import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { AppState } from "../App";

export default function Auth({
  setAppState,
}: {
  setAppState: (login: string) => void;
}) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStoredData, setIsCheckingStoredData] = useState(true);

  // Проверяем сохраненные данные при загрузке
  useEffect(() => {
    checkStoredCredentials();
  }, []);

  const checkStoredCredentials = async () => {
    try {
      const storedLogin = await SecureStore.getItemAsync("user_login");
      const storedPassword = await SecureStore.getItemAsync("user_password");
      
      if (storedLogin && storedPassword && storedLogin.trim() && storedPassword.trim()) {
        setLogin(storedLogin);
        setPassword(storedPassword);
        // Автоматически пытаемся войти с сохраненными данными
        handleLoginWithCredentials(storedLogin, storedPassword);
      } else {
        // Если нет сохраненных данных, просто скрываем спиннер
        setIsCheckingStoredData(false);
      }
    } catch (error) {
      console.log("Ошибка при загрузке сохраненных данных:", error);
      setIsCheckingStoredData(false);
    }
  };

  const saveCredentials = async (username: string, password: string) => {
    try {
      await SecureStore.setItemAsync("user_login", username);
      await SecureStore.setItemAsync("user_password", password);
    } catch (error) {
      console.log("Ошибка при сохранении данных:", error);
    }
  };

  const clearCredentials = async () => {
    try {
      await SecureStore.deleteItemAsync("user_login");
      await SecureStore.deleteItemAsync("user_password");
    } catch (error) {
      console.log("Ошибка при удалении данных:", error);
    }
  };

  // Функция для работы с реальным сервером
  const authenticateWithServer = async (username: string, password: string) => {
    const credentials = btoa(`${username}:${password}`);

    const response = await fetch("http://localhost:3000/check/", {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    return response.ok;
  };

  // Мок функция для тестирования (временно)
  const authenticateWithMock = async (username: string, password: string) => {
    // Имитируем задержку сети
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Простая проверка для демонстрации
    return username === "admin" && password === "password";
  };

  const handleLoginWithCredentials = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // Используем мок для тестирования
      // В будущем замените на: const isAuthenticated = await authenticateWithServer(username, password);
      const isAuthenticated = await authenticateWithMock(username, password);

      if (isAuthenticated) {
        // Сохраняем данные для будущих входов
        await saveCredentials(username, password);
        setAppState(username);
      } else {
        Alert.alert("Ошибка", "Неверный логин или пароль");
        // Очищаем неверные данные
        await clearCredentials();
        setIsCheckingStoredData(false);
      }
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось подключиться к серверу");
      setIsCheckingStoredData(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!login.trim() || !password.trim()) {
      Alert.alert("Ошибка", "Пожалуйста, заполните все поля");
      return;
    }

    await handleLoginWithCredentials(login, password);
  };

  // Показываем спиннер во время проверки сохраненных данных
  if (isCheckingStoredData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Проверка сохраненных данных...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Добро пожаловать!</Text>
          <Text style={styles.subtitle}>Войдите в свой аккаунт</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Логин</Text>
            <TextInput
              style={styles.input}
              placeholder="Введите логин"
              placeholderTextColor="#9CA3AF"
              value={login}
              onChangeText={setLogin}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Пароль</Text>
            <TextInput
              style={styles.input}
              placeholder="Введите пароль"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Войти</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Белый фон
  },
  contentContainer: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF", // Белый фон
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    minHeight: "100%",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#166534", // Темно-зеленый
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#16A34A", // Средне-зеленый
    textAlign: "center",
    fontWeight: "500",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#166534", // Темно-зеленый
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: "#16A34A", // Зеленая граница
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#166534",
    shadowColor: "#16A34A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    backgroundColor: "#16A34A", // Зеленый
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#16A34A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#16A34A",
    fontWeight: "500",
  },
});
