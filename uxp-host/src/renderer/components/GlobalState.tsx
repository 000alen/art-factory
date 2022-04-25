import React, {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  useContext,
} from "react";
import { Instance } from "../typings";

export const GlobalStateContext = createContext<{
  instances: Record<string, Instance>;
  setInstances: Dispatch<SetStateAction<Record<string, Instance>>>;
  setInstance: (id: string, f: (p: Instance) => Instance) => void;
  getInstance: (id: string) => Instance;
}>(null);

export const GlobalStateProvider: React.FC = ({ children }) => {
  const [instances, setInstances] = useState<Record<string, Instance>>({});

  const setInstance = (id: string, f: (p: Instance) => Instance) =>
    setInstances((p) => ({ ...p, [id]: f(p[id]) }));

  const getInstance = (id: string) => instances[id];

  return (
    <GlobalStateContext.Provider
      value={{
        instances,
        setInstances,
        setInstance,
        getInstance,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => {
  const globalState = useContext(GlobalStateContext);
  return globalState;
};
