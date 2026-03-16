import { useState, useEffect } from "react";
import { CHALLENGE_START, CHALLENGE_END } from "@/lib/protocol";

export function useProtocol() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return {
    challengeStart: CHALLENGE_START,
    challengeEnd: CHALLENGE_END,
    protocolStarted: now >= CHALLENGE_START,
    protocolEnded: now >= CHALLENGE_END,
    now,
  };
}
