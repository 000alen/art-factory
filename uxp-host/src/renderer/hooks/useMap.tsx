import { RefObject, useCallback } from "react";
import { useStatePromise } from "./useStateCallback";

export interface FakeMap<K, V> {
  mapRef: RefObject<Map<K, V>>;
  clear(): void;
  delete(key: K): void;
  forEach(
    callbackfn: (value: V, key: K, map: Map<K, V>) => void,
    thisArg?: any
  ): void;
  get(key: K): V | undefined;
  has(key: K): boolean;
  set(key: K, value: V): void;
  size(): number;
  entries(): IterableIterator<[K, V]>;
  keys(): IterableIterator<K>;
  values(): IterableIterator<V>;
}

export const useMap = <K, V>(): FakeMap<K, V> => {
  const [map, setMap, mapRef] = useStatePromise(new Map<K, V>());

  const clear = useCallback(() => setMap((map) => new Map<K, V>()), [map]);

  const _delete = useCallback(
    (key: K) =>
      setMap((map) => {
        const newMap = new Map<K, V>(map);
        newMap.delete(key);
        return newMap;
      }),
    [map]
  );

  const forEach = useCallback(
    (callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any) =>
      map.forEach(callbackfn, thisArg),
    [map]
  );

  const get = useCallback((key: K) => map.get(key), [map]);

  const has = useCallback((key: K) => map.has(key), [map]);

  const set = useCallback(
    (key: K, value: V) =>
      setMap((map) => {
        const newMap = new Map<K, V>(map);
        newMap.set(key, value);
        return newMap;
      }),
    [map]
  );

  const size = useCallback(() => map.size, [map]);

  const entries = useCallback(() => map.entries(), [map]);

  const keys = useCallback(() => map.keys(), [map]);

  const values = useCallback(() => map.values(), [map]);

  return {
    mapRef,
    clear,
    delete: _delete,
    forEach,
    get,
    has,
    set,
    size,
    entries,
    keys,
    values,
  };
};
