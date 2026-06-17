import { useEffect, useState } from "react";
import { formatKurus, type PublicMenuResponse } from "@qrmenu/types";
import { getPublicMenu } from "@/api";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

export default function MenuScreen() {
  const [slug, setSlug] = useState("test-kafe");
  const [data, setData] = useState<PublicMenuResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      setData(await getPublicMenu(slug));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Menu yuklenemedi");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <ScrollView className="flex-1 bg-neutral-100 p-4">
      <View className="rounded-lg bg-white p-4">
        <Text className="text-sm text-neutral-500">İşletme slug</Text>
        <View className="mt-2 flex-row gap-2">
          <TextInput
            className="h-11 flex-1 rounded-md border border-neutral-200 px-3"
            value={slug}
            onChangeText={setSlug}
            autoCapitalize="none"
          />
          <Pressable className="h-11 justify-center rounded-md bg-emerald-700 px-4" onPress={() => void load()}>
            <Text className="font-semibold text-white">Aç</Text>
          </Pressable>
        </View>
      </View>
      {error ? <Text className="mt-4 text-red-600">{error}</Text> : null}
      {data ? (
        <View className="mt-4">
          <Text className="text-2xl font-bold text-neutral-950">{data.business.name}</Text>
          {data.categories.map((category) => (
            <View key={category.id} className="mt-4">
              <Text className="mb-2 text-lg font-bold">{category.name}</Text>
              {category.items.map((item) => (
                <View key={item.id} className="mb-2 rounded-lg bg-white p-4">
                  <Text className="font-semibold">{item.name}</Text>
                  <Text className="mt-1 text-sm text-neutral-500">{item.description}</Text>
                  <Text className="mt-2 font-bold">{formatKurus(item.priceKurus)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

