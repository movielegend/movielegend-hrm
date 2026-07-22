import type { AssetStatus } from './asset.types';

export type AssetIncidentType = 'DAMAGED' | 'LOST' | 'STOLEN' | 'MALFUNCTION' | 'OTHER';

export type AssetIncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';

export interface AssetIncidentDto {
  id: string;
  assetId: string;
  reportedById: string;
  incidentType: AssetIncidentType;
  description: string;
  evidenceUrl?: string | null;
  status: AssetIncidentStatus;
  resolvedById?: string | null;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
  updatedAt: string;
  asset?: {
    id: string;
    assetCode: string;
    name: string;
    assetStatus: AssetStatus;
  } | null;
}

export interface ReportIncidentPayload {
  incidentType: AssetIncidentType;
  description: string;
  evidenceUrl?: string;
}

export interface ResolveIncidentPayload {
  assetStatus?: AssetStatus;
  resolutionNote?: string;
}
