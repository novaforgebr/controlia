'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
  className?: string
}

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  label,
  description,
  className,
}: SwitchProps) {
  const [isChecked, setIsChecked] = useState(checked)

  useEffect(() => {
    setIsChecked(checked)
  }, [checked])

  const handleToggle = () => {
    if (disabled) return
    const newValue = !isChecked
    setIsChecked(newValue)
    onCheckedChange(newValue)
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#039155] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          isChecked ? 'bg-gradient-to-r from-[#039155] to-[#18B0BB]' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            isChecked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              className={cn(
                'text-sm font-medium cursor-pointer',
                disabled ? 'text-gray-400' : 'text-gray-900'
              )}
              onClick={!disabled ? handleToggle : undefined}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      )}
    </div>
  )
}

