import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getMapIncidents, updateIncidentStatus } from '../Incidents/IncidentApi.js';
import { STATUS_BADGE, formatIncident } from '../incidentHelpers.js';
import { incidentSocket } from '../services/incidentSocket.js';

const IncidentContext = createContext(null);

export function IncidentProvider({ children }) {
  const [incidents, setIncidents] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [latestAlert, setLatestAlert] = useState(null);
  const fetchSeqRef = useRef(0);

  // Authoritative sync with sequence guard against stale out-of-order HTTP responses
  const syncIncidents = useCallback(async () => {
    const seq = ++fetchSeqRef.current;
    try {
      const data = await getMapIncidents();
      if (seq !== fetchSeqRef.current) return; // Discard stale response

      const formatted = data.map((inc) => formatIncident(inc));
      setIncidents((prev) => {
        const apiRefs = new Set(formatted.map((i) => i.reference_no));
        // Keep brand-new WS items (< 5s old) if DB read-replica hasn't indexed them yet
        const veryRecentWsOnly = prev.filter(
          (item) =>
            !apiRefs.has(item.reference_no) &&
            item._wsReceivedAt &&
            Date.now() - item._wsReceivedAt < 5000
        );
        return [...veryRecentWsOnly, ...formatted];
      });
    } catch (err) {
      console.error('[IncidentContext] Sync failed:', err);
    }
  }, []);

  // Initial load + resync whenever browser tab regains focus
  useEffect(() => {
    syncIncidents();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncIncidents();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [syncIncidents]);

  // Subscribe to singleton WebSocket bus
  useEffect(() => {
    const unsubStatus = incidentSocket.subscribeStatus((connected) => {
      setIsLive(connected);
      if (connected) {
        // Catch up on any events missed while disconnected
        syncIncidents();
      }
    });

    const unsubEvents = incidentSocket.subscribe((payload) => {
      const { event, data } = payload || {};

      if ((event === 'NEW_INCIDENT' || event === 'INCIDENT_CREATED') && data) {
        const formatted = {
          ...formatIncident(data, true),
          _wsReceivedAt: Date.now(),
        };

        setIncidents((prev) => {
          const exists = prev.some((item) => item.reference_no === formatted.reference_no);
          if (exists) {
            return prev.map((item) =>
              item.reference_no === formatted.reference_no ? { ...item, ...formatted } : item
            );
          }
          return [formatted, ...prev];
        });

        // Trigger instant map fly-to / visual alert pulse
        setLatestAlert(formatted);
      }

      if (event === 'INCIDENT_STATUS_UPDATED' && data) {
        const { reference_no, status } = data;
        const isTerminal = status === 'resolved' || status === 'rejected';
        const badge = STATUS_BADGE[status] || STATUS_BADGE.pending;

        setIncidents((prev) =>
          isTerminal
            ? prev.filter((item) => item.reference_no !== reference_no)
            : prev.map((item) =>
                item.reference_no === reference_no
                  ? { ...item, rawStatus: status, statusLabel: badge.label, statusBg: badge.style }
                  : item
              )
        );
      }

      if (event === 'VOICEMAIL_ATTACHED' && data) {
        const { reference_no, voicemail_file_id } = data;
        setIncidents((prev) =>
          prev.map((item) =>
            item.reference_no === reference_no ? { ...item, voicemail_file_id } : item
          )
        );
      }
    });

    return () => {
      unsubStatus();
      unsubEvents();
    };
  }, [syncIncidents]);

  const changeIncidentStatus = useCallback(async (referenceNo, newStatus) => {
    await updateIncidentStatus(referenceNo, newStatus);

    const isTerminal = newStatus === 'resolved' || newStatus === 'rejected';
    const badge = STATUS_BADGE[newStatus] || STATUS_BADGE.pending;

    setIncidents((prev) =>
      isTerminal
        ? prev.filter((item) => item.reference_no !== referenceNo)
        : prev.map((item) =>
            item.reference_no === referenceNo
              ? { ...item, rawStatus: newStatus, statusLabel: badge.label, statusBg: badge.style }
              : item
          )
    );
  }, []);

  return (
    <IncidentContext.Provider
      value={{
        incidents,
        isLive,
        latestAlert,
        clearLatestAlert: () => setLatestAlert(null),
        changeIncidentStatus,
        syncIncidents,
      }}
    >
      {children}
    </IncidentContext.Provider>
  );
}

export function useIncidents() {
  const ctx = useContext(IncidentContext);
  if (!ctx) {
    throw new Error('useIncidents must be used inside <IncidentProvider>');
  }
  return ctx;
}

export function useOptionalIncidents() {
  return useContext(IncidentContext);
}