'use client'

import { useState, useEffect, useMemo } from 'react'
import {
    startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, format, isSameMonth, isSameDay,
    addMonths, subMonths, addWeeks, subWeeks,
    parseISO, isWithinInterval, startOfDay, endOfDay
} from 'date-fns'
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    Plus, Clock, MapPin, Tag, Filter, MoreHorizontal,
    Trash2, Edit, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { TagInput } from '@/components/ui/tag-input'
import {
    getCalendarEvents, getCalendarCategories, createCalendarEvent,
    updateCalendarEvent, deleteCalendarEvent, addEventTag, removeEventTag, getUsedTags, fetchGoogleEvents, findOrCreatePearlCareCalendar,
    createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent
} from '@/lib/api/services'
import type { CalendarEventWithRelations, CalendarCategory, CalendarEventInsert } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuth } from '@/providers'
import { createClient } from '@/lib/supabase/client'

type ViewMode = 'month' | 'week' | 'list'

export default function CalendarPage() {
    const { user } = useAuth()
    // State
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewMode, setViewMode] = useState<ViewMode>('month')
    const [events, setEvents] = useState<CalendarEventWithRelations[]>([])
    const [googleEvents, setGoogleEvents] = useState<any[]>([])
    const [categories, setCategories] = useState<CalendarCategory[]>([])
    const [availableTags, setAvailableTags] = useState<any[]>([]) // Using any for simplicity with getUsedTags
    const [loading, setLoading] = useState(true)

    // List View Filters
    const [filterCategories, setFilterCategories] = useState<string[]>([])
    const [filterTags, setFilterTags] = useState<string[]>([])
    const [filterStartDate, setFilterStartDate] = useState<string>('')
    const [filterEndDate, setFilterEndDate] = useState<string>('')

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingEvent, setEditingEvent] = useState<CalendarEventWithRelations | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        allDay: false,
        categoryId: 'none',
        location: '',
        tags: [] as string[],
        reminders: [] as { method: 'email' | 'popup', minutes: number }[]
    })

    // Initialization
    useEffect(() => {
        loadData()
    }, []) // Initial load

    // Reload when date range or view changes materially
    useEffect(() => {
        loadEvents()
    }, [currentDate, viewMode])

    async function loadData() {
        try {
            setLoading(true)
            const [cats, tags] = await Promise.all([
                getCalendarCategories(),
                getUsedTags()
            ])
            setCategories(cats)
            setAvailableTags(tags)
            await loadEvents()
        } catch (error) {
            console.error('Failed to load calendar data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function loadEvents() {
        let start, end
        if (viewMode === 'month') {
            start = startOfWeek(startOfMonth(currentDate))
            end = endOfWeek(endOfMonth(currentDate))
        } else if (viewMode === 'week') {
            start = startOfWeek(currentDate)
            end = endOfWeek(currentDate)
        } else {
            // List view - fetch a broader range or paginate
            start = startOfMonth(currentDate)
            end = addMonths(currentDate, 1)
        }

        try {
            // Fetch Local Events
            const data = await getCalendarEvents({
                startDate: start.toISOString(),
                endDate: end.toISOString()
            })
            setEvents(data)

            // Fetch Google Events if token exists
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.provider_token) {
                try {
                    // 1. Get or Create "Pearl Care" calendar ID
                    const calendarId = await findOrCreatePearlCareCalendar(session.provider_token)

                    // 2. Fetch events from THAT calendar
                    const gEvents = await fetchGoogleEvents(session.provider_token, start.toISOString(), end.toISOString(), calendarId)
                    setGoogleEvents(gEvents)
                } catch (e) {
                    console.error("Error fetching Google events", e)
                }
            }

        } catch (error) {
            console.error('Failed to load events:', error)
        }
    }

    // Navigation
    function next() {
        if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1))
        else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1))
    }

    function prev() {
        if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1))
        else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1))
    }

    function today() {
        setCurrentDate(new Date())
    }

    // Event Handling
    function handleCreateClick(date?: Date) {
        setEditingEvent(null)
        setFormData({
            title: '',
            description: '',
            date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
            startTime: '09:00',
            endTime: '10:00',
            allDay: false,
            categoryId: 'none',
            location: '',
            tags: [],
            reminders: []
        })
        setIsDialogOpen(true)
    }

    function handleEditClick(event: CalendarEventWithRelations) {
        setEditingEvent(event)
        const start = new Date(event.start_time)
        const end = new Date(event.end_time)
        setFormData({
            title: event.title,
            description: event.description || '',
            date: format(start, 'yyyy-MM-dd'),
            startTime: format(start, 'HH:mm'),
            endTime: format(end, 'HH:mm'),
            allDay: event.all_day,
            categoryId: event.category_id || 'none',
            location: event.location || '',
            tags: event.tags?.map(t => t.tag_name) || [],
            reminders: event.reminders || []
        })
        setIsDialogOpen(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            const startDateTime = new Date(`${formData.date}T${formData.startTime}`)
            const endDateTime = new Date(`${formData.date}T${formData.endTime}`)

            // Adjust for all day execution if needed, standardizing on time

            const eventData: CalendarEventInsert = {
                title: formData.title,
                description: formData.description || null,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                all_day: formData.allDay,
                location: formData.location || null,
                category_id: formData.categoryId === 'none' ? null : formData.categoryId,
                source: 'local',
                created_by: null,
                external_id: editingEvent ? editingEvent.external_id : null,
                reminders: formData.reminders
            }

            // Helper to check for valid UUID (Supabase/Local IDs)
            const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

            if (editingEvent) {
                // Check if this is a "Virtual" Google Event (String ID) or a Real Local Event (UUID)
                const isVirtualGoogleEvent = !isUuid(editingEvent.id)

                if (isVirtualGoogleEvent) {
                    // CASE: Virtual Google Event - update Google AND create local shadow record
                    const supabase = createClient()
                    const { data: { session } } = await supabase.auth.getSession()
                    if (session?.provider_token) {
                        const calendarId = await findOrCreatePearlCareCalendar(session.provider_token)
                        await updateGoogleCalendarEvent(session.provider_token, calendarId, editingEvent.id, {
                            summary: formData.title,
                            description: formData.description,
                            location: formData.location,
                            start: { dateTime: startDateTime.toISOString() },
                            end: { dateTime: endDateTime.toISOString() },
                            reminders: { useDefault: false, overrides: formData.reminders }
                        })
                        toast.success("Updated event in Google Calendar")

                        // Create local shadow record to persist category, tags, etc.
                        const newEvent = await createCalendarEvent({
                            ...eventData,
                            source: 'google',
                            external_id: editingEvent.id
                        })
                        if (newEvent && formData.tags.length > 0) {
                            await Promise.all(formData.tags.map(tag => addEventTag(newEvent.id, tag)))
                        }
                    }
                    setIsDialogOpen(false)
                    setTimeout(() => loadEvents(), 1000)
                    return
                }

                // UPDATE local event
                await updateCalendarEvent(editingEvent.id, eventData)

                // Sync with Google if it's a Google or synced event
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.provider_token && editingEvent.external_id) {
                    try {
                        const calendarId = await findOrCreatePearlCareCalendar(session.provider_token)
                        await updateGoogleCalendarEvent(session.provider_token, calendarId, editingEvent.external_id, {
                            summary: formData.title,
                            description: formData.description,
                            location: formData.location,
                            start: { dateTime: startDateTime.toISOString() },
                            end: { dateTime: endDateTime.toISOString() },
                            reminders: {
                                useDefault: false,
                                overrides: formData.reminders
                            }
                        })
                        toast.success("Updated event in Google Calendar")
                    } catch (e) {
                        console.warn("Failed to update Google event, trying to re-create it...", e)
                        // If update fails (e.g. 404 because previous calendar deleted), try creating it fresh
                        try {
                            const calendarId = await findOrCreatePearlCareCalendar(session.provider_token)
                            const newGEvent = await createGoogleCalendarEvent(session.provider_token, calendarId, {
                                summary: formData.title,
                                description: formData.description,
                                location: formData.location,
                                start: { dateTime: startDateTime.toISOString() },
                                end: { dateTime: endDateTime.toISOString() },
                                reminders: {
                                    useDefault: false,
                                    overrides: formData.reminders
                                }
                            })
                            // Update local DB with NEW external ID
                            await updateCalendarEvent(editingEvent.id, { external_id: newGEvent.id, source: 'google' })
                            toast.success("Re-synced event to Google Calendar")
                        } catch (createError) {
                            console.error("Failed to re-create event in Google", createError)
                            toast.error("Failed to sync event to Google Calendar")
                        }
                    }
                } else if (session?.provider_token && !editingEvent.external_id) {
                    // Case: Event exists locally but was never synced (or created offline)
                    // Try to sync it now
                    try {
                        const calendarId = await findOrCreatePearlCareCalendar(session.provider_token)
                        const newGEvent = await createGoogleCalendarEvent(session.provider_token, calendarId, {
                            summary: formData.title,
                            description: formData.description,
                            location: formData.location,
                            start: { dateTime: startDateTime.toISOString() },
                            end: { dateTime: endDateTime.toISOString() }
                        })
                        await updateCalendarEvent(editingEvent.id, { external_id: newGEvent.id, source: 'google' })
                        toast.success("Synced local event to Google Calendar")
                    } catch (e) {
                        console.error("Failed to push local event to Google", e)
                    }
                }

            } else {
                // CREATE
                let googleEventId = null
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()

                // 1. Create in Google FIRST to get ID
                if (session?.provider_token) {
                    try {
                        const calendarId = await findOrCreatePearlCareCalendar(session.provider_token)
                        const gEvent = await createGoogleCalendarEvent(session.provider_token, calendarId, {
                            summary: formData.title,
                            description: formData.description,
                            location: formData.location,
                            start: { dateTime: startDateTime.toISOString() },
                            end: { dateTime: endDateTime.toISOString() }
                        })
                        googleEventId = gEvent.id
                        toast.success("Created event in Google Calendar")
                    } catch (e) {
                        console.error("Failed to sync create to Google", e)
                        toast.error("Failed to create event in Google Calendar")
                    }
                }

                // 2. ALWAYS Create in Local DB to persist category, tags, etc.
                // The deduplication logic in allEvents/getEventsForDay will handle duplicates
                const newEvent = await createCalendarEvent({
                    ...eventData,
                    external_id: googleEventId,
                    source: googleEventId ? 'google' : 'local'
                })
                if (newEvent && formData.tags.length > 0) {
                    await Promise.all(formData.tags.map(tag => addEventTag(newEvent.id, tag)))
                }
            }

            setIsDialogOpen(false)
            // Wait a bit for Google propagation before reloading?
            setTimeout(() => loadEvents(), 1000)
        } catch (error) {
            console.error('Failed to save event:', error)
            toast.error("Failed to save event")
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this event?')) return
        try {
            const gEvent = googleEvents.find(e => e.id === id)
            if (gEvent) {
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.provider_token) {
                    const calendarId = await findOrCreatePearlCareCalendar(session.provider_token)
                    await deleteGoogleCalendarEvent(session.provider_token, calendarId, id)
                    toast.success("Deleted from Google Calendar")
                }
            } else {
                await deleteCalendarEvent(id)
            }

            loadEvents()
        } catch (error) {
            console.error('Failed to delete event:', error)
            toast.error("Failed to delete event")
        }
    }

    // Render Helpers
    const monthDays = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate))
        const end = endOfWeek(endOfMonth(currentDate))
        return eachDayOfInterval({ start, end })
    }, [currentDate])

    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate)
        const end = endOfWeek(currentDate)
        return eachDayOfInterval({ start, end })
    }, [currentDate])

    function getEventsForDay(date: Date) {
        const dayEvents = events.filter(event =>
            isSameDay(parseISO(event.start_time), date)
        )

        // Create a set of external IDs that exist locally
        const localExternalIds = new Set(dayEvents.map(e => e.external_id).filter(Boolean))

        const gEvents = googleEvents.filter(event => {
            const start = event.start.dateTime || event.start.date
            // Filter by date AND verify it's not already in local events
            return isSameDay(parseISO(start), date) && !localExternalIds.has(event.id)
        }).map(ge => ({
            id: ge.id,
            title: ge.summary,
            start_time: ge.start.dateTime || ge.start.date,
            end_time: ge.end.dateTime || ge.end.date,
            all_day: !ge.start.dateTime,
            category: {
                id: 'google',
                name: 'Google',
                color: '#DB4437',
                sort_order: 99,
                created_at: new Date().toISOString(),
                created_by: null
            },
            source: 'google' as const,
            description: ge.description || null,
            location: ge.location || null,
            category_id: null,
            external_id: ge.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: null
        } as CalendarEventWithRelations))

        return [...dayEvents, ...gEvents].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    }

    const allEvents = useMemo(() => {
        // 1. Create map of local events by external_id for quick lookup
        const localByExternalId = new Map(
            events.filter(e => e.external_id).map(e => [e.external_id, e])
        )
        // Also track which Google IDs we have locally
        const localExternalIds = new Set(events.map(e => e.external_id).filter(Boolean))

        // 2. Normalize Google events - but prefer local data if it exists (for category)
        const normalizedGoogleEvents = googleEvents
            .filter(ge => !localExternalIds.has(ge.id)) // Only include if NOT already in local
            .map(ge => ({
                id: ge.id,
                title: ge.summary,
                start_time: ge.start.dateTime || ge.start.date,
                end_time: ge.end.dateTime || ge.end.date,
                all_day: !ge.start.dateTime,
                category: null, // No local category for pure Google events
                source: 'google' as const,
                description: ge.description || null,
                location: ge.location || null,
                category_id: null,
                external_id: ge.id,
                reminders: ge.reminders?.overrides?.map((r: any) => ({ method: r.method, minutes: r.minutes })) || [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: null
            } as CalendarEventWithRelations))

        // 3. Merge and Sort - local events already have their categories
        return [...events, ...normalizedGoogleEvents].sort((a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
    }, [events, googleEvents])

    // Filtered events for List View
    const filteredEvents = useMemo(() => {
        return allEvents.filter(event => {
            // Category filter (multi-select)
            if (filterCategories.length > 0) {
                const eventCategoryId = event.category_id || (event.category?.id)
                if (!eventCategoryId || !filterCategories.includes(eventCategoryId)) {
                    return false
                }
            }

            // Tag filter (multi-select)
            if (filterTags.length > 0) {
                const eventTagNames = event.tags?.map(t => t.tag_name) || []
                const hasMatchingTag = filterTags.some(tag => eventTagNames.includes(tag))
                if (!hasMatchingTag) {
                    return false
                }
            }

            // Date range filter
            const eventDate = new Date(event.start_time)
            if (filterStartDate) {
                const startDate = new Date(filterStartDate)
                startDate.setHours(0, 0, 0, 0)
                if (eventDate < startDate) return false
            }
            if (filterEndDate) {
                const endDate = new Date(filterEndDate)
                endDate.setHours(23, 59, 59, 999)
                if (eventDate > endDate) return false
            }

            return true
        })
    }, [allEvents, filterCategories, filterTags, filterStartDate, filterEndDate])

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] gap-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-4">
                    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                        Calendar
                    </h1>
                    <div className="flex items-center rounded-md border bg-background shadow-sm">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="ghost" className="min-w-[100px] sm:min-w-[140px] text-xs sm:text-sm px-1 sm:px-3" onClick={today}>
                            {format(currentDate, viewMode === 'month' ? 'MMM yyyy' : 'MMM d')}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)} className="flex-1 sm:flex-none">
                        <ToggleGroupItem value="month" className="text-xs sm:text-sm px-2 sm:px-3">Month</ToggleGroupItem>
                        <ToggleGroupItem value="week" className="text-xs sm:text-sm px-2 sm:px-3">Week</ToggleGroupItem>
                        <ToggleGroupItem value="list" className="text-xs sm:text-sm px-2 sm:px-3">List</ToggleGroupItem>
                    </ToggleGroup>
                    <Button onClick={() => handleCreateClick()} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-xs sm:text-sm px-2 sm:px-4">
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">New Event</span>
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <Card className="flex-1 overflow-hidden flex flex-col">
                <CardContent className="p-0 flex-1 flex flex-col h-full">
                    {/* Month View */}
                    {viewMode === 'month' && (
                        <div className="grid grid-cols-7 grid-rows-[auto_1fr] h-full">
                            {/* Weekday Headers */}
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="p-2 text-center text-sm font-medium border-b bg-muted/30">
                                    {day}
                                </div>
                            ))}

                            {/* Days Grid */}
                            <div className="col-span-7 grid grid-cols-7 grid-rows-5 lg:grid-rows-6 h-full">
                                {monthDays.map((day, idx) => {
                                    const dayEvents = getEventsForDay(day)
                                    const isCurrentMonth = isSameMonth(day, currentDate)
                                    const isToday = isSameDay(day, new Date())

                                    return (
                                        <div
                                            key={day.toISOString()}
                                            className={cn(
                                                "border-b border-r p-1 min-h-[80px] flex flex-col gap-1 transition-colors hover:bg-muted/10 cursor-pointer",
                                                !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                                                isToday && "bg-indigo-50/50"
                                            )}
                                            onClick={() => handleCreateClick(day)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={cn(
                                                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                                                    isToday && "bg-indigo-600 text-white"
                                                )}>
                                                    {format(day, 'd')}
                                                </span>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                                {dayEvents.map(event => (
                                                    <div
                                                        key={event.id}
                                                        onClick={(e) => { e.stopPropagation(); handleEditClick(event); }}
                                                        className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium border select-none hover:opacity-80 transition-opacity"
                                                        style={{
                                                            backgroundColor: event.category?.color ? `${event.category.color}20` : '#f3f4f6',
                                                            borderColor: event.category?.color ? `${event.category.color}40` : '#e5e7eb',
                                                            color: event.category?.color || '#374151'
                                                        }}
                                                    >
                                                        {format(parseISO(event.start_time), 'HH:mm')} {event.title}
                                                    </div>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <div className="text-[10px] text-muted-foreground pl-1">
                                                        + {dayEvents.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Week View */}
                    {viewMode === 'week' && (
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="grid grid-cols-8 border-b">
                                <div className="p-2 border-r bg-muted/30"></div>
                                {weekDays.map(day => (
                                    <div key={day.toISOString()} className={cn(
                                        "p-2 text-center border-r min-w-[100px]",
                                        isSameDay(day, new Date()) && "bg-indigo-50/50"
                                    )}>
                                        <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                                        <div className={cn(
                                            "font-semibold inline-flex items-center justify-center w-7 h-7 rounded-full mt-1",
                                            isSameDay(day, new Date()) && "bg-indigo-600 text-white"
                                        )}>
                                            {format(day, 'd')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex-1 overflow-y-auto relative">
                                <div className="grid grid-cols-8 min-h-[600px]">
                                    {/* Time Labels */}
                                    <div className="border-r bg-muted/10">
                                        {Array.from({ length: 24 }).map((_, i) => (
                                            <div key={i} className="h-[60px] border-b text-xs text-muted-foreground px-2 py-1 text-right">
                                                {format(new Date().setHours(i, 0, 0, 0), 'HH:mm')}
                                            </div>
                                        ))}
                                    </div>
                                    {/* Days Columns */}
                                    {weekDays.map(day => (
                                        <div key={day.toISOString()} className="border-r relative group">
                                            {/* Grid Lines */}
                                            {Array.from({ length: 24 }).map((_, i) => (
                                                <div key={i} className="h-[60px] border-b border-dashed" />
                                            ))}

                                            {/* Events */}
                                            {getEventsForDay(day).map(event => {
                                                const start = parseISO(event.start_time)
                                                const end = parseISO(event.end_time)
                                                const startHour = start.getHours() + start.getMinutes() / 60
                                                const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

                                                return (
                                                    <div
                                                        key={event.id}
                                                        onClick={(e) => { e.stopPropagation(); handleEditClick(event); }}
                                                        className="absolute left-0.5 right-0.5 rounded border px-1.5 py-1 text-xs overflow-hidden hover:z-10 cursor-pointer shadow-sm hover:shadow-md transition-all"
                                                        style={{
                                                            top: `${startHour * 60}px`,
                                                            height: `${Math.max(duration * 60, 20)}px`,
                                                            backgroundColor: event.category?.color ? `${event.category.color}20` : '#f3f4f6',
                                                            borderColor: event.category?.color ? `${event.category.color}40` : '#e5e7eb',
                                                            borderLeftWidth: '3px',
                                                            borderLeftColor: event.category?.color || '#374151'
                                                        }}
                                                    >
                                                        <div className="font-semibold truncate">{event.title}</div>
                                                        <div className="text-[10px] opacity-75 truncate">
                                                            {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'list' && (
                        <div className="flex flex-col h-full">
                            {/* Filter Bar */}
                            <div className="p-4 border-b bg-muted/20 flex flex-wrap gap-3 items-center">
                                {/* Category Multi-Select */}
                                <div className="flex flex-col gap-1">
                                    <Label className="text-xs text-muted-foreground">Categories</Label>
                                    <div className="flex flex-wrap gap-1">
                                        {categories.map(cat => (
                                            <Badge
                                                key={cat.id}
                                                variant={filterCategories.includes(cat.id) ? "default" : "outline"}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                style={filterCategories.includes(cat.id) ? { backgroundColor: cat.color, borderColor: cat.color } : { borderColor: cat.color, color: cat.color }}
                                                onClick={() => {
                                                    setFilterCategories(prev =>
                                                        prev.includes(cat.id)
                                                            ? prev.filter(id => id !== cat.id)
                                                            : [...prev, cat.id]
                                                    )
                                                }}
                                            >
                                                {cat.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Tags Multi-Select */}
                                <div className="flex flex-col gap-1">
                                    <Label className="text-xs text-muted-foreground">Tags</Label>
                                    <div className="flex flex-wrap gap-1">
                                        {availableTags.map(tag => (
                                            <Badge
                                                key={tag.tag_name}
                                                variant={filterTags.includes(tag.tag_name) ? "default" : "outline"}
                                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                    setFilterTags(prev =>
                                                        prev.includes(tag.tag_name)
                                                            ? prev.filter(t => t !== tag.tag_name)
                                                            : [...prev, tag.tag_name]
                                                    )
                                                }}
                                            >
                                                {tag.tag_name}
                                            </Badge>
                                        ))}
                                        {availableTags.length === 0 && (
                                            <span className="text-xs text-muted-foreground">No tags</span>
                                        )}
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div className="flex gap-2 items-end">
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-xs text-muted-foreground">From</Label>
                                        <Input
                                            type="date"
                                            value={filterStartDate}
                                            onChange={(e) => setFilterStartDate(e.target.value)}
                                            className="w-36 h-8"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-xs text-muted-foreground">To</Label>
                                        <Input
                                            type="date"
                                            value={filterEndDate}
                                            onChange={(e) => setFilterEndDate(e.target.value)}
                                            className="w-36 h-8"
                                        />
                                    </div>
                                </div>

                                {/* Clear Filters */}
                                {(filterCategories.length > 0 || filterTags.length > 0 || filterStartDate || filterEndDate) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setFilterCategories([])
                                            setFilterTags([])
                                            setFilterStartDate('')
                                            setFilterEndDate('')
                                        }}
                                    >
                                        Clear Filters
                                    </Button>
                                )}

                                <span className="text-xs text-muted-foreground ml-auto">
                                    {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Event List */}
                            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                                {filteredEvents.map(event => (
                                    <Card key={event.id} className="cursor-pointer hover:border-indigo-500/50" onClick={() => handleEditClick(event)}>
                                        <CardContent className="flex items-center gap-4 p-4">
                                            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-muted/50 border">
                                                <span className="text-xs font-medium uppercase text-muted-foreground">
                                                    {format(parseISO(event.start_time), 'MMM')}
                                                </span>
                                                <span className="text-xl font-bold">
                                                    {format(parseISO(event.start_time), 'd')}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">{event.title}</h3>
                                                    {event.category && (
                                                        <Badge variant="outline" style={{ borderColor: event.category.color, color: event.category.color }}>
                                                            {event.category.name}
                                                        </Badge>
                                                    )}
                                                    {event.tags?.map(t => (
                                                        <Badge key={t.tag_name} variant="secondary" className="text-xs">
                                                            {t.tag_name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {format(parseISO(event.start_time), 'HH:mm')} - {format(parseISO(event.end_time), 'HH:mm')}
                                                    </div>
                                                    {event.location && (
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {event.location}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                                {filteredEvents.length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground">
                                        No events found for this period.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Event Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingEvent ? 'Edit Event' : 'New Event'}</DialogTitle>
                        <DialogDescription>
                            {editingEvent ? 'Make changes to your event details.' : 'Schedule a new appointment or booking.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Event title"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select
                                    value={formData.categoryId}
                                    onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                                    {cat.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Start Time</Label>
                                <Input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>End Time</Label>
                                <Input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Add details..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Location</Label>
                            <Input
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Add location"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Reminders</Label>
                            <div className="space-y-2">
                                {formData.reminders.map((reminder, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                                        <span>{reminder.method === 'email' ? 'Email' : 'Notification'} - {reminder.minutes} minutes before</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const newReminders = [...formData.reminders]
                                                newReminders.splice(idx, 1)
                                                setFormData({ ...formData, reminders: newReminders })
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex gap-2">
                                    <Select
                                        defaultValue="popup"
                                        onValueChange={(val) => {
                                            const method = val as 'email' | 'popup'
                                            setFormData(prev => ({
                                                ...prev,
                                                reminders: [...prev.reminders, { method, minutes: 10 }]
                                            }))
                                        }}
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Add..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="popup">Notification</SelectItem>
                                            <SelectItem value="email">Email</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {formData.reminders.length > 0 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                // Update last reminder's minutes
                                                const newReminders = [...formData.reminders]
                                                const last = newReminders[newReminders.length - 1]
                                                // Check if we just added a default 10 min one, let them edit
                                                // For now, simpliest UI is just to let them pick 10, 30, 60 etc from a dropdown?
                                                // Or just keep the 'Add' simple for now.
                                            }}
                                            className="hidden"
                                        >
                                            Edit Time
                                        </Button>
                                    )}
                                </div>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                    Common:
                                    {[10, 30, 60, 1440].map(mins => (
                                        <button
                                            key={mins}
                                            type="button"
                                            className="hover:underline"
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                reminders: [...prev.reminders, { method: 'popup', minutes: mins }]
                                            }))}
                                        >
                                            {mins < 60 ? `${mins}m` : mins === 60 ? '1h' : '1d'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Tags</Label>
                            <TagInput
                                selectedTags={formData.tags}
                                onTagsChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                                availableTags={availableTags}
                                placeholder="Add tags..."
                            />
                        </div>
                        <DialogFooter className="gap-2">
                            {editingEvent && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    className="mr-auto"
                                    onClick={() => { setIsDialogOpen(false); handleDelete(editingEvent.id); }}
                                >
                                    Delete
                                </Button>
                            )}
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-gradient-to-r from-indigo-500 to-purple-600">
                                {editingEvent ? 'Save Changes' : 'Create Event'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
