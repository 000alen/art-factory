import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const FormattedError = (code: number, message: string, props: any) =>
  new Error(`[E${code}]: ${message}: ${JSON.stringify(props)}`);

function getMessageError(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}") + 1;

  const textObject = JSON.parse(text.substr(start, end));

  return textObject.message;
}

export function useErrorHandler(genericDialogContext: any) {
  const navigate = useNavigate();
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState(null);

  const task =
    (name: string, callback: (...args: any[]) => void) =>
    async (...args: any[]) => {
      try {
        setIsWorking(true);
        await callback(...args);
      } catch (error) {
        genericDialogContext.show(`Error during ${name}`, error.message);
      } finally {
        setIsWorking(false);
      }
    };

  return { task, isWorking, error };
}
