import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {helperText && !error && (
          <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
        <input
          ref={ref}
          className={`
            block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400 shadow-sm transition-colors
            focus:border-[#039155] focus:outline-none focus:ring-2 focus:ring-[#039155]/20
            disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed
            ${error ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `.trim()}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && error && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

