import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@react-native-vector-icons/ionicons';

const ICONS = {
  home: 'home',
  find: 'search',
  chat: 'chatbubble',
  profile: 'person',
};
const LABELS = { home: 'Home', find: 'Find', chat: 'Chat', profile: 'Profile' };
const ORDER = ['home', 'find', 'create', 'chat', 'profile'];

// Custom bottom tab bar matching wireframe: 4 tabs + a raised circular "+" create button.
export default function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  const routeByName = Object.fromEntries(state.routes.map((r) => [r.name, r]));
  const activeName = state.routes[state.index]?.name;

  const go = (name) => {
    const route = routeByName[name];
    const isFocused = activeName === name;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(name);
  };

  return (
    <View
      className="flex-row items-center justify-around bg-white border-t border-border px-2"
      style={{ height: 64 + insets.bottom, paddingBottom: insets.bottom }}
    >
      {ORDER.map((name) => {
        if (name === 'create') {
          return (
            <Pressable
              key="create"
              testID="tab-create-button"
              onPress={() => go('create')}
              className="w-12 h-12 rounded-full bg-primary items-center justify-center -mt-5"
              style={{
                shadowColor: '#3AAFA9',
                shadowOpacity: 0.3,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              }}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </Pressable>
          );
        }
        const focused = activeName === name;
        return (
          <Pressable
            key={name}
            testID={`tab-${name}`}
            onPress={() => go(name)}
            className="items-center justify-center py-1.5 px-3"
          >
            <Ionicons name={ICONS[name]} size={22} color={focused ? '#3AAFA9' : '#8A8A9A'} />
            <Text className={`text-[10px] mt-0.5 ${focused ? 'text-primary' : 'text-text-3'}`}>
              {LABELS[name]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
