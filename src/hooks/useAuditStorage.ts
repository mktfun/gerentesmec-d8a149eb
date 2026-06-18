import { useState, useEffect } from 'react';
import localforage from 'localforage';

export interface AuditPhoto {
  id: string;
  blob: Blob;
  lat: number | null;
  long: number | null;
  timestamp: string;
  previewUrl: string;
}

export interface AuditItemData {
  item_name: string;
  category_name: string;
  status: 'conforme' | 'não_conforme' | 'na' | null;
  notes: string;
  photos: AuditPhoto[];
}

export interface AuditPayload {
  inspection_id: string;
  store_id: string;
  schema_version: string;
  auditor_user_id: string | null;
  started_at: string;
  completed_at: string | null;
  device_info: string;
  categories: {
    category_name: string;
    items: AuditItemData[];
  }[];
}

const STORE_KEY = 'current_audit_draft';

export function useAuditStorage() {
  const [draft, setDraft] = useState<AuditPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDraft() {
      try {
        const saved = await localforage.getItem<AuditPayload>(STORE_KEY);
        if (saved) {
          // Check for schema conflicts
          if (saved.schema_version !== 'v2_granular') {
            console.warn('Audit schema changed, wiping outdated cache...');
            await localforage.removeItem(STORE_KEY);
            setDraft(null);
          } else {
            setDraft(saved);
          }
        }
      } catch (err) {
        console.error('Error loading audit draft', err);
      } finally {
        setLoading(false);
      }
    }
    loadDraft();
  }, []);

  const saveDraft = async (newDraft: AuditPayload) => {
    setDraft(newDraft);
    await localforage.setItem(STORE_KEY, newDraft);
  };

  const clearDraft = async () => {
    setDraft(null);
    await localforage.removeItem(STORE_KEY);
  };

  return { draft, loading, saveDraft, clearDraft };
}
