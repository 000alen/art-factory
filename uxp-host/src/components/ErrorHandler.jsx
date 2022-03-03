import { useState } from "react";

export function useErrorHandler(genericDialogContext) {
  const [isWorking, setIsWorking] = useState(false);

  const task =
    (name, callback) =>
    async (...args) => {
      try {
        setIsWorking(true);
        await callback(...args);
      } catch (error) {
        genericDialogContext.show(`Error during ${name}`, error.message, null);
      } finally {
        setIsWorking(false);
      }
    };

  return { task, isWorking };
}
