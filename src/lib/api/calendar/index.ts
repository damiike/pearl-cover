import { createClient } from '@/lib/api/shared/supabase-client'
import type {
  CalendarCategory,
  CalendarCategoryInsert,
  CalendarEvent,
  CalendarEventInsert,
  CalendarEventUpdate,
  CalendarEventWithRelations
} from '@/lib/types/database'

export async function getCalendarCategories() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('calendar_categories')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data as CalendarCategory[]
}

export async function createCalendarCategory(category: CalendarCategoryInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('calendar_categories')
    .insert(category)
    .select()
    .single()
  if (error) throw error
  return data as CalendarCategory
}

export async function getCalendarEvents(filters?: {
  startDate?: string
  endDate?: string
  categoryId?: string
  search?: string
}) {
  const supabase = createClient()
  let query = supabase
    .from('calendar_events')
    .select(`
      *,
      category:calendar_categories(*),
      tags:event_tags(*)
    `)
    .order('start_time', { ascending: true })

  if (filters?.startDate) {
    query = query.gte('end_time', filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte('start_time', filters.endDate)
  }
  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as CalendarEventWithRelations[]
}

export async function createCalendarEvent(event: CalendarEventInsert) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('calendar_events')
    .insert(event)
    .select()
    .single()
  if (error) throw error
  return data as CalendarEvent
}

export async function updateCalendarEvent(id: string, updates: CalendarEventUpdate) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as CalendarEvent
}

export async function deleteCalendarEvent(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) throw error
}

export async function addEventTag(eventId: string, tagName: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('event_tags')
    .insert({
      event_id: eventId,
      tag_name: tagName
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeEventTag(tagId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('event_tags')
    .delete()
    .eq('id', tagId)
  if (error) throw error
}

export async function fetchGoogleEvents(accessToken: string, timeMin: string, timeMax: string, calendarId: string = 'primary') {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error('Failed to fetch Google Calendar events')
  }

  const data = await response.json()
  return data.items || []
}

export async function createGoogleCalendarEvent(accessToken: string, calendarId: string, event: any) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    },
  )

  if (!response.ok) {
    throw new Error('Failed to create Google Event')
  }

  return await response.json()
}

export async function updateGoogleCalendarEvent(accessToken: string, calendarId: string, eventId: string, event: any) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    },
  )

  if (!response.ok) {
    throw new Error('Failed to update Google Event')
  }

  return await response.json()
}

export async function deleteGoogleCalendarEvent(accessToken: string, calendarId: string, eventId: string) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error('Failed to delete Google Event')
  }

  return true
}

export async function findOrCreatePearlCareCalendar(accessToken: string) {
  let findOrCreatePromise: Promise<string> | null = null

  if (findOrCreatePromise) return findOrCreatePromise

  findOrCreatePromise = (async () => {
    try {
      const listResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      )

      if (!listResponse.ok) throw new Error('Failed to list calendars')

      const listData = await listResponse.json()
      const matches = listData.items?.filter((c: any) => c.summary === 'Pearl Care' && !c.deleted) || []

      if (matches && matches.length > 0) {
        return matches[0].id
      }

      const createResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: 'Pearl Care',
            description: 'Calendar for Pearl Care bookings and appointments',
          }),
        },
      )

      if (!createResponse.ok) throw new Error('Failed to create Pearl Care calendar')

      const newCalendar = await createResponse.json()
      return newCalendar.id
    } finally {
      setTimeout(() => { findOrCreatePromise = null }, 2000)
    }
  })()

  return findOrCreatePromise
}
