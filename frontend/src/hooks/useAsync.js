// Loads data when a page opens and tracks loading / error / data for it.
//   const { data, error, loading, reload } = useAsync(() => usersApi.listTechnicians(), [])
// - deps: when any of them change, the data is loaded again (like useEffect).
// - Answers that arrive after the page moved on are ignored, so a slow old
//   request can never overwrite a newer one.
// - On reload the old data stays visible until the new data arrives.
import { useCallback, useEffect, useState } from 'react'

export function useAsync(load, deps = []) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true })
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let current = true
    setState((prev) => ({ ...prev, loading: true, error: null }))
    load().then(
      (data) => current && setState({ data, error: null, loading: false }),
      (error) => current && setState((prev) => ({ ...prev, error, loading: false })),
    )
    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadCount])

  const reload = useCallback(() => setReloadCount((n) => n + 1), [])

  /** Replace the loaded data locally, e.g. after an edit returned the new version. */
  const setData = useCallback(
    (update) =>
      setState((prev) => ({
        ...prev,
        data: typeof update === 'function' ? update(prev.data) : update,
      })),
    [],
  )

  return { ...state, reload, setData }
}