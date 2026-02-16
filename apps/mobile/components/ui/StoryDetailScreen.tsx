import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Video } from "expo-av";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import RenderHTML, { HTMLContentModel, HTMLElementModel } from "react-native-render-html";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HearEmoteIcon from "./HearEmoteIcon";

interface StoryDetailScreenProps {
  storyId: string;
  onClose: () => void;
}

export function StoryDetailScreen({ storyId, onClose }: StoryDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [isLiked, setIsLiked] = useState(false);

  // Use reactive query to fetch story
  // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
  const story = useQuery(
    api.queries.blog.getBlogPostById,
    storyId ? { postId: storyId as any } : "skip"
  );

  const isLoading = story === undefined;
  const error = story === null ? "Story not found" : null;

  const handleLikeChange = useCallback((liked: boolean) => {
    setIsLiked(liked);
    // TODO: Implement actual like mutation
  }, []);


  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Custom renderers for HTML elements
  const renderers = useMemo(() => ({
    video: ({ TDefaultRenderer, ...props }: any) => {
      const { src, poster } = props.tnode.attributes;
      if (src) {
        return (
          <View style={styles.videoWrapper}>
            <Video
              source={{ uri: src }}
              style={styles.htmlVideoPlayer}
              useNativeControls
              resizeMode={"contain" as any}
              posterSource={poster ? { uri: poster } : undefined}
            />
          </View>
        );
      }
      return <TDefaultRenderer {...props} />;
    },
    img: ({ TDefaultRenderer, ...props }: any) => {
      const { src, alt } = props.tnode.attributes;
      if (src) {
        return (
          <Image
            source={{ uri: src }}
            style={styles.htmlImage}
            resizeMode="cover"
            alt={alt}
          />
        );
      }
      return <TDefaultRenderer {...props} />;
    },
    a: ({ TDefaultRenderer, ...props }: any) => {
      const { href } = props.tnode.attributes;
      return (
        <TouchableOpacity
          onPress={() => {
            if (href) {
              Linking.openURL(href).catch((err) =>
                console.error("Failed to open URL:", err)
              );
            }
          }}
        >
          <TDefaultRenderer {...props} />
        </TouchableOpacity>
      );
    },
  }), []);

  // Custom element models for better HTML5 support
  const customHTMLElementModels = useMemo(() => ({
    video: HTMLElementModel.fromCustomModel({
      tagName: "video",
      contentModel: HTMLContentModel.block,
    }),
    section: HTMLElementModel.fromCustomModel({
      tagName: "section",
      contentModel: HTMLContentModel.block,
    }),
  }), []);

  // System default styles
  const systemFonts = useMemo(() => [
    'System',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ] as const, []);

  // Preprocess HTML to handle common issues
  const preprocessHTML = useCallback((html: string): string => {
    if (!html) return '';

    // Decode common HTML entities that might not be handled
    let processed = html
      .replace(/&#039;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&hellip;/g, '…')
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"');

    // Remove script and style tags completely
    processed = processed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    processed = processed.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Fix self-closing tags that might cause issues
    processed = processed.replace(/<br\s*\/?>/gi, '<br />');
    processed = processed.replace(/<hr\s*\/?>/gi, '<hr />');
    processed = processed.replace(/<img([^>]*?)(?:\s*\/\s*>|>)/gi, '<img$1 />');

    return processed;
  }, []);

  // Preprocess story content
  const processedContent = useMemo(() => {
    return story?.content ? preprocessHTML(story.content) : '';
  }, [story?.content, preprocessHTML]);

  const processedBody = useMemo(() => {
    return story?.body && typeof story.body === 'string' ? preprocessHTML(story.body) : '';
  }, [story?.body, preprocessHTML]);

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Story</Text>
          <View style={styles.headerActions}>
            <HearEmoteIcon
              width={24}
              height={24}
              liked={isLiked}
              onLikeChange={handleLikeChange}
              style={styles.actionButton}
            />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF3B30" />
            <Text style={styles.loadingText}>Loading story...</Text>
          </View>
        ) : error || !story ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || "Story not found"}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Story Image */}
            {(story.coverImage || story.featuredImage) && (
              <Image
                source={{ uri: story.coverImage || story.featuredImage }}
                style={styles.storyImage}
                resizeMode="cover"
              />
            )}

            {/* Story Content */}
            <View style={styles.content}>
              <Text style={styles.title}>{story.title}</Text>

              {/* Meta Info */}
              <View style={styles.metaContainer}>
                {story.author && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Creator</Text>
                    <Text style={styles.metaValue}>
                      {typeof story.author === "string" ? story.author : story.author.name}
                    </Text>
                  </View>
                )}
                {story.publishedAt && (
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Published</Text>
                    <Text style={styles.metaValue}>{formatDate(story.publishedAt)}</Text>
                  </View>
                )}
              </View>

              {/* Categories & Tags */}
              {(story.categories?.length > 0 || story.tags?.length > 0) && (
                <View style={styles.tagsContainer}>
                  {story.categories?.map((category: string, index: number) => (
                    <View key={`cat-${index}`} style={styles.tag}>
                      <Text style={styles.tagText}>{category}</Text>
                    </View>
                  ))}
                  {story.tags?.map((tag: string, index: number) => (
                    <View key={`tag-${index}`} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Render HTML content */}
              {processedContent && (
                <View style={styles.contentSection}>
                  <RenderHTML
                    contentWidth={width - 40}
                    source={{ html: processedContent }}
                    baseStyle={styles.htmlBase}
                    renderers={renderers}
                    customHTMLElementModels={customHTMLElementModels}
                    systemFonts={systemFonts as any}
                    tagsStyles={{
                      p: styles.htmlParagraph,
                      h1: styles.htmlH1,
                      h2: styles.htmlH2,
                      h3: styles.htmlH3,
                      h4: styles.htmlH4,
                      h5: styles.htmlH5,
                      h6: styles.htmlH6,
                      strong: styles.htmlStrong,
                      b: styles.htmlStrong,
                      em: styles.htmlEm,
                      i: styles.htmlEm,
                      a: styles.htmlLink,
                      ul: styles.htmlList,
                      ol: styles.htmlList,
                      li: styles.htmlListItem,
                      blockquote: styles.htmlBlockquote,
                      img: styles.htmlImage,
                      video: styles.htmlVideo,
                      section: styles.htmlSection,
                      div: styles.htmlDiv,
                      span: styles.htmlSpan,
                      br: styles.htmlBr,
                      hr: styles.htmlHr,
                      code: styles.htmlCode,
                      pre: styles.htmlPre,
                      table: styles.htmlTable,
                      thead: styles.htmlTableHead,
                      tbody: styles.htmlTableBody,
                      tr: styles.htmlTableRow,
                      th: styles.htmlTableHeader,
                      td: styles.htmlTableCell,
                    }}
                    defaultTextProps={{
                      style: styles.htmlText,
                    }}
                    ignoredDomTags={['script', 'style', 'iframe']}
                    enableExperimentalMarginCollapsing={true}
                  />
                </View>
              )}

              {/* Render body if it's HTML */}
              {processedBody && processedBody.includes('<') && (
                <View style={styles.contentSection}>
                  <RenderHTML
                    contentWidth={width - 40}
                    source={{ html: processedBody }}
                    baseStyle={styles.htmlBase}
                    renderers={renderers}
                    customHTMLElementModels={customHTMLElementModels}
                    systemFonts={systemFonts as any}
                    tagsStyles={{
                      p: styles.htmlParagraph,
                      h1: styles.htmlH1,
                      h2: styles.htmlH2,
                      h3: styles.htmlH3,
                      h4: styles.htmlH4,
                      h5: styles.htmlH5,
                      h6: styles.htmlH6,
                      strong: styles.htmlStrong,
                      b: styles.htmlStrong,
                      em: styles.htmlEm,
                      i: styles.htmlEm,
                      a: styles.htmlLink,
                      ul: styles.htmlList,
                      ol: styles.htmlList,
                      li: styles.htmlListItem,
                      blockquote: styles.htmlBlockquote,
                      img: styles.htmlImage,
                      video: styles.htmlVideo,
                      section: styles.htmlSection,
                      div: styles.htmlDiv,
                      span: styles.htmlSpan,
                      br: styles.htmlBr,
                      hr: styles.htmlHr,
                      code: styles.htmlCode,
                      pre: styles.htmlPre,
                      table: styles.htmlTable,
                      thead: styles.htmlTableHead,
                      tbody: styles.htmlTableBody,
                      tr: styles.htmlTableRow,
                      th: styles.htmlTableHeader,
                      td: styles.htmlTableCell,
                    }}
                    defaultTextProps={{
                      style: styles.htmlText,
                    }}
                    ignoredDomTags={['script', 'style', 'iframe']}
                    enableExperimentalMarginCollapsing={true}
                  />
                </View>
              )}

              {/* Render body if it's an array of strings */}
              {story.body && Array.isArray(story.body) && (
                <View style={styles.contentSection}>
                  {story.body.map((paragraph: string, pIndex: number) => (
                    <Text key={pIndex} style={styles.paragraph}>
                      {paragraph}
                    </Text>
                  ))}
                </View>
              )}

              {/* Sections (if available) */}
              {story.sections && story.sections.length > 0 && (
                <View style={styles.sectionsContainer}>
                  {story.sections.map((section: any, index: number) => (
                    <View key={index} style={styles.section}>
                      {section.title && (
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                      )}
                      {section.paragraphs?.map((paragraph: string, pIndex: number) => (
                        <Text key={pIndex} style={styles.paragraph}>
                          {paragraph}
                        </Text>
                      ))}
                      {section.video && (
                        <View style={styles.videoContainer}>
                          <Text style={styles.videoPlaceholder}>Video: {section.video}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  storyImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#F3F4F6",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    lineHeight: 36,
  },
  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  metaItem: {
    flex: 1,
    minWidth: "45%",
  },
  metaLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  excerpt: {
    fontSize: 18,
    color: "#374151",
    lineHeight: 28,
    fontStyle: "italic",
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  contentSection: {
    marginBottom: 24,
  },
  contentText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 26,
    marginBottom: 16,
  },
  sectionsContainer: {
    marginTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 26,
    marginBottom: 16,
  },
  // HTML rendering styles
  htmlBase: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 26,
  },
  htmlText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 26,
  },
  htmlParagraph: {
    marginBottom: 16,
    fontSize: 16,
    color: "#374151",
    lineHeight: 26,
  },
  htmlH1: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    marginTop: 24,
    marginBottom: 16,
    lineHeight: 40,
  },
  htmlH2: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginTop: 24,
    marginBottom: 12,
    lineHeight: 32,
  },
  htmlH3: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginTop: 20,
    marginBottom: 10,
    lineHeight: 28,
  },
  htmlH4: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 26,
  },
  htmlH5: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginTop: 14,
    marginBottom: 8,
    lineHeight: 24,
  },
  htmlH6: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginTop: 12,
    marginBottom: 6,
    lineHeight: 22,
  },
  htmlStrong: {
    fontWeight: "700",
    color: "#111827",
  },
  htmlEm: {
    fontStyle: "italic",
  },
  htmlLink: {
    color: "#FF3B30",
    textDecorationLine: "underline",
  },
  htmlList: {
    marginBottom: 16,
    paddingLeft: 20,
  },
  htmlListItem: {
    marginBottom: 8,
    fontSize: 16,
    color: "#374151",
    lineHeight: 26,
  },
  htmlBlockquote: {
    borderLeftWidth: 4,
    borderLeftColor: "#E5E7EB",
    paddingLeft: 16,
    marginVertical: 16,
    fontStyle: "italic",
    color: "#6B7280",
  },
  htmlImage: {
    width: "100%",
    height: 200,
    marginVertical: 16,
    borderRadius: 8,
  },
  htmlVideo: {
    width: "100%",
    height: 200,
    marginVertical: 16,
    borderRadius: 8,
    backgroundColor: "#000",
  },
  videoWrapper: {
    width: "100%",
    marginVertical: 16,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  htmlVideoPlayer: {
    width: "100%",
    height: 200,
  },
  htmlSection: {
    marginBottom: 24,
  },
  htmlDiv: {
    marginBottom: 8,
  },
  htmlSpan: {
    // Inline element, no special styling needed
  },
  htmlBr: {
    height: 16,
  },
  htmlHr: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginVertical: 24,
  },
  htmlCode: {
    fontFamily: "monospace",
    fontSize: 14,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    color: "#111827",
  },
  htmlPre: {
    fontFamily: "monospace",
    fontSize: 14,
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    overflow: "hidden",
  },
  htmlTable: {
    width: "100%",
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
  },
  htmlTableHead: {
    backgroundColor: "#F9FAFB",
  },
  htmlTableBody: {
    backgroundColor: "#fff",
  },
  htmlTableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  htmlTableHeader: {
    flex: 1,
    padding: 12,
    fontWeight: "600",
    color: "#111827",
    fontSize: 14,
  },
  htmlTableCell: {
    flex: 1,
    padding: 12,
    color: "#374151",
    fontSize: 14,
  },
  videoContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  videoPlaceholder: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },
});

