import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

// Create the Yjs document
export const ydoc = new Y.Doc();

// Setup websocket provider (adjust URL accordingly)
export const provider = new WebsocketProvider('wss://your-websocket-server.com', 'canvas-room', ydoc);

// Shared map to hold canvas data
export const yCanvas = ydoc.getMap<any>('canvas');

export const awareness = provider.awareness;