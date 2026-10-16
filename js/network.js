/**
 * SAMBUNGIN! — WebRTC Peer-to-Peer Network Manager
 * Enables seamless multi-device gameplay using PeerJS DataChannels.
 * Allows one device to be the HOST and other devices to JOIN via a simple Room Code.
 */

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

    // Event Callbacks
    this.onConnected = null;
    this.onPlayerJoined = null;
    this.onPlayerLeft = null;
    this.onMessage = null;
    this.onError = null;
  }

  /**
   * Checks if URL has ?room=CODE parameter
   */
  static getRoomFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('room') ? params.get('room').toUpperCase().trim() : null;
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
    return `sambungin-p2p-${code.toUpperCase().trim()}`;
  }

  /**
   * Initializes Host Peer with a generated room code.
   */
  createRoom(hostName) {
    return new Promise((resolve, reject) => {
      this.role = 'HOST';
      this.myName = hostName.trim() || 'Host';
      this.roomCode = this.generateRoomCode();
      const peerId = this.getPrefixedId(this.roomCode);

      if (typeof window.Peer === 'undefined') {
        return reject(new Error('Pustaka PeerJS belum tersedia di peramban.'));
      }

      this.peer = new window.Peer(peerId, {
        debug: 1
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        this.isConnected = true;
        console.log(`[P2P HOST] Room dibuat dengan Kode: ${this.roomCode} (PeerID: ${id})`);

        this.setupHostListeners();
        resolve(this.roomCode);
      });

      this.peer.on('error', (err) => {
        console.error('[P2P HOST ERROR]', err);
        if (err.type === 'unavailable-id') {
          this.peer.destroy();
          this.createRoom(hostName).then(resolve).catch(reject);
        } else {
          if (this.onError) this.onError(err);
          reject(err);
        }
      });
    });
  }

  setupHostListeners() {
    this.peer.on('connection', (conn) => {
      conn.on('open', () => {
        console.log(`[P2P HOST] Klien terhubung: ${conn.peer}`);
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
        console.warn(`[P2P HOST] Connection error with ${conn.peer}:`, err);
      });
    });
  }

  handleHostReceivedData(conn, data) {
    if (!data || !data.type) return;

    if (data.type === 'JOIN_REQUEST') {
      const playerName = (data.name || 'Pemain').trim().slice(0, 16);
      const playerObj = {
        id: conn.peer,
        name: playerName,
        conn: conn
      };
      this.clients.set(conn.peer, playerObj);

      // Reply with acceptance & current state
      conn.send({
        type: 'JOIN_ACCEPTED',
        roomCode: this.roomCode,
        assignedId: conn.peer,
        hostName: this.myName
      });

      if (this.onPlayerJoined) {
        this.onPlayerJoined(playerObj);
      }
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
      this.role = 'CLIENT';
      this.myName = playerName.trim() || 'Pemain';
      this.roomCode = roomCode.toUpperCase().trim();
      const targetHostPeerId = this.getPrefixedId(this.roomCode);

      if (typeof window.Peer === 'undefined') {
        return reject(new Error('Pustaka PeerJS belum tersedia di peramban.'));
      }

      this.peer = new window.Peer(null, {
        debug: 1
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
        console.log(`[P2P CLIENT] Terhubung ke signaling sebagai: ${id}, mencoba masuk ke Room: ${this.roomCode}`);

        // Connect to Host
        this.hostConn = this.peer.connect(targetHostPeerId, {
          reliable: true
        });

        this.hostConn.on('open', () => {
          console.log('[P2P CLIENT] Berhasil tersambung ke Host! Mengirim JOIN_REQUEST...');
          this.isConnected = true;

          this.hostConn.send({
            type: 'JOIN_REQUEST',
            name: this.myName
          });
        });

        this.hostConn.on('data', (data) => {
          if (data.type === 'JOIN_ACCEPTED') {
            resolve(data);
          }
          if (this.onMessage) {
            this.onMessage(data.type, data.payload);
          }
        });

        this.hostConn.on('close', () => {
          console.warn('[P2P CLIENT] Terputus dari Host.');
          this.isConnected = false;
          if (this.onError) this.onError(new Error('Koneksi ke Host terputus!'));
        });

        this.hostConn.on('error', (err) => {
          console.error('[P2P CLIENT] Connection error:', err);
          reject(err);
        });
      });

      this.peer.on('error', (err) => {
        console.error('[P2P CLIENT ERROR]', err);
        if (err.type === 'peer-unavailable') {
          reject(new Error(`Room dengan kode "${this.roomCode}" tidak ditemukan atau Host sedang offline.`));
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Host sends message to all connected clients.
   */
  broadcast(type, payload = {}) {
    if (this.role !== 'HOST') return;
    const packet = { type, payload };
    this.clients.forEach(client => {
      if (client.conn && client.conn.open) {
        client.conn.send(packet);
      }
    });
  }

  /**
   * Host sends message to a specific connected client.
   */
  sendToClient(clientId, type, payload = {}) {
    if (this.role !== 'HOST') return false;
    const client = this.clients.get(clientId);
    if (client && client.conn && client.conn.open) {
      client.conn.send({ type, payload });
      return true;
    }
    return false;
  }

  /**
   * Client sends message to Host.
   */
  sendToHost(type, payload = {}) {
    if (this.role !== 'CLIENT' || !this.hostConn || !this.hostConn.open) return;
    this.hostConn.send({ type, payload });
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
   * Disconnects and resets network state.
   */
  disconnect() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.role = 'LOCAL';
    this.roomCode = null;
    this.hostConn = null;
    this.clients.clear();
    this.isConnected = false;
  }
}
