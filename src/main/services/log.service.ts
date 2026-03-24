import { v4 as uuidv4 } from 'uuid';
import { LogSession, LogEntry } from '../../shared/types';

export class LogService {
  private sessions: Map<string, LogSession> = new Map();

  startSession(bottleId: string): string {
    const id = uuidv4();
    const session: LogSession = {
      id,
      bottleId,
      startedAt: new Date().toISOString(),
      entries: [],
    };
    this.sessions.set(id, session);
    return id;
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endedAt = new Date().toISOString();
    }
  }

  log(sessionId: string, level: LogEntry['level'], source: string, message: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.entries.push({
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
    });

    // Keep memory bounded — trim to last 5000 entries
    if (session.entries.length > 5000) {
      session.entries = session.entries.slice(-4000);
    }
  }

  getSessions(bottleId: string): LogSession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.bottleId === bottleId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  getSession(sessionId: string): LogSession | null {
    return this.sessions.get(sessionId) ?? null;
  }

  clearSessions(bottleId: string): void {
    for (const [id, session] of this.sessions) {
      if (session.bottleId === bottleId) {
        this.sessions.delete(id);
      }
    }
  }
}
