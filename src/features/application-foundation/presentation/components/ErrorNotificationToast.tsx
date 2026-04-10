import { useEffect } from 'react'
import { toast } from 'sonner'
import { useErrorNotificationViewModel } from '../use-error-notification-viewmodel'

export function ErrorNotificationToast(): null {
  const { notifications, dismiss, retry } = useErrorNotificationViewModel()

  useEffect(() => {
    notifications.forEach((notification) => {
      const toastId = notification.id

      const toastContent = (
        <div className="space-y-2">
          <div>
            <p className="font-semibold">{notification.title}</p>
            <p className="text-sm">{notification.message}</p>
          </div>
          {notification.detail && (
            <details className="text-xs">
              <summary className="cursor-pointer">詳細を表示</summary>
              <pre className="mt-1 whitespace-pre-wrap">{notification.detail}</pre>
            </details>
          )}
          {notification.retryable && (
            <button
              onClick={() => {
                retry(notification.id)
                toast.dismiss(toastId)
              }}
              className="text-sm underline"
            >
              リトライ
            </button>
          )}
        </div>
      )

      const toastOptions = {
        id: toastId,
        duration: notification.severity === 'error' ? Infinity : 5000,
        onDismiss: () => dismiss(notification.id),
      }

      switch (notification.severity) {
        case 'error':
          toast.error(toastContent, toastOptions)
          break
        case 'warning':
          toast.warning(toastContent, toastOptions)
          break
        case 'info':
          toast.info(toastContent, toastOptions)
          break
      }
    })
  }, [notifications, dismiss, retry])

  return null
}
