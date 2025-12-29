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
          'relative inline-flex h-7 w-12 md:h-6 md:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#039155] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 p-2 md:p-0',
          isChecked ? 'bg-gradient-to-r from-[#039155] to-[#18B0BB]' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 md:h-4 md:w-4 transform rounded-full bg-white transition-transform shadow-sm',
            isChecked ? 'translate-x-5 md:translate-x-6' : 'translate-x-0.5 md:translate-x-1'
          )}
        />
      </button>
      {description && (
        <div className="flex flex-col">
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      )}
    </div>
  )
}

