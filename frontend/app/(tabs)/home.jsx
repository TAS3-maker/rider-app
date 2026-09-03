import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text testID="home-title" className="text-[22px] font-extrabold text-text">Home</Text>
        <Pressable
          testID="home-notifications"
          onPress={() => router.push('/notifications')}
          className="w-8 h-8 rounded-full bg-white items-center justify-center"
          style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 }}
        >
          <Ionicons name="notifications-outline" size={16} color="#1A1A2E" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Text className="px-5 pt-4 pb-2 text-[13px] font-bold text-text-3 uppercase tracking-wide">
          Your Upcoming Ride
        </Text>

        {/* Phase 0 empty state (ride discovery/creation lands in Phase 2) */}
        <View className="items-center px-8 py-8">
          <Text className="text-[48px] mb-4">✈️</Text>
          <Text className="text-lg font-bold text-text mb-2">No rides yet</Text>
          <Text className="text-sm text-text-3 text-center leading-5 mb-5 max-w-[260px]">
            Post your trip and we'll notify you when someone matches your flight time.
          </Text>
          <Pressable
            testID="home-create-ride"
            onPress={() => router.push('/(tabs)/create')}
            className="bg-primary px-6 py-3 rounded-[12px]"
          >
            <Text className="text-white font-semibold text-sm">Create a Ride</Text>
          </Pressable>
        </View>

        <View className="h-2 bg-[#F0F0EC] my-2" />

        <Text className="px-5 pt-2 pb-2 text-[13px] font-bold text-text-3 uppercase tracking-wide">
          Upcoming Travel
        </Text>
        <View className="mx-5 rounded-[14px] bg-white p-4" style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 }}>
          <Text className="text-sm text-text-3">
            Travel calendar events will appear here once your school adds them.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
