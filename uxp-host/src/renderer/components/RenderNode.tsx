import React, { memo, useEffect, useState } from "react";
import { Handle, Node as FlowNode, Position, useEdges, useNodes } from "react-flow-renderer";

import {
    ActionButton, Flex, Heading, Item, Menu, MenuTrigger, NumberField, Radio, RadioGroup, Text
} from "@adobe/react-spectrum";
import Remove from "@spectrum-icons/workflow/Remove";

import { DEFAULT_N, DEFAULT_PRICE, DEFAULT_SALE_TIME, DEFAULT_SALE_TYPE } from "../constants";
import { Trait } from "../typings";
import { getBranches, hash } from "../utils";
import { ImageItem } from "./ImageItem";
import { LayerNodeComponentData } from "./LayerNode";
import { Time } from "./Time";

export interface RenderNodeComponentData {
  composedUrls?: Record<string, string>;
  renderIds?: Record<string, string>;
  ns?: Record<string, number>;
  maxNs?: Record<string, number>;
  ignored?: string[];

  salesTypes?: Record<string, string>;
  startingPrices?: Record<string, number>;
  endingPrices?: Record<string, number>;
  salesTimes?: Record<string, number>;
  orders?: Record<string, number>;

  requestComposedUrl?: (traits: Trait[]) => void;
  requestRenderId?: (traits: Trait[]) => void;
  requestMaxNs?: (traits: Trait[]) => void;
  requestOrder?: (traits: Trait[]) => void;
  updateNs?: (traits: Trait[], n: number) => void;
  updateIgnored?: (traits: Trait[], ignored: boolean) => void;
  updateSalesTypes?: (traits: Trait[], salesType: string) => void;
  updateStartingPrices?: (traits: Trait[], price: number) => void;
  updateEndingPrices?: (traits: Trait[], price: number) => void;
  updateSalesTimes?: (traits: Trait[], time: number) => void;
  // updateOrders?: (traits: Trait[], order: number) => void;
  updateOrders: (traits: Trait[], order: number) => void;
}

interface RenderNodeProps {
  id: string;
  data: RenderNodeComponentData;
}

export const RenderNode: React.FC<RenderNodeProps> = memo(({ id, data }) => {
  const [nodes, edges] = [useNodes(), useEdges()];

  const [cacheKey, setCacheKey] = useState<string>(null);
  const [keys, setKeys] = useState<string[]>([]);
  const [nTraits, setNTraits] = useState<Trait[][]>([]);

  console.log(data.orders);

  useEffect(() => {
    const nTraits: Trait[][] = (
      getBranches(nodes, edges)
        .filter((branch) => branch[branch.length - 1].id === id)
        .map((branch) =>
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

    const keys = nTraits.map(hash);

    for (const [i, key] of keys.entries()) {
      if (!(key in data.composedUrls)) data.requestComposedUrl(nTraits[i]);
      if (!(key in data.renderIds)) data.requestRenderId(nTraits[i]);
      if (!(key in data.maxNs)) data.requestMaxNs(nTraits[i]);

      if (!(key in data.orders)) data.requestOrder(nTraits[i]);

      if (!(key in data.ns)) data.updateNs(nTraits[i], DEFAULT_N);
      if (!(key in data.salesTypes))
        data.updateSalesTypes(nTraits[i], DEFAULT_SALE_TYPE);
      if (!(key in data.startingPrices))
        data.updateStartingPrices(nTraits[i], DEFAULT_PRICE);
      if (!(key in data.endingPrices))
        data.updateEndingPrices(nTraits[i], DEFAULT_PRICE);
      if (!(key in data.salesTimes))
        data.updateSalesTimes(nTraits[i], DEFAULT_SALE_TIME);
    }

    setCacheKey(currentCacheKey);
    setNTraits(nTraits);
    setKeys(keys);
  }, [nodes, edges]);

  const renderItem = (key: string, i: number) => {
    const renderId = data.renderIds[key];
    const composedUrl = data.composedUrls[key];
    const n = data.ns[key];
    const maxNs = data.maxNs[key];
    const saleType = data.salesTypes[key];
    const startingPrice = data.startingPrices[key];
    const endingPrice = data.endingPrices[key];
    const salesTime = data.salesTimes[key];
    const order = data.orders[key];

    return data.ignored.includes(key) ? (
      <></>
    ) : (
      <>
        <Flex UNSAFE_className="w-48" key={i} direction="column" gap="size-100">
          <ImageItem src={composedUrl} maxSize={192}>
            <Text>{nTraits[i].map((trait) => trait.name).join(", ")}</Text>
          </ImageItem>
          <Heading>{renderId}</Heading>

          <NumberField
            label="Order"
            value={order}
            onChange={(value) => data.updateOrders(nTraits[i], value)}
            isQuiet
          />

          <RadioGroup
            label="Sale type"
            value={saleType}
            onChange={(value) => data.updateSalesTypes(nTraits[i], value)}
          >
            <Radio value="fixed">Fixed price</Radio>
            <Radio value="dutch">Dutch auction</Radio>
            <Radio value="english">English auction</Radio>
          </RadioGroup>

          <NumberField
            width="100%"
            minValue={0}
            value={startingPrice}
            onChange={(value: number) =>
              data.updateStartingPrices(nTraits[i], value)
            }
            label="Starting price"
          />

          {saleType === "dutch" && (
            <NumberField
              width="100%"
              minValue={0}
              value={endingPrice}
              onChange={(value: number) =>
                data.updateEndingPrices(nTraits[i], value)
              }
              label="Ending price"
            />
          )}

          {(saleType === "english" || saleType === "dutch") && (
            <Time
              value={salesTime}
              onChange={(value: number) =>
                data.updateSalesTimes(nTraits[i], value)
              }
            />
          )}

          <Flex gap="size-100" alignItems="end">
            <NumberField
              width="100%"
              minValue={1}
              maxValue={maxNs}
              value={n}
              onChange={(value: number) => data.updateNs(nTraits[i], value)}
              label={`N (max: ${maxNs})`}
            />
            <ActionButton onPress={() => data.updateIgnored(nTraits[i], true)}>
              <Remove />
            </ActionButton>
          </Flex>
        </Flex>
      </>
    );
  };

  const visibleKeys = keys.filter((key) => !data.ignored.includes(key));

  const ignoredKeys = keys.filter((key) => data.ignored.includes(key));
  const ignoredItems = ignoredKeys.map((key) => ({
    id: key,
    name: data.renderIds[key],
  }));

  return (
    <Flex direction="column" gap="size-100">
      {/* <div className="w-48 p-3 transition-all border-white border-dashed rounded border-1 opacity-5 hover:opacity-100"> */}
      <div className="p-3 transition-all border-white border-dashed rounded border-1 opacity-5 hover:opacity-100">
        <MenuTrigger>
          <ActionButton width="100%">Hidden</ActionButton>
          <Menu
            items={ignoredItems}
            selectionMode="single"
            onSelectionChange={(selectedKeys) => {
              const selectedKey = [...selectedKeys].shift() as string;
              data.updateIgnored(nTraits[keys.indexOf(selectedKey)], false);
            }}
          >
            {({ id, name }) => <Item key={id}>{name}</Item>}
          </Menu>
        </MenuTrigger>
      </div>

      {/* <div className="relative w-48 p-3 border-white border-solid rounded border-1"> */}
      <div className="relative p-3 border-white border-solid rounded border-1">
        <Handle
          className="!w-4 !h-4 !left-0 !translate-x-[-50%] !translate-y-[-50%]"
          id="renderIn"
          type="target"
          position={Position.Left}
        />

        {/* <Flex direction="column" gap="size-300"> */}
        <Flex direction="row" gap="size-300">
          {visibleKeys.length > 0 ? (
            keys.map(renderItem)
          ) : (
            // <div className="flex items-center justify-center h-48">
            <div className="flex items-center justify-center w-48 h-48">
              <Text>Nothing to render yet</Text>
            </div>
          )}
        </Flex>
      </div>
    </Flex>
  );
});
