import { FocusSession, FocusCheckpoint, FocusInterruption } from '../db/schema';

export function calculateSessionTimeBreakdown(session: FocusSession): {
  verifiedSeconds: number;
  interruptedSeconds: number;
  unverifiedSeconds: number;
  efficiencyPct: number;
} {
  const verifiedSeconds = session.verifiedSeconds || 0;
  const interruptedSeconds = session.interruptedSeconds || 0;
  const elapsedSeconds = session.elapsedSeconds || 0;
  const unverifiedSeconds = Math.max(0, elapsedSeconds - verifiedSeconds - interruptedSeconds);

  const efficiencyPct = elapsedSeconds > 0 ? Math.round((verifiedSeconds / elapsedSeconds) * 100) : 100;

  return {
    verifiedSeconds,
    interruptedSeconds,
    unverifiedSeconds,
    efficiencyPct,
  };
}

export function recordFocusCheckpoint(
  session: FocusSession,
  response: 'focused' | 'distracted' | 'away' | 'break',
  notes?: string
): FocusSession {
  const newCheckpoint: FocusCheckpoint = {
    id: `chk-${Date.now()}`,
    timestamp: new Date().toISOString(),
    verified: response === 'focused',
    response,
    notes,
  };

  const updatedCheckpoints = [...(session.checkpoints || []), newCheckpoint];
  return {
    ...session,
    checkpoints: updatedCheckpoints,
  };
}

export function logFocusInterruption(
  session: FocusSession,
  reason: string,
  durationMinutes: number,
  notes?: string
): FocusSession {
  const interruption: FocusInterruption = {
    id: `intr-${Date.now()}`,
    timestamp: new Date().toISOString(),
    reason,
    durationMinutes,
    durationSeconds: durationMinutes * 60,
    notes,
  };

  return {
    ...session,
    interruptions: [...(session.interruptions || []), interruption],
    interruptedSeconds: (session.interruptedSeconds || 0) + durationMinutes * 60,
  };
}
