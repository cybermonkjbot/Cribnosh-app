/**
 * Quick reply suggestions for support chat
 * Returns contextual suggestions based on conversation context
 */

export interface QuickReply {
  text: string;
  category: 'order' | 'payment' | 'account' | 'technical' | 'general';
}

/**
 * Get static quick reply suggestions
 * In the future, this can be made dynamic based on conversation context
 */
export function getQuickReplies(context?: {
  category?: string;
  recentMessages?: string[];
}): QuickReply[] {
  // Default quick replies
  const defaultReplies: QuickReply[] = [
    { text: 'Order status', category: 'order' },
    { text: 'Payment issue', category: 'payment' },
    { text: 'Account problem', category: 'account' },
    { text: 'Technical support', category: 'technical' },
  ];

  // If we have context, we can customize suggestions
  if (context?.category) {
    const categoryReplies: Record<string, QuickReply[]> = {
      order: [
        { text: 'Order status', category: 'order' },
        { text: 'Delivery issue', category: 'order' },
        { text: 'Refund request', category: 'order' },
        { text: 'Cancel order', category: 'order' },
      ],
      payment: [
        { text: 'Payment issue', category: 'payment' },
        { text: 'Refund request', category: 'payment' },
        { text: 'Payment method', category: 'payment' },
        { text: 'Billing question', category: 'payment' },
      ],
      account: [
        { text: 'Account problem', category: 'account' },
        { text: 'Password reset', category: 'account' },
        { text: 'Profile update', category: 'account' },
        { text: 'Delete account', category: 'account' },
      ],
      technical: [
        { text: 'Technical support', category: 'technical' },
        { text: 'App issue', category: 'technical' },
        { text: 'Bug report', category: 'technical' },
        { text: 'Feature request', category: 'technical' },
      ],
    };

    return categoryReplies[context.category] || defaultReplies;
  }

  // Analyze recent messages for context (future enhancement)
  if (context?.recentMessages && context.recentMessages.length > 0) {
    const recentText = context.recentMessages.join(' ').toLowerCase();
    
    // Check for keywords to suggest relevant replies
    if (recentText.includes('order') || recentText.includes('delivery')) {
      return [
        { text: 'Order status', category: 'order' },
        { text: 'Delivery issue', category: 'order' },
        { text: 'Refund request', category: 'order' },
      ];
    }
    
    if (recentText.includes('payment') || recentText.includes('refund') || recentText.includes('charge')) {
      return [
        { text: 'Payment issue', category: 'payment' },
        { text: 'Refund request', category: 'payment' },
        { text: 'Billing question', category: 'payment' },
      ];
    }
    
    if (recentText.includes('account') || recentText.includes('profile') || recentText.includes('password')) {
      return [
        { text: 'Account problem', category: 'account' },
        { text: 'Password reset', category: 'account' },
        { text: 'Profile update', category: 'account' },
      ];
    }
  }

  return defaultReplies;
}

