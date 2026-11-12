// Choose which skills a technician has: active skills grouped by category, with
// a search box. Saving replaces their whole list, so a skill that has since been
// deactivated is dropped, and the dialog says so before you save.
import { useState } from 'react'
import { Search } from 'lucide-react'
import { skillsApi } from '@/api/catalogApi'
import { usersApi } from '@/api/usersApi'
import { CategoryCode } from '@/components/CategoryCode'
import { ErrorAlert } from '@/components/ErrorAlert'
import { FormAlert } from '@/components/FormAlert'
import { FormDialog } from '@/components/FormDialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAsync } from '@/hooks/useAsync'
import { getErrorMessage } from '@/lib/errors'

export function TechnicianSkillsDialog({ open, onOpenChange, technician, onSaved }) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} className="sm:max-w-xl">
      {(dialog) => <SkillsForm technician={technician} onSaved={onSaved} {...dialog} />}
    </FormDialog>
  )
}

function groupByCategory(skills) {
  const groups = new Map()
  for (const skill of skills) {
    const key = skill.category.id
    if (!groups.has(key)) groups.set(key, { category: skill.category, skills: [] })
    groups.get(key).skills.push(skill)
  }
  return [...groups.values()].sort((a, b) => a.category.name.localeCompare(b.category.name))
}

function SkillsForm({ technician, onSaved, busy, setBusy, close }) {
  const skills = useAsync(() => skillsApi.list(), []) // active skills only
  const [selected, setSelected] = useState(() => new Set(technician.skills?.map((s) => s.id)))
  const [search, setSearch] = useState('')
  const [formError, setFormError] = useState(null)

  const active = skills.data ?? []
  const activeIds = new Set(active.map((s) => s.id))
  const inactiveHeld = skills.data
    ? (technician.skills ?? []).filter((s) => !activeIds.has(s.id))
    : []
  const chosenCount = active.filter((s) => selected.has(s.id)).length

  const q = search.trim().toLowerCase()
  const groups = groupByCategory(
    active.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.category.name.toLowerCase().includes(q) ||
        s.category.code.toLowerCase().includes(q),
    ),
  )

  function toggle(id, checked) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
    setFormError(null)
  }

  async function handleSave() {
    // only active skills are sent; inactive ones are dropped by design
    const skillIds = active.filter((s) => selected.has(s.id)).map((s) => s.id)
    setBusy(true)
    try {
      const updated = await usersApi.replaceTechnicianSkills(technician.id, skillIds)
      onSaved(updated)
      close()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">Skills for {technician.fullName}</DialogTitle>
        <DialogDescription>
          Incidents are matched to technicians by these skills, from Phase 4.
        </DialogDescription>
      </DialogHeader>

      <FormAlert message={formError} />

      {skills.error ? (
        <ErrorAlert error={skills.error} title="Couldn’t load skills" onRetry={skills.reload} />
      ) : !skills.data ? (
        <div className="grid gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search skills or categories"
              aria-label="Search skills or categories"
              className="h-9 bg-popover pl-9"
            />
          </div>

          <div className="max-h-[45svh] overflow-y-auto rounded-lg border border-border bg-popover">
            {groups.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                {active.length
                  ? `No skills match “${search.trim()}”.`
                  : 'There are no active skills yet. Add some on the Skills tab.'}
              </p>
            ) : (
              groups.map(({ category, skills: list }) => (
                <fieldset
                  key={category.id}
                  className="border-b border-border px-4 py-3 last:border-b-0"
                >
                  <legend className="sr-only">{category.name}</legend>
                  <div aria-hidden="true" className="mb-2 flex items-center gap-2">
                    <CategoryCode code={category.code} />
                    <span className="text-sm font-semibold">{category.name}</span>
                  </div>
                  <ul className="grid gap-1 sm:grid-cols-2">
                    {list.map((skill) => {
                      const id = `skill-${skill.id}`
                      return (
                        <li
                          key={skill.id}
                          className="flex items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-accent"
                        >
                          <Checkbox
                            id={id}
                            checked={selected.has(skill.id)}
                            onCheckedChange={(checked) => toggle(skill.id, checked === true)}
                          />
                          <label
                            htmlFor={id}
                            className="flex-1 cursor-pointer text-sm leading-snug"
                          >
                            {skill.name}
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                </fieldset>
              ))
            )}
          </div>

          {inactiveHeld.length > 0 && (
            <div className="rounded-lg border border-lamp-caution/40 bg-lamp-caution/5 px-4 py-3 text-sm">
              <p className="font-semibold">Inactive skills, removed when you save</p>
              <p className="mt-0.5 text-muted-foreground">
                {inactiveHeld.map((s) => s.name).join(', ')}. These skills have been deactivated, so
                they no longer count when incidents are assigned.
              </p>
            </div>
          )}
        </>
      )}

      <DialogFooter className="items-center sm:justify-between">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {skills.data && `${chosenCount} of ${active.length} skills selected`}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={close}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={busy || !skills.data}>
            {busy ? 'Saving…' : 'Save skills'}
          </Button>
        </div>
      </DialogFooter>
    </div>
  )
}
