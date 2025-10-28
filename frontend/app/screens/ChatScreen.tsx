import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Constants from "@/constants/Constants";
import { useSession } from "@/components/SessionContext";
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToConversation,
} from "@/app/utils/messagingService";
import * as types from "@/app/utils/types";

type ChatScreenRouteProp = RouteProp<
  {
    Chat: {
      conversationId: string;
      otherUser: types.UserProfile;
      shareEvent?: types.Event;
      shareClub?: types.Club;
    };
  },
  "Chat"
>;

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute<ChatScreenRouteProp>();
  const session = useSession();
  const { conversationId, otherUser, shareEvent, shareClub } = route.params;

  const [messages, setMessages] = useState<types.Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    markAsRead();
  }, [conversationId]);

  useEffect(() => {
    if (session?.user) {
      // Subscribe to new messages
      const subscription = subscribeToConversation(
        conversationId,
        (message) => {
          setMessages((prev) => [...prev, message]);
          // Auto-scroll to bottom when new message arrives
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [conversationId, session?.user]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!session?.user) return;
    await markMessagesAsRead(conversationId, session.user.id);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !session?.user || sending) return;

    const messageContent = messageText.trim();
    setMessageText("");
    setSending(true);

    try {
      const newMessage = await sendMessage(
        conversationId,
        session.user.id,
        messageContent
      );

      if (newMessage) {
        setMessages((prev) => [...prev, newMessage]);
        // Scroll to bottom after sending
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
      setMessageText(messageContent); // Restore message text
    } finally {
      setSending(false);
    }
  };

  const handleShareEvent = async () => {
    if (!session?.user || !shareEvent) return;

    setSending(true);
    try {
      await sendMessage(
        conversationId,
        session.user.id,
        `Check out this event: ${shareEvent.title}`,
        "event_share",
        shareEvent.id
      );
      // Navigate back to clear sharing context
      navigation.goBack();
    } catch (error) {
      console.error("Error sharing event:", error);
      Alert.alert("Error", "Failed to share event");
    } finally {
      setSending(false);
    }
  };

  const handleShareClub = async () => {
    if (!session?.user || !shareClub) return;

    setSending(true);
    try {
      await sendMessage(
        conversationId,
        session.user.id,
        `Check out this club: ${shareClub.Name}`,
        "club_share",
        undefined,
        shareClub.id
      );
      // Navigate back to clear sharing context
      navigation.goBack();
    } catch (error) {
      console.error("Error sharing club:", error);
      Alert.alert("Error", "Failed to share club");
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: string): string => {
    const messageTime = new Date(timestamp);
    const now = new Date();
    const diffInHours =
      (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return messageTime.toLocaleDateString();
    }
  };

  const renderMessage = ({ item }: { item: types.Message }) => {
    const isOwnMessage = item.sender_id === session?.user?.id;
    const showAvatar = !isOwnMessage;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage
            ? styles.ownMessageContainer
            : styles.otherMessageContainer,
        ]}
      >
        {showAvatar && (
          <View style={styles.avatarContainer}>
            {otherUser.avatar_url ? (
              <Image
                source={{ uri: otherUser.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {otherUser.first_name?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
            )}
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
          >
            {item.content}
          </Text>

          <Text
            style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
            ]}
          >
            {formatMessageTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Constants.blackCOLOR}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Constants.purpleCOLOR} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Constants.blackCOLOR}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Constants.whiteCOLOR} />
        </TouchableOpacity>

        <View style={styles.headerUserInfo}>
          <Text style={styles.headerUserName}>
            {otherUser.first_name} {otherUser.last_name}
          </Text>
          <Text style={styles.headerUserStatus}>Online</Text>
        </View>

        <TouchableOpacity>
          <Ionicons
            name="call-outline"
            size={24}
            color={Constants.whiteCOLOR}
          />
        </TouchableOpacity>
      </View>

      {/* Sharing Banner */}
      {(shareEvent || shareClub) && (
        <View style={styles.sharingBanner}>
          <View style={styles.sharingContent}>
            <Ionicons
              name="share-outline"
              size={20}
              color={Constants.purpleCOLOR}
            />
            <Text style={styles.sharingText}>
              {shareEvent
                ? `Sharing: ${shareEvent.title}`
                : `Sharing: ${shareClub?.Name}`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={shareEvent ? handleShareEvent : handleShareClub}
            style={styles.shareButton}
            disabled={sending}
          >
            <Text style={styles.shareButtonText}>
              {sending ? "Sharing..." : "Share"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages List */}
      <KeyboardAvoidingView
        style={styles.messagesContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No messages yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start the conversation!
              </Text>
            </View>
          }
        />

        {/* Message Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              placeholderTextColor={Constants.greyCOLOR}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!messageText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={Constants.whiteCOLOR} />
              ) : (
                <Ionicons name="send" size={20} color={Constants.whiteCOLOR} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Constants.blackCOLOR,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  sharingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(138, 43, 226, 0.1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(138, 43, 226, 0.2)",
  },
  sharingContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sharingText: {
    fontSize: 14,
    color: Constants.whiteCOLOR,
    marginLeft: 8,
    fontWeight: "500",
  },
  shareButton: {
    backgroundColor: Constants.purpleCOLOR,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shareButtonText: {
    color: Constants.whiteCOLOR,
    fontSize: 14,
    fontWeight: "600",
  },
  headerUserInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerUserName: {
    fontSize: 18,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
  },
  headerUserStatus: {
    fontSize: 14,
    color: Constants.greyCOLOR,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 4,
  },
  ownMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginRight: 8,
    marginTop: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Constants.purpleCOLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  ownMessageBubble: {
    backgroundColor: Constants.purpleCOLOR,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: Constants.whiteCOLOR,
  },
  otherMessageText: {
    color: Constants.whiteCOLOR,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  ownMessageTime: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },
  otherMessageTime: {
    color: Constants.greyCOLOR,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: Constants.whiteCOLOR,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    backgroundColor: Constants.purpleCOLOR,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Constants.greyCOLOR,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Constants.greyCOLOR,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: Constants.whiteCOLOR,
    fontSize: 16,
    marginTop: 12,
  },
});
