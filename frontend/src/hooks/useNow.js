// One shared clock for every live countdown on the page. Whether one countdown
// or fifty are on screen there is a single 1-second timer, and it stops while
// the tab is hidden (catching up the moment the tab is visible again).
import { useSyncExternalStore } from 'react'

const listeners = new Set()
let now = Date.now()
let timer = null

function tick() {
  now = Date.now()
  listeners.forEach((listener) => listener())
}

function start() {
  if (timer || document.visibilityState === 'hidden') return
  tick()
  timer = setInterval(tick, 1000)
}

function stop() {
  clearInterval(timer)
  timer = null
}

const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop())

function subscribe(listener) {
  listeners.add(listener)
  if (listeners.size === 1) {
    document.addEventListener('visibilitychange', onVisibility)
    start()
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }
}

export function useNow() {
  return useSyncExternalStore(subscribe, () => now)
}
