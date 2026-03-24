import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Bottle, AppConfig, BottlePackage, LogSession,
  RegistryEntry, ComponentKind, DownloadProgress, SystemPrerequisite,
} from '../../shared/types';

const api = typeof window !== 'undefined' && window.api ? window.api : null;

export function useBottles() {
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (api) {
        const list = await api.listBottles();
        setBottles(list);
      }
    } catch (err) {
      console.error('Failed to load bottles:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { bottles, loading, refresh };
}

export function useRegistry(component?: ComponentKind) {
  const [entries, setEntries] = useState<RegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (api) {
        const list = await api.listRegistry(component);
        setEntries(list);
      }
    } catch (err) {
      console.error('Failed to load registry:', err);
    }
    setLoading(false);
  }, [component]);

  useEffect(() => { refresh(); }, [refresh]);

  return { entries, loading, refresh };
}

export function useSystemCheck() {
  const [prerequisites, setPrerequisites] = useState<SystemPrerequisite[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (api) {
        const list = await api.checkSystem();
        setPrerequisites(list);
      }
    } catch (err) {
      console.error('Failed to check system:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { prerequisites, loading, refresh };
}

export function useDownloadProgress(bottleId?: string) {
  const [progress, setProgress] = useState<DownloadProgress | null>(null);

  useEffect(() => {
    if (!api) return;
    const cleanup = api.onDownloadProgress((p: DownloadProgress) => {
      if (!bottleId || p.bottleId === bottleId) {
        setProgress(p);
      }
    });
    return cleanup;
  }, [bottleId]);

  const reset = useCallback(() => setProgress(null), []);

  return { progress, reset };
}

export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);

  const refresh = useCallback(async () => {
    try {
      if (api) {
        const c = await api.getConfig();
        setConfig(c);
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  }, []);

  const update = useCallback(async (updates: Partial<AppConfig>) => {
    try {
      if (api) {
        const c = await api.updateConfig(updates);
        setConfig(c);
        return c;
      }
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { config, refresh, update };
}

export function usePackages() {
  const [packages, setPackages] = useState<BottlePackage[]>([]);

  useEffect(() => {
    if (api) {
      api.listPackages().then(setPackages).catch(console.error);
    }
  }, []);

  return packages;
}

export function useLogs(bottleId: string | null) {
  const [logs, setLogs] = useState<LogSession[]>([]);

  const refresh = useCallback(async () => {
    if (!bottleId || !api) return;
    try {
      const sessions = await api.getLogs(bottleId);
      setLogs(sessions);
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  }, [bottleId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { logs, refresh };
}

export { api };
