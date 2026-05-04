import * as React from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { AlertCircle, Trash2, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatedConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  variant?: 'danger' | 'warning' | 'default'
  icon?: 'trash' | 'alert' | 'shield' | React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  isDestructive?: boolean
  children?: React.ReactNode // Extra content like inputs/selects inside the dialog
  confirmDisabled?: boolean
}

const getVariantStyles = (variant: 'danger' | 'warning' | 'default') => {
  switch (variant) {
    case 'danger':
      return {
        iconBg: 'bg-red-600',
        iconColor: 'text-white',
        border: 'border-red-500',
        contentBorder: 'border-red-500 shadow-xl shadow-red-500/10',
        confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
      }
    case 'warning':
      return {
        iconBg: 'bg-amber-500',
        iconColor: 'text-white',
        border: 'border-amber-500',
        contentBorder: 'border-amber-500 shadow-xl shadow-amber-500/10',
        confirmButton: 'bg-[#187555] hover:bg-[#146c4f] text-white', // Based on the "Confirm Role Change" button being green but warning icon
      }
    default:
      return {
        iconBg: 'bg-blue-600',
        iconColor: 'text-white',
        border: 'border-blue-500',
        contentBorder: 'border-border shadow-xl',
        confirmButton: 'bg-primary hover:bg-primary/90 text-primary-foreground',
      }
  }
}

export function AnimatedConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = 'default',
  icon = 'alert',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  children,
  confirmDisabled = false,
}: AnimatedConfirmDialogProps) {
  const styles = getVariantStyles(variant)

  const renderIcon = () => {
    if (typeof icon !== 'string') return icon
    switch (icon) {
      case 'trash':
         return <AlertCircle className="w-6 h-6" /> // From screenshot, it's a triangle exclamation inside red box
      case 'shield':
         return <ShieldAlert className="w-6 h-6" />
      default:
         return <AlertCircle className="w-6 h-6" />
    }
  }

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {open && (
        <AlertDialogPrimitive.Portal forceMount>
          <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-[10vh] sm:p-0">
            <AlertDialogPrimitive.Content
              className={cn(
                "relative w-full max-w-lg bg-white rounded-xl border p-6 flex flex-col gap-6",
                styles.contentBorder
              )}
            >
              <div className="flex gap-4 items-start">
                <div className={cn("w-10 h-10 rounded-lg shrink-0 flex items-center justify-center", styles.iconBg, styles.iconColor)}>
                  {renderIcon()}
                </div>
                <div className="flex-1 space-y-1 mt-1">
                  <AlertDialogPrimitive.Title className={cn("text-lg font-semibold leading-none tracking-tight", variant === 'danger' ? 'text-red-600' : 'text-gray-900')}>
                    {title}
                  </AlertDialogPrimitive.Title>
                  {description && (
                    <AlertDialogPrimitive.Description className="text-sm text-gray-500 pt-1">
                      {description}
                    </AlertDialogPrimitive.Description>
                  )}
                </div>
                <button 
                  onClick={() => onOpenChange(false)}
                  className="text-gray-400 hover:text-gray-500 absolute top-4 right-4 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {children && (
                <div className="pl-14">
                  {children}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-2">
                <AlertDialogPrimitive.Cancel
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 font-medium rounded-lg transition-colors focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {cancelText}
                </AlertDialogPrimitive.Cancel>
                <AlertDialogPrimitive.Action
                  type="button"
                  onClick={onConfirm}
                  disabled={confirmDisabled}
                  className={cn(
                    "px-4 py-2 font-medium rounded-lg transition-colors focus:ring-2 focus:ring-primary focus:outline-none flex items-center justify-center gap-2",
                    styles.confirmButton,
                    confirmDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {variant === 'danger' && <Trash2 className="w-4 h-4" />}
                  {confirmText}
                </AlertDialogPrimitive.Action>
              </div>
            </AlertDialogPrimitive.Content>
          </div>
        </AlertDialogPrimitive.Portal>
      )}
    </AlertDialogPrimitive.Root>
  )
}
