import { Node, mergeAttributes } from '@tiptap/core';

export interface TikTokEmbedOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tiktokEmbed: {
      /**
       * Insert a TikTok embed
       */
      setTikTokEmbed: (options: { videoId: string; url: string }) => ReturnType;
    };
  }
}

export const TikTokEmbed = Node.create<TikTokEmbedOptions>({
  name: 'tiktokEmbed',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      videoId: {
        default: null,
      },
      url: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="tiktok-embed"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const videoId = node.getAttribute('data-video-id');
          const url = node.getAttribute('data-url');
          return { videoId, url };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { videoId, url } = HTMLAttributes;
    
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'tiktok-embed',
        'data-video-id': videoId,
        'data-url': url,
        class: 'embed-responsive embed-tiktok',
      }),
      [
        'blockquote',
        {
          class: 'tiktok-embed',
          cite: url,
          'data-video-id': videoId,
        },
        [
          'section',
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setTikTokEmbed:
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

