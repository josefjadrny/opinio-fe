import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import {
  getSupportTickets, getSupportTicket, createSupportTicket,
  updateSupportStatus, updateSupportNote, postSupportMessage, markSupportRead,
} from '../api/client';
import type { MeResponse, SupportTicketDetail } from '../types/api';

// The list and an open ticket poll while the window is up - a conversation
// should move without a reload. Not on the WS, for the same reason as the
// comment thread: the socket is not app-wide yet.
const LIST_POLL_MS = 30_000;
const THREAD_POLL_MS = 15_000;

export function useSupportTickets(enabled = true) {
  return useQuery({
    queryKey: ['support'],
    queryFn: getSupportTickets,
    retry: false,
    enabled,
    refetchInterval: LIST_POLL_MS,
  });
}

export function useSupportTicket(id: string) {
  return useQuery({
    queryKey: ['support', id],
    queryFn: () => getSupportTicket(id),
    retry: false,
    refetchInterval: THREAD_POLL_MS,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support'] }),
  });
}

// The new message goes straight into the open thread (and the status the
// server moved to), then the list and thread revalidate behind it.
export function usePostSupportMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => postSupportMessage(id, body),
    onSuccess: ({ message, status }) => {
      qc.setQueryData<SupportTicketDetail>(['support', id], (old) => old && {
        ...old,
        status,
        messages: old.messages.some((m) => m.id === message.id) ? old.messages : [...old.messages, message],
      });
      qc.invalidateQueries({ queryKey: ['support'] });
    },
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateSupportStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support'] }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote: string }) => updateSupportNote(id, adminNote),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support'] }),
  });
}

// Opening a ticket clears its bell line (and support opening a new one moves
// it to investigating). The badge is written into the /api/me cache like the
// bell does it.
export function useMarkTicketRead() {
  const qc = useQueryClient();
  return useCallback((id: string) => {
    markSupportRead(id)
      .then(async (r) => {
        await qc.cancelQueries({ queryKey: ['me'] });
        qc.setQueryData<MeResponse>(['me'], (old) => (old ? { ...old, unseenNotifications: r.unseenNotifications } : old));
        qc.invalidateQueries({ queryKey: ['support'] });
      })
      .catch(() => { /* the line stays lit; harmless */ });
  }, [qc]);
}
