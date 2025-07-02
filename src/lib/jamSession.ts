import { nanoid } from 'nanoid';
import { create } from 'zustand';
import Peer from 'simple-peer';
import { io, Socket } from 'socket.io-client';

interface JamState {
  id: string | null;
  peers: Record<string, any>;
  start: () => void;
  send: (data: any) => void;
}

export const useJam = create<JamState>((set, get) => ({
  id: null,
  peers: {},
  start: () => {
    const id = nanoid(6);
    const socket: Socket = io('ws://localhost:3030');
    socket.emit('message', JSON.stringify({ type: 'join', id }));
    socket.on('message', (msg: string) => {
      const data = JSON.parse(msg);
      if (data.type === 'signal' && data.from) {
        let peer = get().peers[data.from];
        if (!peer) {
          peer = new Peer({ initiator: false, trickle: false });
          peer.on('signal', (s: any) => {
            socket.emit('message', JSON.stringify({ type: 'signal', id, to: data.from, payload: s }));
          });
          peer.on('data', (d: Uint8Array) => console.log('peer data', d.toString()));
          set({ peers: { ...get().peers, [data.from]: peer } });
        }
        peer.signal(data.payload);
      } else if (data.type === 'signal-ready' && data.from) {
        const peer = new Peer({ initiator: true, trickle: false });
        peer.on('signal', (s: any) => {
          socket.emit('message', JSON.stringify({ type: 'signal', id, to: data.from, payload: s }));
        });
        peer.on('data', (d: Uint8Array) => console.log('peer data', d.toString()));
        set({ peers: { ...get().peers, [data.from]: peer } });
        peer.signal(data.payload);
      }
    });
    set({ id });
  },
  send: (data: any) => {
    Object.values(get().peers).forEach(p => p.send(JSON.stringify(data)));
  },
}));

