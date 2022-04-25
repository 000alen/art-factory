import React, { memo, useEffect, useState } from "react";
import { Node as FlowNode, useEdges, useNodes } from "react-flow-renderer";

import {
  ActionButton,
  Flex,
  Heading,
  Item,
  Menu,
  MenuTrigger,
  NumberField,
  Radio,
  RadioGroup,
  Text,
  TextField,
} from "@adobe/react-spectrum";
import Add from "@spectrum-icons/workflow/Add";
import Refresh from "@spectrum-icons/workflow/Refresh";
import Remove from "@spectrum-icons/workflow/Remove";

import { arrayDifference, chooseN, getBranches, hash } from "../utils";
import { ImageItem } from "./ImageItem";
import { LayerNodeComponentData } from "./LayerNode";
import { Time } from "./Time";

export interface BundleNodeComponentData {
  composedUrls?: Record<string, string>;
  renderIds?: Record<string, string>;
  ns?: Record<string, number>;
  ignored?: string[];

  onChangeBundleName?: (id: string, value: string) => void;
  onChangeBundleIds?: (id: string, value: string[]) => void;
  onChangeBundleSaleType?: (id: string, value: string) => void;
  onChangeBundleStartingPrice?: (id: string, value: number) => void;
  onChangeBundleEndingPrice?: (id: string, value: number) => void;
  onChangeBundleSaleTime?: (id: string, value: number) => void;

  name: string;
  ids: string[];
  saleType: string;
  startingPrice: number;
  endingPrice: number;
  saleTime: number;
}

interface BundleNodeProps {
  id: string;
  data: BundleNodeComponentData;
}

export const BundleNode: React.FC<BundleNodeProps> = memo(({ id, data }) => {
  const [nodes, edges] = [useNodes(), useEdges()];

  const [cacheKey, setCacheKey] = useState<string>(null);
  const [emptyValue, setEmptyValue] = useState<string>(null);

  useEffect(() => {
    const nTraits = (
      getBranches(nodes, edges).map((branch) =>
        branch.slice(1, -1)
      ) as FlowNode<LayerNodeComponentData>[][]
    )
      .map((branch) => branch.map((node) => node.data))
      .map((branch) =>
        branch.map((data) => ({
          ...data.trait,
          id: data.id,
        }))
      );
    const currentCacheKey = hash(nTraits);

    if (currentCacheKey === cacheKey) return;

    const keys = nTraits.map(hash).filter((key) => !data.ignored.includes(key));

    if (keys.length > 0) {
      if (emptyValue === null)
        setEmptyValue(() => keys[Math.floor(Math.random() * keys.length)]);

      if (data.ids === null && keys.length > 1)
        data.onChangeBundleIds(id, chooseN(keys, 2));
      else if (data.ids !== null) {
        const itemsToRemove = arrayDifference(data.ids, keys);
        if (itemsToRemove.length > 0)
          data.onChangeBundleIds(id, arrayDifference(data.ids, itemsToRemove));
        if (itemsToRemove.includes(emptyValue))
          setEmptyValue(() => keys[Math.floor(Math.random() * keys.length)]);
      }
    }

    setCacheKey(currentCacheKey);
  }, [nodes, edges]);

  const renderItem = (key: string, i: number) => {
    const renderId = data.renderIds[key];
    const composedUrl = data.composedUrls[key];

    const items = Object.entries(data.renderIds)
      .filter(([key]) => !data.ignored.includes(key))
      .map(([, renderId]) => renderId)
      .map((renderId) => ({
        id: renderId,
        name: renderId,
      }));

    return (
      <Flex UNSAFE_className="w-48" key={i} direction="column" gap="size-100">
        <ImageItem src={composedUrl} maxSize={192} />
        <Flex gap="size-100">
          <MenuTrigger>
            <ActionButton width="100%">{renderId}</ActionButton>
            <Menu
              items={items}
              selectionMode="single"
              disallowEmptySelection={true}
              selectedKeys={[renderId]}
              onSelectionChange={(selectedKeys) => {
                const selectedKey = [...selectedKeys].shift() as string;
                const [nId] = Object.entries(data.renderIds).find(
                  ([, _id]) => _id === selectedKey
                );

                data.onChangeBundleIds(
                  id,
                  data.ids.map((cId, j) => (i === j ? nId : cId))
                );
              }}
            >
              {({ id, name }) => <Item key={id}>{name}</Item>}
            </Menu>
          </MenuTrigger>
          <ActionButton
            onPress={() =>
              data.onChangeBundleIds(
                id,
                data.ids.filter((_, j) => j !== i)
              )
            }
          >
            <Remove />
          </ActionButton>
        </Flex>
      </Flex>
    );
  };

  return (
    <Flex direction="column" gap="size-100">
      <div className="p-3 border-1 border-dashed border-white rounded opacity-25 hover:opacity-100 transition-all">
        <TextField
          width="100%"
          aria-label="Name"
          value={data.name}
          onChange={(value: string) => data.onChangeBundleName(id, value)}
        />
      </div>

      <div className="p-3 border-1 border-solid border-white rounded">
        <Flex direction="column" gap="size-300">
          {data.ids === null ? (
            <div className="h-48 flex justify-center items-center">
              <Text>Nothing to bundle yet</Text>
            </div>
          ) : (
            <>
              <Flex direction="row" gap="size-300">
                {data.ids.map(renderItem)}
              </Flex>

              <Heading>{data.name}</Heading>

              <RadioGroup
                label="Sale type"
                value={data.saleType}
                onChange={(value) => data.onChangeBundleSaleType(id, value)}
              >
                <Radio value="fixed">Fixed price</Radio>
                <Radio value="dutch">Dutch auction</Radio>
                <Radio value="english">English auction</Radio>
              </RadioGroup>

              <NumberField
                minValue={0}
                value={data.startingPrice}
                onChange={(value: number) =>
                  data.onChangeBundleStartingPrice(id, value)
                }
                label="Starting price"
              />

              {data.saleType === "dutch" && (
                <NumberField
                  minValue={0}
                  value={data.endingPrice}
                  onChange={(value: number) =>
                    data.onChangeBundleEndingPrice(id, value)
                  }
                  label="Ending price"
                />
              )}

              {(data.saleType === "dutch" || data.saleType === "english") && (
                <Time
                  value={data.saleTime}
                  onChange={(value) => data.onChangeBundleSaleTime(id, value)}
                />
              )}

              <Flex direction="row-reverse">
                <ActionButton
                  onPress={() =>
                    data.onChangeBundleIds(id, [...data.ids, emptyValue])
                  }
                >
                  <Add />
                </ActionButton>
              </Flex>
            </>
          )}
        </Flex>
      </div>
    </Flex>
  );
});
