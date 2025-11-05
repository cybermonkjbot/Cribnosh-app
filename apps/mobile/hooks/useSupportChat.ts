import { useEffect, useRef, useState } from 'react';
import { useGetSupportChatQuery, useGetSupportChatMessagesQuery, useSendSupportMessageMutation, useGetSupportAgentQuery, useGetQuickRepliesQuery } from '../store/customerApi';
import { SupportMessage, SupportAgent } from '../types/customer';

interface UseSupportChatOptions {
  enabled?: boolean;
  pollingInterval?: number;
  caseId?: string; // Optional: specific support case ID to load
  onNewMessage?: (message: SupportMessage) => void;
  onAgentChange?: (agent: SupportAgent | null) => void;
}

export function useSupportChat(options: UseSupportChatOptions = {}) {
  const {
    enabled = true,
    pollingInterval = 5000, // 5 seconds
    caseId,
    onNewMessage,
    onAgentChange,
  } = options;

  const [chatId, setChatId] = useState<string | null>(null);
  const [supportCaseId, setSupportCaseId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [agent, setAgent] = useState<SupportAgent | null>(null);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const lastMessageIdRef = useRef<string | null>(null);
  const lastAgentIdRef = useRef<string | null>(null);

  // Get or create support chat
  const {
    data: chatData,
    isLoading: isLoadingChat,
    error: chatError,
    refetch: refetchChat,
  } = useGetSupportChatQuery(caseId ? { caseId } : undefined, {
    skip: !enabled,
    refetchOnMountOrArgChange: true,
  });

  // Get messages
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages,
  } = useGetSupportChatMessagesQuery(
    { limit: 100, offset: 0 },
    {
      skip: !chatId || !enabled,
      pollingInterval: chatId ? pollingInterval : 0,
    }
  );

  // Get agent info
  const {
    data: agentData,
    isLoading: isLoadingAgent,
    error: agentError,
    refetch: refetchAgent,
  } = useGetSupportAgentQuery(undefined, {
    skip: !chatId || !enabled,
    pollingInterval: chatId ? pollingInterval * 2 : 0, // Poll less frequently
  });

  // Get quick replies
  const {
    data: quickRepliesData,
    isLoading: isLoadingQuickReplies,
    error: quickRepliesError,
    refetch: refetchQuickReplies,
  } = useGetQuickRepliesQuery(undefined, {
    skip: !chatId || !enabled,
  });

  // Send message mutation
  const [sendMessage, { isLoading: isSendingMessage }] = useSendSupportMessageMutation();

  // Initialize chat data
  useEffect(() => {
    if (chatData?.data && !isInitialized) {
      setChatId(chatData.data.chatId);
      setSupportCaseId(chatData.data.supportCaseId);
      setMessages(chatData.data.messages || []);
      setAgent(chatData.data.agent);
      setIsInitialized(true);

      // Set initial refs
      if (chatData.data.messages && chatData.data.messages.length > 0) {
        const lastMessage = chatData.data.messages[chatData.data.messages.length - 1];
        lastMessageIdRef.current = lastMessage._id;
      }
      if (chatData.data.agent) {
        lastAgentIdRef.current = chatData.data.agent.id;
      }
    }
  }, [chatData, isInitialized]);

  // Update messages from polling
  useEffect(() => {
    if (messagesData?.data?.messages) {
      const newMessages = messagesData.data.messages;
      
      // Check for new messages
      if (lastMessageIdRef.current) {
        const lastMessageIndex = newMessages.findIndex(
          (msg) => msg._id === lastMessageIdRef.current
        );
        
        if (lastMessageIndex >= 0 && lastMessageIndex < newMessages.length - 1) {
          // New messages found
          const newMessagesFound = newMessages.slice(lastMessageIndex + 1);
          newMessagesFound.forEach((msg) => {
            if (onNewMessage) {
              onNewMessage(msg);
            }
          });
        }
      } else if (newMessages.length > 0) {
        // First time loading messages
        const lastMessage = newMessages[newMessages.length - 1];
        lastMessageIdRef.current = lastMessage._id;
      }

      setMessages(newMessages);
      
      // Update last message ID
      if (newMessages.length > 0) {
        const lastMessage = newMessages[newMessages.length - 1];
        lastMessageIdRef.current = lastMessage._id;
      }
    }
  }, [messagesData, onNewMessage]);

  // Update agent info
  useEffect(() => {
    if (agentData?.data?.agent !== undefined) {
      const newAgent = agentData.data.agent;
      
      // Check if agent changed
      if (lastAgentIdRef.current !== newAgent?.id) {
        if (onAgentChange) {
          onAgentChange(newAgent);
        }
        lastAgentIdRef.current = newAgent?.id || null;
      }
      
      setAgent(newAgent);
    }
  }, [agentData, onAgentChange]);

  // Update quick replies
  useEffect(() => {
    if (quickRepliesData?.data?.replies) {
      setQuickReplies(quickRepliesData.data.replies.map((reply) => reply.text));
    }
  }, [quickRepliesData]);

  // Send message function
  const sendSupportMessage = async (content: string): Promise<boolean> => {
    try {
      const result = await sendMessage({ content }).unwrap();
      if (result.success) {
        // Refetch messages to get the new message
        await refetchMessages();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  };

  // Manual refresh function
  const refresh = async () => {
    await Promise.all([
      refetchChat(),
      chatId && refetchMessages(),
      chatId && refetchAgent(),
      chatId && refetchQuickReplies(),
    ]);
  };

  return {
    // State
    chatId,
    supportCaseId,
    messages,
    agent,
    quickReplies,
    isInitialized,

    // Loading states
    isLoading: isLoadingChat || isLoadingMessages || isLoadingAgent,
    isLoadingChat,
    isLoadingMessages,
    isLoadingAgent,
    isLoadingQuickReplies,
    isSendingMessage,

    // Errors
    error: chatError || messagesError || agentError || quickRepliesError,
    chatError,
    messagesError,
    agentError,
    quickRepliesError,

    // Actions
    sendMessage: sendSupportMessage,
    refresh,
  };
}

