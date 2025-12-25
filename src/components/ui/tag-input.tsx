import * as React from "react"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export interface TagInputProps {
    placeholder?: string
    availableTags?: string[]
    selectedTags: string[]
    onTagsChange: (tags: string[]) => void
    className?: string
}

export function TagInput({
    placeholder = "Select tags...",
    availableTags = [],
    selectedTags,
    onTagsChange,
    className,
}: TagInputProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")

    const handleSelect = (tag: string) => {
        if (selectedTags.includes(tag)) {
            onTagsChange(selectedTags.filter((t) => t !== tag))
        } else {
            onTagsChange([...selectedTags, tag])
        }
        setInputValue("")
        setOpen(false)
    }

    const handleRemove = (tag: string) => {
        onTagsChange(selectedTags.filter((t) => t !== tag))
    }

    const handleCreate = () => {
        if (inputValue && !selectedTags.includes(inputValue)) {
            onTagsChange([...selectedTags, inputValue])
            setInputValue("")
            setOpen(false)
        }
    }

    const filteredTags = availableTags.filter((tag) => !selectedTags.includes(tag))
    const showCreate = inputValue && !availableTags.includes(inputValue) && !selectedTags.includes(inputValue)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div
                    className={cn(
                        "flex min-h-[40px] w-full flex-wrap items-center justify-start gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-text hover:bg-accent/10",
                        className
                    )}
                    onClick={() => setOpen(true)}
                >
                    {selectedTags.length > 0 ? (
                        selectedTags.map((tag) => (
                            <Badge
                                key={tag}
                                variant="secondary"
                                className="inline-flex items-center gap-1 pr-1"
                            >
                                {tag}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-3 w-3 p-0 hover:bg-transparent"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemove(tag)
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                    <span className="sr-only">Remove {tag}</span>
                                </Button>
                            </Badge>
                        ))
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder="Search or create tag..."
                        value={inputValue}
                        onValueChange={setInputValue}
                        className="h-9"
                    />
                    <CommandList>
                        <CommandEmpty>
                            {showCreate ? (
                                <div
                                    className="flex cursor-pointer items-center justify-center gap-2 p-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                    onClick={handleCreate}
                                >
                                    Create tag "{inputValue}"
                                </div>
                            ) : (
                                "No tags found."
                            )}
                        </CommandEmpty>
                        {filteredTags.length > 0 && (
                            <CommandGroup heading="Available Tags">
                                {filteredTags.map((tag) => (
                                    <CommandItem
                                        key={tag}
                                        value={tag}
                                        onSelect={() => handleSelect(tag)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedTags.includes(tag)
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                        {tag}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
