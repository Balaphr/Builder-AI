import { useEffect, useState } from 'react'
import { accountsApi, api } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import type { UserAccount } from '@/types'
import {
  ShieldCheck, Plus, Search, UserPlus, Pencil, Trash2,
  Power, Check, Loader2, Globe
} from 'lucide-react'

const ACCOUNT_TYPES = [
  { key: 'sub', name: 'Sub Account' },
  { key: 'test', name: 'Test Account' },
  { key: 'custom', name: 'Custom' },
]

const DEFAULT_PERMISSIONS = ['website.view', 'website.edit', 'website.create', 'builder', 'media', 'ai', 'analytics', 'publish']

export function AccountsPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<UserAccount | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const [allWebsites, setAllWebsites] = useState<{ id: string; title: string }[]>([])

  // Create form
  const [form, setForm] = useState({
    name: '', email: '', password: '', accountType: 'sub', plan: 'free',
    permissions: DEFAULT_PERMISSIONS.join(','), websites: [] as string[],
  })

  useEffect(() => { loadAccounts(); loadWebsites() }, [])

  const loadAccounts = async () => {
    try {
      const res = await accountsApi.list()
      setAccounts(res.accounts)
    } catch {
      toast.error('Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }

  const loadWebsites = async () => {
    try {
      const res = await api.get<{ websites: { id: string; title: string }[] }>('/websites')
      setAllWebsites(res.websites.map((w) => ({ id: w.id, title: w.title })))
    } catch { /* ignore */ }
  }

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email and password are required')
      return
    }
    setActionId('create')
    try {
      await accountsApi.create({
        name: form.name,
        email: form.email,
        password: form.password,
        accountType: form.accountType,
        plan: form.plan,
        permissions: form.permissions.split(',').map((p) => p.trim()).filter(Boolean),
        websites: form.websites.map((id) => ({ websiteId: id })),
      })
      toast.success('Account created')
      setCreateOpen(false)
      setForm({ name: '', email: '', password: '', accountType: 'sub', plan: 'free', permissions: DEFAULT_PERMISSIONS.join(','), websites: [] })
      loadAccounts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setActionId(null)
    }
  }

  const openEdit = (account: UserAccount) => {
    setEditing(account)
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    setActionId(editing.id)
    try {
      await accountsApi.update(editing.id, {
        role: editing.role,
        accountType: editing.accountType,
        plan: editing.plan,
        permissions: editing.permissions,
      })
      toast.success('Account updated')
      setEditOpen(false)
      loadAccounts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update account')
    } finally {
      setActionId(null)
    }
  }

  const handleToggleDisable = async (account: UserAccount) => {
    setActionId(account.id)
    try {
      await accountsApi.disable(account.id, !account.isDisabled)
      toast.success(account.isDisabled ? 'Account enabled' : 'Account disabled')
      loadAccounts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (account: UserAccount) => {
    if (!confirm(`Delete account ${account.name}? This cannot be undone.`)) return
    setActionId(account.id)
    try {
      await accountsApi.remove(account.id)
      toast.success('Account deleted')
      loadAccounts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setActionId(null)
    }
  }

  const filtered = accounts.filter(
    (a) => a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  )

  const canManage = user?.accountType === 'admin' || user?.role === 'admin'

  if (!canManage) {
    return (
      <div className="text-center py-20">
        <ShieldCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Admin access required</h1>
        <p className="text-muted-foreground">Only platform administrators can manage accounts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage sub, test and custom accounts with granular permissions.
          </p>
        </div>
        <Button className="gradient-bg text-white" onClick={() => setCreateOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Create Account
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search accounts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShieldCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No accounts found</h3>
            <p className="text-muted-foreground mb-6">Create your first team account to get started.</p>
            <Button className="gradient-bg text-white" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((account) => (
            <Card key={account.id} className="hover:shadow-lg transition-all">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center text-white font-bold shrink-0">
                      {account.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{account.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{account.email}</p>
                    </div>
                  </div>
                  <Badge variant={account.isDisabled ? 'destructive' : account.accountType === 'test' ? 'secondary' : 'success'}>
                    {account.accountType}{account.isDisabled ? ' · disabled' : ''}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{account.role}</Badge>
                  <Badge variant="outline">{account.plan}</Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {account.websites?.length || 0} sites
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-xs text-muted-foreground">
                    {account.permissions?.length || 0} permissions
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(account)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={account.isDisabled ? 'Enable' : 'Disable'}
                      isLoading={actionId === account.id}
                      onClick={() => handleToggleDisable(account)}
                    >
                      <Power className={`w-4 h-4 ${account.isDisabled ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      title="Delete"
                      onClick={() => handleDelete(account)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Account Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
            <DialogDescription>Create a sub, test or custom account and assign website access.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input className="mt-1.5" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input className="mt-1.5" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Password</Label>
                <Input className="mt-1.5" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <Label>Account Type</Label>
                <Select value={form.accountType} onValueChange={(v) => setForm({ ...form, accountType: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plan</Label>
                <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['free', 'pro', 'business', 'enterprise'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Permissions (comma separated)</Label>
              <textarea
                className="mt-1.5 flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.permissions}
                onChange={(e) => setForm({ ...form, permissions: e.target.value })}
              />
            </div>
            <div>
              <Label>Assign Websites</Label>
              <div className="mt-1.5 space-y-1.5 max-h-36 overflow-y-auto">
                {allWebsites.length === 0 && <p className="text-sm text-muted-foreground">No websites available.</p>}
                {allWebsites.map((w) => (
                  <label key={w.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={form.websites.includes(w.id)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.websites, w.id]
                          : form.websites.filter((id) => id !== w.id)
                        setForm({ ...form, websites: next })
                      }}
                    />
                    {w.title}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className="gradient-bg text-white" isLoading={actionId === 'create'} onClick={handleCreate}>
              <Check className="w-4 h-4 mr-2" />
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>{editing?.email}</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4 py-2">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Role</Label>
                  <Select
                    value={editing.role}
                    onValueChange={(v) => setEditing({ ...editing, role: v })}
                  >
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['admin', 'editor', 'viewer', 'test'].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Plan</Label>
                  <Select value={editing.plan} onValueChange={(v) => setEditing({ ...editing, plan: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['free', 'pro', 'business', 'enterprise'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Permissions</Label>
                <textarea
                  className="mt-1.5 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editing.permissions?.join(', ') || ''}
                  onChange={(e) => setEditing({
                    ...editing,
                    permissions: e.target.value.split(',').map((p) => p.trim()).filter(Boolean),
                  })}
                />
              </div>
              {editing.websites?.length > 0 && (
                <div>
                  <Label>Assigned Websites</Label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {editing.websites.map((w) => (
                      <Badge key={w.websiteId} variant="outline" className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {w.title || w.websiteId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="gradient-bg text-white" isLoading={actionId === editing?.id} onClick={handleSaveEdit}>
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}