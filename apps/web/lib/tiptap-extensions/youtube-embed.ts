import { Node, mergeAttributes } from '@tiptap/core';

export interface YouTubeEmbedOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtubeEmbed: {
      /**
       * Insert a YouTube embed
       */
      setYouTubeEmbed: (options: { videoId: string; usePrivacyMode?: boolean }) => ReturnType;
    };
  }
}

export const YouTubeEmbed = Node.create<YouTubeEmbedOptions>({
  name: 'youtubeEmbed',

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
      usePrivacyMode: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="youtube-embed"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false;
          const videoId = node.getAttribute('data-video-id');
          const usePrivacyMode = node.getAttribute('data-privacy-mode') === 'true';
          return { videoId, usePrivacyMode };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { videoId, usePrivacyMode } = HTMLAttributes;
    const domain = usePrivacyMode ? 'youtube-nocookie.com' : 'youtube.com';
    
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'youtube-embed',
        'data-video-id': videoId,
        'data-privacy-mode': usePrivacyMode ? 'true' : 'false',
        class: 'embed-responsive embed-youtube',
      }),
      [
        'iframe',
        {
          src: `https://www.${domain}/embed/${videoId}`,
          frameborder: '0',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: 'true',
          loading: 'lazy',
          style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;',
        },
      ],
    ];
  },

  addCommands() {
    return {
      setYouTubeEmbed:
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

