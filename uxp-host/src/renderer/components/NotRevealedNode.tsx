import { ActionButton, Flex, Heading, Text } from "@adobe/react-spectrum";
import React, { useEffect, useState } from "react";
import { Trait } from "../typings";
import Refresh from "@spectrum-icons/workflow/Refresh";
import { useForceUpdate } from "../hooks/useForceUpdate";
import {
  Handle,
  Position,
  useEdges,
  useNodes,
  Node as FlowNode,
} from "react-flow-renderer";
import { ImageItem } from "./RenderNode";
import { hash } from "../utils";
import { getBranch } from "../nodesUtils";
import { LayerNodeComponentData } from "./LayerNode";

export interface NotRevealedNodeComponentData {
  composedUrls?: Record<string, string>;
  renderIds?: Record<string, string>;
  requestComposedUrl?: (traits: Trait[]) => void;
  requestRenderId?: (traits: Trait[]) => void;
}

interface NotRevealedNodeProps {
  id: string;
  data: NotRevealedNodeComponentData;
}

export const NotRevealedNode: React.FC<NotRevealedNodeProps> = ({
  id,
  data,
}) => {
  const [forceUpdate, x] = useForceUpdate();
  const [nodes, edges] = [useNodes(), useEdges()];

  const [cacheKey, setCacheKey] = useState<string>(null);
  const [key, setKey] = useState<string>(null);
  const [traits, setTraits] = useState<Trait[]>([]);

  useEffect(() => {
    const branch = getBranch(id, nodes, edges);

    if (branch === undefined) {
      const currentCacheKey = hash([]);
      if (currentCacheKey === cacheKey) return;
      setCacheKey(currentCacheKey);

      setTraits([]);
      setKey(null);
      return;
    }

    const traits: Trait[] = (
      branch.slice(1, -1) as FlowNode<LayerNodeComponentData>[]
    )
      .map((node) => node.data)
      .map((data) => ({
        ...data.trait,
        id: data.id,
      }));

    const currentCacheKey = hash(traits);
    if (currentCacheKey === cacheKey) return;
    setCacheKey(currentCacheKey);

    const key = hash(traits);

    if (!(key in data.composedUrls)) data.requestComposedUrl(traits);
    if (!(key in data.renderIds)) data.requestRenderId(traits);

    setTraits(traits);
    setKey(key);
  }, [nodes, edges]);

  return (
    <Flex direction="column" gap="size-100">
      <div className="w-48 p-3 border-1 border-dashed border-white rounded opacity-5 hover:opacity-100 transition-all">
        <Flex direction="row-reverse" gap="size-100">
          <ActionButton onPress={() => forceUpdate()}>
            <Refresh />
          </ActionButton>
        </Flex>
      </div>

      <div className="relative w-48 p-3 border-1 border-solid border-white rounded">
        <Handle
          className="w-4 h-4 left-0 translate-x-[-50%] translate-y-[-50%]"
          id="notRevealedIn"
          type="target"
          position={Position.Left}
        />

        {key !== null && traits.length > 0 ? (
          <Flex direction="column" gap="size-100">
            <ImageItem src={data.composedUrls[key]}>
              <Text>{traits.map((trait) => trait.name).join(", ")}</Text>
            </ImageItem>
            <Heading>Not revealed</Heading>
          </Flex>
        ) : (
          <div className="h-48 flex justify-center items-center">
            <Text>Not revealed unset</Text>
          </div>
        )}
      </div>
    </Flex>
  );
};
