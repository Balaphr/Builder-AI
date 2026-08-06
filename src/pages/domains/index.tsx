import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { Globe, Plus, Trash2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

export function DomainsPage() {
  const [domains, setDomains] = useState<any[]>([])
  const [domain, setDomain] = useState('')
  const [websiteId, setWebsiteId] = useState('')
  const [websites, setWebsites] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [domainsRes, websitesRes] = await Promise.all([
        api.get<{ domains: any[] }>('/domains'),
        api.get<{ websites: any[] }>('/websites'),
      ])
      setDomains(domainsRes.domains)
      setWebsites(websitesRes.websites)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!domain || !websiteId) {
      toast.error('Please enter a domain and select a website')
      return
    }
    try {
      await api.post('/domains', { websiteId, domain })
      toast.success('Domain added')
      setDomain('')
      loadData()
    } catch (err) {
      toast.error('Failed to add domain')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this domain?')) return
    try {
      await api.delete(`/domains/${id}`)
      setDomains((d) => d.filter((dom) => dom.id !== id))
      toast.success('Domain removed')
    } catch (err) {
      toast.error('Failed to remove domain')
    }
  }

  const handleVerify = async (id: string) => {
    try {
      await api.post(`/domains/${id}/verify`)
      toast.success('Domain verified!')
      loadData()
    } catch (err) {
      toast.error('Verification failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Domains</h1>
        <p className="text-muted-foreground mt-1">Manage custom domains for your websites</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Custom Domain</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="flex-1"
            />
            <select
              value={websiteId}
              onChange={(e) => setWebsiteId(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">Select website</option>
              {websites.map((w) => (
                <option key={w.id} value={w.id}>{w.title}</option>
              ))}
            </select>
            <Button onClick={handleAdd} className="gradient-bg text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Domains ({domains.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No custom domains yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{d.domain}</p>
                      <p className="text-sm text-muted-foreground">{d.website_title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={d.status === 'active' ? 'success' : d.status === 'error' ? 'destructive' : 'secondary'}>
                      {d.status === 'active' ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                      {d.status}
                    </Badge>
                    {d.ssl ? <Badge variant="info">SSL</Badge> : null}
                    {d.status === 'pending' && (
                      <Button variant="outline" size="sm" onClick={() => handleVerify(d.id)}>Verify</Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
