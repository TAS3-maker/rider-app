import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plane } from 'lucide-react-native';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <LinearGradient colors={['#3AAFA9', '#2B8A85']} style={{ flex: 1 }}>
      <View
        className="flex-1 justify-end px-6"
        style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }}
      >
        <View className="mt-auto">
          <Plane size={60} color="#FFFFFF" strokeWidth={1.5} style={{ marginBottom: 20 }} />
          <Text testID="welcome-logo" className="text-[36px] font-extrabold text-white mb-2 tracking-tight">
            RidePact
          </Text>
          <Text className="text-base text-white/80 mb-8 leading-6">
            Find your airport crew.{'\n'}Split the ride. Save 60%.
          </Text>
        </View>

        <Pressable
          testID="welcome-get-started"
          onPress={() => router.push('/(auth)/signup')}
          className="w-full py-4 rounded-[14px] bg-white items-center mb-2.5"
        >
          <Text className="text-base font-semibold text-primary-dark">Get Started</Text>
        </Pressable>

        <Pressable
          testID="welcome-signin"
          onPress={() => router.push('/(auth)/signin')}
          className="w-full py-4 rounded-[14px] bg-white/15 border-[1.5px] border-white/30 items-center"
        >
          <Text className="text-base font-semibold text-white">I already have an account</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}
