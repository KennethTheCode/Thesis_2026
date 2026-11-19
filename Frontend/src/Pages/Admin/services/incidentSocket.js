import { getIncidentWSUrl } from '../Incidents/IncidentApi.js';

class IncidentSocketManager {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.statusListeners = new Set();
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.isConnected = false;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(getIncidentWSUrl());

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this._notifyStatus(true);
        this._startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const payload = JSON.parse(event.data);
          this.listeners.forEach((cb) => cb(payload));
        } catch (err) {
          console.error('[IncidentWS] Malformed payload:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this._notifyStatus(false);
        this._stopHeartbeat();
        this._scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch (err) {
      console.error('[IncidentWS] Connection failed:', err);
      this._scheduleReconnect();
    }
  }

  _startHeartbeat() {
    this._stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 25000);
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    // Exponential backoff capped at 10s so emergency recovery is rapid
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 10000);
    this.reconnectAttempts += 1;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  _notifyStatus(connected) {
    this.statusListeners.forEach((cb) => cb(connected));
  }

  subscribe(callback) {
    this.listeners.add(callback);
    this.connect();
    return () => {
      this.listeners.delete(callback);
    };
  }

  subscribeStatus(callback) {
    this.statusListeners.add(callback);
    callback(this.isConnected);
    return () => {
      this.statusListeners.delete(callback);
    };
  }
}

export const incidentSocket = new IncidentSocketManager();