import { useEffect, useState } from "react";
import { getLiveStatus } from "../api/client.js";

const POLL_MS = 60000;

export function useLiveStatus() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchStatus = () => {
      getLiveStatus()
        .then((s) => {
          if (!cancelled) setStatus(s);
        })
        .catch(() => {});
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return status;
}
