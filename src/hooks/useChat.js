import { useState, useEffect, useRef, useCallback } from "react";
import { socket } from "../socket";
import API_URL from "../api";

/**
 * useChat — encapsulates all chat state and socket event management.
 * The ChatView should use this hook to get messages, send, etc.
 */
export function useChat({ activeChat, currentUserId, token }) {
  const [messages, setMessages] = useState([]);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMsgCount, setNewMsgCount] = useState(0);

  const activeChatRef = useRef(activeChat);
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // ── Load messages when chat changes ────────────────────────────
  useEffect(() => {
    if (!activeChat || !token) return;

    setMessages([]);
    setNewMsgCount(0);
    socket.emit("join_room", activeChat._id);

    const loadMessages = async () => {
      try {
        const res = await fetch(`${API_URL}/api/conversations/${activeChat._id}/messages`);
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages);
          // Mark as read
          socket.emit("message_seen", { roomId: activeChat._id });
        }
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };
    loadMessages();

    return () => { socket.emit("leave_room", activeChat._id); };
  }, [activeChat?._id, token]);

  // ── Socket event listeners ──────────────────────────────────────
  useEffect(() => {
    const onReceiveMessage = (msg) => {
      const isFromMe = (msg.senderId?._id || msg.senderId) === currentUserId;
      
      // Acknowledge delivery if received by recipient
      if (!isFromMe && msg._id) {
        socket.emit("message_delivered", {
          messageIds: [msg._id],
          conversationId: msg.conversationId,
          senderId: msg.senderId?._id || msg.senderId
        });
      }

      const isActive = activeChatRef.current && (msg.conversationId === activeChatRef.current._id || msg.conversationId?._id === activeChatRef.current._id);
      if (isActive) {
        setMessages(prev => {
          // Replace optimistic message if clientMessageId matches
          if (msg.clientMessageId) {
            const optimisticIdx = prev.findIndex(m => m._id === msg.clientMessageId || m.clientMessageId === msg.clientMessageId);
            if (optimisticIdx > -1) {
              const updated = [...prev];
              updated[optimisticIdx] = msg;
              return updated;
            }
          }
          // Avoid true duplicates
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        // If user is actively viewing at bottom, mark as seen
        if (isAtBottomRef.current && !isFromMe) {
          socket.emit("message_seen", { roomId: activeChatRef.current._id });
        } else if (!isFromMe) {
          setNewMsgCount(c => c + 1);
        }
      }
    };

    const onMessageDelivered = ({ roomId, messageIds = [] }) => {
      if (roomId && activeChatRef.current && roomId !== activeChatRef.current._id) return;
      setMessages(prev => prev.map(m => {
        const idMatch = messageIds.some(id => id.toString() === m._id?.toString() || (m.clientMessageId && id.toString() === m.clientMessageId));
        if (idMatch || (!roomId && !messageIds.length)) {
          if (m.status !== "seen" && m.status !== "read" && m.messageStatus !== "seen") {
            return { ...m, status: "delivered", messageStatus: "delivered" };
          }
        }
        return m;
      }));
    };

    const onMessageSeen = ({ roomId }) => {
      if (roomId && activeChatRef.current && roomId !== activeChatRef.current._id) return;
      setMessages(prev => prev.map(m => {
        const senderId = m.senderId?._id || m.senderId;
        if (senderId === currentUserId) {
          return { ...m, status: "seen", messageStatus: "seen" };
        }
        return m;
      }));
    };

    const onMessageRead = ({ roomId }) => {
      if (roomId && activeChatRef.current && roomId !== activeChatRef.current._id) return;
      setMessages(prev => prev.map(m => {
        const senderId = m.senderId?._id || m.senderId;
        if (senderId === currentUserId) {
          return { ...m, status: "seen", messageStatus: "seen" };
        }
        return m;
      }));
    };

    const onMessageEdited = (updatedMsg) => {
      setMessages(prev => prev.map(m => m._id === updatedMsg._id ? { ...m, ...updatedMsg } : m));
    };

    const onMessageDeleted = ({ _id }) => {
      setMessages(prev => prev.map(m => m._id === _id ? { ...m, isDeleted: true, text: "" } : m));
    };

    const onMessageReaction = ({ _id, reactions }) => {
      setMessages(prev => prev.map(m => m._id === _id ? { ...m, reactions } : m));
    };

    socket.on("receive_message", onReceiveMessage);
    socket.on("message_delivered", onMessageDelivered);
    socket.on("message_seen", onMessageSeen);
    socket.on("message_read", onMessageRead);
    socket.on("message_edited", onMessageEdited);
    socket.on("message_deleted", onMessageDeleted);
    socket.on("message_reaction", onMessageReaction);

    return () => {
      socket.off("receive_message", onReceiveMessage);
      socket.off("message_delivered", onMessageDelivered);
      socket.off("message_seen", onMessageSeen);
      socket.off("message_read", onMessageRead);
      socket.off("message_edited", onMessageEdited);
      socket.off("message_deleted", onMessageDeleted);
      socket.off("message_reaction", onMessageReaction);
    };
  }, [currentUserId]);

  // ── Track scroll position ───────────────────────────────────────
  const isAtBottomRef = useRef(true);
  const handleScroll = useCallback((e) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
    if (atBottom) setNewMsgCount(0);
  }, []);

  // ── Optimistic send ─────────────────────────────────────────────
  const sendMessage = useCallback(({ text, replyTo, attachment }) => {
    if (!activeChat) return;
    const clientMessageId = `temp-${Date.now()}-${Math.random()}`;
    const tempMsg = {
      _id: clientMessageId,
      clientMessageId,
      conversationId: activeChat._id,
      senderId: { _id: currentUserId },
      text: text || "",
      fileUrl: attachment?.fileUrl || "",
      fileType: attachment?.fileType || "text",
      fileName: attachment?.fileName || "",
      fileSize: attachment?.fileSize || 0,
      replyTo: replyTo || null,
      status: "sending",
      messageStatus: "sending",
      reactions: [],
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    socket.emit("send_message", {
      roomId: activeChat._id,
      text: text || "",
      fileUrl: attachment?.fileUrl || "",
      fileType: attachment?.fileType || "text",
      fileName: attachment?.fileName || "",
      fileSize: attachment?.fileSize || 0,
      replyTo: replyTo?._id || null,
      clientMessageId,
    });
  }, [activeChat, currentUserId]);

  // Mark failed messages and retry
  const retryMessage = useCallback((failedMsg) => {
    setMessages(prev => prev.filter(m => m._id !== failedMsg._id));
    sendMessage({
      text: failedMsg.text,
      replyTo: failedMsg.replyTo,
      attachment: failedMsg.fileUrl ? {
        fileUrl: failedMsg.fileUrl,
        fileType: failedMsg.fileType,
        fileName: failedMsg.fileName,
        fileSize: failedMsg.fileSize,
      } : null
    });
  }, [sendMessage]);

  // ── Edit message ────────────────────────────────────────────────
  const editMessage = useCallback(async (msgId, newText) => {
    try {
      await fetch(`${API_URL}/api/messages/${msgId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: newText }),
      });
    } catch (err) {
      console.error("Edit failed", err);
    }
  }, [token]);

  // ── Delete message ──────────────────────────────────────────────
  const deleteMessage = useCallback(async (msgId) => {
    try {
      await fetch(`${API_URL}/api/messages/${msgId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Delete failed", err);
    }
  }, [token]);

  // ── React to message ────────────────────────────────────────────
  const reactToMessage = useCallback(async (msgId, emoji) => {
    try {
      await fetch(`${API_URL}/api/messages/${msgId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ emoji }),
      });
    } catch (err) {
      console.error("React failed", err);
    }
  }, [token]);

  // ── Scroll to message by id ─────────────────────────────────────
  const scrollToMessage = useCallback((msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-[#6C48F5]/40");
    setTimeout(() => el.classList.remove("ring-2", "ring-[#6C48F5]/40"), 1500);
  }, []);

  // ── Mark read on scroll to bottom ──────────────────────────────
  const markReadNow = useCallback(() => {
    if (activeChat) {
      socket.emit("message_seen", { roomId: activeChat._id });
      setNewMsgCount(0);
    }
  }, [activeChat]);

  return {
    messages,
    isAtBottom,
    newMsgCount,
    handleScroll,
    sendMessage,
    retryMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    scrollToMessage,
    markReadNow,
  };
}
