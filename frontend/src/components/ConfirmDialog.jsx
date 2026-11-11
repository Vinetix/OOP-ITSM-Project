// "Are you sure?" dialog for actions like deactivating a user.
// onConfirm may be async: the button shows progress, the dialog closes on
// success and stays open if it throws (the caller shows the error toast).
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  pendingLabel = 'Working…',
  destructive = false,
  onConfirm,
}) {
  const [pending, setPending] = useState(false)

  async function handleConfirm(event) {
    event.preventDefault() // keep the dialog open until the action finishes
    setPending(true)
    try {
      await onConfirm?.()
      onOpenChange(false)
    } catch {
      // stay open; the caller has already reported the error
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}