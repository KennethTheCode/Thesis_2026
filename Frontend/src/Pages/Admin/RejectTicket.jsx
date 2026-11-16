import React, { useState } from 'react';

function RejectTicket({ currentStatus, onReject, disabled }) {
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Hide button if incident is already resolved or rejected (unless showing success feedback)
  if ((currentStatus === 'resolved' || currentStatus === 'rejected') && !isSuccess) {
    return null;
  }

  const handleConfirmReject = async () => {
    try {
      await onReject('rejected');
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        setShowModal(false);
      }, 1000);
    } catch {
      // Error is handled and displayed by TicketManagement
      setShowModal(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setShowModal(true)}
        className="bg-red-500/20 hover:bg-red-600 text-red-500 hover:text-white py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Reject
      </button>

      {showModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-black/60 fixed inset-0 z-50 flex justify-center items-center p-4"
        >
          <div className="bg-zinc-900 p-5 rounded-4xl w-full max-w-md border border-zinc-700 flex flex-col items-center justify-between gap-6">
            <div className="w-full flex justify-center border-b border-zinc-800 pb-3 items-center">
              <p className="font-semibold text-zinc-400">
                {isSuccess ? 'Ticket Rejected' : 'Reject Ticket'}
              </p>
            </div>

            {isSuccess ? (
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <span className="material-symbols-outlined text-green-400 text-3xl">
                  check_circle
                </span>
                <p className="text-green-400 text-xs font-semibold">
                  Ticket rejected successfully! Redirecting...
                </p>
              </div>
            ) : (
              <>
                <p className="text-red-400 text-xs text-center border border-red-500/30 bg-red-500/10 p-3 rounded-lg w-full">
                  Are you sure you want to reject this ticket? This action cannot be undone.
                </p>

                <div className="flex gap-4">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setShowModal(false)}
                    className="border border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-6 py-3 rounded-xl duration-300 transition-colors cursor-pointer text-xs font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={handleConfirmReject}
                    className="bg-red-500/20 hover:bg-red-600 text-red-500 hover:text-white py-2 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {disabled ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RejectTicket;