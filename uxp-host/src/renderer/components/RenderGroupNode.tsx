import React, { useEffect, useState } from "react";
import { Handle, Position } from "react-flow-renderer";
import { Trait } from "../typings";
import { getId, hash } from "../utils";
import { useErrorHandler } from "./ErrorHandler";

interface RenderGroupNodeComponentData {
  readonly factoryId: string;
  readonly nTraits: Trait[][];

  addToRenderGroup?: (parent: string, _id: string, traits: Trait[]) => void;
  removeFromRenderGroup?: (parent: string, _id: string) => void;
}

interface RenderGroupNodeProps {
  sidebar: boolean;
  id: string;
  data: RenderGroupNodeComponentData;
}

export const RenderGroupNode: React.FC<RenderGroupNodeProps> = ({
  sidebar,
  id,
  data,
}) => {
  const task = useErrorHandler();

  const [map, setMap] = useState(
    new Map<string, { traits: Trait[]; id: string }>()
  );
  const updateMap = (k: string, v: { traits: Trait[]; id: string }) =>
    setMap(new Map(map.set(k, v)));

  useEffect(() => {
    task("TODO", async () => {
      if (data.nTraits === undefined) return;

      const hashes = data.nTraits.map(hash);
      const hashedTraits = new Map<string, Trait[]>(
        data.nTraits.map((traits, i) => [hashes[i], traits])
      );

      const keys = new Set(map.keys());
      const currentKeys = new Set(hashes);
      const keysToRemove = new Set(
        [...keys].filter((k) => !currentKeys.has(k))
      );
      const keysToAdd = new Set([...currentKeys].filter((k) => !keys.has(k)));

      for (const key of keysToRemove) {
        data.removeFromRenderGroup(id, map.get(key).id);
        map.delete(key);
      }

      for (const key of keysToAdd) {
        const _id = getId();
        const traits = hashedTraits.get(key);
        data.addToRenderGroup(id, _id, traits);
        map.set(key, { traits, id: _id });
      }

      setMap(new Map(map));
    })();
  }, [data.factoryId, data.nTraits]);

  return (
    <div
      className="w-64 p-2 border-2 border-dashed border-white rounded"
      style={{
        //   width: 300,
        height: 600,
      }}
    >
      {!sidebar && (
        <Handle
          className="w-4 h-4 left-0 translate-x-[-50%] translate-y-[-50%]"
          id="renderGroupIn"
          type="target"
          position={Position.Left}
        />
      )}
    </div>
  );
};
