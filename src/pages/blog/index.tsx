import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/components/ui/toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { formatDate } from '@/lib/utils'
import { api, mediaUrl } from '@/lib/api'
import { Plus, Search, FileText, Edit, Trash2, Upload, Send, Clock } from 'lucide-react'

interface PostForm {
  websiteId: string
  title: string
  excerpt: string
  content: string
  category: string
  tags: string
  featuredImage: string
  status: 'draft' | 'published' | 'scheduled'
  publishedAt: string
}

interface Post {
  id: string
  website_id: string
  title: string
  excerpt?: string
  content?: string
  category?: string
  tags?: string | string[]
  featured_image?: string
  status: string
  published_at?: string
  created_at?: string
}

interface WebsiteOption {
  id: string
  title: string
}

const emptyForm = (websiteId: string): PostForm => ({
  websiteId,
  title: '',
  excerpt: '',
  content: '',
  category: '',
  tags: '',
  featuredImage: '',
  status: 'draft',
  publishedAt: '',
})

function postToForm(post: Post): PostForm {
  const publishedAt = post.published_at
    ? post.published_at.replace(' ', 'T').slice(0, 16)
    : ''
  return {
    websiteId: post.website_id,
    title: post.title || '',
    excerpt: post.excerpt || '',
    content: post.content || '',
    category: post.category || '',
    tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || '').replace(/[[]"]/g, ''),
    featuredImage: post.featured_image || '',
    status: (post.status || 'draft') as PostForm['status'],
    publishedAt,
  }
}

function formToPayload(form: PostForm) {
  return {
    websiteId: form.websiteId,
    title: form.title,
    excerpt: form.excerpt,
    content: form.content,
    category: form.category || undefined,
    tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    featuredImage: form.featuredImage || undefined,
    status: form.status,
    publishedAt:
      form.status === 'scheduled' || form.status === 'published'
        ? form.publishedAt ? new Date(form.publishedAt).toISOString() : undefined
        : undefined,
  }
}

export function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [websites, setWebsites] = useState<WebsiteOption[]>([])
  const [websiteId, setWebsiteId] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Post | null>(null)
  const [form, setForm] = useState<PostForm>(emptyForm(''))
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const loadPosts = useCallback(async (wid: string) => {
    if (!wid) return
    try {
      const { posts } = await api.get<{ posts: Post[] }>(`/blog?websiteId=${wid}`)
      setPosts(posts)
    } catch (err) {
      console.error(err)
    }
  }, [])

  const loadData = useCallback(async () => {
    try {
      const { websites } = await api.get<{ websites: WebsiteOption[] }>('/websites')
      setWebsites(websites)
      const wid = websites[0]?.id || ''
      setWebsiteId(wid)
      await loadPosts(wid)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [loadPosts])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!isOpen) return
    if (!form.websiteId && websites.length > 0) {
      setForm((f) => ({ ...f, websiteId: websites[0].id }))
    }
  }, [isOpen, form.websiteId, websites])

  const openNew = () => {
    setEditing(null)
    setForm(emptyForm(websiteId))
    setIsOpen(true)
  }

  const openEdit = (post: Post) => {
    setEditing(post)
    setForm(postToForm(post))
    setIsOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a title')
      return
    }
    if (!form.websiteId) {
      toast.error('Please select a website')
      return
    }
    setIsSaving(true)
    try {
      const payload = formToPayload(form)
      if (editing) {
        await api.put(`/blog/${editing.id}`, payload)
        toast.success('Post updated')
      } else {
        await api.post('/blog', payload)
        toast.success('Post created')
      }
      setIsOpen(false)
      await loadPosts(form.websiteId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save post')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) return
    try {
      await api.delete(`/blog/${id}`)
      setPosts((prev) => prev.filter((p) => p.id !== id))
      toast.success('Post deleted')
    } catch {
      toast.error('Failed to delete post')
    }
  }

  const togglePublish = async (post: Post) => {
    try {
      const next = post.status === 'published' ? 'draft' : 'published'
      await api.put(`/blog/${post.id}`, { status: next })
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: next } : p)))
      toast.success(next === 'published' ? 'Post published' : 'Post moved to draft')
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingImage(true)
    try {
      const res = await api.upload<{ file: { url: string } }>('/media/upload', file)
      setForm((f) => ({ ...f, featuredImage: res.file.url }))
      toast.success('Image uploaded')
    } catch {
      toast.error('Image upload failed')
    } finally {
      setIsUploadingImage(false)
      e.target.value = ''
    }
  }

  const filtered = posts.filter((p) => {
    const matchesSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusBadge = (status: string) => {
    if (status === 'published') return <Badge variant="success">{status}</Badge>
    if (status === 'scheduled') return <Badge variant="info">{status}</Badge>
    return <Badge variant="secondary">{status}</Badge>
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blog</h1>
          <p className="text-muted-foreground mt-1">Create, edit and publish blog posts</p>
        </div>
        <Button onClick={openNew} className="gradient-bg text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search posts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background text-sm"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
        </select>
        {websites.length > 1 && (
          <select
            value={websiteId}
            onChange={(e) => { setWebsiteId(e.target.value); loadPosts(e.target.value) }}
            className="px-3 py-2 border rounded-md bg-background text-sm"
          >
            {websites.map((w) => (
              <option key={w.id} value={w.id}>{w.title}</option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Loading posts…</CardContent></Card>
      ) : websites.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Create a website first</h3>
            <p className="text-muted-foreground mb-6">Blog posts are attached to a website. Go to Websites to create one.</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No blog posts yet</h3>
            <p className="text-muted-foreground mb-6">Create your first blog post</p>
            <Button onClick={openNew} className="gradient-bg text-white">
              <Plus className="w-4 h-4 mr-2" />
              Write Your First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium">Title</th>
                  <th className="text-left p-4 text-sm font-medium">Status</th>
                  <th className="text-left p-4 text-sm font-medium">Date</th>
                  <th className="text-right p-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((post) => (
                  <tr key={post.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {post.featured_image ? (
                          <img src={mediaUrl(post.featured_image)} alt="" className="w-12 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-10 rounded bg-muted flex items-center justify-center">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{post.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-md">{post.excerpt}</p>
                          {post.category ? (
                            <Badge variant="outline" className="mt-0.5">{post.category}</Badge>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{statusBadge(post.status)}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {post.published_at ? formatDate(post.published_at) : post.created_at ? formatDate(post.created_at) : '—'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="sm" className="h-8"
                          onClick={() => togglePublish(post)}
                          title={post.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {post.status === 'published' ? <Clock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => openEdit(post)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

<Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Post' : 'New Post'}</DialogTitle>
            <DialogDescription>Write and configure your blog post below.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Website</Label>
                <select
                  value={form.websiteId}
                  onChange={(e) => setForm({ ...form, websiteId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                >
                  {websites.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as PostForm['status'] })}
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-title">Title</Label>
              <Input id="post-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="My awesome post" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-excerpt">Excerpt</Label>
              <Input id="post-excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Short summary shown in listings" />
            </div>

            <div className="space-y-2">
              <Label>Featured Image</Label>
              <div className="flex items-center gap-2">
                <Input value={form.featuredImage} onChange={(e) => setForm({ ...form, featuredImage: e.target.value })} placeholder="https://… or upload one" className="flex-1" />
                <Button type="button" variant="outline" disabled={isUploadingImage} onClick={() => document.getElementById('featured-upload')?.click()}>
                  <Upload className="w-4 h-4 mr-1" />
                  {isUploadingImage ? 'Uploading…' : 'Upload'}
                </Button>
                <input id="featured-upload" type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
              </div>
              {form.featuredImage ? (
                <img src={mediaUrl(form.featuredImage)} alt="" className="w-32 h-20 object-cover rounded border" />
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="post-category">Category</Label>
                <Input id="post-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Tech" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-tags">Tags (comma separated)</Label>
                <Input id="post-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="react, ai" />
              </div>
            </div>

            {form.status === 'scheduled' || form.status === 'published' ? (
              <div className="space-y-2">
                <Label htmlFor="post-date">Publish date</Label>
                <Input id="post-date" type="datetime-local" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} />
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="post-content">Content</Label>
              <textarea
                id="post-content"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write your post content (Markdown supported)…"
                rows={8}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="gradient-bg text-white">
              {isSaving ? 'Saving…' : editing ? 'Save Changes' : 'Create Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
