import React, { RefObject, useCallback, useEffect, useRef } from "react";
import useStateRef from "react-usestateref";

export const useStateCallback = <T,>(
  initialState: T
): [T, (v: T | ((p: T) => T), cb?: (v: T) => void) => void, RefObject<T>] => {
  const [state, setState, stateRef] = useStateRef(initialState);
  const cbRef = useRef(null);

  const setStateCallback = useCallback(
    (state: T | ((p: T) => T), cb?: (v: T) => void) => {
      cbRef.current = cb !== undefined ? cb : null;
      setState(state);
    },
    []
  );

  useEffect(() => {
    if (cbRef.current) {
      cbRef.current(state);
      cbRef.current = null;
    }
  }, [state]);

  return [state, setStateCallback, stateRef];
};

export const useStatePromise = <T,>(
  initialState: T
): [T, (v: T | ((p: T) => T)) => Promise<T>, RefObject<T>] => {
  const [state, setState, stateRef] = useStateCallback(initialState);

  const setStatePromise = useCallback(
    (state: T | ((p: T) => T)) =>
      new Promise((resolve) => setState(state, resolve)) as Promise<T>,
    []
  );

  return [state, setStatePromise, stateRef];
};
