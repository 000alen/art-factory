import { useContext } from "react";
import { useNavigate } from "react-router-dom";

import { GenericDialogContext } from "./GenericDialog";

export function useErrorHandler() {
  const navigate = useNavigate();
  const genericDialogContext = useContext(GenericDialogContext);

  const task =
    (name: string, callback: (...args: any[]) => void) =>
    async (...args: any[]) => {
      try {
        await callback(...args);
      } catch (error) {
        genericDialogContext.show(`Error during ${name}`, error.message);
      } finally {
      }
    };

  return task;
}
