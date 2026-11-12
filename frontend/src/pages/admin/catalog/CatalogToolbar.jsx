// Search box, optional extra filters, "Show inactive" switch and the Add button,
// shared by the three catalog tabs.
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function CatalogToolbar({
  idPrefix,
  search,
  onSearch,
  searchLabel,
  includeInactive,
  onIncludeInactive,
  addLabel,
  onAdd,
  children,
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchLabel}
            aria-label={searchLabel}
            className="h-9 bg-popover pl-9"
          />
        </div>
        {children}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id={`${idPrefix}-inactive`}
            checked={includeInactive}
            onCheckedChange={onIncludeInactive}
          />
          <Label htmlFor={`${idPrefix}-inactive`} className="font-normal whitespace-nowrap">
            Show inactive
          </Label>
        </div>
        <Button onClick={onAdd} className="h-9">
          <Plus aria-hidden="true" />
          {addLabel}
        </Button>
      </div>
    </div>
  )
}
