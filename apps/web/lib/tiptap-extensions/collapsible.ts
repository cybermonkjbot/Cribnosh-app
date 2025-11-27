import { Node, mergeAttributes } from '@tiptap/core';

export interface CollapsibleOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    collapsible: {
      /**
       * Insert a collapsible section
       */
      setCollapsible: (options: { title: string; open?: boolean }) => ReturnType;
    };
  }
}

export const Collapsible = Node.create<CollapsibleOptions>({
  name: 'collapsible',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  content: 'block+',

  addAttributes() {
    return {
      title: {
        default: null,
      },
      open: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'details[data-type="collapsible"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const title = node.querySelector('summary')?.textContent || '';
          const open = node.hasAttribute('open');
          return { title, open };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { title, open } = HTMLAttributes;
    
    return [
      'details',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'collapsible',
        open: open ? 'open' : undefined,
        class: 'my-4 border border-gray-200 rounded-lg overflow-hidden',
      }),
      [
        'summary',
        {
          class: 'px-4 py-3 bg-gray-50 cursor-pointer font-medium hover:bg-gray-100 transition-colors',
        },
        title || 'Click to expand',
      ],
      [
        'div',
        {
          class: 'px-4 py-3',
        },
        0,
      ],
    ];
  },

  addCommands() {
    return {
      setCollapsible:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { title: options.title, open: options.open || false },
            content: [
              {
                type: 'paragraph',
              },
            ],
          });
        },
    };
  },
});

