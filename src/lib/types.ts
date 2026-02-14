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
  summary?: string;
  content?: string;
  category?: string;
  source?: string;
  source_url?: string;
  images?: string[];
  published_at?: string;
  processed_at?: string;
}

export interface NfSubscription {
  id: string;
  name: string;
  filter_regions: string[];
  filter_categories: string[];
  filter_keywords: string[];
  schedule_cron: string;
  schedule_tz?: string;
  max_articles: number;
  is_active: boolean;
  last_delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NfDelivery {
  id: string;
  subscription_id: string;
  article_count: number;
  status: 'success' | 'failed' | 'pending';
  error_message?: string;
  delivered_at: string;
}
