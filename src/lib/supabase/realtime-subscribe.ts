import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

type RealtimeCallback = () => void

interface ChannelEntry {
  channel: RealtimeChannel
  callbacks: Set<RealtimeCallback>
}

const channelRegistry = new Map<string, ChannelEntry>()

/**
 * Multiplexes listeners on a single Supabase Realtime channel.
 * Avoids "cannot add postgres_changes callbacks after subscribe()" when
 * multiple hooks subscribe to the same table/couple.
 */
export function subscribeToPostgresChanges(
  supabase: SupabaseClient,
  channelName: string,
  config: {
    schema?: string
    table: string
    filter?: string
  },
  callback: RealtimeCallback,
): () => void {
  let entry = channelRegistry.get(channelName)

  if (!entry) {
    const callbacks = new Set<RealtimeCallback>()
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: config.schema ?? 'public',
          table: config.table,
          filter: config.filter,
        },
        () => {
          callbacks.forEach((cb) => cb())
        },
      )
      .subscribe()

    entry = { channel, callbacks }
    channelRegistry.set(channelName, entry)
  }

  entry.callbacks.add(callback)

  return () => {
    const current = channelRegistry.get(channelName)
    if (!current) return

    current.callbacks.delete(callback)
    if (current.callbacks.size === 0) {
      void supabase.removeChannel(current.channel)
      channelRegistry.delete(channelName)
    }
  }
}

/** For tests or hot reload cleanup */
export function clearRealtimeSubscriptions(supabase: SupabaseClient) {
  for (const [name, entry] of channelRegistry.entries()) {
    void supabase.removeChannel(entry.channel)
    channelRegistry.delete(name)
  }
}
