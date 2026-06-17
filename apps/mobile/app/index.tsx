import { useState } from "react";
import { router } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const canLogin = phone.trim().length >= 10 && code.trim().length === 4;

  return (
    <View className="flex-1 justify-center bg-neutral-100 px-6">
      <View className="rounded-lg bg-white p-5">
        <Text className="text-2xl font-bold text-neutral-950">QR Menu</Text>
        <Text className="mt-1 text-sm text-neutral-500">Telefon ile giriş yap. Mock OTP için herhangi 4 hane kabul.</Text>
        <TextInput
          className="mt-5 h-12 rounded-md border border-neutral-200 px-3"
          placeholder="Telefon"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          className="mt-3 h-12 rounded-md border border-neutral-200 px-3"
          placeholder="OTP"
          keyboardType="number-pad"
          maxLength={4}
          value={code}
          onChangeText={setCode}
        />
        <Pressable
          disabled={!canLogin}
          className={`mt-5 h-12 items-center justify-center rounded-md ${canLogin ? "bg-emerald-700" : "bg-neutral-300"}`}
          onPress={() => router.replace("/(tabs)/menu")}
        >
          <Text className="font-semibold text-white">Giriş yap</Text>
        </Pressable>
      </View>
    </View>
  );
}

