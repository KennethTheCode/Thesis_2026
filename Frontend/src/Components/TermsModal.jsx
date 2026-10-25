import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Edit this list to change the wording. Have your adviser / the city's legal office review it.
const SECTIONS = [
  {
    title: '1. About ResQ:Biñan',
    body: 'ResQ:Biñan is a web-based road-accident emergency response system for Biñan City. It helps residents report accidents, find nearby facilities, and helps authorized responders coordinate rescue. It supports, and does not replace, calling 911 or your local emergency hotline.',
  },
  {
    title: '2. Your account',
    body: 'You must be at least 18 years old and provide true and current information. You are responsible for keeping your password secret and for everything done under your account. Tell us right away if you think someone else is using it.',
  },
  {
    title: '3. Valid ID and verification',
    body: 'We ask for a photo of a valid government ID only to confirm that you are a real person and a resident. The ID is stored securely, is seen only by authorized administrators, and is never shown to other users.',
  },
  {
    title: '4. Responsible use and false reports',
    body: 'Only report real emergencies. Sending false, prank, or repeated misleading reports wastes rescue resources and may lead to account suspension and possible legal action under Philippine law.',
  },
  {
    title: '5. Location and personal data',
    body: 'When you send an SOS or report, we use your location, contact number, and details you provide so responders can find and reach you. We collect only what is needed for this purpose, in line with the Data Privacy Act of 2012 (RA 10173). We do not sell your data.',
  },
  {
    title: '6. Who can see your information',
    body: 'Your information is shared only with authorized city responders and administrators while handling an incident, or when the law requires it. You may ask to view, correct, or delete your data by contacting the system administrators.',
  },
  {
    title: '7. Availability',
    body: 'We work to keep the system running, but we cannot promise it will always be available or error-free. In an emergency, always call 911 first.',
  },
  {
    title: '8. Changes and suspension',
    body: 'These terms may be updated from time to time. We may suspend accounts that break these terms or put others at risk.',
  },
]

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'

export default function TermsModal({ open, onClose, onAccept }) {
  const dialogRef = useRef(null)
  const bodyRef = useRef(null)
  const [readAll, setReadAll] = useState(false)

  // Lock page scroll, move focus into the dialog, give focus back when it closes.
  useEffect(() => {
    if (!open) return undefined
    const previouslyFocused = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    // Short screens may not need scrolling at all.
    const el = bodyRef.current
    if (el && el.scrollHeight - el.clientHeight <= 8) setReadAll(true)

    return () => {
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  const handleScroll = (e) => {
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= 8) setReadAll(true)
  }

  // Escape closes; Tab stays inside the dialog.
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    const nodes = dialogRef.current?.querySelectorAll(FOCUSABLE)
    if (!nodes?.length) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-lg sm:rounded-lg border border-neutral-800 bg-neutral-900 text-white shadow-xl focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-800 p-5">
          <div>
            <h2 id="terms-title" className="text-lg font-bold">Terms and Conditions</h2>
            <p className="text-xs font-thin text-gray-400">ResQ:Biñan · Terms of Use and Privacy Policy</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-gray-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          ref={bodyRef}
          onScroll={handleScroll}
          tabIndex={0}
          aria-label="Terms and Conditions text"
          className="flex-1 space-y-4 overflow-y-auto p-5 text-sm text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h3 className="mb-1 font-semibold text-white">{s.title}</h3>
              <p className="font-thin leading-relaxed">{s.body}</p>
            </section>
          ))}
          <p className="text-xs text-gray-500">Last updated: October 2026</p>
        </div>

        <div className="border-t border-neutral-800 p-4">
          {!readAll && (
            <p className="mb-2 text-center text-xs text-gray-400">Scroll to the bottom to enable “I Agree”.</p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-gray-600 px-4 py-2 text-sm hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              Close
            </button>
            <button
              type="button"
              disabled={!readAll}
              onClick={onAccept}
              className={`rounded px-4 py-2 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                readAll ? 'bg-red-600 hover:bg-red-700' : 'cursor-not-allowed bg-red-800/50 text-gray-400'
              }`}
            >
              I Agree
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}