import { Text, View } from "react-native";

export default function LoyaltyScreen() {
  return (
    <View className="flex-1 bg-neutral-100 p-4">
      <View className="rounded-lg bg-white p-5">
        <Text className="text-sm text-neutral-500">Sadakat puanı</Text>
        <Text className="mt-2 text-4xl font-bold text-emerald-700">0</Text>
        <Text className="mt-2 text-sm text-neutral-500">Puan kazanımı sonraki aşamada canlı veriye bağlanacak.</Text>
      </View>
    </View>
  );
}

