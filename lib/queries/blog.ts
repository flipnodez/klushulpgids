import 'server-only'

import type { Prisma } from '@prisma/client'

import { prisma } from '../db'

const BLOG_LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  metaDescription: true,
  excerpt: true,
  coverImageUrl: true,
  coverImageAlt: true,
  authorName: true,
  category: true,
  publishedAt: true,
  relatedTradeId: true,
  relatedTrade: { select: { id: true, slug: true, namePlural: true } },
  relatedCityId: true,
  relatedCity: { select: { id: true, slug: true, name: true } },
} satisfies Prisma.BlogPostSelect

const BLOG_FULL_SELECT = {
  ...BLOG_LIST_SELECT,
  body: true,
  faqItems: true,
  howToSteps: true,
  updatedAt: true,
  createdAt: true,
} satisfies Prisma.BlogPostSelect

export type BlogPostListItem = Prisma.BlogPostGetPayload<{ select: typeof BLOG_LIST_SELECT }>
export type BlogPostFull = Prisma.BlogPostGetPayload<{ select: typeof BLOG_FULL_SELECT }>

export async function getRecentBlogPosts(limit = 3): Promise<BlogPostListItem[]> {
  return prisma.blogPost.findMany({
    where: { publishedAt: { not: null, lte: new Date() } },
    select: BLOG_LIST_SELECT,
    orderBy: { publishedAt: 'desc' },
    take: limit,
  })
}

export async function getBlogPosts(opts: {
  take?: number
  skip?: number
  category?: string
}): Promise<BlogPostListItem[]> {
  const { take = 12, skip = 0, category } = opts
  return prisma.blogPost.findMany({
    where: {
      publishedAt: { not: null, lte: new Date() },
      ...(category ? { category: category as never } : {}),
    },
    select: BLOG_LIST_SELECT,
    orderBy: { publishedAt: 'desc' },
    take,
    skip,
  })
}

export async function countBlogPosts(opts: { category?: string } = {}): Promise<number> {
  return prisma.blogPost.count({
    where: {
      publishedAt: { not: null, lte: new Date() },
      ...(opts.category ? { category: opts.category as never } : {}),
    },
  })
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostFull | null> {
  return prisma.blogPost.findUnique({
    where: { slug },
    select: BLOG_FULL_SELECT,
  })
}

export async function getBlogPostsByTrade(tradeId: string, limit = 3): Promise<BlogPostListItem[]> {
  return prisma.blogPost.findMany({
    where: {
      relatedTradeId: tradeId,
      publishedAt: { not: null, lte: new Date() },
    },
    select: BLOG_LIST_SELECT,
    orderBy: { publishedAt: 'desc' },
    take: limit,
  })
}

export async function getRelatedPosts(post: BlogPostFull, limit = 3): Promise<BlogPostListItem[]> {
  return prisma.blogPost.findMany({
    where: {
      id: { not: post.id },
      publishedAt: { not: null, lte: new Date() },
      OR: [
        { category: post.category },
        post.relatedTradeId ? { relatedTradeId: post.relatedTradeId } : {},
        post.relatedCityId ? { relatedCityId: post.relatedCityId } : {},
      ],
    },
    select: BLOG_LIST_SELECT,
    orderBy: { publishedAt: 'desc' },
    take: limit,
  })
}
