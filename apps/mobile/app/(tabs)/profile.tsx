import { Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-neutral-100 p-4">
      <View className="rounded-lg bg-white p-5">
        <Text className="text-lg font-bold">Profil</Text>
        <Text className="mt-2 text-sm text-neutral-500">Mock telefon oturumu aktif.</Text>
      </View>
    </View>
  );
}
