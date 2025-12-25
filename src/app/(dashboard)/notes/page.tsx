'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, Plus, Search, Pin, Archive, Loader2, Trash2, Edit, MoreHorizontal, PinOff, ArchiveRestore, Paperclip, Calendar as CalendarIcon, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TagInput } from '@/components/ui/tag-input'
import { getNotes, getNoteCategories, createNote, updateNote, deleteNote, addNoteTag, removeNoteTag, getUsedTags, uploadAttachment, getAttachmentsByEntityType, getWorkcoverClaimsForLinking, getAgedCareExpensesForLinking, getWorkcoverExpensesForLinking, linkNoteToWorkcoverClaim, linkNoteToAgedCareExpense, linkNoteToWorkcoverExpense, unlinkNoteFromWorkcoverClaim, unlinkNoteFromAgedCareExpense, unlinkNoteFromWorkcoverExpense } from '@/lib/api/services'
import type { NoteWithRelations, NoteCategory, Attachment } from '@/lib/types/database'

export default function NotesPage() {
    const [notes, setNotes] = useState<NoteWithRelations[]>([])
    const [categories, setCategories] = useState<NoteCategory[]>([])
    const [availableTags, setAvailableTags] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [showArchived, setShowArchived] = useState(false)
    const [filterTags, setFilterTags] = useState<string[]>([])
    const [allAttachments, setAllAttachments] = useState<Attachment[]>([])
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Note linking state
    const [availableClaims, setAvailableClaims] = useState<any[]>([])
    const [availableAgedCareExpenses, setAvailableAgedCareExpenses] = useState<any[]>([])
    const [availableWorkcoverExpenses, setAvailableWorkcoverExpenses] = useState<any[]>([])
    const [selectedClaims, setSelectedClaims] = useState<string[]>([])
    const [selectedAgedCareExpenses, setSelectedAgedCareExpenses] = useState<string[]>([])
    const [selectedWorkcoverExpenses, setSelectedWorkcoverExpenses] = useState<string[]>([])

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category_id: null as string | null,
        parent_id: null as string | null,
        entry_date: new Date().toISOString().split('T')[0],
        tags: [] as string[],
        linkedClaimIds: [] as string[],
        linkedAgedCareExpenseIds: [] as string[],
        linkedWorkcoverExpenseIds: [] as string[]
    })

    useEffect(() => {
        loadData()
    }, [showArchived])

    async function loadData() {
        try {
            setLoading(true)
            const [notesData, categoriesData, tagsData, attachmentsData, claimsData, acExpensesData, wcExpensesData] = await Promise.all([
                getNotes({ isArchived: showArchived }),
                getNoteCategories(),
                getUsedTags(),
                getAttachmentsByEntityType('note'),
                getWorkcoverClaimsForLinking(),
                getAgedCareExpensesForLinking(),
                getWorkcoverExpensesForLinking()
            ])
            setNotes(notesData)
            setCategories(categoriesData)
            setAvailableTags(tagsData)
            setAllAttachments(attachmentsData)
            setAvailableClaims(claimsData)
            setAvailableAgedCareExpenses(acExpensesData)
            setAvailableWorkcoverExpenses(wcExpensesData)
        } catch (error) {
            console.error('Failed to load notes:', error)
            console.error('Error details:', JSON.stringify(error, null, 2))
            // Continue despite errors - some data may have loaded
        } finally {
            setLoading(false)
        }
    }

    function openNewDialog() {
        setEditingId(null)
        setFormData({
            title: '',
            content: '',
            category_id: null,
            tags: [],
            parent_id: null,
            entry_date: new Date().toISOString().split('T')[0],
            linkedClaimIds: [],
            linkedAgedCareExpenseIds: [],
            linkedWorkcoverExpenseIds: []
        })
        setSelectedClaims([])
        setSelectedAgedCareExpenses([])
        setSelectedWorkcoverExpenses([])
        setSelectedFiles([])
        setDialogOpen(true)
    }

    function openEditDialog(note: NoteWithRelations) {
        setEditingId(note.id)
        setFormData({
            title: note.title,
            content: note.content || '',
            category_id: note.category_id,
            parent_id: note.parent_id || null,
            entry_date: note.entry_date ? note.entry_date.toString() : new Date().toISOString().split('T')[0],
            tags: note.tags?.map(t => t.tag_name) || [],
            linkedClaimIds: (note as any).linked_workcover_claims?.map((lc: any) => lc.workcover_claims?.id).filter(Boolean) || [],
            linkedAgedCareExpenseIds: (note as any).linked_aged_care_expenses?.map((le: any) => le.aged_care_expenses?.id).filter(Boolean) || [],
            linkedWorkcoverExpenseIds: (note as any).linked_workcover_expenses?.map((le: any) => le.workcover_expenses?.id).filter(Boolean) || []
        })
        setSelectedClaims((note as any).linked_workcover_claims?.map((lc: any) => lc.workcover_claims?.id).filter(Boolean) || [])
        setSelectedAgedCareExpenses((note as any).linked_aged_care_expenses?.map((le: any) => le.aged_care_expenses?.id).filter(Boolean) || [])
        setSelectedWorkcoverExpenses((note as any).linked_workcover_expenses?.map((le: any) => le.workcover_expenses?.id).filter(Boolean) || [])
        setSelectedFiles([])
        setDialogOpen(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const data = {
                title: formData.title,
                content: formData.content || null,
                category_id: formData.category_id,
                parent_id: formData.parent_id,
                entry_date: formData.entry_date,
                is_pinned: false,
                is_archived: false,
                created_by: null,
            }

            let noteId = editingId

            if (editingId) {
                await updateNote(editingId, data)
            } else {
                const newNote = await createNote(data)
                noteId = newNote.id
            }

            // Handle Tags
            // Handle Tags
            if (noteId) {
                const currentTags = editingId
                    ? notes.find(n => n.id === editingId)?.tags || []
                    : []
                const currentTagNames = currentTags.map(t => t.tag_name)
                const newTagNames = formData.tags

                const toAdd = newTagNames.filter(t => !currentTagNames.includes(t))
                const toRemove = currentTags.filter(t => !newTagNames.includes(t.tag_name))

                const promises: Promise<any>[] = [
                    ...toAdd.map(tag => addNoteTag(noteId!, tag)),
                    ...toRemove.map(tag => removeNoteTag(tag.id))
                ]

                // Handle Attachments
                if (selectedFiles.length > 0) {
                    promises.push(...selectedFiles.map(file => uploadAttachment(file, noteId!, 'note')))
                }

                // Handle linked entities
                const currentNote = notes.find(n => n.id === editingId) as any

                // Workcover Claims
                const currentClaimIds = currentNote?.linked_workcover_claims?.map((lc: any) => lc.workcover_claims?.id).filter(Boolean) || []
                const toAddClaims = selectedClaims.filter(id => !currentClaimIds.includes(id))
                const toRemoveClaims = currentClaimIds.filter((id: string) => !selectedClaims.includes(id))
                promises.push(...toAddClaims.map(id => linkNoteToWorkcoverClaim(noteId!, id)))
                promises.push(...toRemoveClaims.map((id: string) => unlinkNoteFromWorkcoverClaim(noteId!, id)))

                // Aged Care Expenses
                const currentACExpIds = currentNote?.linked_aged_care_expenses?.map((le: any) => le.aged_care_expenses?.id).filter(Boolean) || []
                const toAddACExp = selectedAgedCareExpenses.filter(id => !currentACExpIds.includes(id))
                const toRemoveACExp = currentACExpIds.filter((id: string) => !selectedAgedCareExpenses.includes(id))
                promises.push(...toAddACExp.map(id => linkNoteToAgedCareExpense(noteId!, id)))
                promises.push(...toRemoveACExp.map((id: string) => unlinkNoteFromAgedCareExpense(noteId!, id)))

                // Workcover Expenses
                const currentWCExpIds = currentNote?.linked_workcover_expenses?.map((le: any) => le.workcover_expenses?.id).filter(Boolean) || []
                const toAddWCExp = selectedWorkcoverExpenses.filter(id => !currentWCExpIds.includes(id))
                const toRemoveWCExp = currentWCExpIds.filter((id: string) => !selectedWorkcoverExpenses.includes(id))
                promises.push(...toAddWCExp.map(id => linkNoteToWorkcoverExpense(noteId!, id)))
                promises.push(...toRemoveWCExp.map((id: string) => unlinkNoteFromWorkcoverExpense(noteId!, id)))

                await Promise.all(promises)
            }

            setDialogOpen(false)
            loadData()
        } catch (error) {
            console.error('Failed to save note:', error)
        } finally {
            setSaving(false)
        }
    }

    async function handlePin(note: NoteWithRelations) {
        try {
            await updateNote(note.id, { is_pinned: !note.is_pinned })
            loadData()
        } catch (error) {
            console.error('Failed to pin note:', error)
        }
    }

    async function handleArchive(note: NoteWithRelations) {
        try {
            await updateNote(note.id, { is_archived: !note.is_archived })
            loadData()
        } catch (error) {
            console.error('Failed to archive note:', error)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this note?')) return
        try {
            await deleteNote(id)
            loadData()
        } catch (error) {
            console.error('Failed to delete note:', error)
        }
    }

    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || note.category_id === selectedCategory
        const matchesTags = filterTags.length === 0 || filterTags.every(t => note.tags?.some(nt => nt.tag_name === t))
        return matchesSearch && matchesCategory && matchesTags
    })

    const pinnedNotes = filteredNotes.filter(n => n.is_pinned)
    const otherNotes = filteredNotes.filter(n => !n.is_pinned)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
                    <p className="text-muted-foreground">Keep track of important information</p>
                </div>
                <Button
                    onClick={openNewDialog}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    New Note
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search notes..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="w-full sm:w-[300px]">
                    <TagInput
                        selectedTags={filterTags}
                        onTagsChange={setFilterTags}
                        availableTags={availableTags}
                        placeholder="Filter by tags..."
                    />
                </div>
                <Button
                    variant={showArchived ? 'secondary' : 'outline'}
                    onClick={() => setShowArchived(!showArchived)}
                >
                    <Archive className="mr-2 h-4 w-4" />
                    {showArchived ? 'Showing Archived' : 'Show Archived'}
                </Button>
            </div>

            {/* Notes Grid */}
            {filteredNotes.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-600/10">
                            <FileText className="h-8 w-8 text-indigo-500" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">
                            {notes.length === 0 ? 'No notes yet' : 'No matching notes'}
                        </h3>
                        <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
                            {notes.length === 0 ? 'Create your first note to get started.' : 'Try adjusting your search or filters.'}
                        </p>
                        {notes.length === 0 && (
                            <Button
                                onClick={openNewDialog}
                                className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create First Note
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Pinned Notes */}
                    {pinnedNotes.length > 0 && (
                        <div>
                            <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                <Pin className="h-4 w-4" /> Pinned
                            </h2>
                            <div className="space-y-3">
                                {pinnedNotes.map(note => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        attachments={allAttachments.filter(a => a.entity_id === note.id)}
                                        onEdit={openEditDialog}
                                        onPin={handlePin}
                                        onArchive={handleArchive}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Other Notes */}
                    {otherNotes.length > 0 && (
                        <div>
                            {pinnedNotes.length > 0 && (
                                <h2 className="text-sm font-medium text-muted-foreground mb-3">Others</h2>
                            )}
                            <div className="space-y-3">
                                {otherNotes.map(note => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        attachments={allAttachments.filter(a => a.entity_id === note.id)}
                                        onEdit={openEditDialog}
                                        onPin={handlePin}
                                        onArchive={handleArchive}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Note' : 'New Note'}</DialogTitle>
                            <DialogDescription>
                                {editingId ? 'Update your note' : 'Create a new note'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Title *</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Note title"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Category</Label>
                                <Select
                                    value={formData.category_id || 'none'}
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, category_id: v === 'none' ? null : v }))}
                                >
                                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Content</Label>
                                <Textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                                    placeholder="Write your note..."
                                    className="min-h-[200px]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.entry_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, entry_date: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Parent Note</Label>
                                    <Select
                                        value={formData.parent_id || 'none'}
                                        onValueChange={(v) => setFormData(prev => ({ ...prev, parent_id: v === 'none' ? null : v }))}
                                    >
                                        <SelectTrigger><SelectValue placeholder="No parent" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No parent</SelectItem>
                                            {notes
                                                .filter(n => n.id !== editingId) // Prevent self-parenting
                                                .map(note => (
                                                    <SelectItem key={note.id} value={note.id}>{note.title}</SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
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
                            <div className="grid gap-2">
                                <Label>Attachments</Label>
                                <Input
                                    type="file"
                                    multiple
                                    ref={fileInputRef}
                                    onChange={(e) => {
                                        if (e.target.files) {
                                            setSelectedFiles(Array.from(e.target.files))
                                        }
                                    }}
                                />
                                {selectedFiles.length > 0 && (
                                    <div className="text-sm text-muted-foreground">
                                        {selectedFiles.length} file(s) selected
                                    </div>
                                )}
                                {editingId && allAttachments.filter(a => a.entity_id === editingId).length > 0 && (
                                    <div className="mt-2 text-sm">
                                        <p className="font-medium mb-1">Existing Attachments:</p>
                                        <ul className="list-disc list-inside text-muted-foreground">
                                            {allAttachments.filter(a => a.entity_id === editingId).map(a => (
                                                <li key={a.id} className="truncate">
                                                    <a href={a.file_path} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                        {a.file_name}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                            >
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingId ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function NoteCard({
    note,
    attachments = [],
    onEdit,
    onPin,
    onArchive,
    onDelete
}: {
    note: NoteWithRelations
    attachments?: Attachment[]
    onEdit: (note: NoteWithRelations) => void
    onPin: (note: NoteWithRelations) => void
    onArchive: (note: NoteWithRelations) => void
    onDelete: (id: string) => void
}) {
    return (
        <Card
            className={`cursor-pointer hover:border-indigo-500/50 transition-colors ${note.is_pinned ? 'border-amber-200 bg-amber-50/30' : ''}`}
            onClick={() => onEdit(note)}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{note.title}</CardTitle>
                        {note.category && (
                            <Badge
                                variant="outline"
                                className="mt-1"
                                style={{ borderColor: note.category.color, color: note.category.color }}
                            >
                                {note.category.name}
                            </Badge>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                            {note.tags?.map(tag => (
                                <Badge key={tag.id} variant="secondary" className="text-xs px-1.5 h-5">
                                    {tag.tag_name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => onEdit(note)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPin(note)}>
                                {note.is_pinned ? <PinOff className="mr-2 h-4 w-4" /> : <Pin className="mr-2 h-4 w-4" />}
                                {note.is_pinned ? 'Unpin' : 'Pin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onArchive(note)}>
                                {note.is_archived ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
                                {note.is_archived ? 'Unarchive' : 'Archive'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(note.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                {note.content ? (
                    <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
                ) : (
                    <p className="text-sm text-muted-foreground italic">No content</p>
                )}

                {/* Footer Info */}
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {note.entry_date ? new Date(note.entry_date).toLocaleDateString() : new Date(note.updated_at).toLocaleDateString()}
                    </div>
                </div>

                {/* Attachments Indicator */}
                {attachments.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
                    </div>
                )}

                {/* Hierarchy Indicators */}
                {note.parent_id && (
                    <div className="mt-2 text-xs bg-muted px-2 py-1 rounded-md inline-flex items-center">
                        <ChevronRight className="h-3 w-3 mr-1" />
                        Child Note
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
