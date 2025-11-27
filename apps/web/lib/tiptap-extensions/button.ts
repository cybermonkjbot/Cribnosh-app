import { Node, mergeAttributes } from '@tiptap/core';

export interface ButtonOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    button: {
      /**
       * Insert a button
       */
      setButton: (options: { href: string; text: string; variant?: 'primary' | 'secondary' | 'outline'; target?: '_blank' | '_self' }) => ReturnType;
    };
  }
}

export const Button = Node.create<ButtonOptions>({
  name: 'button',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  atom: false,

  content: 'text*',

  addAttributes() {
    return {
      href: {
        default: null,
      },
      variant: {
        default: 'primary',
      },
      target: {
        default: '_self',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-type="button"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const href = node.getAttribute('href');
          const variant = node.getAttribute('data-variant') || 'primary';
          const target = node.getAttribute('target') || '_self';
          return { href, variant, target };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { href, variant, target } = HTMLAttributes;
    
    const variantClasses = {
      primary: 'bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
      outline: 'border-2 border-[#F23E2E] text-[#F23E2E] hover:bg-[#F23E2E]/10',
    };

    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'button',
        href,
        target,
        'data-variant': variant,
        class: `inline-block px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.primary}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setButton:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { href: options.href, variant: options.variant || 'primary', target: options.target || '_self' },
            content: [
              {
                type: 'text',
                text: options.text || 'Button',
              },
            ],
          });
        },
    };
  },
});

