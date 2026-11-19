import React from 'react';

const INCIDENT_ICON = {
  VEHICULAR: 'car_crash',
  FIRE: 'local_fire_department',
  MEDICAL: 'medical_services',
  'MEDICAL ASSISTANCE': 'medical_services',
  WEATHER: 'flood',
  FLOOD: 'flood',
  CRIME: 'emergency',
};

function IncidentTicketItem({ item, onSelect }) {
  const iconName =
    INCIDENT_ICON[(item.incident_type || item.title || '').toUpperCase()] || 'emergency_home';

  return (
    <div
      onClick={() => onSelect(item)}
      className="cursor-pointer w-full p-2 py-3 flex justify-between items-center hover:bg-zinc-800/30 transition-colors"
    >
      <div className="flex items-center gap-2">
        <div className="bg-red-500/20 p-2 flex items-center justify-center rounded-full">
          <span className="material-symbols-outlined text-red-500">{iconName}</span>
        </div>
        <div className="flex flex-col">
          <p className="text-xs font-bold text-white">{item.title}</p>
          <p className="text-[10px] font-thin text-gray-300">{item.locationName}</p>
          <div className="flex items-center gap-1 text-zinc-400 mt-0.5">
            <span className="material-symbols-outlined text-[10px]" style={{ fontSize: '12px' }}>
              schedule
            </span>
            <p className="text-[10px] font-thin">{item.time}</p>
          </div>
        </div>
      </div>

      <span className={`p-1.5 px-2.5 text-[9px] font-medium rounded-lg ${item.statusBg}`}>
        {item.statusLabel}
      </span>
    </div>
  );
}

export default IncidentTicketItem;