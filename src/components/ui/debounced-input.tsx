'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import type { InputHTMLAttributes } from 'react'

interface DebouncedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onDebounce: (value: string) => void
  delay?: number
}

export function DebouncedInput({ onDebounce, delay = 300, value: controlledValue, ...props }: DebouncedInputProps) {
  const [internalValue, setInternalValue] = useState<string>(controlledValue || '')

  useEffect(() => {
    setInternalValue(controlledValue || '')
  }, [controlledValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onDebounce(internalValue)
    }, delay)

    return () => clearTimeout(timeout)
  }, [internalValue, delay, onDebounce])

  return (
    <Input
      {...props}
      value={internalValue}
      onChange={(e) => setInternalValue(e.target.value)}
    />
  )
}
