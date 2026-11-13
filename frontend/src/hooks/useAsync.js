// Loads data for a page and tracks loading, error and reload.
//   const { data, error, loading, reload } = useAsync(() => usersApi.listTechnicians(), [])
// A late answer from an old request is ignored, so it can't overwrite newer data.
// reload({ silent: true }) refreshes in the background: no loading state, and a
// failed background refresh keeps what's on screen.
import { useCallback, useEffect, useRef, useState } from 'react'

export function useAsync(load, deps = []) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true })
  const [reloadCount, setReloadCount] = useState(0)
  const silentRef = useRef(false)

  useEffect(() => {
    let current = true
    const silent = silentRef.current
    silentRef.current = false
    if (!silent) setState((prev) => ({ ...prev, loading: true, error: null }))
    load().then(
      (data) => current && setState({ data, error: null, loading: false }),
      (error) => {
        if (current && !silent) setState((prev) => ({ ...prev, error, loading: false }))
      },
    )
    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadCount])

  const reload = useCallback(({ silent = false } = {}) => {
    silentRef.current = silent
    setReloadCount((n) => n + 1)
  }, [])

  // swap in data we already have, e.g. the row an edit just returned
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
