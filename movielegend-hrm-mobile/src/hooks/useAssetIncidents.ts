import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAssetIncident,
  getAssetIncidents,
  investigateAssetIncident,
  rejectAssetIncident,
  reportAssetIncident,
  resolveAssetIncident,
} from '../api/asset-incidents.api';
import { assetKeys, incidentKeys } from '../constants/queryKeys';
import type { ReportIncidentPayload, ResolveIncidentPayload } from '../types/asset-incident.types';

export function useAssetIncidents(enabled = true) {
  return useQuery({ queryKey: incidentKeys.list(), queryFn: getAssetIncidents, enabled });
}

export function useAssetIncident(id?: string) {
  return useQuery({
    queryKey: incidentKeys.detail(id ?? 'missing'),
    queryFn: () => getAssetIncident(id ?? ''),
    enabled: Boolean(id),
  });
}

/** Report: DAMAGED/LOST/STOLEN đổi luôn asset status ở backend → invalidate asset + my assets. */
export function useReportAssetIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assetId, payload }: { assetId: string; payload: ReportIncidentPayload }) =>
      reportAssetIncident(assetId, payload),
    onSuccess: (incident) => {
      void queryClient.invalidateQueries({ queryKey: incidentKeys.all });
      void queryClient.invalidateQueries({ queryKey: assetKeys.detail(incident.assetId) });
      void queryClient.invalidateQueries({ queryKey: assetKeys.my() });
    },
  });
}

export function useAssetIncidentAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, payload }: { id: string; action: 'investigate' | 'resolve' | 'reject'; payload?: ResolveIncidentPayload }) => {
      if (action === 'investigate') return investigateAssetIncident(id);
      if (action === 'resolve') return resolveAssetIncident(id, payload ?? {});
      return rejectAssetIncident(id, payload ?? {});
    },
    onSuccess: (incident) => {
      void queryClient.invalidateQueries({ queryKey: incidentKeys.all });
      void queryClient.invalidateQueries({ queryKey: incidentKeys.detail(incident.id) });
      void queryClient.invalidateQueries({ queryKey: assetKeys.detail(incident.assetId) });
      void queryClient.invalidateQueries({ queryKey: assetKeys.list() });
    },
  });
}
