// A dialog for one form. The form inside only exists while the dialog is open,
// so it starts fresh every time, and the dialog can't be closed mid-save.
//   <FormDialog open={open} onOpenChange={setOpen}>
//     {({ close, busy, setBusy }) => <MyForm ... />}
//   </FormDialog>
import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export function FormDialog({ open, onOpenChange, className, children }) {
  const [busy, setBusy] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className={cn('max-h-[90svh] overflow-y-auto sm:max-w-lg', className)}>
        {children({ busy, setBusy, close: () => onOpenChange(false) })}
      </DialogContent>
    </Dialog>
  )
}
