import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Car, Cloud } from 'lucide-react-native';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View className="flex-1 bg-navy" style={{ paddingTop: insets.top }}>
      {/* cloud motif */}
      <Cloud size={64} color="#3A4A5C" fill="#3A4A5C" style={{ position: 'absolute', top: insets.top + 40, right: 20 }} />
      <Cloud size={90} color="#3A4A5C" fill="#3A4A5C" style={{ position: 'absolute', top: insets.top + 300, left: -10 }} />

      <View className="flex-1 px-7 justify-center">
        <Car size={72} color="#FFFFFF" strokeWidth={1.5} />
        <Text className="text-white font-extrabold" style={{ fontSize: 72, lineHeight: 78, marginTop: -6 }}>Rovo</Text>
        <View className="mt-6">
          <Text className="text-[18px] text-white/70">Same place. Same time.</Text>
          <Text className="text-[18px] text-white/70">Find people going your way.</Text>
          <Text className="text-[18px] font-bold text-white mt-1">Save up to 65%.</Text>
        </View>
      </View>

      <View className="px-7" style={{ paddingBottom: insets.bottom + 28 }}>
        <View className="self-center px-5 py-2.5 mb-4 rounded-full border" style={{ borderColor: '#E0913C' }}>
          <Text className="text-[14px] font-bold text-amber">Verified .edu Students Only</Text>
        </View>
        <Pressable testID="welcome-getstarted" onPress={() => router.push('/(auth)/signup')} className="bg-cream rounded-[14px] py-4 items-center mb-3">
          <Text className="text-[16px] font-bold text-ink">Get Started</Text>
        </Pressable>
        <Pressable testID="welcome-signin" onPress={() => router.push('/(auth)/signin')} className="bg-navy-light rounded-[14px] py-4 items-center">
          <Text className="text-[16px] font-bold text-white">I already have an account</Text>
        </Pressable>
      </View>
    </View>
  );
}
