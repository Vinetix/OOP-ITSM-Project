// The DEFAULT policy for each priority. They can be edited but never deleted,
// because every incident needs at least a default to fall back on.
import { Lock, Pencil, Plus } from 'lucide-react'
import { PriorityBadge } from '@/components/PriorityBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PRIORITIES } from '@/config/catalog'
import { formatMinutes } from '@/lib/format'

export function DefaultPoliciesCard({ policies, onEdit, onCreate }) {
  const byPriority = new Map(
    policies.filter((p) => p.scope === 'DEFAULT').map((p) => [p.priority, p]),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Default policies</CardTitle>
        <CardDescription>Used for every service that has no override.</CardDescription>
      </CardHeader>
      <CardContent>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-sm text-muted-foreground">
              <th scope="col" className="pb-2 font-medium">
                Priority
              </th>
              <th scope="col" className="pb-2 font-medium">
                First response
              </th>
              <th scope="col" className="pb-2 font-medium">
                Resolution
              </th>
              <th scope="col" className="pb-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PRIORITIES.map(({ value }) => {
              const policy = byPriority.get(value)
              return (
                <tr key={value}>
                  <td className="py-3">
                    <PriorityBadge priority={value} />
                  </td>
                  {policy ? (
                    <>
                      <td className="py-3 font-semibold tabular-nums">
                        {formatMinutes(policy.responseMinutes)}
                      </td>
                      <td className="py-3 font-semibold tabular-nums">
                        {formatMinutes(policy.resolutionMinutes)}
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              tabIndex={0}
                              aria-label="Default policies can’t be deleted"
                              className="mr-1 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <Lock aria-hidden="true" className="size-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Default policies can’t be deleted</TooltipContent>
                        </Tooltip>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onEdit(policy)}
                          aria-label={`Edit the default ${value} policy`}
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td colSpan={2} className="py-3 text-sm text-destructive">
                        Not set: incidents of this priority have no SLA
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="outline" size="sm" onClick={() => onCreate(value)}>
                          <Plus aria-hidden="true" />
                          Set
                        </Button>
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
