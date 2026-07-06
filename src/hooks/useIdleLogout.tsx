import { useEffect, useRef, useState, useCallback } from "react";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"] as const;

export interface UseIdleLogoutOptions {
  /** Total idle time before warning (ms). Default 10 min. */
  idleMs?: number;
  /** Countdown shown before forced logout (ms). Default 60s. */
  warningMs?: number;
  /** Called when the warning countdown reaches 0. */
  onTimeout: () => void;
  /** Whether the idle tracker is enabled (e.g. only when authenticated). */
  enabled?: boolean;
}

/**
 * Tracks user activity. When idle for `idleMs`, surfaces a warning with a
 * `warningMs` countdown. If the user does not interact, `onTimeout` fires.
 */
export function useIdleLogout({
  idleMs = 5 * 60 * 1000,
  warningMs = 60 * 1000,
  onTimeout,
  enabled = true,
}: UseIdleLogoutOptions) {
  const [warningOpen, setWarningOpen] = useState(false);
  const [remaining, setRemaining] = useState(Math.ceil(warningMs / 1000));
  const idleTimerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const clearCountdown = () => {
    if (countdownRef.current) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const startCountdown = useCallback(() => {
    setRemaining(Math.ceil(warningMs / 1000));
    setWarningOpen(true);
    clearCountdown();
    countdownRef.current = window.setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          clearCountdown();
          setWarningOpen(false);
          onTimeout();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [warningMs, onTimeout]);

  const resetIdleTimer = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = window.setTimeout(startCountdown, idleMs);
  }, [idleMs, startCountdown]);

  const dismissWarningAndReset = useCallback(() => {
    clearCountdown();
    setWarningOpen(false);
    resetIdleTimer();
  }, [resetIdleTimer]);

  useEffect(() => {
    if (!enabled) {
      clearIdleTimer();
      clearCountdown();
      setWarningOpen(false);
      return;
    }

    const onActivity = () => {
      if (warningOpen) return; // Activity during warning shouldn't silently reset; user must click
      resetIdleTimer();
    };

    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, onActivity, { passive: true })
    );
    resetIdleTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
      clearIdleTimer();
      clearCountdown();
    };
  }, [enabled, warningOpen, resetIdleTimer]);

  return { warningOpen, remaining, dismissWarningAndReset };
}