import { FACILITY_TYPES, BARANGAYS, COORD_LIMITS } from './Facilityoptions.js'

const inputClass = "bg-zinc-800 text-zinc-500 placeholder:text-zinc-600 placeholder:font-thin placeholder:text-[12px] px-1 border-b border-zinc-700"

// The form inputs shared by Add and Edit. The parent owns the `form` state.
//   form     = { name, facility_type, address, barangay, contact_number, longitude, latitude }
//   onChange = standard input change handler (inputs are matched by their `name`)
function FacilityFields({ form, onChange }) {
    return (
        <>
            <p className="text-zinc-500 text-sm ">Facility Name</p>
            <input name="name" value={form.name} onChange={onChange} required minLength={3} maxLength={100}
                className={inputClass} placeholder="Enter Facility Name..." />

            <p className="text-zinc-500 text-sm ">Type</p>
            <select name="facility_type" value={form.facility_type} onChange={onChange} required className={inputClass}>
                <option value="">Select Facility Type...</option>
                {FACILITY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                ))}
            </select>

            <p className="text-zinc-500 text-sm ">Address</p>
            <input name="address" value={form.address} onChange={onChange} required minLength={5} maxLength={200}
                className={inputClass} placeholder="Enter Facility Address..." />

            <p className="text-zinc-500 text-sm ">Barangay</p>
            <select name="barangay" value={form.barangay} onChange={onChange} required className={inputClass}>
                <option value="">Select Barangay...</option>
                {BARANGAYS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                ))}
            </select>

            <p className="text-zinc-500 text-sm ">Contact Number</p>
            <input name="contact_number" value={form.contact_number} onChange={onChange} required
                pattern="[0-9+()\-\s]{7,20}" title="Digits, spaces, + ( ) - only (7-20 characters)"
                className={inputClass} placeholder="Enter Contact Number..." />

            <p className="text-zinc-500 text-sm ">Coordinates x (longitude)</p>
            <input name="longitude" type="number" step="any" value={form.longitude} onChange={onChange} required
                min={COORD_LIMITS.minLng} max={COORD_LIMITS.maxLng}
                className={inputClass} placeholder={`e.g. 121.082 (${COORD_LIMITS.minLng} - ${COORD_LIMITS.maxLng})`} />

            <p className="text-zinc-500 text-sm ">Coordinates y (latitude)</p>
            <input name="latitude" type="number" step="any" value={form.latitude} onChange={onChange} required
                min={COORD_LIMITS.minLat} max={COORD_LIMITS.maxLat}
                className={inputClass} placeholder={`e.g. 14.3323 (${COORD_LIMITS.minLat} - ${COORD_LIMITS.maxLat})`} />
        </>
    )
}

export default FacilityFields