import { Node, mergeAttributes } from '@tiptap/core';

export interface CalloutOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      /**
       * Insert a callout
       */
      setCallout: (options: { variant: 'note' | 'warning' | 'tip'; text: string }) => ReturnType;
    };
  }
}

export const Callout = Node.create<CalloutOptions>({
  name: 'callout',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  content: 'inline*',

  addAttributes() {
    return {
      variant: {
        default: 'note',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const variant = node.getAttribute('data-variant') || 'note';
          return { variant };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { variant } = HTMLAttributes;
    
    const variantStyles = {
      note: 'bg-neutral-50 border-neutral-200 text-neutral-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      tip: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    };

    const variantLabels = {
      note: 'Note',
      warning: 'Warning',
      tip: 'Tip',
    };

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'callout',
        'data-variant': variant,
        class: `mt-3 p-4 rounded-xl border ${variantStyles[variant as keyof typeof variantStyles] || variantStyles.note}`,
      }),
      [
        'p',
        {
          class: 'text-sm font-medium mb-2',
        },
        variantLabels[variant as keyof typeof variantLabels] || 'Note',
      ],
      [
        'div',
        {
          class: 'text-sm',
        },
        0,
      ],
    ];
  },

  addCommands() {
    return {
      setCallout:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { variant: options.variant },
            content: [
              {
                type: 'text',
                text: options.text,
              },
            ],
          });
        },
    };
  },
});

