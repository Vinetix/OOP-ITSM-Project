// Incident categories: a permanent code, a name, and the keywords that will
// let the system suggest a category from an incident's description.
import { useState } from 'react'
import { Ellipsis, Info, Pencil, Power, PowerOff, Tags } from 'lucide-react'
import { toast } from 'sonner'
import { categoriesApi } from '@/api/catalogApi'
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
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { CatalogToolbar } from './CatalogToolbar'
import { CategoryFormDialog } from './CategoryFormDialog'
import { matchesSearch, useCatalogList } from './useCatalogList'

const VISIBLE_KEYWORDS = 4

function KeywordChips({ keywords = [] }) {
  if (!keywords.length) return <span className="text-muted-foreground">—</span>
  const visible = keywords.slice(0, VISIBLE_KEYWORDS)
  const hidden = keywords.slice(VISIBLE_KEYWORDS)
  return (
    <div className="flex max-w-sm flex-wrap gap-1">
      {visible.map((k) => (
        <span key={k} className="rounded-sm bg-muted px-1.5 py-0.5 text-xs">
          {k}
        </span>
      ))}
      {hidden.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="rounded-sm px-1.5 py-0.5 text-xs font-semibold text-muted-foreground underline decoration-dotted underline-offset-2 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              +{hidden.length} more
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-64">{hidden.join(', ')}</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

export function CategoriesTab() {
  const categories = useCatalogList(categoriesApi)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ open: false, category: null })
  const [deactivating, setDeactivating] = useState({ open: false, category: null })

  const shown = categories.items.filter((c) =>
    matchesSearch(search, c.code, c.name, c.description, ...(c.keywords ?? [])),
  )

  async function activate(category) {
    try {
      categories.replaceItem(await categoriesApi.activate(category.id))
      toast.success(`${category.name} is active again`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function confirmDeactivate() {
    const { category } = deactivating
    try {
      categories.replaceItem(await categoriesApi.deactivate(category.id))
      toast.success(`${category.name} deactivated`)
    } catch (error) {
      toast.error(getErrorMessage(error))
      throw error
    }
  }

  function handleSaved(saved, { created }) {
    if (created) {
      toast.success(`${saved.name} added`)
      categories.reload()
    } else {
      toast.success('Changes saved')
      categories.replaceItem(saved)
    }
  }

  return (
    <>
      <CatalogToolbar
        idPrefix="categories"
        search={search}
        onSearch={setSearch}
        searchLabel="Search categories or keywords"
        includeInactive={categories.includeInactive}
        onIncludeInactive={categories.setIncludeInactive}
        addLabel="Add category"
        onAdd={() => setForm({ open: true, category: null })}
      />

      <p className="mb-4 flex items-start gap-2 text-sm text-muted-foreground">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Keywords help the system suggest a category when an employee describes a problem. The
        suggestions start working with incidents in Phase 3.
      </p>

      {categories.error ? (
        <ErrorAlert
          error={categories.error}
          title="Couldn’t load categories"
          onRetry={categories.reload}
        />
      ) : (
        <Card className="gap-0 py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden lg:table-cell">Keywords</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 pr-5">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody aria-busy={categories.loading}>
              {categories.loading && !categories.data
                ? Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="pl-5">
                        <Skeleton className="h-9 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : shown.map((category) => (
                    <TableRow
                      key={category.id}
                      className={cn(!category.active && 'text-muted-foreground')}
                    >
                      <TableCell className="py-3 pl-5">
                        <CategoryCode code={category.code} />
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <span className="block font-semibold text-foreground">{category.name}</span>
                        {category.description && (
                          <span className="line-clamp-1 max-w-sm text-sm text-muted-foreground">
                            {category.description}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <KeywordChips keywords={category.keywords} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={category.active ? 'ACTIVE' : 'INACTIVE'} />
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${category.name}`}
                            >
                              <Ellipsis aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onSelect={() => setForm({ open: true, category })}>
                              <Pencil aria-hidden="true" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {category.active ? (
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeactivating({ open: true, category })}
                              >
                                <PowerOff aria-hidden="true" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onSelect={() => activate(category)}>
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

          {categories.data && shown.length === 0 && (
            <div className="p-5">
              <EmptyState
                icon={Tags}
                title={search ? `No categories match “${search.trim()}”` : 'No categories yet'}
                description={
                  search
                    ? 'Search looks at codes, names and keywords. Try another word.'
                    : 'Add categories so incidents can be sorted by the kind of problem.'
                }
              />
            </div>
          )}

          {categories.data && shown.length > 0 && (
            <p className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
              {shown.length === categories.items.length
                ? `${shown.length} ${shown.length === 1 ? 'category' : 'categories'}`
                : `${shown.length} of ${categories.items.length} categories`}
            </p>
          )}
        </Card>
      )}

      <CategoryFormDialog
        open={form.open}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        category={form.category}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deactivating.open}
        onOpenChange={(open) => setDeactivating((d) => ({ ...d, open }))}
        title={`Deactivate ${deactivating.category?.name ?? ''}?`}
        description="It can’t be chosen for new incidents or skills. Services, skills and incidents that already use it keep it."
        confirmLabel="Deactivate"
        pendingLabel="Deactivating…"
        destructive
        onConfirm={confirmDeactivate}
      />
    </>
  )
}
