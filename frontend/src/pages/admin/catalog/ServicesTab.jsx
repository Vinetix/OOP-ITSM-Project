// IT services: what can break, how critical it is, and its default category.
import { useState } from 'react'
import { Ellipsis, Layers, Pencil, Power, PowerOff, Timer } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { categoriesApi, servicesApi } from '@/api/catalogApi'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { CriticalityBadge } from '@/components/CriticalityBadge'
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
import { useAsync } from '@/hooks/useAsync'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { CatalogToolbar } from './CatalogToolbar'
import { ServiceFormDialog } from './ServiceFormDialog'
import { matchesSearch, useCatalogList } from './useCatalogList'

export function ServicesTab() {
  const services = useCatalogList(servicesApi)
  const categories = useAsync(() => categoriesApi.list(), []) // active ones, for the dialog
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ open: false, service: null })
  const [deactivating, setDeactivating] = useState({ open: false, service: null })

  const shown = services.items.filter((s) => matchesSearch(search, s.name, s.description))

  async function activate(service) {
    try {
      services.replaceItem(await servicesApi.activate(service.id))
      toast.success(`${service.name} is active again`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function confirmDeactivate() {
    const { service } = deactivating
    try {
      services.replaceItem(await servicesApi.deactivate(service.id))
      toast.success(`${service.name} deactivated`)
    } catch (error) {
      toast.error(getErrorMessage(error))
      throw error // keeps the dialog open
    }
  }

  function handleSaved(saved, { created }) {
    if (created) {
      toast.success(`${saved.name} added`)
      services.reload()
    } else {
      toast.success('Changes saved')
      services.replaceItem(saved)
    }
  }

  return (
    <>
      <CatalogToolbar
        idPrefix="services"
        search={search}
        onSearch={setSearch}
        searchLabel="Search services"
        includeInactive={services.includeInactive}
        onIncludeInactive={services.setIncludeInactive}
        addLabel="Add service"
        onAdd={() => setForm({ open: true, service: null })}
      />

      {services.error ? (
        <ErrorAlert
          error={services.error}
          title="Couldn’t load services"
          onRetry={services.reload}
        />
      ) : (
        <Card className="gap-0 py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Service</TableHead>
                <TableHead>Criticality</TableHead>
                <TableHead className="hidden md:table-cell">Default category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12 pr-5">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody aria-busy={services.loading}>
              {services.loading && !services.data
                ? Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="pl-5">
                        <Skeleton className="h-9 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : shown.map((service) => (
                    <TableRow
                      key={service.id}
                      className={cn(!service.active && 'text-muted-foreground')}
                    >
                      <TableCell className="py-3 pl-5 whitespace-normal">
                        <span className="block font-semibold text-foreground">{service.name}</span>
                        {service.description && (
                          <span className="line-clamp-1 max-w-md text-sm text-muted-foreground">
                            {service.description}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <CriticalityBadge criticality={service.criticality} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {service.defaultCategory?.name ?? '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={service.active ? 'ACTIVE' : 'INACTIVE'} />
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${service.name}`}
                            >
                              <Ellipsis aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onSelect={() => setForm({ open: true, service })}>
                              <Pencil aria-hidden="true" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() =>
                                navigate(`/admin/sla-policies?serviceId=${service.id}`)
                              }
                            >
                              <Timer aria-hidden="true" />
                              View SLA
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {service.active ? (
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeactivating({ open: true, service })}
                              >
                                <PowerOff aria-hidden="true" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onSelect={() => activate(service)}>
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

          {services.data && shown.length === 0 && (
            <div className="p-5">
              <EmptyState
                icon={Layers}
                title={search ? `No services match “${search.trim()}”` : 'No services yet'}
                description={
                  search
                    ? 'Try another word, or turn on “Show inactive”.'
                    : 'Add the IT services people rely on, so incidents can be reported against them.'
                }
              />
            </div>
          )}

          {services.data && shown.length > 0 && (
            <p className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
              {shown.length === services.items.length
                ? `${shown.length} ${shown.length === 1 ? 'service' : 'services'}`
                : `${shown.length} of ${services.items.length} services`}
            </p>
          )}
        </Card>
      )}

      <ServiceFormDialog
        open={form.open}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        service={form.service}
        categories={categories.data ?? []}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deactivating.open}
        onOpenChange={(open) => setDeactivating((d) => ({ ...d, open }))}
        title={`Deactivate ${deactivating.service?.name ?? ''}?`}
        description="New incidents can’t be reported against it. Existing incidents keep it, and you can activate it again later."
        confirmLabel="Deactivate"
        pendingLabel="Deactivating…"
        destructive
        onConfirm={confirmDeactivate}
      />
    </>
  )
}
