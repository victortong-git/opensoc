import toast, { Toaster } from 'react-hot-toast';

// Toast service with consistent styling
export class ToastService {
  static success(message: string, options?: any) {
    return toast.success(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: '#FFFFFF',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      iconTheme: {
        primary: '#FFFFFF',
        secondary: '#10B981',
      },
      ...options,
    });
  }

  static error(message: string, options?: any) {
    return toast.error(message, {
      duration: 6000,
      position: 'top-right',
      style: {
        background: '#EF4444',
        color: '#FFFFFF',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      iconTheme: {
        primary: '#FFFFFF',
        secondary: '#EF4444',
      },
      ...options,
    });
  }

  static info(message: string, options?: any) {
    return toast(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#3B82F6',
        color: '#FFFFFF',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      icon: 'ℹ️',
      iconTheme: {
        primary: '#FFFFFF',
        secondary: '#3B82F6',
      },
      ...options,
    });
  }

  static warning(message: string, options?: any) {
    return toast(message, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#F59E0B',
        color: '#FFFFFF',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      icon: '⚠️',
      iconTheme: {
        primary: '#FFFFFF',
        secondary: '#F59E0B',
      },
      ...options,
    });
  }

  static loading(message: string, options?: any) {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: '#6B7280',
        color: '#FFFFFF',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      iconTheme: {
        primary: '#FFFFFF',
        secondary: '#6B7280',
      },
      ...options,
    });
  }

  static dismiss(toastId?: string) {
    return toast.dismiss(toastId);
  }

  static remove(toastId: string) {
    return toast.remove(toastId);
  }

  // Test data generation specific toasts
  static testDataSuccess(dataType: string, quantity: number) {
    return this.success(
      `Successfully generated ${quantity} test ${dataType}${quantity > 1 ? 's' : ''}!`,
      {
        duration: 5000,
        icon: '🎯',
      }
    );
  }

  static testDataError(dataType: string, error?: string) {
    return this.error(
      `Failed to generate test ${dataType}${error ? `: ${error}` : ''}`,
      {
        duration: 7000,
        icon: '❌',
      }
    );
  }

  static aiGenerationSuccess(dataType: string, quantity: number) {
    return this.success(
      `AI-generated ${quantity} test ${dataType}${quantity > 1 ? 's' : ''} successfully!`,
      {
        duration: 5000,
        icon: '🤖',
      }
    );
  }
}

// Export the Toaster component for app-level usage
export { Toaster } from 'react-hot-toast';

export default ToastService;