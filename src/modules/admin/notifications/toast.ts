import { toast as sonner, type ExternalToast } from "sonner";

// The only module that imports sonner directly. Features call `toast.*` so the library stays swappable.
type Message = React.ReactNode;

export const toast = {
  success: (message: Message, options?: ExternalToast) => sonner.success(message, options),
  error: (message: Message, options?: ExternalToast) => sonner.error(message, options),
  warning: (message: Message, options?: ExternalToast) => sonner.warning(message, options),
  info: (message: Message, options?: ExternalToast) => sonner.info(message, options),
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: Message;
      success: Message | ((data: T) => Message);
      error: Message | ((error: unknown) => Message);
    },
  ) => sonner.promise(promise, messages),
  dismiss: (id?: string | number) => sonner.dismiss(id),
};
