import { useState } from 'react'
import { createFacility } from '../facilityApi'
import { SUBMIT_COOLDOWN_S } from '../Facilityoptions.js'
import { useCooldown } from '../useCooldown'
import FacilityFields from './FacilityFields'

const emptyForm = {
    name: '',
    facility_type: '',
    address: '',
    barangay: '',
    contact_number: '',
    longitude: '',   // Coordinates x
    latitude: '',    // Coordinates y
}

// onAdded() is called after a successful save so the list and map refresh without reloading.
function AddFacilities({ onAdded }) {
    const [showModal, setShowModal] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [cooldown, startCooldown] = useCooldown(SUBMIT_COOLDOWN_S)   // seconds left before you can submit again

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (saving || cooldown > 0) return

        setSaving(true)
        setError('')
        try {
            await createFacility({
                ...form,
                longitude: Number(form.longitude),
                latitude: Number(form.latitude),
            })
            setForm(emptyForm)
            setShowModal(false)
            onAdded?.()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
            startCooldown()   // lock the button whether it worked or not
        }
    }

    const locked = saving || cooldown > 0
    const buttonText = saving ? 'Saving...' : cooldown > 0 ? `Please wait ${cooldown}s` : 'Add Facility'

    return (
        <div>
            <button onClick={() => setShowModal(true)} className='bg-red-700 text-white p-1 rounded text-sm  items-center flex justify-center cursor-pointer hover:bg-red-600/20 hover:text-red-600 transition-colors duration-300'>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>Add Facility
            </button>
            {showModal && (
                <div className="bg-black/60 fixed inset-0 z-[100] flex justify-center items-center ">
                    <div className="bg-zinc-900 rounded w-[50vh] max-h-[95vh] overflow-y-auto flex flex-col  border border-zinc-700">
                        <div className="w-full p-3 border-b border-red-500 flex items-center justify-between">
                            <div className="flex justify-center items-center gap-2">
                                <span className="material-symbols-outlined" style={{ fontSize: '23px' }}>apartment</span>
                                <p className="text-lg font-semibold">
                                    Add Facility
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white cursor-pointer duration-300 transition-colors">
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-3">
                            <FacilityFields form={form} onChange={handleChange} />

                            {error && (
                                <p className="text-red-400 text-xs border border-red-500/30 bg-red-500/10 rounded p-2">{error}</p>
                            )}

                            <button type="submit" disabled={locked}
                                className="bg-red-500/20 text-red-500 hover:bg-red-600/20 cursor-pointer border border-red-500/30 text-sm transition-colors duration-300 font-bold py-2 px-4 rounded mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
                                {buttonText}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AddFacilities