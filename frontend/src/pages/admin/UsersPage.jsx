// Users list for admins. Filters live in the URL, so refresh keeps them and
// the dashboard tiles can link straight to a filtered list.
import { useEffect, useState } from 'react'
import {
  Ellipsis,
  Eye,
  GraduationCap,
  Pencil,
  Search,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { usersApi } from '@/api/usersApi'
import { useAuth } from '@/auth/AuthContext'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { ErrorAlert } from '@/components/ErrorAlert'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { RoleBadge } from '@/components/RoleBadge'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAsync } from '@/hooks/useAsync'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'
import { TechnicianSkillsDialog } from './TechnicianSkillsDialog'
import { UserDetailsDialog } from './UserDetailsDialog'
import { UserFormDialog } from './UserFormDialog'

const ROLES = ['EMPLOYEE', 'TECHNICIAN', 'ADMIN']
const PAGE_SIZES = [10, 20, 50]
const ALL = 'ALL' // Radix Select doesn't allow an empty value, so "no filter" is ALL

function useUserFilters() {
  const [params, setParams] = useSearchParams()

  const role = ROLES.includes(params.get('role')) ? params.get('role') : ALL
  const active = ['true', 'false'].includes(params.get('active')) ? params.get('active') : ALL
  const search = params.get('search') ?? ''
  const page = Math.max(0, Number.parseInt(params.get('page') ?? '0', 10) || 0)
  const size = PAGE_SIZES.includes(Number(params.get('size'))) ? Number(params.get('size')) : 20

  // Changing any filter sends you back to the first page.
  function update(changes) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(changes)) {
          if (value === '' || value === ALL || value == null) next.delete(key)
          else next.set(key, String(value))
        }
        if (!('page' in changes)) next.delete('page')
        if (next.get('page') === '0') next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  return { role, active, search, page, size, update }
}

export default function UsersPage() {
  const { user: me, updateUser } = useAuth()
  const filters = useUserFilters()
  const { role, active, search, page, size, update } = filters

  const { data, error, loading, reload, setData } = useAsync(
    () =>
      usersApi.list({
        page,
        size,
        role: role === ALL ? undefined : role,
        active: active === ALL ? undefined : active === 'true',
        search: search || undefined,
      }),
    [page, size, role, active, search],
  )

  // wait until typing pauses before searching
  const [query, setQuery] = useState(search)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim() !== search) update({ search: query.trim() })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  // If the last row on a page disappears (e.g. after deactivating with the
  // Active filter on), step back to a page that still has rows.
  useEffect(() => {
    if (data && data.content.length === 0 && page > 0) {
      update({ page: Math.max(0, data.totalPages - 1) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, page])

  // Each dialog remembers its user while closing, so the fade-out doesn't flicker.
  const [form, setForm] = useState({ open: false, user: null }) // user null = add new
  const [details, setDetails] = useState({ open: false, user: null })
  const [deactivating, setDeactivating] = useState({ open: false, user: null })
  const [pendingId, setPendingId] = useState(null)

  const [skillsFor, setSkillsFor] = useState({ open: false, user: null })
  const openForm = (user = null) => setForm({ open: true, user })
  const openDetails = (user) => setDetails({ open: true, user })

  const hasFilters = role !== ALL || active !== ALL || search !== ''

  function clearFilters() {
    setQuery('')
    update({ role: ALL, active: ALL, search: '' })
  }

  function replaceRow(updated) {
    setData((prev) =>
      prev
        ? { ...prev, content: prev.content.map((u) => (u.id === updated.id ? updated : u)) }
        : prev,
    )
    if (updated.id === me.id) updateUser(updated) // keep the top bar in sync when editing yourself
  }

  async function activate(user) {
    setPendingId(user.id)
    try {
      replaceRow(await usersApi.activate(user.id))
      toast.success(`${user.fullName} can sign in again`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setPendingId(null)
    }
  }

  async function confirmDeactivate() {
    const { user } = deactivating
    try {
      replaceRow(await usersApi.deactivate(user.id))
      toast.success(`${user.fullName} deactivated`)
    } catch (err) {
      toast.error(getErrorMessage(err))
      throw err // keeps the dialog open
    }
  }

  function handleSaved(saved, { created }) {
    if (created) {
      toast.success(`${saved.fullName} added`)
      reload()
    } else {
      toast.success('Changes saved')
      replaceRow(saved)
    }
  }

  const users = data?.content ?? []

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone who can sign in to I-ITSM. Deactivated users keep their history but can’t sign in."
        actions={
          <Button size="lg" className="h-10" onClick={() => openForm()}>
            <UserPlus aria-hidden="true" />
            Add user
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email"
            aria-label="Search users by name or email"
            className="h-9 bg-popover pl-9"
          />
        </div>
        <div className="flex gap-3">
          <Select value={role} onValueChange={(value) => update({ role: value })}>
            <SelectTrigger className="h-9 w-40 bg-popover" aria-label="Filter by role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All roles</SelectItem>
              <SelectItem value="EMPLOYEE">Employees</SelectItem>
              <SelectItem value="TECHNICIAN">Technicians</SelectItem>
              <SelectItem value="ADMIN">Admins</SelectItem>
            </SelectContent>
          </Select>
          <Select value={active} onValueChange={(value) => update({ active: value })}>
            <SelectTrigger className="h-9 w-36 bg-popover" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Any status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" className="h-9" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <ErrorAlert error={error} title="Couldn’t load users" onRetry={reload} />
      ) : (
        <Card className="gap-0 py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="w-12 pr-5">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody aria-busy={loading}>
              {loading && !data
                ? Array.from({ length: 6 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-5" colSpan={6}>
                        <Skeleton className="h-9 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : users.map((user) => (
                    <TableRow key={user.id} className={loading ? 'opacity-60' : undefined}>
                      <TableCell className="py-3 pl-5">
                        <button
                          type="button"
                          onClick={() => openDetails(user)}
                          className="block max-w-64 rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <span className="block truncate font-semibold hover:underline">
                            {user.fullName}
                            {user.id === me.id && (
                              <span className="font-normal text-muted-foreground"> (you)</span>
                            )}
                          </span>
                          <span className="block truncate text-sm text-muted-foreground">
                            {user.email}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        <UserDetail user={user} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={user.active ? 'ACTIVE' : 'INACTIVE'} />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <RowActions
                          user={user}
                          isSelf={user.id === me.id}
                          busy={pendingId === user.id}
                          onView={() => openDetails(user)}
                          onEdit={() => openForm(user)}
                          onManageSkills={() => setSkillsFor({ open: true, user })}
                          onActivate={() => activate(user)}
                          onDeactivate={() => setDeactivating({ open: true, user })}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          {data && users.length === 0 && (
            <div className="p-5">
              <EmptyState
                icon={Users}
                title={hasFilters ? 'No users match these filters' : 'No users yet'}
                description={
                  hasFilters
                    ? 'Try a different search, or clear the filters to see everyone.'
                    : 'Add the first user to get started.'
                }
                action={
                  hasFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  )
                }
              />
            </div>
          )}

          {data && data.totalElements > 0 && (
            <div className="border-t border-border px-5 py-3">
              <Pagination
                page={page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                size={size}
                sizes={PAGE_SIZES}
                itemLabel={data.totalElements === 1 ? 'user' : 'users'}
                disabled={loading}
                onPageChange={(next) => update({ page: next })}
                onSizeChange={(next) => update({ size: next })}
              />
            </div>
          )}
        </Card>
      )}

      <UserFormDialog
        open={form.open}
        user={form.user}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        onSaved={handleSaved}
        onConflict={reload}
      />

      <UserDetailsDialog
        open={details.open}
        user={details.user}
        onOpenChange={(open) => setDetails((d) => ({ ...d, open }))}
        onEdit={(user) => {
          setDetails((d) => ({ ...d, open: false }))
          openForm(user)
        }}
      />

      <TechnicianSkillsDialog
        open={skillsFor.open}
        onOpenChange={(open) => setSkillsFor((d) => ({ ...d, open }))}
        technician={skillsFor.user}
        onSaved={(updated) => {
          replaceRow(updated)
          toast.success(`${updated.fullName}’s skills saved`)
        }}
      />

      <ConfirmDialog
        open={deactivating.open}
        onOpenChange={(open) => setDeactivating((d) => ({ ...d, open }))}
        title={`Deactivate ${deactivating.user?.fullName ?? ''}?`}
        description="They won’t be able to sign in until an admin activates them again. Their account and history are kept."
        confirmLabel="Deactivate"
        pendingLabel="Deactivating…"
        destructive
        onConfirm={confirmDeactivate}
      />
    </>
  )
}

// Department for employees, number of skills for technicians.
function UserDetail({ user }) {
  if (user.role === 'TECHNICIAN') {
    const count = user.skills?.length ?? 0
    return count ? `${count} ${count === 1 ? 'skill' : 'skills'}` : 'No skills yet'
  }
  return user.department || '—'
}

function RowActions({
  user,
  isSelf,
  busy,
  onView,
  onEdit,
  onManageSkills,
  onActivate,
  onDeactivate,
}) {
  // modal={false}: lets a dialog open cleanly straight from a menu item
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={busy}
          aria-label={`Actions for ${user.fullName}`}
        >
          <Ellipsis aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={onView}>
          <Eye aria-hidden="true" />
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        {user.role === 'TECHNICIAN' && (
          <DropdownMenuItem onSelect={onManageSkills}>
            <GraduationCap aria-hidden="true" />
            Manage skills
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {user.active ? (
          <DropdownMenuItem variant="destructive" disabled={isSelf} onSelect={onDeactivate}>
            <UserX aria-hidden="true" />
            {isSelf ? 'Can’t deactivate yourself' : 'Deactivate'}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={onActivate}>
            <UserCheck aria-hidden="true" />
            Activate
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
