/**
 * SAMBUNGIN! — WebRTC Peer-to-Peer Network Manager
 * Enables seamless multi-device gameplay using PeerJS DataChannels.
 * Allows one device to be the HOST and other devices to JOIN via a simple Room Code.
 * 
 * Features:
 * - Robust STUN & OpenRelay free TURN servers for seamless NAT / 4G / 5G traversal.
 * - Strict timeouts & auto-recovery so clients and host never get stuck in connecting limbo.
 * - Instant roster sync inside JOIN_ACCEPTED to eliminate race conditions.
 * - Heartbeat ping/pong to prevent cellular network timeouts.
 * - Room code normalization (strips spaces, symbols, and prefixes).
 */

const PEER_CONFIG = {
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
      // OpenRelay Public TURN server for NAT traversal (crucial for mobile 4G/5G CGNAT and cross-network play)
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelay',
        credential: 'openrelay'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelay',
        credential: 'openrelay'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelay',
        credential: 'openrelay'
      }
    ],
    iceCandidatePoolSize: 10
  }
};

export class NetworkManager {
  constructor() {
    this.peer = null;
    this.role = 'LOCAL'; // 'LOCAL', 'HOST', 'CLIENT'
    this.roomCode = null;
    this.myPeerId = null;
    this.myName = '';
    this.hostConn = null; // For Client: connection to Host
    this.clients = new Map(); // For Host: peerId -> { conn, name, id }
    this.isConnected = false;
    this.isGameStarted = false;

    // Heartbeat timer
    this.heartbeatInterval = null;

    // Event Callbacks
    this.onConnected = null;
    this.onPlayerJoined = null;
    this.onPlayerLeft = null;
    this.onMessage = null;
    this.onError = null;
  }

  /**
   * Cleans and normalizes room code input (removes prefix, spaces, dashes, symbols).
   */
  static sanitizeRoomCode(raw) {
    if (!raw) return '';
    return String(raw)
      .replace(/^sambungin-p2p-/i, '')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .trim();
  }

  /**
   * Checks if URL has ?room=CODE parameter
   */
  static getRoomFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get('room');
      return raw ? NetworkManager.sanitizeRoomCode(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Generates a 4-character easy-to-read room code (e.g. 7482 or KL39)
   */
  generateRoomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  getPrefixedId(code) {
    const clean = NetworkManager.sanitizeRoomCode(code);
    return `sambungin-p2p-${clean}`;
  }

  /**
   * Initializes Host Peer with a generated room code.
   */
  createRoom(hostName, retryCount = 0) {
    return new Promise((resolve, reject) => {
      this.disconnect(); // Clean up any stale peer connection

      this.role = 'HOST';
      this.myName = hostName.trim() || 'Host';
      this.roomCode = this.generateRoomCode();
      this.isGameStarted = false;
      const peerId = this.getPrefixedId(this.roomCode);

      if (typeof window.Peer === 'undefined') {
        return reject(new Error('Pustaka PeerJS belum tersedia di peramban. Periksa koneksi internet Anda.'));
      }

      let isResolved = false;
      const connTimeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          this.disconnect();
          reject(new Error('Waktu habis saat menghubungkan ke jaringan P2P. Periksa koneksi internet dan coba lagi.'));
        }
      }, 14000);

      try {
        this.peer = new window.Peer(peerId, PEER_CONFIG);
      } catch (e) {
        clearTimeout(connTimeout);
        return reject(new Error(`Gagal menginisialisasi Peer: ${e.message}`));
      }

      this.peer.on('open', (id) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(connTimeout);

        this.myPeerId = id;
        this.isConnected = true;
        console.log(`[P2P HOST] Room dibuat dengan Kode: ${this.roomCode} (PeerID: ${id})`);

        this.setupHostListeners();
        resolve(this.roomCode);
      });

      this.peer.on('error', (err) => {
        console.error('[P2P HOST ERROR]', err);
        if (err.type === 'unavailable-id') {
          clearTimeout(connTimeout);
          this.disconnect();
          if (retryCount < 3) {
            console.log(`[P2P HOST] ID bentrok, mencoba membuat room baru (percobaan ${retryCount + 1})...`);
            this.createRoom(hostName, retryCount + 1).then(resolve).catch(reject);
          } else {
            reject(new Error('ID room bentrok berulang kali. Silakan coba lagi sebentar.'));
          }
        } else {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(connTimeout);
            if (this.onError) this.onError(err);
            reject(new Error(`Gagal membuat room (${err.type || err.message || 'Error'}).`));
          }
        }
      });
    });
  }

  setupHostListeners() {
    if (!this.peer) return;

    this.peer.on('connection', (conn) => {
      console.log(`[P2P HOST] Permintaan koneksi masuk dari: ${conn.peer}`);

      conn.on('open', () => {
        console.log(`[P2P HOST] DataChannel terbuka dengan klien: ${conn.peer}`);
      });

      conn.on('data', (data) => {
        this.handleHostReceivedData(conn, data);
      });

      conn.on('close', () => {
        console.log(`[P2P HOST] Klien terputus: ${conn.peer}`);
        const client = this.clients.get(conn.peer);
        this.clients.delete(conn.peer);
        if (this.onPlayerLeft && client) {
          this.onPlayerLeft(client);
        }
      });

      conn.on('error', (err) => {
        console.warn(`[P2P HOST] Connection error dengan ${conn.peer}:`, err);
      });

      // Monitor underlying WebRTC state if accessible
      if (conn.peerConnection) {
        conn.peerConnection.addEventListener('iceconnectionstatechange', () => {
          const state = conn.peerConnection.iceConnectionState;
          if (state === 'failed' || state === 'closed') {
            console.log(`[P2P HOST] WebRTC ICE ${state} untuk ${conn.peer}`);
            const client = this.clients.get(conn.peer);
            this.clients.delete(conn.peer);
            if (this.onPlayerLeft && client) {
              this.onPlayerLeft(client);
            }
          }
        });
      }
    });
  }

  handleHostReceivedData(conn, data) {
    if (!data || !data.type) return;

    if (data.type === 'JOIN_REQUEST') {
      if (this.isGameStarted) {
        try {
          conn.send({
            type: 'JOIN_REJECTED',
            reason: 'Permainan di room ini sudah dimulai!'
          });
        } catch (e) {}
        return;
      }

      if (this.clients.size >= 8) {
        try {
          conn.send({
            type: 'JOIN_REJECTED',
            reason: 'Room sudah penuh (maksimal 8 pemain)!'
          });
        } catch (e) {}
        return;
      }

      const playerName = (data.name || 'Pemain').trim().slice(0, 16);
      const playerObj = {
        id: conn.peer,
        name: playerName,
        conn: conn
      };
      this.clients.set(conn.peer, playerObj);

      // Build current full roster for immediate sync
      const currentRoster = [
        { id: this.myPeerId, name: `${this.myName} (Host)` }
      ];
      this.clients.forEach(c => {
        currentRoster.push({ id: c.id, name: c.name });
      });

      // Reply with acceptance & current state including full roster
      try {
        conn.send({
          type: 'JOIN_ACCEPTED',
          roomCode: this.roomCode,
          assignedId: conn.peer,
          hostName: this.myName,
          players: currentRoster
        });
      } catch (e) {
        console.warn('[P2P HOST] Gagal mengirim JOIN_ACCEPTED:', e);
      }

      if (this.onPlayerJoined) {
        this.onPlayerJoined(playerObj);
      }
    } else if (data.type === 'PING') {
      try {
        conn.send({ type: 'PONG', timestamp: Date.now() });
      } catch (e) {}
    } else if (data.type === 'REACTION_EMOTE') {
      // Re-broadcast reaction emote to all other connected clients
      this.broadcast('REACTION_EMOTE', data.payload);
      if (this.onMessage) {
        this.onMessage(data.type, data.payload, conn.peer);
      }
    } else {
      // Forward gameplay action to GameEngine on Host
      if (this.onMessage) {
        this.onMessage(data.type, data.payload, conn.peer);
      }
    }
  }

  /**
   * Initializes Client Peer and connects to Host via Room Code.
   */
  joinRoom(roomCode, playerName) {
    return new Promise((resolve, reject) => {
      this.disconnect(); // Clean up any stale peer connection

      this.role = 'CLIENT';
      this.myName = playerName.trim() || 'Pemain';
      const cleanCode = NetworkManager.sanitizeRoomCode(roomCode);
      this.roomCode = cleanCode;

      if (!cleanCode || cleanCode.length < 3) {
        return reject(new Error('Kode room minimal 3-4 karakter.'));
      }

      const targetHostPeerId = this.getPrefixedId(cleanCode);

      if (typeof window.Peer === 'undefined') {
        return reject(new Error('Pustaka PeerJS belum tersedia di peramban. Periksa koneksi internet Anda.'));
      }

      let isResolved = false;
      const totalTimeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          this.disconnect();
          reject(new Error(`Waktu habis saat mencoba menghubungi Room "${cleanCode}". Pastikan kode room benar dan Host masih online.`));
        }
      }, 15000);

      try {
        this.peer = new window.Peer(null, PEER_CONFIG);
      } catch (e) {
        clearTimeout(totalTimeout);
        return reject(new Error(`Gagal menginisialisasi Peer: ${e.message}`));
      }

      this.peer.on('open', (id) => {
        if (isResolved) return;
        this.myPeerId = id;
        console.log(`[P2P CLIENT] Terhubung ke signaling sebagai: ${id}, mencoba masuk ke Host: ${targetHostPeerId}`);

        // Connect to Host without legacy 'reliable' flag (DataChannel is SCTP-reliable natively)
        try {
          this.hostConn = this.peer.connect(targetHostPeerId, {
            serialization: 'json'
          });
        } catch (e) {
          if (!isResolved) {
            isResolved = true;
            clearTimeout(totalTimeout);
            this.disconnect();
            reject(new Error(`Gagal membuka koneksi ke Host: ${e.message}`));
          }
          return;
        }

        // Wait for connection to open, then send JOIN_REQUEST
        let joinRequestSent = false;
        const sendJoinReq = () => {
          if (joinRequestSent || !this.hostConn) return;
          joinRequestSent = true;
          console.log('[P2P CLIENT] Berhasil tersambung ke Host! Mengirim JOIN_REQUEST...');
          this.isConnected = true;

          try {
            this.hostConn.send({
              type: 'JOIN_REQUEST',
              name: this.myName
            });
          } catch (err) {
            console.error('[P2P CLIENT] Gagal mengirim JOIN_REQUEST:', err);
          }
        };

        this.hostConn.on('open', sendJoinReq);

        this.hostConn.on('data', (data) => {
          if (!data || !data.type) return;

          if (data.type === 'JOIN_ACCEPTED') {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(totalTimeout);
              this.startHeartbeat();
              resolve(data);
            }
          } else if (data.type === 'JOIN_REJECTED') {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(totalTimeout);
              this.disconnect();
              reject(new Error(data.reason || 'Permintaan bergabung ditolak oleh Host.'));
            }
          } else if (data.type === 'PONG') {
            // Heartbeat ACK
          }

          if (this.onMessage) {
            this.onMessage(data.type, data.payload || data);
          }
        });

        this.hostConn.on('close', () => {
          console.warn('[P2P CLIENT] Terputus dari Host.');
          this.stopHeartbeat();
          this.isConnected = false;
          if (!isResolved) {
            isResolved = true;
            clearTimeout(totalTimeout);
            this.disconnect();
            reject(new Error(`Koneksi ditutup sebelum berhasil bergabung ke Room "${cleanCode}".`));
          } else {
            if (this.onError) this.onError(new Error('Koneksi ke Host terputus!'));
          }
        });

        this.hostConn.on('error', (err) => {
          console.error('[P2P CLIENT] DataConnection error:', err);
          if (!isResolved) {
            isResolved = true;
            clearTimeout(totalTimeout);
            this.disconnect();
            reject(new Error('Gagal menghubungkan DataChannel ke Host.'));
          }
        });

        // Monitor underlying WebRTC state if accessible
        if (this.hostConn.peerConnection) {
          this.hostConn.peerConnection.addEventListener('iceconnectionstatechange', () => {
            const state = this.hostConn.peerConnection.iceConnectionState;
            if (state === 'failed') {
              console.warn('[P2P CLIENT] WebRTC ICE connection failed.');
              if (!isResolved) {
                isResolved = true;
                clearTimeout(totalTimeout);
                this.disconnect();
                reject(new Error(`Gagal menembus NAT/jaringan ke Host Room "${cleanCode}". Pastikan sinyal internet stabil.`));
              }
            }
          });
        }
      });

      this.peer.on('error', (err) => {
        console.error('[P2P CLIENT ERROR]', err);
        if (!isResolved) {
          isResolved = true;
          clearTimeout(totalTimeout);
          this.disconnect();
          if (err.type === 'peer-unavailable') {
            reject(new Error(`Room dengan kode "${cleanCode}" tidak ditemukan atau Host sedang offline.`));
          } else if (err.type === 'network') {
            reject(new Error('Koneksi internet bermasalah saat menghubungi server P2P.'));
          } else {
            reject(new Error(`Gagal bergabung: ${err.type || err.message || 'Koneksi error'}`));
          }
        }
      });
    });
  }

  /**
   * Heartbeat to keep WebRTC DataChannel active across mobile carrier NAT gateways.
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.role === 'CLIENT' && this.hostConn && this.hostConn.open) {
        try {
          this.hostConn.send({ type: 'PING' });
        } catch (e) {}
      }
    }, 4000);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Host sends message to all connected clients.
   */
  broadcast(type, payload = {}) {
    if (this.role !== 'HOST') return;
    const packet = { type, payload };
    this.clients.forEach(client => {
      try {
        if (client.conn && (client.conn.open || client.conn._open)) {
          client.conn.send(packet);
        }
      } catch (err) {
        console.warn(`[P2P HOST] Broadcast error ke ${client.id}:`, err);
      }
    });
  }

  /**
   * Host sends message to a specific connected client.
   */
  sendToClient(clientId, type, payload = {}) {
    if (this.role !== 'HOST') return false;
    const client = this.clients.get(clientId);
    if (client && client.conn && (client.conn.open || client.conn._open)) {
      try {
        client.conn.send({ type, payload });
        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  /**
   * Client sends message to Host.
   */
  sendToHost(type, payload = {}) {
    if (this.role !== 'CLIENT' || !this.hostConn || !this.hostConn.open) return;
    try {
      this.hostConn.send({ type, payload });
    } catch (e) {
      console.warn('[P2P CLIENT] sendToHost error:', e);
    }
  }

  /**
   * Sends reaction emote (Host broadcasts to all, Client sends to Host to broadcast).
   */
  sendReaction(emoji) {
    const payload = { emoji, sender: this.myName };
    if (this.role === 'HOST') {
      this.broadcast('REACTION_EMOTE', payload);
      if (this.onMessage) {
        this.onMessage('REACTION_EMOTE', payload, this.myPeerId);
      }
    } else if (this.role === 'CLIENT') {
      this.sendToHost('REACTION_EMOTE', payload);
      if (this.onMessage) {
        this.onMessage('REACTION_EMOTE', payload, this.myPeerId);
      }
    }
  }

  /**
   * Disconnects and cleanly resets network state.
   */
  disconnect() {
    this.stopHeartbeat();

    // Notify clients if host leaves
    if (this.role === 'HOST' && this.clients.size > 0) {
      try {
        this.broadcast('HOST_ROOM_CLOSED', { message: 'Host telah menutup room ini.' });
      } catch (e) {}
    }

    if (this.clients) {
      this.clients.forEach(c => {
        try {
          if (c.conn) c.conn.close();
        } catch (e) {}
      });
      this.clients.clear();
    }

    if (this.hostConn) {
      try {
        this.hostConn.close();
      } catch (e) {}
      this.hostConn = null;
    }

    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (e) {}
      this.peer = null;
    }

    this.role = 'LOCAL';
    this.roomCode = null;
    this.myPeerId = null;
    this.isConnected = false;
    this.isGameStarted = false;
  }
}
