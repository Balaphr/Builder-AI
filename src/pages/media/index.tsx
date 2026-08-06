import { useState, useEffect, useCallback } from 'react'
import { api, mediaUrl } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatBytes, formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/toast'
import {
  Image, Upload, Search, FolderOpen, Trash2,
  Eye, Download, Grid3X3, List, Filter
} from 'lucide-react'

export function MediaPage() {
  const [files, setFiles] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { loadFiles() }, [])

  const loadFiles = async () => {
    try {
      const { files } = await api.get<{ files: any[] }>('/media')
      setFiles(files)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList?.length) return

    setIsUploading(true)
    try {
      for (const file of Array.from(fileList)) {
        await api.upload('/media/upload', file)
      }
      toast.success('Files uploaded!')
      loadFiles()
    } catch (err) {
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file?')) return
    try {
      await api.delete(`/media/${id}`)
      setFiles((f) => f.filter((file) => file.id !== id))
      toast.success('File deleted')
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  const filtered = files.filter(
    (f) => f.name.toLowerCase().includes(search.toLowerCase())
  )

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎬'
    if (type.startsWith('audio/')) return '🎵'
    if (type.includes('pdf')) return '📄'
    return '📁'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground mt-1">Manage your images, videos, and files</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.zip"
            onChange={handleUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button className="gradient-bg text-white" disabled={isUploading}>
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center border rounded-lg p-1">
          <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setView('grid')}>
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setView('list')}>
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Image className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No files yet</h3>
            <p className="text-muted-foreground mb-4">Upload your first files to get started</p>
            <label htmlFor="file-upload">
              <Button className="gradient-bg text-white">
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </label>
          </CardContent>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((file) => (
            <div key={file.id} className="group relative aspect-square rounded-xl border overflow-hidden hover:shadow-lg transition-all">
              {file.type.startsWith('image/') ? (
                <img src={mediaUrl(file.url)} alt={file.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted text-3xl">
                  {getFileIcon(file.type)}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={() => window.open(mediaUrl(file.url))}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={() => handleDelete(file.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-xs truncate">{file.name}</p>
                <p className="text-white/70 text-xs">{formatBytes(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium">Name</th>
                  <th className="text-left p-4 text-sm font-medium">Type</th>
                  <th className="text-left p-4 text-sm font-medium">Size</th>
                  <th className="text-left p-4 text-sm font-medium">Date</th>
                  <th className="text-right p-4 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((file) => (
                  <tr key={file.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getFileIcon(file.type)}</span>
                        <span className="text-sm font-medium">{file.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{file.type}</td>
                    <td className="p-4 text-sm text-muted-foreground">{formatBytes(file.size)}</td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDate(file.created_at)}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(file.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
