import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Constants from "@/constants/Constants";
import { useSession } from "@/components/SessionContext";
import {
  getConversations,
  searchUsers,
  createDMConversation,
  subscribeToUserConversations,
} from "@/app/utils/messagingService";
import * as types from "@/app/utils/types";

type DMScreenRouteProp = RouteProp<
  {
    DMScreen: {
      shareEvent?: types.Event;
      shareClub?: types.Club;
    };
  },
  "DMScreen"
>;

export default function DMScreen() {
  const navigation = useNavigation();
  const route = useRoute<DMScreenRouteProp>();
  const session = useSession();
  const { shareEvent, shareClub } = route.params || {};
  const [conversations, setConversations] = useState<types.Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<types.UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadConversations();
    }
  }, [session?.user]);

  useEffect(() => {
    if (session?.user) {
      // Subscribe to conversation updates
      const subscription = subscribeToUserConversations(
        session.user.id,
        (conversation) => {
          setConversations((prev) => {
            const existingIndex = prev.findIndex(
              (c) => c.id === conversation.id
            );
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = conversation;
              return updated.sort(
                (a, b) =>
                  new Date(b.last_message_at).getTime() -
                  new Date(a.last_message_at).getTime()
              );
            } else {
              return [conversation, ...prev].sort(
                (a, b) =>
                  new Date(b.last_message_at).getTime() -
                  new Date(a.last_message_at).getTime()
              );
            }
          });
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [session?.user]);

  const loadConversations = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      const data = await getConversations(session.user.id);
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!session?.user || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchUsers(query, session.user.id);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const startConversation = async (user: types.UserProfile) => {
    if (!session?.user) return;

    try {
      const conversationId = await createDMConversation(
        session.user.id,
        user.id
      );
      if (conversationId) {
        // Navigate to chat screen
        navigation.navigate("Chat", {
          conversationId,
          otherUser: user,
        });
        setShowSearch(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      Alert.alert("Error", "Failed to start conversation");
    }
  };

  const getOtherParticipant = (
    conversation: types.Conversation
  ): types.UserProfile | null => {
    if (!session?.user || !conversation.participants) return null;

    const otherParticipant = conversation.participants.find(
      (p) => p.user_id !== session.user.id && p.is_active
    );

    return otherParticipant?.user || null;
  };

  const formatLastMessageTime = (timestamp: string): string => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours =
      (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 168) {
      // 7 days
      return `${Math.floor(diffInHours / 24)}d`;
    } else {
      return messageTime.toLocaleDateString();
    }
  };

  const renderConversationItem = ({ item }: { item: types.Conversation }) => {
    const otherUser = getOtherParticipant(item);
    if (!otherUser) return null;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => {
          navigation.navigate("Chat", {
            conversationId: item.id,
            otherUser,
            shareEvent,
            shareClub,
          });
        }}
      >
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

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>
              {otherUser.first_name} {otherUser.last_name}
            </Text>
            <Text style={styles.timestamp}>
              {formatLastMessageTime(item.last_message_at)}
            </Text>
          </View>

          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message_content || "No messages yet"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchResult = ({ item }: { item: types.UserProfile }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => startConversation(item)}
    >
      <View style={styles.avatarContainer}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {item.first_name?.charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.searchResultContent}>
        <Text style={styles.userName}>
          {item.first_name} {item.last_name}
        </Text>
        <Text style={styles.username}>@{item.username}</Text>
      </View>

      <Ionicons
        name="chatbubble-outline"
        size={20}
        color={Constants.purpleCOLOR}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Constants.blackCOLOR}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Constants.purpleCOLOR} />
          <Text style={styles.loadingText}>Loading conversations...</Text>
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
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          onPress={() => setShowSearch(!showSearch)}
          style={styles.searchButton}
        >
          <Ionicons
            name={showSearch ? "close" : "search"}
            size={24}
            color={Constants.whiteCOLOR}
          />
        </TouchableOpacity>
      </View>

      {/* Sharing Context Banner */}
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
            onPress={() => navigation.goBack()}
            style={styles.cancelShareButton}
          >
            <Ionicons name="close" size={20} color={Constants.whiteCOLOR} />
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for users..."
            placeholderTextColor={Constants.greyCOLOR}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearch(text);
            }}
            autoFocus
          />
        </View>
      )}

      {/* Search Results */}
      {showSearch && searchQuery.length > 0 && (
        <View style={styles.searchResultsContainer}>
          {searching ? (
            <View style={styles.searchLoading}>
              <ActivityIndicator size="small" color={Constants.purpleCOLOR} />
              <Text style={styles.searchLoadingText}>Searching...</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={renderSearchResult}
              style={styles.searchResultsList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}

      {/* Conversations List */}
      {!showSearch && (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          style={styles.conversationsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="chatbubbles-outline"
                size={64}
                color={Constants.greyCOLOR}
              />
              <Text style={styles.emptyStateTitle}>No conversations yet</Text>
              <Text style={styles.emptyStateText}>
                Start a conversation by searching for a user above
              </Text>
            </View>
          }
        />
      )}
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
    justifyContent: "space-between",
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
  cancelShareButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Constants.whiteCOLOR,
  },
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  searchInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Constants.whiteCOLOR,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  searchResultsContainer: {
    flex: 1,
    backgroundColor: Constants.blackCOLOR,
  },
  searchResultsList: {
    flex: 1,
  },
  searchLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  searchLoadingText: {
    color: Constants.greyCOLOR,
    fontSize: 14,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  searchResultContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Constants.purpleCOLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: "bold",
    color: Constants.whiteCOLOR,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
  },
  username: {
    fontSize: 14,
    color: Constants.greyCOLOR,
  },
  timestamp: {
    fontSize: 12,
    color: Constants.greyCOLOR,
  },
  lastMessage: {
    fontSize: 14,
    color: Constants.greyCOLOR,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Constants.whiteCOLOR,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: Constants.greyCOLOR,
    textAlign: "center",
    lineHeight: 22,
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
