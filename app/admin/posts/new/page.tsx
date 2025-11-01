'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  Tag,
  Calendar,
  Globe,
  Clock,
  Settings,
  Edit
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NewPostPage() {
  const [postData, setPostData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft' as 'draft' | 'published' | 'scheduled',
    featuredImage: '',
    tags: [] as string[],
    publishedAt: '',
    seoTitle: '',
    seoDescription: '',
    canonicalUrl: '',
    allowComments: true
  })

  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'seo'>('content')

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const handleTitleChange = (title: string) => {
    setPostData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }))
  }

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const target = e.target as HTMLInputElement
      const tag = target.value.trim()
      if (tag && !postData.tags.includes(tag)) {
        setPostData(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }))
        target.value = ''
      }
    }
  }

  const removeTag = (tagToRemove: string) => {
    setPostData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSave = (status: 'draft' | 'published' | 'scheduled') => {
    // In a real app, this would save to the API
    console.log('Saving post:', { ...postData, status })
    alert(`Post ${status === 'draft' ? 'saved as draft' : status === 'published' ? 'published' : 'scheduled'}!`)
  }

  const tabs = [
    { id: 'content', label: 'Content', icon: Edit },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'seo', label: 'SEO', icon: Globe }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/posts">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold text-te-deep-teal">New Post</h1>
            <p className="text-te-sage">Create a new blog post</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={() => handleSave('draft')}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave('published')}>
            <Globe className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tab Navigation */}
          <div className="border-b">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-te-vibrant-coral text-te-vibrant-coral'
                      : 'border-transparent text-te-sage hover:text-te-charcoal'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="label-te">
                  Post Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={postData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter your post title..."
                  className="input-te text-lg font-medium"
                />
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="label-te">
                  URL Slug
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 text-sm text-te-sage bg-te-sage/10 border border-te-sage border-r-0 rounded-l-md">
                    /blog/
                  </span>
                  <input
                    id="slug"
                    type="text"
                    value={postData.slug}
                    onChange={(e) => setPostData(prev => ({ ...prev, slug: e.target.value }))}
                    className="input-te rounded-l-none flex-1"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label htmlFor="excerpt" className="label-te">
                  Excerpt
                </label>
                <textarea
                  id="excerpt"
                  value={postData.excerpt}
                  onChange={(e) => setPostData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief description of your post..."
                  rows={3}
                  className="input-te"
                />
                <p className="text-sm text-te-sage mt-1">
                  This will be used as the post preview in listings and search results.
                </p>
              </div>

              {/* Content Editor */}
              <div>
                <label htmlFor="content" className="label-te">
                  Content
                </label>
                <textarea
                  id="content"
                  value={postData.content}
                  onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write your post content here... (Markdown supported)"
                  rows={20}
                  className="input-te font-mono text-sm"
                />
                <p className="text-sm text-te-sage mt-1">
                  You can use Markdown formatting. A rich text editor will be added soon.
                </p>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Publication Settings */}
              <div className="card-te bg-te-pearl space-y-4">
                <h3 className="font-display text-lg font-medium text-te-deep-teal">Publication Settings</h3>

                <div>
                  <label className="label-te">Status</label>
                  <select
                    value={postData.status}
                    onChange={(e) => setPostData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="input-te"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </div>

                {postData.status === 'scheduled' && (
                  <div>
                    <label className="label-te">Publish Date</label>
                    <input
                      type="datetime-local"
                      value={postData.publishedAt}
                      onChange={(e) => setPostData(prev => ({ ...prev, publishedAt: e.target.value }))}
                      className="input-te"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allowComments"
                    checked={postData.allowComments}
                    onChange={(e) => setPostData(prev => ({ ...prev, allowComments: e.target.checked }))}
                    className="rounded text-te-vibrant-coral focus:ring-te-vibrant-coral"
                  />
                  <label htmlFor="allowComments" className="text-sm text-te-charcoal">
                    Allow comments on this post
                  </label>
                </div>
              </div>

              {/* Tags */}
              <div className="card-te bg-te-pearl space-y-4">
                <h3 className="font-display text-lg font-medium text-te-deep-teal">Tags</h3>
                <div>
                  <input
                    type="text"
                    placeholder="Add tags (press Enter or comma to add)"
                    onKeyDown={handleTagInput}
                    className="input-te"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {postData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 bg-te-vibrant-coral/10 text-te-vibrant-coral border border-te-vibrant-coral/20 text-sm px-2 py-1 rounded-md"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 text-te-vibrant-coral hover:text-te-warm-coral transition-colors duration-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="card-te bg-te-pearl space-y-4">
                <h3 className="font-display text-lg font-medium text-te-deep-teal">SEO Settings</h3>

                <div>
                  <label className="label-te">SEO Title</label>
                  <input
                    type="text"
                    value={postData.seoTitle}
                    onChange={(e) => setPostData(prev => ({ ...prev, seoTitle: e.target.value }))}
                    placeholder="Custom title for search engines (optional)"
                    className="input-te"
                  />
                  <p className="text-sm text-te-sage mt-1">
                    Leave empty to use post title. Max 60 characters recommended.
                  </p>
                </div>

                <div>
                  <label className="label-te">SEO Description</label>
                  <textarea
                    value={postData.seoDescription}
                    onChange={(e) => setPostData(prev => ({ ...prev, seoDescription: e.target.value }))}
                    placeholder="Custom description for search engines (optional)"
                    rows={3}
                    className="input-te"
                  />
                  <p className="text-sm text-te-sage mt-1">
                    Leave empty to use excerpt. Max 160 characters recommended.
                  </p>
                </div>

                <div>
                  <label className="label-te">Canonical URL</label>
                  <input
                    type="url"
                    value={postData.canonicalUrl}
                    onChange={(e) => setPostData(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                    placeholder="https://example.com/original-post (optional)"
                    className="input-te"
                  />
                  <p className="text-sm text-te-sage mt-1">
                    Use this if the content was originally published elsewhere.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Featured Image */}
          <div className="card-te bg-te-pearl space-y-4">
            <h3 className="font-display font-medium text-te-deep-teal">Featured Image</h3>
            <div className="border-2 border-dashed border-te-sage/30 rounded-lg p-6 text-center hover:border-te-vibrant-coral/50 transition-colors duration-200">
              <Upload className="h-8 w-8 mx-auto text-te-sage mb-2" />
              <p className="text-sm text-te-sage mb-2">
                Upload or drag an image here
              </p>
              <Button variant="outline" size="sm">
                Choose File
              </Button>
            </div>
            {postData.featuredImage && (
              <div className="mt-2">
                <img
                  src={postData.featuredImage}
                  alt="Featured"
                  className="w-full h-32 object-cover rounded"
                />
              </div>
            )}
          </div>

          {/* Post Status */}
          <div className="card-te bg-te-pearl space-y-4">
            <h3 className="font-display font-medium text-te-deep-teal">Status</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-te-charcoal">
                <Clock className="h-4 w-4 text-te-sage" />
                <span>Status: {postData.status}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-te-charcoal">
                <Calendar className="h-4 w-4 text-te-sage" />
                <span>Created: Just now</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-te-charcoal">
                <Eye className="h-4 w-4 text-te-sage" />
                <span>Visibility: Public</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Eye className="h-4 w-4 mr-2" />
              Preview Post
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Save className="h-4 w-4 mr-2" />
              Save as Template
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}