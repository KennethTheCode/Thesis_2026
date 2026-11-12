import { useEffect, useState } from 'react'

// Locks a button for a few seconds after submitting.
//   const [secondsLeft, startCooldown] = useCooldown(3)
// Call startCooldown() after a submit; the button should be disabled while secondsLeft > 0.
export function useCooldown(seconds) {
  const [left, setLeft] = useState(0)

  useEffect(() => {
    if (left <= 0) return
    const timer = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [left])

  return [left, () => setLeft(seconds)]
}