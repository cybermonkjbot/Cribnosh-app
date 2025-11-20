import { useEffect, useRef, useState, useCallback } from 'react';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';
import { SupportMessage, SupportAgent } from '@/types/customer';

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

  // Loading states
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);
  const [isLoadingQuickReplies, setIsLoadingQuickReplies] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Error states
  const [chatError, setChatError] = useState<any>(null);
  const [messagesError, setMessagesError] = useState<any>(null);
  const [agentError, setAgentError] = useState<any>(null);
  const [quickRepliesError, setQuickRepliesError] = useState<any>(null);

  const lastMessageIdRef = useRef<string | null>(null);
  const lastAgentIdRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const agentPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Fetch support chat
  const fetchSupportChat = useCallback(async () => {
    if (!enabled) return;

    try {
      if (!isMountedRef.current) return;
      setIsLoadingChat(true);
      setChatError(null);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error('Not authenticated');
      }

      const result = await convex.action(api.actions.users.customerGetSupportChat, {
        sessionToken,
        caseId: caseId || undefined,
      });

      if (!isMountedRef.current) return;

      if (result.success === false) {
        throw new Error(result.error || 'Failed to get support chat');
      }

      if (!isInitializedRef.current) {
        setChatId(result.chatId);
        setSupportCaseId(result.supportCaseId);
        setMessages(result.messages || []);
        setAgent(result.agent);
        setIsInitialized(true);
        isInitializedRef.current = true;

        // Set initial refs
        if (result.messages && result.messages.length > 0) {
          const lastMessage = result.messages[result.messages.length - 1];
          lastMessageIdRef.current = lastMessage._id;
        }
        if (result.agent) {
          lastAgentIdRef.current = result.agent.id;
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch support chat:', error);
      if (isMountedRef.current) {
        setChatError(error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingChat(false);
      }
    }
  }, [enabled, caseId]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!enabled || !chatId) return;

    try {
      if (!isMountedRef.current) return;
      setIsLoadingMessages(true);
      setMessagesError(null);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error('Not authenticated');
      }

      const result = await convex.action(api.actions.users.customerGetSupportMessages, {
        sessionToken,
        limit: 100,
        offset: 0,
      });

      if (!isMountedRef.current) return;

      if (result.success === false) {
        throw new Error(result.error || 'Failed to get messages');
      }

      const newMessages = result.messages;

      // Check for new messages
      if (lastMessageIdRef.current) {
        const lastMessageIndex = newMessages.findIndex(
          (msg: SupportMessage) => msg._id === lastMessageIdRef.current
        );

        if (lastMessageIndex >= 0 && lastMessageIndex < newMessages.length - 1) {
          // New messages found
          const newMessagesFound = newMessages.slice(lastMessageIndex + 1);
          newMessagesFound.forEach((msg: SupportMessage) => {
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
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      if (isMountedRef.current) {
        setMessagesError(error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMessages(false);
      }
    }
  }, [enabled, chatId, onNewMessage]);

  // Fetch agent info
  const fetchAgent = useCallback(async () => {
    if (!enabled || !chatId) return;

    try {
      if (!isMountedRef.current) return;
      setIsLoadingAgent(true);
      setAgentError(null);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error('Not authenticated');
      }

      const result = await convex.action(api.actions.users.customerGetSupportAgent, {
        sessionToken,
      });

      if (!isMountedRef.current) return;

      if (result.success === false) {
        throw new Error(result.error || 'Failed to get agent info');
      }

      const newAgent = result.agent;

      // Check if agent changed
      if (lastAgentIdRef.current !== newAgent?.id) {
        if (onAgentChange) {
          onAgentChange(newAgent);
        }
        lastAgentIdRef.current = newAgent?.id || null;
      }

      setAgent(newAgent);
    } catch (error: any) {
      console.error('Failed to fetch agent:', error);
      if (isMountedRef.current) {
        setAgentError(error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingAgent(false);
      }
    }
  }, [enabled, chatId, onAgentChange]);

  // Fetch quick replies
  const fetchQuickReplies = useCallback(async () => {
    if (!enabled || !chatId) return;

    try {
      if (!isMountedRef.current) return;
      setIsLoadingQuickReplies(true);
      setQuickRepliesError(null);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error('Not authenticated');
      }

      const result = await convex.action(api.actions.users.customerGetQuickReplies, {
        sessionToken,
      });

      if (!isMountedRef.current) return;

      if (result.success === false) {
        throw new Error(result.error || 'Failed to get quick replies');
      }

      setQuickReplies(result.replies.map((reply: { text: string }) => reply.text));
    } catch (error: any) {
      console.error('Failed to fetch quick replies:', error);
      if (isMountedRef.current) {
        setQuickRepliesError(error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingQuickReplies(false);
      }
    }
  }, [enabled, chatId]);

  // Reset initialization when caseId changes
  useEffect(() => {
    if (caseId) {
      setIsInitialized(false);
      isInitializedRef.current = false;
      setChatId(null);
      setSupportCaseId(null);
      setMessages([]);
      setAgent(null);
    }
  }, [caseId]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchSupportChat();
    }
  }, [enabled, caseId, fetchSupportChat]); // Only fetch when enabled or caseId changes

  // Set up polling for messages
  useEffect(() => {
    if (enabled && chatId) {
      // Initial fetch
      fetchMessages();

      // Set up polling
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages();
      }, pollingInterval);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [enabled, chatId, pollingInterval, fetchMessages]);

  // Set up polling for agent (less frequent)
  useEffect(() => {
    if (enabled && chatId) {
      // Initial fetch
      fetchAgent();

      // Set up polling (less frequent)
      agentPollingIntervalRef.current = setInterval(() => {
        fetchAgent();
      }, pollingInterval * 2);

      return () => {
        if (agentPollingIntervalRef.current) {
          clearInterval(agentPollingIntervalRef.current);
        }
      };
    }
  }, [enabled, chatId, pollingInterval, fetchAgent]);

  // Fetch quick replies once when chat is initialized
  useEffect(() => {
    if (enabled && chatId && isInitialized) {
      fetchQuickReplies();
    }
  }, [enabled, chatId, isInitialized, fetchQuickReplies]);

  // Send message function
  const sendSupportMessage = useCallback(async (content: string): Promise<boolean> => {
    try {
      if (!isMountedRef.current) return false;
      setIsSendingMessage(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error('Not authenticated');
      }

      const result = await convex.action(api.actions.users.customerSendSupportMessage, {
        sessionToken,
        content,
      });

      if (!isMountedRef.current) return false;

      if (result.success === false) {
        throw new Error(result.error || 'Failed to send message');
      }

      // Refetch messages to get the new message
      await fetchMessages();
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsSendingMessage(false);
      }
    }
  }, [fetchMessages]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchSupportChat(),
      chatId && fetchMessages(),
      chatId && fetchAgent(),
      chatId && fetchQuickReplies(),
    ]);
  }, [fetchSupportChat, fetchMessages, fetchAgent, fetchQuickReplies, chatId]);

  // Cleanup polling intervals and mounted ref on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (agentPollingIntervalRef.current) {
        clearInterval(agentPollingIntervalRef.current);
      }
    };
  }, []);

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

