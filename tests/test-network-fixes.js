/**
 * Test Suite: WebRTC P2P Multiplayer Connection & NetworkManager Fixes
 */

import { NetworkManager } from '../js/network.js';

console.log('========================================================');
console.log('🧪 PENGUJIAN PERBAIKAN P2P NETWORK & JOIN ROOM STUCK');
console.log('========================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. Sanitasi Kode Room
console.log('--- 1. Pengujian Sanitasi & Normalisasi Kode Room ---');
assert(NetworkManager.sanitizeRoomCode('abcd') === 'ABCD', 'Lowercase otomatis diubah ke UPPERCASE');
assert(NetworkManager.sanitizeRoomCode(' a 7 k 9 ') === 'A7K9', 'Spasi di tengah dan luar dibersihkan');
assert(NetworkManager.sanitizeRoomCode('sambungin-p2p-KL39') === 'KL39', 'Prefix sambungin-p2p- otomatis dihapus');
assert(NetworkManager.sanitizeRoomCode('KL-39#') === 'KL39', 'Karakter tanda baca/simbol dibersihkan');

const net = new NetworkManager();
assert(net.getPrefixedId('7x8y') === 'sambungin-p2p-7X8Y', 'getPrefixedId menghasilkan ID PeerJS yang valid');

// 2. Simulasi Data JOIN_ACCEPTED dengan Roster Lengkap
console.log('\n--- 2. Pengujian Instant Roster Sync pada JOIN_ACCEPTED ---');
const host = new NetworkManager();
host.role = 'HOST';
host.myName = 'Host Akbar';
host.roomCode = 'TEST';
host.myPeerId = 'sambungin-p2p-TEST';

let sentToMockClient = null;
const mockConn = {
  peer: 'client_peer_999',
  open: true,
  send: (pkt) => {
    sentToMockClient = pkt;
  }
};

let playerJoinedFired = false;
host.onPlayerJoined = (p) => {
  playerJoinedFired = true;
};

// Simulasi klien mengirim JOIN_REQUEST
host.handleHostReceivedData(mockConn, {
  type: 'JOIN_REQUEST',
  name: 'Budi'
});

assert(playerJoinedFired === true, 'Host berhasil memicu event onPlayerJoined');
assert(sentToMockClient !== null, 'Host langsung membalas ke koneksi klien');
assert(sentToMockClient.type === 'JOIN_ACCEPTED', 'Tipe pesan balasan adalah JOIN_ACCEPTED');
assert(Array.isArray(sentToMockClient.players), 'Pesan JOIN_ACCEPTED langsung membawa array pemain (players)');
assert(sentToMockClient.players.length === 2, 'Array pemain memuat 2 pemain (Host + Budi)');
assert(sentToMockClient.players[0].name.includes('Host Akbar'), 'Pemain pertama adalah Host');
assert(sentToMockClient.players[1].name === 'Budi', 'Pemain kedua adalah Budi');

// 3. Simulasi Penolakan Saat Game Sudah Dimulai
console.log('\n--- 3. Pengujian Penolakan Saat Game Sedang Berjalan ---');
host.isGameStarted = true;
let rejectedData = null;
const mockLateConn = {
  peer: 'client_late',
  open: true,
  send: (pkt) => { rejectedData = pkt; }
};

host.handleHostReceivedData(mockLateConn, {
  type: 'JOIN_REQUEST',
  name: 'Terlambat'
});

assert(rejectedData !== null, 'Host membalas ke klien yang terlambat');
assert(rejectedData.type === 'JOIN_REJECTED', 'Tipe pesan adalah JOIN_REJECTED');
assert(rejectedData.reason.includes('sudah dimulai'), 'Alasan penolakan jelas');

// 4. Simulasi Penutupan Room oleh Host
console.log('\n--- 4. Pengujian Host Disconnect & Broadcast Penutupan ---');
host.isGameStarted = false;
let hostClosedBroadcasted = false;
host.broadcast = (type, payload) => {
  if (type === 'HOST_ROOM_CLOSED') {
    hostClosedBroadcasted = true;
  }
};

host.disconnect();
assert(hostClosedBroadcasted === true, 'Saat Host disconnect, pesan HOST_ROOM_CLOSED disiarkan ke semua klien');
assert(host.clients.size === 0, 'Daftar klien Host bersih setelah disconnect');
assert(host.role === 'LOCAL', 'Role kembali menjadi LOCAL');

// 5. Pengujian Timeout Validasi Kode Room pada joinRoom
console.log('\n--- 5. Pengujian Validasi Kode Room Pendek ---');
let shortCodeRejected = false;
try {
  await host.joinRoom('1', 'Pemain');
} catch (e) {
  shortCodeRejected = true;
  assert(e.message.includes('minimal 3-4 karakter'), 'Kode room pendek ditolak secara cepat tanpa delay');
}
assert(shortCodeRejected === true, 'Promise joinRoom reject saat kode tidak valid');

console.log('\n========================================================');
console.log(`HASIL AKHIR: ${passed} LULUS, ${failed} GAGAL`);
console.log('========================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
