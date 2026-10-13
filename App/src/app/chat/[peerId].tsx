import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';
import {
  getChatThreadRequest,
  sendChatMessageRequest,
  type ChatMessage,
} from '@/lib/api';

export default function DoctorChatScreen() {
  const { peerId, name, specialty } = useLocalSearchParams<{
    peerId: string;
    name?: string;
    specialty?: string;
  }>();
  const { accessToken, user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken || !peerId) {
      setLoading(false);
      return;
    }
    try {
      const thread = await getChatThreadRequest(peerId, accessToken);
      setMessages(thread);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, peerId]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/sign-in' as Href);
      return;
    }
    load();
  }, [isAuthenticated, load]);

  async function onSend() {
    const body = text.trim();
    if (!body || !accessToken || !peerId || sending) return;
    setSending(true);
    try {
      const sent = await sendChatMessageRequest(
        {
          recipientId: peerId,
          recipientType: 'CLINICIAN',
          subject: name ? `Chat with ${name}` : 'Doctor chat',
          body,
        },
        accessToken,
      );
      setMessages((prev) => [...prev, sent]);
      setText('');
    } catch {
      /* keep draft */
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 8}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            borderBottomColor: theme.border,
            backgroundColor: theme.backgroundElement,
          },
        ]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={theme.brandDark} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.brandDark }]} numberOfLines={1}>
            {name || 'Doctor'}
          </Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]} numberOfLines={1}>
            {specialty || 'Secure chat'}
          </Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Brand.primary} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.messageid}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              Start the conversation — your clinician will reply here.
            </Text>
          }
          renderItem={({ item }) => {
            const mine = item.senderId === user?.userid;
            return (
              <View
                style={[
                  styles.bubble,
                  mine ? styles.mine : styles.theirs,
                  {
                    backgroundColor: mine ? Brand.primary : theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}>
                <Text style={{ color: mine ? '#fff' : theme.brandDark, fontFamily: Fonts.regular }}>
                  {item.body}
                </Text>
                <Text
                  style={[
                    styles.time,
                    { color: mine ? 'rgba(255,255,255,0.75)' : theme.textSecondary },
                  ]}>
                  {new Date(item.createdAt).toLocaleTimeString(undefined, {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          }}
        />
      )}

      <View
        style={[
          styles.composer,
          {
            paddingBottom: insets.bottom + 10,
            borderTopColor: theme.border,
            backgroundColor: theme.backgroundElement,
          },
        ]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write a message…"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            {
              color: theme.brandDark,
              borderColor: theme.border,
              backgroundColor: theme.background,
            },
          ]}
          multiline
        />
        <Pressable
          onPress={onSend}
          disabled={sending || !text.trim()}
          style={[
            styles.send,
            { opacity: sending || !text.trim() ? 0.5 : 1 },
          ]}>
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.three,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { fontFamily: Fonts.bold, fontSize: 17 },
  sub: { fontFamily: Fonts.regular, fontSize: 12, marginTop: 2 },
  list: { padding: Spacing.three, gap: 8, flexGrow: 1 },
  empty: {
    textAlign: 'center',
    marginTop: 48,
    fontFamily: Fonts.medium,
    fontSize: 14,
    paddingHorizontal: 24,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  mine: { alignSelf: 'flex-end' },
  theirs: { alignSelf: 'flex-start' },
  time: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: Fonts.regular,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: Spacing.three,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Fonts.regular,
    fontSize: 15,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
