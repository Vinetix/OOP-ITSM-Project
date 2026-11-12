// Technician skills, each tied to a category, with how many technicians hold them.
import { useState } from 'react'
import { Ellipsis, GraduationCap, Pencil, Power, PowerOff } from 'lucide-react'
import { toast } from 'sonner'
import { categoriesApi, skillsApi } from '@/api/catalogApi'
import { usersApi } from '@/api/usersApi'
import { CategoryCode } from '@/components/CategoryCode'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { ErrorAlert } from '@/components/ErrorAlert'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAsync } from '@/hooks/useAsync'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { CatalogToolbar } from './CatalogToolbar'
import { SkillFormDialog } from './SkillFormDialog'
import { matchesSearch, useCatalogList } from './useCatalogList'

const ALL = 'ALL'

// skill id → names of the technicians who have it
function holdersBySkill(technicians = []) {
  const map = new Map()
  for (const tech of technicians) {
    for (const skill of tech.skills ?? []) {
      map.set(skill.id, [...(map.get(skill.id) ?? []), tech.fullName])
    }
  }
  return map
}

function HolderCount({ names = [] }) {
  if (!names.length) return <span className="text-muted-foreground">0</span>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="rounded-sm font-semibold tabular-nums underline decoration-dotted underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {names.length}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{names.join(', ')}</TooltipContent>
    </Tooltip>
  )
}

export function SkillsTab() {
  const skills = useCatalogList(skillsApi)
  const categories = useAsync(() => categoriesApi.list(), []) // active ones, for the dialog
  const technicians = useAsync(() => usersApi.listTechnicians(), [])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(ALL)
  const [form, setForm] = useState({ open: false, skill: null })
  const [deactivating, setDeactivating] = useState({ open: false, skill: null })

  const holders = holdersBySkill(technicians.data)

  // filter choices come from the skills themselves, so inactive categories appear too
  const filterOptions = [
    ...new Map(skills.items.map((s) => [s.category.id, s.category])).values(),
  ].sort((a, b) => a.name.localeCompare(b.name))

  // a filter for a category that has dropped out of the list falls back to "All"
  const category = filterOptions.some((c) => String(c.id) === categoryFilter)
    ? categoryFilter
    : ALL

  const shown = skills.items.filter(
    (s) =>
      (category === ALL || String(s.category.id) === category) &&
      matchesSearch(search, s.name, s.description, s.category.name, s.category.code),
  )

  async function activate(skill) {
    try {
      skills.replaceItem(await skillsApi.activate(skill.id))
      toast.success(`${skill.name} is active again`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function confirmDeactivate() {
    const { skill } = deactivating
    try {
      skills.replaceItem(await skillsApi.deactivate(skill.id))
      toast.success(`${skill.name} deactivated`)
    } catch (error) {
      toast.error(getErrorMessage(error))
      throw error
    }
  }

  function handleSaved(saved, { created }) {
    if (created) {
      toast.success(`${saved.name} added`)
      skills.reload()
    } else {
      toast.success('Changes saved')
      skills.replaceItem(saved)
    }
  }

  const filtering = search.trim() !== '' || category !== ALL

  return (
    <>
      <CatalogToolbar
        idPrefix="skills"
        search={search}
        onSearch={setSearch}
        searchLabel="Search skills"
        includeInactive={skills.includeInactive}
        onIncludeInactive={skills.setIncludeInactive}
        addLabel="Add skill"
        onAdd={() => setForm({ open: true, skill: null })}
      >
        <Select value={category} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 w-48 bg-popover" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {filterOptions.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CatalogToolbar>

      {skills.error ? (
        <ErrorAlert error={skills.error} title="Couldn’t load skills" onRetry={skills.reload} />
      ) : (
        <Card className="gap-0 py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Skill</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Technicians</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 pr-5">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody aria-busy={skills.loading}>
              {skills.loading && !skills.data
                ? Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="pl-5">
                        <Skeleton className="h-9 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : shown.map((skill) => (
                    <TableRow
                      key={skill.id}
                      className={cn(!skill.active && 'text-muted-foreground')}
                    >
                      <TableCell className="py-3 pl-5 whitespace-normal">
                        <span className="block font-semibold text-foreground">{skill.name}</span>
                        {skill.description && (
                          <span className="line-clamp-1 max-w-md text-sm text-muted-foreground">
                            {skill.description}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex flex-wrap items-center gap-2">
                          <CategoryCode code={skill.category.code} />
                          <span className="hidden text-sm text-muted-foreground xl:inline">
                            {skill.category.name}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-right sm:table-cell">
                        {technicians.data ? (
                          <HolderCount names={holders.get(skill.id)} />
                        ) : (
                          <span className="text-muted-foreground">…</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={skill.active ? 'ACTIVE' : 'INACTIVE'} />
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${skill.name}`}
                            >
                              <Ellipsis aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onSelect={() => setForm({ open: true, skill })}>
                              <Pencil aria-hidden="true" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {skill.active ? (
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeactivating({ open: true, skill })}
                              >
                                <PowerOff aria-hidden="true" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onSelect={() => activate(skill)}>
                                <Power aria-hidden="true" />
                                Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          {skills.data && shown.length === 0 && (
            <div className="p-5">
              <EmptyState
                icon={GraduationCap}
                title={filtering ? 'No skills match these filters' : 'No skills yet'}
                description={
                  filtering
                    ? 'Try another search or category, or turn on “Show inactive”.'
                    : 'Add skills, then give them to technicians from the Users page.'
                }
                action={
                  filtering && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch('')
                        setCategoryFilter(ALL)
                      }}
                    >
                      Clear filters
                    </Button>
                  )
                }
              />
            </div>
          )}

          {skills.data && shown.length > 0 && (
            <p className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
              {shown.length === skills.items.length
                ? `${shown.length} ${shown.length === 1 ? 'skill' : 'skills'}`
                : `${shown.length} of ${skills.items.length} skills`}
            </p>
          )}
        </Card>
      )}

      <SkillFormDialog
        open={form.open}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        skill={form.skill}
        categories={categories.data ?? []}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deactivating.open}
        onOpenChange={(open) => setDeactivating((d) => ({ ...d, open }))}
        title={`Deactivate ${deactivating.skill?.name ?? ''}?`}
        description="Technicians keep it on their profile, but it’s ignored when incidents are assigned. You can activate it again later."
        confirmLabel="Deactivate"
        pendingLabel="Deactivating…"
        destructive
        onConfirm={confirmDeactivate}
      />
    </>
  )
}
