import * as React from "react"
import { createPortal } from "react-dom"

interface AlertDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
}

export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel"
}: AlertDialogProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!mounted) return null
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />
      {/* Alert Dialog Container */}
      <div className="relative z-10 w-full max-w-md rounded-xl border border-[#ebebeb] bg-white p-6 shadow-[0px_1px_1px_#00000005,0px_8px_16px_-4px_#0000000a,0px_24px_32px_-8px_#0000000f] animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-lg font-semibold tracking-tight text-[#171717]">{title}</h2>
        <p className="mt-2 text-sm text-[#4d4d4d] leading-relaxed">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-[#ebebeb] bg-white px-4 text-sm font-medium text-[#171717] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 rounded-md bg-[#ee0000] px-4 text-sm font-medium text-white hover:bg-[#c50000] transition-colors cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
