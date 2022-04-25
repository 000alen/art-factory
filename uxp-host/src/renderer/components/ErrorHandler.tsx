import { useContext } from "react";

import { GenericDialogContext } from "./GenericDialog";

export function useErrorHandler(setWorking?: (isWorking: boolean) => void) {
  const genericDialogContext = useContext(GenericDialogContext);

  const task =
    (name: string, callback: (...args: any[]) => void) =>
    async (...args: any[]) => {
      try {
        if (setWorking) setWorking(true);
        await callback(...args);
      } catch (error) {
        genericDialogContext.show(`Error during ${name}`, error.message);
      } finally {
        if (setWorking) setWorking(false);
      }
    };

  return task;
}
