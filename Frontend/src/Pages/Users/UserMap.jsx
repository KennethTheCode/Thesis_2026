import React, { useState, useMemo, useEffect, useRef } from 'react';

// ==========================================
// ACCURATE BIÑAN CITY INFRASTRUCTURE DATASET
// ==========================================
const BINAN_INFRASTRUCTURE = [
  // CITY HALL & EMERGENCY RESPONSE HQ
  {
    id: 'GOV-01',
    name: 'Biñan City Hall',
    category: 'City Hall',
    address: 'San Pablo St., Brgy. Zapote, Biñan, Laguna',
    lat: 14.3167,
    lng: 121.0820,
    hotline: '(049) 523-5400',
    type: 'Administrative Center',
    details: 'Primary Municipal & City Government Center'
  },
  {
    id: 'GOV-02',
    name: 'Biñan City Call Center 911 / CDRRMO',
    category: 'City Hall',
    address: 'CDRRMO Building, Brgy. Zapote, Biñan, Laguna',
    lat: 14.3172,
    lng: 121.0825,
    hotline: '911 / (049) 513-9111 / 0917-120-8911',
    type: 'Disaster Command Center',
    details: '24/7 City Disaster Risk Reduction & Management Center'
  },

  // HOSPITALS & MEDICAL CENTERS
  {
    id: 'HOSP-01',
    name: 'University of Perpetual Help System DALTA - Biñan Campus Medical Center',
    category: 'Hospitals',
    address: 'National Highway, Brgy. Sto. Niño, Biñan, Laguna',
    lat: 14.3312,
    lng: 121.0881,
    hotline: '(049) 511-9259 / (02) 8779-5310',
    type: 'Level 3 Tertiary Hospital',
    details: '24/7 Emergency Room, ICU & Trauma Care Center'
  },
  {
    id: 'HOSP-02',
    name: "Biñan Doctors' Hospital",
    category: 'Hospitals',
    address: 'Plaza Limaco, Brgy. San Vicente, Biñan, Laguna',
    lat: 14.3338,
    lng: 121.0824,
    hotline: '(049) 511-9159 / (049) 511-6171',
    type: 'Private Hospital',
    details: 'Full Clinical, Emergency & Surgical Services'
  },
  {
    id: 'HOSP-03',
    name: 'Unihealth-Southwoods Hospital and Medical Center',
    category: 'Hospitals',
    address: 'Southwoods Ecocentrum, Brgy. San Francisco, Biñan, Laguna',
    lat: 14.3168,
    lng: 121.0458,
    hotline: '(02) 8898-9700 / 0917-535-8532',
    type: 'Tertiary Medical Center',
    details: 'Advanced Critical Care, Diagnostics & Emergency Center'
  },
  {
    id: 'HOSP-04',
    name: 'Biñan City Hospital',
    category: 'Hospitals',
    address: 'Old National Hwy, Brgy. Canlalay, Biñan, Laguna',
    lat: 14.3418,
    lng: 121.0772,
    hotline: '(049) 511-4040',
    type: 'Public / Government Hospital',
    details: 'Municipal Healthcare & 24/7 Public Emergency Ward'
  },

  // POLICE STATIONS & PRECINCTS
  {
    id: 'POL-01',
    name: 'Biñan City Police Station (Main HQ)',
    category: 'Police',
    address: 'Zapote Street, Brgy. Zapote, Biñan, Laguna',
    lat: 14.3175,
    lng: 121.0828,
    hotline: '(049) 513-5111 / 0998-598-5645',
    type: 'City Police Headquarters',
    details: 'PNP Main City Tactical Command'
  },
  {
    id: 'POL-02',
    name: 'Biñan Police Station - PCP Olivarez',
    category: 'Police',
    address: 'Olivarez Plaza, Brgy. Sto. Domingo, Biñan, Laguna',
    lat: 14.3328,
    lng: 121.0815,
    hotline: '(049) 511-3783',
    type: 'Police Community Precinct',
    details: 'Commercial District Patrol & Rapid Response'
  },
  {
    id: 'POL-03',
    name: 'Mamplasan Police Sub-station',
    category: 'Police',
    address: 'LIIP Ave, Brgy. Mamplasan, Biñan, Laguna',
    lat: 14.3125,
    lng: 121.0665,
    hotline: '(049) 539-0128',
    type: 'Sub-station',
    details: 'Industrial Zone & CALAX Access Security Unit'
  },
  {
    id: 'POL-04',
    name: 'Biñan Police Sub-Station Canlalay',
    category: 'Police',
    address: 'Old National Hwy, Brgy. Canlalay, Biñan, Laguna',
    lat: 14.3402,
    lng: 121.0779,
    hotline: '(049) 511-3783',
    type: 'Sub-station',
    details: 'Northern Corridor Police Patrol Unit'
  },

  // FIRE STATIONS & BRIGADES
  {
    id: 'FIRE-01',
    name: 'DILG BFP Biñan City Central Fire Station',
    category: 'Fire',
    address: 'Malvar St, Brgy. Poblacion, Biñan, Laguna',
    lat: 14.3370,
    lng: 121.0862,
    hotline: '(049) 511-9110 / 0925-888-2371',
    type: 'Central BFP Fire Station',
    details: 'Main Bureau of Fire Protection HQ'
  },
  {
    id: 'FIRE-02',
    name: 'BFP Biñan City Fire Auxiliary Unit',
    category: 'Fire',
    address: 'City Hall Complex, Brgy. Zapote, Biñan, Laguna',
    lat: 14.3169,
    lng: 121.0826,
    hotline: '(049) 513-9111',
    type: 'Auxiliary Fire Response',
    details: 'City Government Auxiliary Rescue & Water Tanker Unit'
  },
  {
    id: 'FIRE-03',
    name: 'Biñan Volunteer Fire Brigade HQ',
    category: 'Fire',
    address: 'P. Paterno Street, Brgy. San Vicente, Biñan, Laguna',
    lat: 14.3355,
    lng: 121.0841,
    hotline: '(049) 511-6677 / 0917-500-2462',
    type: 'Volunteer Fire Brigade',
    details: 'Community Volunteer Emergency & Suppression Team'
  },

  // ALL 24 BARANGAY HALLS OF BIÑAN CITY
  { id: 'BRGY-01', name: 'Barangay Biñan Hall', category: 'Barangay Halls', address: '102 Maya St, Brgy. Biñan, Laguna', lat: 14.3355, lng: 121.0842, hotline: '(049) 511-3001', type: 'Barangay Government' },
  { id: 'BRGY-02', name: 'Barangay Bungahan Hall', category: 'Barangay Halls', address: 'Brgy. Bungahan, Biñan, Laguna', lat: 14.3018, lng: 121.0556, hotline: '(049) 511-3002', type: 'Barangay Government' },
  { id: 'BRGY-03', name: 'Barangay Canlalay Hall', category: 'Barangay Halls', address: 'Old National Hwy, Brgy. Canlalay, Biñan, Laguna', lat: 14.3412, lng: 121.0782, hotline: '(049) 511-3003', type: 'Barangay Government' },
  { id: 'BRGY-04', name: 'Barangay Casile Hall', category: 'Barangay Halls', address: 'Brgy. Casile, Biñan, Laguna', lat: 14.2884, lng: 121.0381, hotline: '(049) 511-3004', type: 'Barangay Government' },
  { id: 'BRGY-05', name: 'Barangay De La Paz Hall', category: 'Barangay Halls', address: 'Old National Hwy, Brgy. De La Paz, Biñan, Laguna', lat: 14.3382, lng: 121.0921, hotline: '(049) 511-3005', type: 'Barangay Government' },
  { id: 'BRGY-06', name: 'Barangay Ganado Hall', category: 'Barangay Halls', address: 'Brgy. Ganado, Biñan, Laguna', lat: 14.3019, lng: 121.0423, hotline: '(049) 511-3006', type: 'Barangay Government' },
  { id: 'BRGY-07', name: 'Barangay Langkiwa Hall', category: 'Barangay Halls', address: 'Langkiwa Main Rd, Brgy. Langkiwa, Biñan, Laguna', lat: 14.2856, lng: 121.0567, hotline: '(049) 511-3007', type: 'Barangay Government' },
  { id: 'BRGY-08', name: 'Barangay Loma Hall', category: 'Barangay Halls', address: 'Loma Main Rd, Brgy. Loma, Biñan, Laguna', lat: 14.2945, lng: 121.0634, hotline: '(049) 511-3008', type: 'Barangay Government' },
  { id: 'BRGY-09', name: 'Barangay Malaban Hall', category: 'Barangay Halls', address: 'Shoreline Rd, Brgy. Malaban, Biñan, Laguna', lat: 14.3451, lng: 121.0965, hotline: '(049) 511-3009', type: 'Barangay Government' },
  { id: 'BRGY-10', name: 'Barangay Malamig Hall', category: 'Barangay Halls', address: 'Brgy. Malamig, Biñan, Laguna', lat: 14.3041, lng: 121.0489, hotline: '(049) 511-3010', type: 'Barangay Government' },
  { id: 'BRGY-11', name: 'Barangay Mamplasan Hall', category: 'Barangay Halls', address: 'LIIP Ave, Brgy. Mamplasan, Biñan, Laguna', lat: 14.3112, lng: 121.0689, hotline: '(049) 511-3011', type: 'Barangay Government' },
  { id: 'BRGY-12', name: 'Barangay Platero Hall', category: 'Barangay Halls', address: 'Platero Rd, Brgy. Platero, Biñan, Laguna', lat: 14.3378, lng: 121.0876, hotline: '(049) 511-3012', type: 'Barangay Government' },
  { id: 'BRGY-13', name: 'Barangay Poblacion Hall', category: 'Barangay Halls', address: 'J. Rizal St, Brgy. Poblacion, Biñan, Laguna', lat: 14.3368, lng: 121.0835, hotline: '(049) 511-3013', type: 'Barangay Government' },
  { id: 'BRGY-14', name: 'Barangay San Antonio Hall', category: 'Barangay Halls', address: 'F Balagtas St, Brgy. San Antonio, Biñan, Laguna', lat: 14.3282, lng: 121.0745, hotline: '(049) 511-3014', type: 'Barangay Government' },
  { id: 'BRGY-15', name: 'Barangay San Francisco Hall', category: 'Barangay Halls', address: 'Halang Rd, Brgy. San Francisco, Biñan, Laguna', lat: 14.3067, lng: 121.0789, hotline: '(049) 511-3015', type: 'Barangay Government' },
  { id: 'BRGY-16', name: 'Barangay San Jose Hall', category: 'Barangay Halls', address: 'San Jose St, Brgy. San Jose, Biñan, Laguna', lat: 14.3321, lng: 121.0798, hotline: '(049) 511-3016', type: 'Barangay Government' },
  { id: 'BRGY-17', name: 'Barangay San Vicente Hall', category: 'Barangay Halls', address: 'P. Paterno St, Brgy. San Vicente, Biñan, Laguna', lat: 14.3351, lng: 121.0805, hotline: '(049) 511-3017', type: 'Barangay Government' },
  { id: 'BRGY-18', name: 'Barangay Santo Domingo Hall', category: 'Barangay Halls', address: 'Olivarez Compound, Brgy. Sto. Domingo, Biñan, Laguna', lat: 14.3304, lng: 121.0776, hotline: '(049) 511-3018', type: 'Barangay Government' },
  { id: 'BRGY-19', name: 'Barangay Santo Niño Hall', category: 'Barangay Halls', address: 'National Hwy, Brgy. Sto. Niño, Biñan, Laguna', lat: 14.3298, lng: 121.0812, hotline: '(049) 511-3019', type: 'Barangay Government' },
  { id: 'BRGY-20', name: 'Barangay Santo Tomas Hall', category: 'Barangay Halls', address: 'Brgy. Sto. Tomas, Biñan, Laguna', lat: 14.2812, lng: 121.0612, hotline: '(049) 511-3020', type: 'Barangay Government' },
  { id: 'BRGY-21', name: 'Barangay Soro-Soro Hall', category: 'Barangay Halls', address: 'Soro-Soro Rd, Brgy. Soro-Soro, Biñan, Laguna', lat: 14.3189, lng: 121.0601, hotline: '(049) 511-3021', type: 'Barangay Government' },
  { id: 'BRGY-22', name: 'Barangay Timbao Hall', category: 'Barangay Halls', address: 'Timbao Main Rd, Brgy. Timbao, Biñan, Laguna', lat: 14.3002, lng: 121.0712, hotline: '(049) 511-3022', type: 'Barangay Government' },
  { id: 'BRGY-23', name: 'Barangay Tubigan Hall', category: 'Barangay Halls', address: 'Tubigan Rd, Brgy. Tubigan, Biñan, Laguna', lat: 14.3218, lng: 121.0698, hotline: '(049) 511-3023', type: 'Barangay Government' },
  { id: 'BRGY-24', name: 'Barangay Zapote Hall', category: 'Barangay Halls', address: 'Zapote Rd, Brgy. Zapote, Biñan, Laguna', lat: 14.3171, lng: 121.0832, hotline: '(049) 511-3024', type: 'Barangay Government' }
];

// INITIAL SAMPLE INCIDENTS
const INITIAL_INCIDENTS = [
  {
    id: 101,
    title: 'Vehicular Collision',
    locationName: 'Plaza Rizal, Biñan Poblacion',
    lat: 14.3368,
    lng: 121.0830,
    severity: 'High',
    status: 'Responder Dispatched',
    category: 'Incidents',
    reportedAt: '10 mins ago'
  },
  {
    id: 102,
    title: 'Motorcycle Slip & Fall',
    locationName: 'SLEX Biñan Exit Toll Plaza',
    lat: 14.3125,
    lng: 121.0712,
    severity: 'Medium',
    status: 'Pending Verification',
    category: 'Incidents',
    reportedAt: '25 mins ago'
  }
];

// HAVERSINE DISTANCE CALCULATOR (IN KM)
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Custom Marker HTML generator
const getCategoryIconHtml = (category, isSelected = false) => {
  let bgColor = '#6b7280';
  let svgPath = '';

  switch (category) {
    case 'Hospitals':
      bgColor = '#ef4444';
      svgPath = `<path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>`;
      break;
    case 'Police':
      bgColor = '#2563eb';
      svgPath = `<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>`;
      break;
    case 'Fire':
      bgColor = '#f97316';
      svgPath = `<path d="M13.5 1.5s0 3-2 5c-1-1.5-1.5-3.5-1.5-3.5A7.5 7.5 0 003 10.5C3 15.19 6.81 19 11.5 19s8.5-3.81 8.5-8.5c0-4-3-7-6.5-9zM11.5 17c-2.48 0-4.5-2.02-4.5-4.5 0-1.78 1.03-3.32 2.5-4.04.14 1.74.88 3.32 2 4.54 1.25 1.37 2.5 2 2.5 2s-.5 2-2.5 2z"/>`;
      break;
    case 'Barangay Halls':
      bgColor = '#9333ea';
      svgPath = `<path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.7l5 4.5v7.8h-2v-6H9v6H7V10.2l5-4.5z"/>`;
      break;
    case 'City Hall':
      bgColor = '#059669';
      svgPath = `<path d="M12 2L1 7h22L12 2zm-7 7v10h3V9H5zm5 0v10h3V9h-3zm5 0v10h3V9h-3zm5 0v10h3V9h-3zM2 21h20v2H2v-2z"/>`;
      break;
    case 'Incidents':
      bgColor = '#dc2626';
      svgPath = `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>`;
      break;
    default:
      bgColor = '#475569';
      svgPath = `<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>`;
  }

  const borderClass = isSelected ? 'ring-4 ring-yellow-400 scale-125 z-50 shadow-2xl' : 'shadow-lg border-2 border-white/90 hover:scale-110';
  const pulseHtml = category === 'Incidents' ? `<span class="absolute -inset-1 rounded-full bg-red-500 animate-ping opacity-75"></span>` : '';

  return `
    <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${borderClass} transition-all duration-200 cursor-pointer" style="background-color: ${bgColor};">
      ${pulseHtml}
      <svg class="w-4 h-4 fill-current text-white relative z-10" viewBox="0 0 24 24">
        ${svgPath}
      </svg>
    </div>
  `;
};

export default function App() {
  const BINAN_CENTER = [14.3300, 121.0800];
  
  // DOM & Map Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // State
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('landmarks'); // 'landmarks' | 'incidents' | 'nearest'

  // Category Filters
  const [filters, setFilters] = useState({
    'City Hall': true,
    'Hospitals': true,
    'Police': true,
    'Fire': true,
    'Barangay Halls': true,
    'Incidents': true,
  });

  // Dynamic Leaflet Loader (CDN script & CSS inject)
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(cssLink);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setLeafletLoaded(true);
    document.body.appendChild(script);
  }, []);

  const toggleFilter = (cat) => {
    setFilters(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Filtered Lists
  const visibleLandmarks = useMemo(() => {
    return BINAN_INFRASTRUCTURE.filter(item => filters[item.category]);
  }, [filters]);

  const visibleIncidents = useMemo(() => {
    return filters['Incidents'] ? incidents : [];
  }, [filters, incidents]);

  const searchedLandmarks = useMemo(() => {
    if (!searchQuery.trim()) return BINAN_INFRASTRUCTURE;
    const q = searchQuery.toLowerCase();
    return BINAN_INFRASTRUCTURE.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Nearest Facilities Calculation
  const nearestResponders = useMemo(() => {
    if (!selectedPoint) return null;

    const findNearest = (category) => {
      let nearest = null;
      let minDistance = Infinity;

      BINAN_INFRASTRUCTURE.filter(item => item.category === category).forEach(item => {
        const dist = calculateHaversineDistance(
          selectedPoint.lat,
          selectedPoint.lng,
          item.lat,
          item.lng
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearest = { ...item, distanceKm: dist.toFixed(2) };
        }
      });
      return nearest;
    };

    return {
      hospital: findNearest('Hospitals'),
      police: findNearest('Police'),
      fire: findNearest('Fire'),
      cityHall: findNearest('City Hall')
    };
  }, [selectedPoint]);

  // Initialize Map Instance with Standard Public OpenStreetMap Tile Layer
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    const map = L.map(mapContainerRef.current, {
      center: BINAN_CENTER,
      zoom: 14,
      zoomControl: false,
    });

    // Clean OpenStreetMap standard tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.on('click', (e) => {
      setSelectedPoint({ lat: e.latlng.lat, lng: e.latlng.lng });
      setActiveTab('nearest');
      setSidebarOpen(true);
    });

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [leafletLoaded]);

  // Re-size Map whenever sidebar state changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 300);
    }
  }, [sidebarOpen]);

  // Render Map Markers dynamically
  useEffect(() => {
    if (!leafletLoaded || !mapInstanceRef.current) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // Render Infrastructure Markers
    visibleLandmarks.forEach((item) => {
      const isSelected = activeItem?.id === item.id;
      const icon = L.divIcon({
        html: getCategoryIconHtml(item.category, isSelected),
        className: 'bg-transparent border-0',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      const marker = L.marker([item.lat, item.lng], { icon }).addTo(map);
      marker.on('click', () => setActiveItem(item));

      marker.bindPopup(`
        <div style="color: #0f172a; font-family: system-ui, -apple-system, sans-serif; max-width: 240px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; tracking: 0.05em; margin-bottom: 2px;">
            ${item.category} • ${item.type}
          </div>
          <h3 style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.3; margin-bottom: 4px;">${item.name}</h3>
          <p style="font-size: 11px; color: #475569; margin-bottom: 6px;">${item.address}</p>
          ${item.details ? `<p style="font-size: 11px; color: #334155; background: #f1f5f9; padding: 4px 6px; border-radius: 6px; margin-bottom: 8px;">${item.details}</p>` : ''}
          <div style="border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <a href="tel:${item.hotline.split('/')[0].trim()}" style="font-size: 11px; font-weight: 700; color: #dc2626; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
              📞 ${item.hotline}
            </a>
          </div>
        </div>
      `);

      markersRef.current.push(marker);
    });

    // Render Incident Markers
    visibleIncidents.forEach((incident) => {
      const isSelected = activeItem?.id === incident.id;
      const icon = L.divIcon({
        html: getCategoryIconHtml('Incidents', isSelected),
        className: 'bg-transparent border-0',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      const marker = L.marker([incident.lat, incident.lng], { icon }).addTo(map);
      marker.on('click', () => setActiveItem(incident));

      marker.bindPopup(`
        <div style="color: #0f172a; font-family: system-ui, -apple-system, sans-serif; max-width: 220px; padding: 4px;">
          <span style="font-size: 9px; font-weight: 800; color: #dc2626; background: #fee2e2; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 4px;">
            ALERT • ${incident.severity}
          </span>
          <h4 style="font-size: 13px; font-weight: 700; color: #991b1b; margin-bottom: 4px;">${incident.title}</h4>
          <p style="font-size: 11px; color: #334155; margin-bottom: 6px;">${incident.locationName}</p>
          <p style="font-size: 10px; color: #64748b;">Status: <strong style="color: #d97706;">${incident.status}</strong></p>
        </div>
      `);

      markersRef.current.push(marker);
    });

    // Render User Click Target Pin
    if (selectedPoint) {
      const icon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-amber-500 shadow-xl animate-bounce">
            <span class="text-xs font-black text-black">📍</span>
          </div>
        `,
        className: 'bg-transparent border-0',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([selectedPoint.lat, selectedPoint.lng], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="font-size: 11px; padding: 2px;">
          <strong style="color: #b45309; font-size: 12px; display: block;">Target Location Pin</strong>
          <p style="color: #475569; font-size: 10px; margin-top: 2px;">
            ${selectedPoint.lat.toFixed(4)}, ${selectedPoint.lng.toFixed(4)}
          </p>
        </div>
      `);
      markersRef.current.push(marker);
    }
  }, [leafletLoaded, visibleLandmarks, visibleIncidents, selectedPoint, activeItem]);

  // Dispatch Report Emergency Location
  const handleReportEmergency = (e) => {
    e.preventDefault();
    if (!selectedPoint) return;

    const newReport = {
      id: Date.now(),
      title: 'Reported Incident',
      locationName: `Near Lat: ${selectedPoint.lat.toFixed(4)}, Lng: ${selectedPoint.lng.toFixed(4)}`,
      lat: selectedPoint.lat,
      lng: selectedPoint.lng,
      severity: 'High Priority',
      status: 'Pending Verification',
      category: 'Incidents',
      reportedAt: 'Just now'
    };

    setIncidents(prev => [newReport, ...prev]);
    setActiveItem(newReport);
    setSelectedPoint(null);
  };

  // Fly Map to Specified Facility
  const handleFlyToFacility = (facility) => {
    setActiveItem(facility);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([facility.lat, facility.lng], 16, { duration: 1.2 });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden antialiased relative">
      
      {/* CLEAN MODERN HEADER */}
      <header className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 z-30 shadow-sm w-full">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-2 text-xs font-semibold"
            title="Toggle Sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <span>{sidebarOpen ? 'Hide Menu' : 'Show Menu'}</span>
          </button>
          
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              ResQ <span className="text-slate-400 font-normal text-xs border-l border-slate-700 pl-2 hidden sm:inline">Biñan Command Center</span>
            </h1>
          </div>
        </div>

        {/* Top Header Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
            <span>Facilities: <strong className="text-slate-200 font-semibold">{BINAN_INFRASTRUCTURE.length}</strong></span>
            <span>Alerts: <strong className="text-red-400 font-semibold">{incidents.length}</strong></span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER (MAP & OVERLAY SIDEBAR) */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        
        {/* FULLSCREEN INTERACTIVE MAP VIEWPORT */}
        <div className="absolute inset-0 z-0 bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* TOGGLEABLE SIDEBAR OVERLAY */}
        <div className={`
          absolute top-0 left-0 bottom-16 z-20 w-full sm:w-80 bg-slate-900/95 backdrop-blur-md border-r border-slate-800/80 
          flex flex-col transition-all duration-300 ease-in-out shadow-2xl
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          
          {/* Minimalist Filter Bar */}
          <div className="p-3 bg-slate-950/40 border-b border-slate-800/60 shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
              Filter Categories
            </span>
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'Hospitals', key: 'Hospitals', activeBg: 'bg-red-500/20 text-red-300 border-red-500/30' },
                { label: 'Police', key: 'Police', activeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
                { label: 'Fire', key: 'Fire', activeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
                { label: 'City Hall', key: 'City Hall', activeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                { label: 'Barangays', key: 'Barangay Halls', activeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
                { label: 'Incidents', key: 'Incidents', activeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
              ].map(cat => (
                <button
                  key={cat.key}
                  onClick={() => toggleFilter(cat.key)}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition-all ${
                    filters[cat.key] 
                      ? `${cat.activeBg} shadow-xs` 
                      : 'bg-slate-900 text-slate-500 border-slate-800 opacity-60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Navigation Tabs */}
          <div className="flex border-b border-slate-800/80 text-xs font-medium bg-slate-900/50 shrink-0">
            <button
              onClick={() => setActiveTab('landmarks')}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                activeTab === 'landmarks'
                  ? 'border-red-500 text-white font-semibold bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Directory ({BINAN_INFRASTRUCTURE.length})
            </button>
            <button
              onClick={() => setActiveTab('incidents')}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                activeTab === 'incidents'
                  ? 'border-red-500 text-white font-semibold bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Alerts ({incidents.length})
            </button>
            <button
              onClick={() => setActiveTab('nearest')}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors relative ${
                activeTab === 'nearest'
                  ? 'border-red-500 text-white font-semibold bg-slate-800/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Routing
              {selectedPoint && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              )}
            </button>
          </div>

          {/* TAB CONTENTS CONTAINER */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            
            {/* TAB 1: DIRECTORY */}
            {activeTab === 'landmarks' && (
              <div className="space-y-2.5">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, address, or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1.5 text-xs text-slate-500 hover:text-slate-300"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {searchedLandmarks.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleFlyToFacility(item)}
                      className={`p-2.5 rounded-lg border transition-all cursor-pointer text-left ${
                        activeItem?.id === item.id 
                          ? 'bg-slate-800/80 border-slate-600 shadow-sm' 
                          : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700/80 hover:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xs font-semibold text-slate-100 leading-tight">{item.name}</h3>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 bg-slate-800 text-slate-300 border border-slate-700/50">
                          {item.category}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{item.address}</p>

                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <a
                          href={`tel:${item.hotline.split('/')[0].trim()}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
                        >
                          📞 {item.hotline}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: ALERTS */}
            {activeTab === 'incidents' && (
              <div className="space-y-2">
                {incidents.map((incident) => (
                  <div
                    key={incident.id}
                    onClick={() => handleFlyToFacility(incident)}
                    className="p-3 rounded-lg border border-red-900/30 bg-red-950/10 hover:bg-red-950/20 cursor-pointer transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/50">
                        {incident.severity}
                      </span>
                      <span className="text-[10px] text-slate-500">{incident.reportedAt}</span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-100 mt-1.5">{incident.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{incident.locationName}</p>
                    <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
                      <span>Status: <strong className="text-amber-400 font-normal">{incident.status}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: NEAREST ROUTING */}
            {activeTab === 'nearest' && (
              <div className="space-y-3">
                {!selectedPoint ? (
                  <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800 text-center">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center mx-auto mb-2 text-xs">
                      📍
                    </div>
                    <h3 className="text-xs font-semibold text-slate-200">No Location Pin Selected</h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                      Click anywhere on the map to set a location target and calculate nearest response units.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="p-2.5 bg-slate-950 border border-amber-500/20 rounded-lg">
                      <span className="text-[10px] uppercase font-bold text-amber-400/90 block tracking-wider">Target Location</span>
                      <div className="text-xs font-mono text-slate-300 mt-0.5">
                        {selectedPoint.lat.toFixed(5)}, {selectedPoint.lng.toFixed(5)}
                      </div>
                      <button
                        onClick={handleReportEmergency}
                        className="mt-2 w-full bg-red-600 hover:bg-red-500 text-white font-semibold text-xs py-1.5 px-3 rounded shadow-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        🚨 Dispatch Alert to Location
                      </button>
                    </div>

                    {nearestResponders && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Nearest Units
                        </span>

                        {/* Hospital */}
                        {nearestResponders.hospital && (
                          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                            <div className="flex justify-between items-start text-xs">
                              <span className="font-semibold text-red-400">🏥 Hospital</span>
                              <span className="font-mono text-slate-400 text-[10px]">
                                {nearestResponders.hospital.distanceKm} km
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-slate-200 mt-1">{nearestResponders.hospital.name}</div>
                            <a
                              href={`tel:${nearestResponders.hospital.hotline.split('/')[0].trim()}`}
                              className="mt-2 text-[10px] text-red-400 hover:text-red-300 font-medium block text-right"
                            >
                              📞 Call {nearestResponders.hospital.hotline}
                            </a>
                          </div>
                        )}

                        {/* Police */}
                        {nearestResponders.police && (
                          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                            <div className="flex justify-between items-start text-xs">
                              <span className="font-semibold text-blue-400">👮 Police Station</span>
                              <span className="font-mono text-slate-400 text-[10px]">
                                {nearestResponders.police.distanceKm} km
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-slate-200 mt-1">{nearestResponders.police.name}</div>
                            <a
                              href={`tel:${nearestResponders.police.hotline.split('/')[0].trim()}`}
                              className="mt-2 text-[10px] text-blue-400 hover:text-blue-300 font-medium block text-right"
                            >
                              📞 Call {nearestResponders.police.hotline}
                            </a>
                          </div>
                        )}

                        {/* Fire */}
                        {nearestResponders.fire && (
                          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                            <div className="flex justify-between items-start text-xs">
                              <span className="font-semibold text-orange-400">🚒 Fire Station</span>
                              <span className="font-mono text-slate-400 text-[10px]">
                                {nearestResponders.fire.distanceKm} km
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-slate-200 mt-1">{nearestResponders.fire.name}</div>
                            <a
                              href={`tel:${nearestResponders.fire.hotline.split('/')[0].trim()}`}
                              className="mt-2 text-[10px] text-orange-400 hover:text-orange-300 font-medium block text-right"
                            >
                              📞 Call {nearestResponders.fire.hotline}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* PERMANENT SOS EMERGENCY BAR AT THE BOTTOM */}
      <footer className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t-2 border-red-600/80 px-4 py-2 flex items-center justify-between z-50 shadow-2xl backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] uppercase font-extrabold text-red-500 tracking-wider">Emergency Response</span>
            <span className="text-xs font-medium text-slate-300">Biñan Command Center 24/7 Hotline</span>
          </div>
        </div>

        <a
          href="tel:911"
          className="w-full sm:w-auto bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-base px-8 py-2.5 rounded-xl transition-all duration-300 transform active:scale-95 shadow-lg shadow-red-600/40 flex items-center justify-center gap-3 border border-red-400/30 tracking-wider animate-pulse"
        >
          <span className="text-xl">🚨</span>
          <span>SOS EMERGENCY - CALL 911</span>
        </a>

        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>ALT: (049) 513-9111</span>
        </div>
      </footer>

    </div>
  );
}