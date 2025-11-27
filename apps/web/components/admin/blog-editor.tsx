"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  Quote,
  Code,
  Undo,
  Redo,
  X,
  CheckCircle2,
  Youtube,
  Twitter,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Highlighter,
  Table as TableIcon,
  MousePointerClick,
  AlertCircle,
  ChevronDown,
  Type
} from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { BlogImageUpload } from './blog-image-upload';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { YouTubeEmbed } from '@/lib/tiptap-extensions/youtube-embed';
import { TwitterEmbed } from '@/lib/tiptap-extensions/twitter-embed';
import { TikTokEmbed } from '@/lib/tiptap-extensions/tiktok-embed';
import { Button as ButtonExtension } from '@/lib/tiptap-extensions/button';
import { Callout } from '@/lib/tiptap-extensions/callout';
import { Collapsible } from '@/lib/tiptap-extensions/collapsible';
import { 
  parseYouTubeUrl, 
  parseTwitterUrl, 
  parseTikTokUrl,
  detectEmbedType 
} from '@/lib/utils/embed-utils';
import { validateEmbedUrl } from '@/lib/utils/embed-sanitizer';

interface BlogEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

export function BlogEditor({ content = '', onChange, placeholder = 'Start writing...' }: BlogEditorProps) {
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [showButtonDialog, setShowButtonDialog] = useState(false);
  const [showCalloutDialog, setShowCalloutDialog] = useState(false);
  const [showCollapsibleDialog, setShowCollapsibleDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [embedPreview, setEmbedPreview] = useState<{ type: string; data: any } | null>(null);
  const [buttonUrl, setButtonUrl] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonVariant, setButtonVariant] = useState<'primary' | 'secondary' | 'outline'>('primary');
  const [buttonTarget, setButtonTarget] = useState<'_blank' | '_self'>('_self');
  const [calloutVariant, setCalloutVariant] = useState<'note' | 'warning' | 'tip'>('note');
  const [calloutText, setCalloutText] = useState('');
  const [collapsibleTitle, setCollapsibleTitle] = useState('');
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#FFFF00');
  const generateUploadUrl = useMutation(api.mutations.documents.generateUploadUrl);
  const previousContentRef = useRef<string>(content || '');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#F23E2E] underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      YouTubeEmbed,
      TwitterEmbed,
      TikTokEmbed,
      ButtonExtension,
      Callout,
      Collapsible,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const html = editor.getHTML();
        previousContentRef.current = html;
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4 blog-editor-content',
      },
    },
  });

  // Update editor content when content prop changes (for editing existing posts)
  useEffect(() => {
    if (!editor) return;
    
    const currentContent = editor.getHTML();
    const normalizedCurrent = currentContent.trim();
    const normalizedNew = (content || '').trim();
    const normalizedPrevious = (previousContentRef.current || '').trim();
    
    // Only update if:
    // 1. The content prop has changed externally (different from what we last set)
    // 2. The editor content doesn't match the new content
    // This prevents overwriting user edits while allowing initial load and external updates
    if (normalizedNew !== normalizedPrevious && normalizedNew !== normalizedCurrent) {
      // This is an external content update (e.g., loading existing post)
      editor.commands.setContent(content || '');
      previousContentRef.current = content || '';
    } else if (normalizedNew === normalizedCurrent && normalizedNew !== normalizedPrevious) {
      // Content matches editor, just update our ref
      previousContentRef.current = content || '';
    }
  }, [content, editor]);

  const handleImageUpload = async (file: File) => {
    if (!editor) return;

    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: await file.arrayBuffer(),
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const result = await uploadResponse.json();
      if (!result.storageId) {
        throw new Error('No storageId in upload response');
      }

      // Insert image into editor
      const imageUrl = `/api/files/${result.storageId}`;
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setShowImageUpload(false);
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleImageUrl = (url: string) => {
    if (!editor) return;
    editor.chain().focus().setImage({ src: url }).run();
    setShowImageUpload(false);
  };

  const handleAddLink = () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');

    if (text) {
      setLinkUrl(text);
    }

    setShowLinkDialog(true);
  };

  const handleInsertLink = () => {
    if (!editor || !linkUrl) return;

    editor.chain().focus().setLink({ href: linkUrl }).run();
    setShowLinkDialog(false);
    setLinkUrl('');
  };

  const handleEmbedUrlChange = (url: string) => {
    setEmbedUrl(url);
    setEmbedError(null);
    setEmbedPreview(null);

    if (!url.trim()) {
      return;
    }

    // Validate URL format and security
    const validation = validateEmbedUrl(url.trim());
    if (!validation.valid) {
      setEmbedError(validation.error || 'Invalid URL');
      return;
    }

    const embedType = detectEmbedType(url.trim());
    
    if (embedType === 'unknown') {
      setEmbedError('Unsupported embed URL. Please use YouTube, Twitter/X, or TikTok.');
      return;
    }

    // Generate preview data
    try {
      switch (embedType) {
        case 'youtube': {
          const videoId = parseYouTubeUrl(url.trim());
          if (videoId) {
            setEmbedPreview({
              type: 'youtube',
              data: { videoId, url: url.trim() }
            });
            setEmbedError(null);
          } else {
            setEmbedError('Invalid YouTube URL format');
          }
          break;
        }
        case 'twitter': {
          const tweetData = parseTwitterUrl(url.trim());
          if (tweetData) {
            setEmbedPreview({
              type: 'twitter',
              data: { tweetUrl: url.trim(), tweetId: tweetData.tweetId }
            });
            setEmbedError(null);
          } else {
            setEmbedError('Invalid Twitter/X URL format');
          }
          break;
        }
        case 'tiktok': {
          const videoId = parseTikTokUrl(url.trim());
          if (videoId) {
            setEmbedPreview({
              type: 'tiktok',
              data: { videoId, url: url.trim() }
            });
            setEmbedError(null);
          } else {
            setEmbedError('Invalid TikTok URL format');
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error parsing embed URL:', error);
      setEmbedError('Failed to parse embed URL');
    }
  };

  const handleInsertEmbed = () => {
    if (!editor || !embedUrl.trim() || !embedPreview) return;

    try {
      switch (embedPreview.type) {
        case 'youtube': {
          editor.chain().focus().setYouTubeEmbed({ videoId: embedPreview.data.videoId }).run();
          setShowEmbedDialog(false);
          setEmbedUrl('');
          setEmbedPreview(null);
          setEmbedError(null);
          break;
        }
        case 'twitter': {
          editor.chain().focus().setTwitterEmbed({ tweetUrl: embedPreview.data.tweetUrl }).run();
          setShowEmbedDialog(false);
          setEmbedUrl('');
          setEmbedPreview(null);
          setEmbedError(null);
          break;
        }
        case 'tiktok': {
          editor.chain().focus().setTikTokEmbed({ 
            videoId: embedPreview.data.videoId, 
            url: embedPreview.data.url 
          }).run();
          setShowEmbedDialog(false);
          setEmbedUrl('');
          setEmbedPreview(null);
          setEmbedError(null);
          break;
        }
      }
    } catch (error) {
      console.error('Error inserting embed:', error);
      setEmbedError('Failed to insert embed. Please try again.');
    }
  };

  const handleInsertButton = () => {
    if (!editor || !buttonUrl.trim() || !buttonText.trim()) return;
    editor.chain().focus().setButton({
      href: buttonUrl,
      text: buttonText,
      variant: buttonVariant,
      target: buttonTarget,
    }).run();
    setShowButtonDialog(false);
    setButtonUrl('');
    setButtonText('');
    setButtonVariant('primary');
    setButtonTarget('_self');
  };

  const handleInsertCallout = () => {
    if (!editor || !calloutText.trim()) return;
    editor.chain().focus().setCallout({
      variant: calloutVariant,
      text: calloutText,
    }).run();
    setShowCalloutDialog(false);
    setCalloutText('');
    setCalloutVariant('note');
  };

  const handleInsertCollapsible = () => {
    if (!editor || !collapsibleTitle.trim()) return;
    editor.chain().focus().setCollapsible({
      title: collapsibleTitle,
      open: collapsibleOpen,
    }).run();
    setShowCollapsibleDialog(false);
    setCollapsibleTitle('');
    setCollapsibleOpen(false);
  };

  if (!editor) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .blog-editor-content p {
          margin-top: 1rem;
          margin-bottom: 1rem;
        }
        .blog-editor-content p + p {
          margin-top: 1rem;
        }
        .blog-editor-content p:first-child {
          margin-top: 0;
        }
        .blog-editor-content p:last-child {
          margin-bottom: 0;
        }
      `}} />
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm transition-shadow duration-200">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap items-center gap-1 transition-colors duration-200">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('underline') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('strike') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="w-4 h-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>

        {/* Block Elements */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Insert Horizontal Rule"
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </Button>
        </div>

        {/* Colors & Highlight */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const color = prompt('Enter text color (hex):', textColor);
              if (color) {
                setTextColor(color);
                editor.chain().focus().setColor(color).run();
              }
            }}
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('highlight') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              const color = prompt('Enter highlight color (hex):', highlightColor);
              if (color) {
                setHighlightColor(color);
                editor.chain().focus().toggleHighlight({ color }).run();
              }
            }}
            title="Highlight"
          >
            <Highlighter className="w-4 h-4" />
          </Button>
        </div>

        {/* Tables */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4" />
          </Button>
          {editor.isActive('table') && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title="Add Column"
              >
                <Type className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().deleteColumn().run()}
                title="Delete Column"
              >
                <X className="w-3 h-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title="Add Row"
              >
                <Type className="w-3 h-3 rotate-90" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().deleteRow().run()}
                title="Delete Row"
              >
                <X className="w-3 h-3 rotate-90" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().deleteTable().run()}
                title="Delete Table"
              >
                <TableIcon className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>

        {/* Media & Special Elements */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowImageUpload(true)}
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowEmbedDialog(true)}
            title="Insert Embed (YouTube, Twitter, TikTok)"
          >
            <Video className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddLink}
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowButtonDialog(true)}
            title="Insert Button"
          >
            <MousePointerClick className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCalloutDialog(true)}
            title="Insert Callout"
          >
            <AlertCircle className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCollapsibleDialog(true)}
            title="Insert Collapsible Section"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Image</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowImageUpload(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <BlogImageUpload
              onImageUploaded={handleImageUrl}
              onCancel={() => setShowImageUpload(false)}
            />
          </div>
        </div>
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Link</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/50 focus:border-[#F23E2E] transition-all duration-200"
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowLinkDialog(false);
                    setLinkUrl('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleInsertLink}
                  className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white"
                >
                  Insert Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embed Dialog */}
      {showEmbedDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl border border-gray-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Insert Embed</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEmbedDialog(false);
                  setEmbedUrl('');
                  setEmbedError(null);
                  setEmbedPreview(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Embed URL</label>
                <input
                  type="url"
                  value={embedUrl}
                  onChange={(e) => handleEmbedUrlChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && embedPreview && !embedError) {
                      handleInsertEmbed();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/50 focus:border-[#F23E2E] transition-all duration-200"
                  placeholder="YouTube, Twitter/X, or TikTok URL"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports YouTube, Twitter/X, and TikTok URLs
                </p>
              </div>

              {/* Error Message */}
              {embedError && (
                <Alert variant="destructive">
                  {embedError}
                </Alert>
              )}

              {/* Preview */}
              {embedPreview && !embedError && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {embedPreview.type === 'youtube' && 'YouTube Video Ready'}
                      {embedPreview.type === 'twitter' && 'Twitter/X Tweet Ready'}
                      {embedPreview.type === 'tiktok' && 'TikTok Video Ready'}
                    </span>
                  </div>
                  {embedPreview.type === 'youtube' && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Youtube className="w-4 h-4" />
                      <span>Video ID: {embedPreview.data.videoId}</span>
                    </div>
                  )}
                  {embedPreview.type === 'twitter' && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Twitter className="w-4 h-4" />
                      <span>Tweet ID: {embedPreview.data.tweetId}</span>
                    </div>
                  )}
                  {embedPreview.type === 'tiktok' && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Video className="w-4 h-4" />
                      <span>Video ID: {embedPreview.data.videoId}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEmbedDialog(false);
                    setEmbedUrl('');
                    setEmbedError(null);
                    setEmbedPreview(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleInsertEmbed}
                  disabled={!embedUrl.trim() || !embedPreview || !!embedError}
                  className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Insert Embed
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Button Dialog */}
      {showButtonDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Insert Button</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowButtonDialog(false);
                  setButtonUrl('');
                  setButtonText('');
                  setButtonVariant('primary');
                  setButtonTarget('_self');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Button Text</label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/50 focus:border-[#F23E2E] transition-all duration-200"
                  placeholder="Click me"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">URL</label>
                <input
                  type="url"
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/50 focus:border-[#F23E2E] transition-all duration-200"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Variant</label>
                <select
                  value={buttonVariant}
                  onChange={(e) => setButtonVariant(e.target.value as 'primary' | 'secondary' | 'outline')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/50 focus:border-[#F23E2E] transition-all duration-200"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="outline">Outline</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Open in</label>
                <select
                  value={buttonTarget}
                  onChange={(e) => setButtonTarget(e.target.value as '_blank' | '_self')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/50 focus:border-[#F23E2E] transition-all duration-200"
                >
                  <option value="_self">Same Window</option>
                  <option value="_blank">New Window</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowButtonDialog(false);
                    setButtonUrl('');
                    setButtonText('');
                    setButtonVariant('primary');
                    setButtonTarget('_self');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleInsertButton}
                  disabled={!buttonUrl.trim() || !buttonText.trim()}
                  className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Insert Button
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Callout Dialog */}
      {showCalloutDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Insert Callout</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCalloutDialog(false);
                  setCalloutText('');
                  setCalloutVariant('note');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Variant</label>
                <select
                  value={calloutVariant}
                  onChange={(e) => setCalloutVariant(e.target.value as 'note' | 'warning' | 'tip')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/50 focus:border-[#F23E2E] transition-all duration-200"
                >
                  <option value="note">Note</option>
                  <option value="warning">Warning</option>
                  <option value="tip">Tip</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Text</label>
                <textarea
                  value={calloutText}
                  onChange={(e) => setCalloutText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/50 focus:border-[#F23E2E] transition-all duration-200"
                  placeholder="Enter callout text..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCalloutDialog(false);
                    setCalloutText('');
                    setCalloutVariant('note');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleInsertCallout}
                  disabled={!calloutText.trim()}
                  className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Insert Callout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Dialog */}
      {showCollapsibleDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Insert Collapsible Section</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCollapsibleDialog(false);
                  setCollapsibleTitle('');
                  setCollapsibleOpen(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={collapsibleTitle}
                  onChange={(e) => setCollapsibleTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F23E2E]/50 focus:border-[#F23E2E] transition-all duration-200"
                  placeholder="Section title"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="collapsible-open"
                  checked={collapsibleOpen}
                  onChange={(e) => setCollapsibleOpen(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="collapsible-open" className="text-sm font-medium">
                  Open by default
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCollapsibleDialog(false);
                    setCollapsibleTitle('');
                    setCollapsibleOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleInsertCollapsible}
                  disabled={!collapsibleTitle.trim()}
                  className="bg-[#F23E2E] hover:bg-[#F23E2E]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Insert Collapsible
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

