import { Node, mergeAttributes } from '@tiptap/core';

export interface TwitterEmbedOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    twitterEmbed: {
      /**
       * Insert a Twitter embed
       */
      setTwitterEmbed: (options: { tweetUrl: string }) => ReturnType;
    };
  }
}

export const TwitterEmbed = Node.create<TwitterEmbedOptions>({
  name: 'twitterEmbed',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      tweetUrl: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="twitter-embed"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const tweetUrl = node.getAttribute('data-tweet-url');
          return { tweetUrl };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { tweetUrl } = HTMLAttributes;
    
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'twitter-embed',
        'data-tweet-url': tweetUrl,
        class: 'embed-responsive embed-twitter',
      }),
      [
        'blockquote',
        {
          class: 'twitter-tweet',
          'data-theme': 'light',
        },
        [
          'a',
          {
            href: tweetUrl,
          },
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setTwitterEmbed:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

