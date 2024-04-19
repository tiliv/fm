import { useState, useEffect, useRef, useCallback } from 'react'

const WORKER = new URL('./worker.js', import.meta.url);

export default function useWorker({ onResult }) {
  const worker = useRef(null);
  const [ready, setReady] = useState(null);

  const request = useCallback((msg) => {
    worker.current.postMessage(msg);
  }, [worker.current]);

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(WORKER, { type: 'module' });
    }

    const onMessageReceived = (e) => {
      switch (e.data.status) {
        // Core events
        case 'initiate':
          if (ready !== null) return;
          setReady(false);
          console.log("Worker is starting...");
          break;

        case 'done':
          break;

        case 'ready':
          setReady(true);
          console.log("Worker is ready.");
          break;

        // Runtime events
        case 'analyzed':
          onResult(e.data.output);
          break;
      }
    };

    worker.current.addEventListener('message', onMessageReceived);
    return () => worker.current.removeEventListener('message', onMessageReceived);
  });

  useEffect(() => {
    if (!worker.current || ready !== null) return;
    worker.current.postMessage({ warmUp: true });
  }, [worker.current, ready]);

  return {
    ready,
    request,
    // progressItems,
  }
}
