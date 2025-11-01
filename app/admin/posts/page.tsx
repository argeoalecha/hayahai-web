import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Eye,
  Calendar,
  User,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Posts Management - Hayah-AI Admin',
  description: 'Manage blog posts, drafts, and content',
}

// Mock posts data
const mockPosts = [
  {
    id: '1',
    title: 'Building a Next.js 14 Blog Platform with Zero-Tolerance Error Handling',
    slug: 'nextjs-14-blog-platform-error-handling',
    excerpt: 'Learn how to build a bulletproof blog platform using Next.js 14, TypeScript, and comprehensive error boundaries.',
    status: 'published',
    author: {
      name: 'Hayah-AI',
      image: null
    },
    publishedAt: '2025-09-28T10:00:00Z',
    updatedAt: '2025-09-28T10:00:00Z',
    views: 245,
    comments: 12,
    readTime: 8,
    tags: ['Next.js', 'TypeScript', 'Error Handling'],
    featuredImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop'
  },
  {
    id: '2',
    title: 'Coding from Paradise: My Remote Development Setup in the Philippines',
    slug: 'coding-from-paradise-remote-setup-philippines',
    excerpt: 'How I built a productive development environment that works from both pristine beaches and volcanic farmlands.',
    status: 'published',
    author: {
      name: 'Hayah-AI',
      image: null
    },
    publishedAt: '2025-09-27T14:30:00Z',
    updatedAt: '2025-09-27T14:30:00Z',
    views: 189,
    comments: 8,
    readTime: 6,
    tags: ['Remote Work', 'Philippines', 'Setup'],
    featuredImage: 'https://images.unsplash.com/photo-1544436513-1c5c0a0b9326?w=400&h=200&fit=crop'
  },
  {
    id: '3',
    title: 'Database Design Patterns for Scalable Blog Platforms',
    slug: 'database-design-patterns-scalable-blog-platforms',
    excerpt: 'Deep dive into Prisma, PostgreSQL, and database architecture decisions that ensure your blog can scale.',
    status: 'draft',
    author: {
      name: 'Hayah-AI',
      image: null
    },
    publishedAt: null,
    updatedAt: '2025-09-26T16:45:00Z',
    views: 0,
    comments: 0,
    readTime: 12,
    tags: ['Database', 'Prisma', 'PostgreSQL', 'Scalability'],
    featuredImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=200&fit=crop'
  },
  {
    id: '4',
    title: 'Beach Debugging: Why Ocean Waves Improve Code Quality',
    slug: 'beach-debugging-ocean-waves-improve-code-quality',
    excerpt: 'A philosophical and practical exploration of how natural environments enhance problem-solving abilities.',
    status: 'published',
    author: {
      name: 'Hayah-AI',
      image: null
    },
    publishedAt: '2025-09-25T16:45:00Z',
    updatedAt: '2025-09-25T16:45:00Z',
    views: 234,
    comments: 6,
    readTime: 5,
    tags: ['Philosophy', 'Debugging', 'Beach'],
    featuredImage: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=200&fit=crop'
  },
  {
    id: '5',
    title: 'Full-Stack Authentication with NextAuth.js and Prisma',
    slug: 'fullstack-authentication-nextauth-prisma',
    excerpt: 'Complete guide to implementing secure authentication in a Next.js application with social logins and email verification.',
    status: 'scheduled',
    author: {
      name: 'Hayah-AI',
      image: null
    },
    publishedAt: '2025-09-30T10:00:00Z',
    updatedAt: '2025-09-24T11:20:00Z',
    views: 0,
    comments: 0,
    readTime: 10,
    tags: ['Authentication', 'NextAuth', 'Security'],
    featuredImage: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop'
  }
]

export default function PostsManagementPage() {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="h-4 w-4 text-te-bright-green" />
      case 'draft':
        return <Clock className="h-4 w-4 text-te-warm-gold" />
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-te-vibrant-coral" />
      default:
        return <AlertCircle className="h-4 w-4 text-te-sage" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-te-bright-green/10 text-te-bright-green border border-te-bright-green/20'
      case 'draft':
        return 'bg-te-warm-gold/10 text-te-warm-gold border border-te-warm-gold/20'
      case 'scheduled':
        return 'bg-te-vibrant-coral/10 text-te-vibrant-coral border border-te-vibrant-coral/20'
      default:
        return 'bg-te-sage/10 text-te-sage border border-te-sage/20'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-te-deep-teal">Posts</h1>
          <p className="text-te-sage">
            Manage your blog posts, drafts, and scheduled content.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="metric-card-te bg-te-pearl border-te-vibrant-coral">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-te-sage">Total Posts</p>
              <p className="text-2xl font-bold text-te-charcoal">{mockPosts.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-te-vibrant-coral" />
          </div>
        </div>
        <div className="metric-card-te bg-te-pearl border-te-bright-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-te-sage">Published</p>
              <p className="text-2xl font-bold text-te-charcoal">
                {mockPosts.filter(p => p.status === 'published').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-te-bright-green" />
          </div>
        </div>
        <div className="metric-card-te bg-te-pearl border-te-warm-gold">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-te-sage">Drafts</p>
              <p className="text-2xl font-bold text-te-charcoal">
                {mockPosts.filter(p => p.status === 'draft').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-te-warm-gold" />
          </div>
        </div>
        <div className="metric-card-te bg-te-pearl border-te-forest-green">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-te-sage">Total Views</p>
              <p className="text-2xl font-bold text-te-charcoal">
                {mockPosts.reduce((sum, post) => sum + post.views, 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-te-forest-green" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-te-sage" />
          <input
            type="text"
            placeholder="Search posts..."
            className="input-te pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
        <select className="input-te">
          <option>All Status</option>
          <option>Published</option>
          <option>Draft</option>
          <option>Scheduled</option>
        </select>
      </div>

      {/* Posts Table */}
      <div className="card-te bg-te-pearl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-te-sage/20 bg-te-sage/10">
              <tr>
                <th className="text-left p-4 font-medium text-te-charcoal">Post</th>
                <th className="text-left p-4 font-medium text-te-charcoal">Status</th>
                <th className="text-left p-4 font-medium text-te-charcoal">Author</th>
                <th className="text-left p-4 font-medium text-te-charcoal">Date</th>
                <th className="text-left p-4 font-medium text-te-charcoal">Engagement</th>
                <th className="text-right p-4 font-medium text-te-charcoal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockPosts.map((post) => (
                <tr key={post.id} className="border-b border-te-sage/20 hover:bg-te-sage/10 transition-colors duration-200">
                  <td className="p-4">
                    <div className="flex items-start gap-4">
                      {post.featuredImage && (
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-16 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium line-clamp-1 mb-1 text-te-charcoal">{post.title}</h3>
                        <p className="text-sm text-te-sage line-clamp-2 mb-2">
                          {post.excerpt}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs bg-te-vibrant-coral/10 text-te-vibrant-coral px-2 py-0.5 rounded border border-te-vibrant-coral/20">
                              {tag}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="text-xs text-te-sage">
                              +{post.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(post.status)}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${getStatusColor(post.status)}`}>
                        {post.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-te-sage" />
                      <span className="text-sm text-te-charcoal">{post.author.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      {post.status === 'published' && post.publishedAt ? (
                        <>
                          <div className="text-te-charcoal">Published</div>
                          <div className="text-te-sage">{formatDate(post.publishedAt)}</div>
                        </>
                      ) : post.status === 'scheduled' && post.publishedAt ? (
                        <>
                          <div className="text-te-charcoal">Scheduled</div>
                          <div className="text-te-sage">{formatDate(post.publishedAt)}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-te-charcoal">Last edited</div>
                          <div className="text-te-sage">{formatDate(post.updatedAt)}</div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-4 text-sm text-te-sage">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{post.views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{post.comments}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{post.readTime}m</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/posts/${post.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-te-sage">
          Showing 1-{mockPosts.length} of {mockPosts.length} posts
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}