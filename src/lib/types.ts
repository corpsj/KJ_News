export interface Author {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

export type ArticleStatus = 'draft' | 'pending_review' | 'scheduled' | 'published' | 'archived' | 'rejected';

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: '임시저장',
  pending_review: '검토중',
  scheduled: '예약됨',
  published: '발행됨',
  archived: '보관됨',
  rejected: '반려됨',
};

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  category: Category;
  author: Author;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: number;
  tags: string[];
  status: ArticleStatus;
  source?: string;
  sourceUrl?: string;
}

// News Factory types
export interface NfArticle {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  category: string;
  source: string;
  source_url: string;
  images: string[];
  published_at: string;
  processed_at: string;
}

export interface NfRegion {
  code: string;
  name: string;
}

export interface NfCategory {
  code: string;
  name: string;
}

export interface NfImportRecord {
  id: number;
  nf_article_id: string;
  local_article_id: number;
  nf_title: string;
  imported_at: string;
  imported_by: string;
  import_type: 'imported' | 'published';
}

// Contact Message types
export type MessageStatus = 'unread' | 'read' | 'archived';

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  unread: '읽지않음',
  read: '읽음',
  archived: '보관됨',
};

export interface ContactMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
  status: MessageStatus;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
