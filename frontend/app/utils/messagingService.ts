import { supabase } from "./supabaseService";
import * as types from "./types";

// ===== CONVERSATION FUNCTIONS =====

export async function getConversations(
  userId: string
): Promise<types.Conversation[]> {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        participants!conversation_participants(
          *,
          user:profiles(*)
        )
      `
      )
      .in("participants.user_id", [userId])
      .eq("participants.is_active", true)
      .order("last_message_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
}

export async function getConversation(
  conversationId: string
): Promise<types.Conversation | null> {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        participants!conversation_participants(
          *,
          user:profiles(*)
        )
      `
      )
      .eq("id", conversationId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return null;
  }
}

export async function createDMConversation(
  user1Id: string,
  user2Id: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("create_dm_conversation", {
      user1_id: user1Id,
      user2_id: user2Id,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating DM conversation:", error);
    return null;
  }
}

export async function getDMConversation(
  user1Id: string,
  user2Id: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("get_dm_conversation", {
      user1_id: user1Id,
      user2_id: user2Id,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting DM conversation:", error);
    return null;
  }
}

// ===== MESSAGE FUNCTIONS =====

export async function getMessages(
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<types.Message[]> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        *,
        sender:profiles(*),
        shared_event:events(*),
        shared_club:Clubs(*),
        reply_to_message:messages(*)
      `
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data || []).reverse(); // Reverse to show oldest first
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  messageType: types.Message["message_type"] = "text",
  sharedEventId?: string,
  sharedClubId?: string,
  imageUrl?: string,
  replyToMessageId?: string
): Promise<types.Message | null> {
  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
        shared_event_id: sharedEventId,
        shared_club_id: sharedClubId,
        image_url: imageUrl,
        reply_to_message_id: replyToMessageId,
      })
      .select(
        `
        *,
        sender:profiles(*),
        shared_event:events(*),
        shared_club:Clubs(*),
        reply_to_message:messages(*)
      `
      )
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
}

export async function editMessage(
  messageId: string,
  newContent: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("messages")
      .update({
        content: newContent,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error editing message:", error);
    return false;
  }
}

export async function deleteMessage(messageId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting message:", error);
    return false;
  }
}

export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("conversation_participants")
      .update({
        last_read_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return false;
  }
}

// ===== EVENT INVITATION FUNCTIONS =====

export async function getEventInvitations(
  userId: string
): Promise<types.EventInvitation[]> {
  try {
    const { data, error } = await supabase
      .from("event_invitations")
      .select(
        `
        *,
        event:events(*),
        inviter:profiles(*),
        invitee:profiles(*)
      `
      )
      .eq("invitee_id", userId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching event invitations:", error);
    return [];
  }
}

export async function sendEventInvitation(
  eventId: string,
  inviterId: string,
  inviteeId: string,
  message?: string
): Promise<types.EventInvitation | null> {
  try {
    const { data, error } = await supabase
      .from("event_invitations")
      .insert({
        event_id: eventId,
        inviter_id: inviterId,
        invitee_id: inviteeId,
        message,
      })
      .select(
        `
        *,
        event:events(*),
        inviter:profiles(*),
        invitee:profiles(*)
      `
      )
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error sending event invitation:", error);
    return null;
  }
}

export async function respondToEventInvitation(
  invitationId: string,
  status: "accepted" | "declined"
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("event_invitations")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error responding to event invitation:", error);
    return false;
  }
}

export async function cancelEventInvitation(
  invitationId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("event_invitations")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error cancelling event invitation:", error);
    return false;
  }
}

// ===== USER SEARCH FUNCTIONS =====

export async function searchUsers(
  query: string,
  currentUserId: string
): Promise<types.UserProfile[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", currentUserId)
      .or(
        `username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`
      )
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
}

// ===== REALTIME SUBSCRIPTIONS =====

export function subscribeToConversation(
  conversationId: string,
  onMessage: (message: types.Message) => void
) {
  return supabase
    .channel(`conversation:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const message = payload.new as types.Message;
        // Fetch the full message with relations
        const { data } = await supabase
          .from("messages")
          .select(
            `
            *,
            sender:profiles(*),
            shared_event:events(*),
            shared_club:Clubs(*),
            reply_to_message:messages(*)
          `
          )
          .eq("id", message.id)
          .single();

        if (data) {
          onMessage(data);
        }
      }
    )
    .subscribe();
}

export function subscribeToUserConversations(
  userId: string,
  onConversationUpdate: (conversation: types.Conversation) => void
) {
  return supabase
    .channel(`user_conversations:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "conversations",
      },
      async (payload) => {
        const conversation = payload.new as types.Conversation;
        // Check if user is a participant
        const { data: participant } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", conversation.id)
          .eq("user_id", userId)
          .eq("is_active", true)
          .single();

        if (participant) {
          onConversationUpdate(conversation);
        }
      }
    )
    .subscribe();
}

export function subscribeToEventInvitations(
  userId: string,
  onInvitation: (invitation: types.EventInvitation) => void
) {
  return supabase
    .channel(`event_invitations:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "event_invitations",
        filter: `invitee_id=eq.${userId}`,
      },
      async (payload) => {
        const invitation = payload.new as types.EventInvitation;
        // Fetch the full invitation with relations
        const { data } = await supabase
          .from("event_invitations")
          .select(
            `
            *,
            event:events(*),
            inviter:profiles(*),
            invitee:profiles(*)
          `
          )
          .eq("id", invitation.id)
          .single();

        if (data) {
          onInvitation(data);
        }
      }
    )
    .subscribe();
}
