import { createId } from '../utils/id';
import { tenantGetItem, tenantSetItem } from '../storage/tenantStorage';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'PAYMENT' | 'RESTORE' | 'LOGIN';

export interface AuditEntry {
  id: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  description: string;
  createdAt: string;
}

export const getAuditEntries = (): AuditEntry[] => {
  const stored = tenantGetItem('merchant_activity_log');
  return stored ? JSON.parse(stored) : [];
};

export const addAuditEntry = (entry: Omit<AuditEntry, 'id' | 'createdAt'>) => {
  const entries = getAuditEntries();
  const next: AuditEntry = { ...entry, id: createId('audit'), createdAt: new Date().toISOString() };
  tenantSetItem('merchant_activity_log', JSON.stringify([next, ...entries].slice(0, 2000)));
  return next;
};
