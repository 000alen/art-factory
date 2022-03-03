import { useState } from "react";
import { useNavigate } from "react-router-dom";

const errorIndicator = /\[E\d+\]/;

export const FormattedError = (code, message, props) =>
  new Error(`[E${code}]: ${message}: ${JSON.stringify(props)}`);

export function useErrorHandler(genericDialogContext) {
  const navigate = useNavigate();
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState(null);

  const task =
    (name, callback) =>
    async (...args) => {
      try {
        setIsWorking(true);
        await callback(...args);
      } catch (error) {
        const message = errorIndicator.test(error.message)
          ? error.message
          : FormattedError(999, "Unexpected error", { message: error.message })
              .message;
        setError(message);
        genericDialogContext.show(`Error during ${name}`, message);
      } finally {
        setIsWorking(false);
      }
    };

  return { task, isWorking, error };
}
