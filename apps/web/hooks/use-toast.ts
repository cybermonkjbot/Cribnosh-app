import { toast as sonnerToast } from 'sonner';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export function useToast() {
  const toast = (props: ToastProps) => {
    const { title, description, variant = 'default', duration = 5000 } = props;
    
    switch (variant) {
      case 'destructive':
        sonnerToast.error(title || 'Error', {
          description,
          duration,
        });
        break;
      case 'success':
        sonnerToast.success(title || 'Success', {
          description,
          duration,
        });
        break;
      default:
        sonnerToast(title || 'Notification', {
          description,
          duration,
        });
        break;
    }
  };

  return { toast };
} 