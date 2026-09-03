import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Send, Info, TrendingDown } from 'lucide-react-native';
import { groupsApi } from '@/api/rides';
import { chatApi } from '@/api/social';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import ScreenHeader from '@/components/ScreenHeader';
import { formatTime, countdown } from '@/lib/format';

export default function GroupChat() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { getSocket } = useSocket();
  const { groupId } = useLocalSearchParams();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState('');
  const ids = useRef(new Set());

  const addMessages = useCallback((arr, toEnd) => {
    setMessages((prev) => {
      const fresh = arr.filter((m) => !ids.current.has(String(m.id)));
      fresh.forEach((m) => ids.current.add(String(m.id)));
      return toEnd ? [...prev, ...fresh] : [...fresh, ...prev];
    });
  }, []);

  const loadPage = useCallback(async (p) => {
    const res = await chatApi.history(groupId, p, 20);
    setTotal(res.total);
    setPage(p);
    addMessages(res.data, true); // history is newest-first → append after current
  }, [groupId, addMessages]);

  useFocusEffect(useCallback(() => {
    let on = true;
    (async () => {
      try {
        const g = await groupsApi.get(groupId);
        if (on) setGroup(g.data);
        await loadPage(1);
      } catch {
        // ignore
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [groupId, loadPage]));

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('chat:join', groupId);
    const onMsg = (m) => { if (String(m.group) === String(groupId)) addMessages([m], false); };
    socket.on('chat:message', onMsg);
    return () => { socket.emit('chat:leave', groupId); socket.off('chat:message', onMsg); };
  }, [getSocket, groupId, addMessages]);

  const onEndReached = () => {
    if (loadingMore || loading || messages.length >= total) return;
    setLoadingMore(true);
    loadPage(page + 1).finally(() => setLoadingMore(false));
  };

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    try {
      const res = await chatApi.send(groupId, t);
      addMessages([res.data], false);
    } catch {
      setText(t);
    }
  };

  const booked = group && ['confirmed', 'in_progress', 'completed'].includes(group.status);
  const cd = group ? countdown(group.bookingDeadline) : { text: '', urgent: false };

  const renderItem = ({ item }) => {
    if (item.isSystemMessage) {
      return (
        <View className="flex-row items-center justify-center my-2" testID="chat-system-msg">
          <View className="flex-row items-center gap-1 bg-border/60 px-3 py-1.5 rounded-full">
            <Info size={12} color="#8A8A9A" />
            <Text className="text-[11px] text-text-3">{item.text}</Text>
          </View>
        </View>
      );
    }
    const mine = item.sender && String(item.sender.id) === String(user?.id);
    return (
      <View className={`px-4 my-1 ${mine ? 'items-end' : 'items-start'}`}>
        {!mine && item.sender ? <Text className="text-[11px] text-text-3 mb-0.5 ml-1">{item.sender.name}</Text> : null}
        <View className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl ${mine ? 'bg-primary rounded-br-md' : 'bg-white border border-border rounded-bl-md'}`}>
          <Text className={`text-[14px] ${mine ? 'text-white' : 'text-text'}`}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader title="Group Chat" testID="chat-header" />
      {/* Pinned ride info */}
      {group ? (
        <View className="mx-4 mt-2 mb-1 rounded-[14px] bg-primary-light p-3 border border-primary/20" testID="chat-pinned">
          <View className="flex-row justify-between mb-1">
            <Text className="text-[12px] text-text-3">Depart</Text>
            <Text className="text-[12px] font-bold text-text">~{formatTime(group.suggestedDeparture)}</Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-[12px] text-text-3">Book by</Text>
            <Text className={`text-[12px] font-bold ${cd.urgent ? 'text-accent' : 'text-text'}`}>{formatTime(group.bookingDeadline)} {cd.text ? `(${cd.text})` : ''}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-[12px] text-text-3">{group.vehicleSuggestion || 'UberX'} · per person</Text>
            <Text className="text-[12px] font-bold text-primary-dark">${group.perPerson}</Text>
          </View>
          {group.isCurrentUserBooker && !booked ? (
            <Pressable
              testID="chat-book-now"
              onPress={() => groupsApi.book(groupId).then(() => router.push({ pathname: '/fare-split', params: { groupId } }))}
              className="bg-primary rounded-lg py-2 items-center flex-row justify-center gap-1.5"
            >
              <TrendingDown size={14} color="#fff" />
              <Text className="text-[12px] font-bold text-white">Save ~{group.savingsPct}% · Book Now</Text>
            </Pressable>
          ) : booked ? (
            <Pressable
              testID="chat-book-now"
              onPress={() => router.push({ pathname: '/fare-split', params: { groupId } })}
              className="bg-white border border-primary rounded-lg py-2 items-center flex-row justify-center gap-1.5"
            >
              <Text className="text-[12px] font-bold text-primary-dark">View Fare Split</Text>
            </Pressable>
          ) : (
            <View className="rounded-lg py-2 items-center bg-white border border-border">
              <Text className="text-[12px] font-semibold text-text-3">Waiting for the booker to book the cab</Text>
            </View>
          )}
        </View>
      ) : null}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1" keyboardVerticalOffset={insets.top + 56}>
        {loading ? (
          <View className="flex-1 items-center justify-center"><ActivityIndicator color="#3AAFA9" /></View>
        ) : (
          <FlatList
            testID="chat-list"
            inverted
            data={messages}
            keyExtractor={(m) => String(m.id)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 10 }}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loadingMore ? <ActivityIndicator color="#3AAFA9" style={{ marginVertical: 12 }} /> : null}
          />
        )}
        <View className="flex-row items-center gap-2 px-3 py-2 bg-white border-t border-border" style={{ paddingBottom: insets.bottom + 8 }}>
          <TextInput
            testID="chat-input"
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor="#8A8A9A"
            className="flex-1 px-4 py-2.5 rounded-full bg-bg text-[14px] text-text"
            onSubmitEditing={send}
          />
          <Pressable testID="chat-send" onPress={send} className="w-10 h-10 rounded-full bg-primary items-center justify-center">
            <Send size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
