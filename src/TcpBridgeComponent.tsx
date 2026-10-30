import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * A custom hook to initialize a write-only WebSocket connection.
 * @param url The WebSocket bridge URL (e.g., 'ws://localhost:8080')
 * @returns A stable function to send strings or binary data to the bridge
 */

type WebSocketDataType = string | ArrayBuffer | Blob | ArrayBufferView<ArrayBuffer>;


export function useTcpSender(url: string): { sendData: (data: WebSocketDataType) => void; latestMessage: string } {  // Explicitly type the ref to hold a WebSocket or null
  const socketRef = useRef<WebSocket | null>(null);
  const [latestMessage, setLatestMessage] = useState<string>('');

    // 1. A pure helper function that safely converts incoming WebSocket data to a string
    const extractStringData = (rawData: any): string => {
    if (typeof rawData === 'string') {
        return rawData;
    }
    
    if (rawData instanceof ArrayBuffer) {
        // Optional fallback: if binary data arrives, convert it to a text string (e.g., UTF-8)
        return new TextDecoder().decode(rawData);
    }
    
    if (rawData instanceof Blob) {
        // Blobs require asynchronous reading, but for synchronous return, 
        // you'd typically expect string or ArrayBuffer from your C++ server.
        console.warn('⚠️ Received Blob data, synchronous string conversion not supported directly.');
        return '';
    }

    return String(rawData);
    };

    // 2. Your React callback using the helper
    const handleReceiveData = useCallback((event: MessageEvent): string => {
    const textString = extractStringData(event.data);
    
    console.log('📥 Received string:', textString);
    return textString;
    }, []);


  useEffect(() => {
    // Initialize the WebSocket connectiaxon
    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = (): void => {
      console.log('🚀 WebSocket bridge connection established.');
    };
    ws.onmessage = (event: MessageEvent) => {
    const resultString = handleReceiveData(event);
    setLatestMessage(resultString);
    
    // Do whatever you need with the returned string here!
    // e.g., setMyState(resultString);
    };
    ws.onerror = (error: Event): void => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = (): void => {
      console.log('🔌 WebSocket bridge connection closed.');
    };

    // Clean up and close the socket when the component unmounts
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [url]);

  

  // Create a stable send function that safely checks the socket state
  const sendData = useCallback((data: string | ArrayBuffer | Blob | ArrayBufferView<ArrayBuffer>): void => {
    const socket = socketRef.current;

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(data);
    } else {
      console.warn('⚠️ Cannot send data: WebSocket is not open yet.');
    }
  }, []);


  

  return { sendData, latestMessage };
}
