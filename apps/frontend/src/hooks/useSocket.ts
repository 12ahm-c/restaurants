import { useSocket as useSocketContext } from '../contexts/SocketContext';

export function useSocket() {
  return useSocketContext();
}
