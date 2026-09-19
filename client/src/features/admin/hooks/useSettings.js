import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/queryClient';
import { settingsApi } from '../api/settings';
import { adminKey, listQueryOptions, useAdminMutation } from './shared';

export const useAdminSettings = () => useQuery({ queryKey: adminKey('settings'), queryFn: settingsApi.get });

export const useUpdateSettings = (opts = {}) =>
  useAdminMutation({
    mutationFn: settingsApi.update,
    invalidate: [['settings']],
    invalidateKeys: [queryKeys.settings],
    success: 'Settings saved',
    errorTitle: 'Could not save settings',
    ...opts,
  });

export const useContactMessages = (params) =>
  useQuery({ queryKey: adminKey('messages', params), queryFn: () => settingsApi.messages(params), ...listQueryOptions });

export const useUpdateMessage = () =>
  useAdminMutation({
    mutationFn: ({ id, status }) => settingsApi.updateMessage(id, status),
    invalidate: [['messages']],
    success: 'Message updated',
    errorTitle: 'Could not update message',
  });
