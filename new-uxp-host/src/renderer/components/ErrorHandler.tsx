import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GenericDialogContext } from "./GenericDialog";

export const FormattedError = (code: number, message: string, props: any) =>
  new Error(`[E${code}]: ${message}: ${JSON.stringify(props)}`);

// function getMessageError(text: string) {
//   const start = text.indexOf("{");
//   const end = text.lastIndexOf("}") + 1;

//   const textObject = JSON.parse(text.substr(start, end));

//   return textObject.message;
// }

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
