// Sets the browser tab title, e.g. "Users – I-ITSM".
import { useEffect } from 'react'

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} – I-ITSM` : 'I-ITSM'
  }, [title])
}
