import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RideBrowseList from '@/components/RideBrowseList';

export default function Find() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-5 py-3 border-b border-border">
        <Text testID="find-title" className="text-[22px] font-extrabold text-text">Find Rides</Text>
      </View>
      <RideBrowseList />
    </View>
  );
}
