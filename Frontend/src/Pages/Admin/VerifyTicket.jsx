import React, { useState } from 'react'

const NEXT_STEP = {
  pending: {
    targetStatus: 'verified',
    label: 'Verify',
    modalTitle: 'Verify Ticket',
    confirmMessage: 'Are you sure you want to verify this emergency incident?',
    successMessage: 'Ticket verified successfully! Updating...',
    loadingLabel: 'Verifying...',
    className: 'bg-blue-500/20 hover:bg-blue-600 text-blue-400 hover:text-white',
  },
  verified: {
    targetStatus: 'dispatched',
    label: 'Dispatch',
    modalTitle: 'Dispatch Responders',
    confirmMessage: 'Confirm dispatching emergency responders to this location?',
    successMessage: 'Responders dispatched successfully! Updating...',
    loadingLabel: 'Dispatching...',
    className: 'bg-amber-500/20 hover:bg-amber-600 text-amber-400 hover:text-white',
  },
  dispatched: {
    targetStatus: 'resolved',
    label: 'Resolved',
    modalTitle: 'Resolve Incident',
    confirmMessage: 'Mark this emergency incident as resolved? This will close the ticket.',
    successMessage: 'Incident resolved successfully! Redirecting...',
    loadingLabel: 'Resolving...',
    className: 'bg-green-500/20 hover:bg-green-600 text-green-400 hover:text-white',
  },
}

function VerifyTicket({ currentStatus, onUpdateStatus, disabled }) {
  const [showModal, setShowModal] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [activeStep, setActiveStep] = useState(null)

  const step = NEXT_STEP[currentStatus]
  const displayStep = activeStep || step

  // Hide button if incident is already resolved or rejected (unless showing success feedback)
  if (!displayStep && !isSuccess) {
    return null
  }

  const handleOpenConfirm = () => {
    setActiveStep(step)
    setShowModal(true)
  }

  const handleConfirmUpdate = async () => {
    if (!displayStep) return

    try {
      await onUpdateStatus(displayStep.targetStatus)
      setIsSuccess(true)

      setTimeout(() => {
        setIsSuccess(false)
        setShowModal(false)
        setActiveStep(null)
      }, 1000)
    } catch {
      // Error is handled and displayed by TicketManagement
      setShowModal(false)
      setActiveStep(null)
    }
  }

  return (
    <div>
      {step && (
        <button
          type="button"
          disabled={disabled}
          onClick={handleOpenConfirm}
          className={`${step.className} py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {step.label}
        </button>
      )}

      {showModal && displayStep && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-black/60 fixed inset-0 z-50 flex justify-center items-center p-4"
        >
          <div className="bg-zinc-900 p-5 rounded-4xl w-full max-w-md border border-zinc-700 flex flex-col items-center justify-between gap-6">
            <div className="w-full flex justify-center border-b border-zinc-800 pb-3 items-center">
              <p className="font-semibold text-zinc-400">
                {isSuccess ? 'Status Updated' : displayStep.modalTitle}
              </p>
            </div>

            {isSuccess ? (
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <span className="material-symbols-outlined text-green-400 text-3xl">
                  check_circle
                </span>
                <p className="text-green-400 text-xs font-semibold">
                  {displayStep.successMessage}
                </p>
              </div>
            ) : (
              <>
                <p className="text-zinc-300 text-xs text-center border border-zinc-700 bg-zinc-800/60 p-3 rounded-lg w-full">
                  {displayStep.confirmMessage}
                </p>

                <div className="flex gap-4">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setShowModal(false)
                      setActiveStep(null)
                    }}
                    className="border border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-6 py-3 rounded-xl duration-300 transition-colors cursor-pointer text-xs font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={handleConfirmUpdate}
                    className={`${displayStep.className} py-2 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {disabled ? displayStep.loadingLabel : displayStep.label}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default VerifyTicket