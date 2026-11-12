import { useState } from 'react'
import { updateFacility } from './Facilityapi.js'
import { SUBMIT_COOLDOWN_S } from './Facilityoptions.js'
import { useCooldown } from './Usecooldown.js'
import FacilityFields from './FacilityFields'

// Popup for editing one facility. ViewFacilities shows it when you click "Edit".
//   facility = the row being edited, onClose() = close the popup, onSaved() = refresh list and map
function EditFacilities({ facility, onClose, onSaved }) {
    const [form, setForm] = useState({
        name: facility.name,
        facility_type: facility.facility_type,
        address: facility.address,
        barangay: facility.barangay,
        contact_number: facility.contact_number,
        longitude: facility.longitude,
        latitude: facility.latitude,
    })
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [cooldown, startCooldown] = useCooldown(SUBMIT_COOLDOWN_S)

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (saving || cooldown > 0) return

        setSaving(true)
        setError('')
        try {
            await updateFacility(facility.id, {
                ...form,
                longitude: Number(form.longitude),
                latitude: Number(form.latitude),
            })
            onSaved?.()
            onClose()
        } catch (err) {
            setError(err.message)
            setSaving(false)
            startCooldown()   // lock the button after a failed try too
        }
    }

    const locked = saving || cooldown > 0
    const buttonText = saving ? 'Saving...' : cooldown > 0 ? `Please wait ${cooldown}s` : 'Save Changes'

    return (
        <div className="bg-black/60 fixed inset-0 z-[100] flex justify-center items-center ">
            <div className="bg-zinc-900 rounded w-[50vh] max-h-[95vh] overflow-y-auto flex flex-col  border border-zinc-700">
                <div className="w-full p-3 border-b border-blue-500 flex items-center justify-between">
                    <div className="flex justify-center items-center gap-2">
                        <span className="material-symbols-outlined" style={{ fontSize: '23px' }}>edit</span>
                        <p className="text-lg font-semibold">
                            Edit Facility
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white cursor-pointer duration-300 transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-3">
                    <FacilityFields form={form} onChange={handleChange} />

                    {error && (
                        <p className="text-red-400 text-xs border border-red-500/30 bg-red-500/10 rounded p-2">{error}</p>
                    )}

                    <button type="submit" disabled={locked}
                        className="bg-blue-500/20 text-blue-400 hover:bg-blue-600/20 cursor-pointer border border-blue-500/30 text-sm transition-colors duration-300 font-bold py-2 px-4 rounded mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                        {buttonText}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default EditFacilities