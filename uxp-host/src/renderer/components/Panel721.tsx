import React, { useMemo, useState } from "react";

import {
    ActionButton, Flex, Heading, Item, Menu, MenuTrigger, View, Well
} from "@adobe/react-spectrum";
import Play from "@spectrum-icons/workflow/Play";

import { mintDrop, sellDrop } from "../ipc";
import { Deployment } from "../typings";
import { useErrorHandler } from "./ErrorHandler";
import { OutputItemProps } from "./OutputItem";

interface Panel721Props {
  deployment: Deployment;
  id: string;
  providerId: string;
  contractId: string;
  providerEngineId: string;
  setWorking: (working: boolean) => void;
  addOutput: (output: OutputItemProps) => void;
  increaseDropNumber: () => void;
}

export const Panel721: React.FC<Panel721Props> = ({
  deployment,
  id,
  providerId,
  contractId,
  providerEngineId,
  setWorking,
  addOutput,
  increaseDropNumber,
}) => {
  const task = useErrorHandler(setWorking);

  const { dropNumber, generation } = deployment;
  const { drops } = generation;

  const hasUnmintedDrops = useMemo(
    () => dropNumber < drops.length,
    [deployment]
  );

  const dropToMint = useMemo(
    () => (hasUnmintedDrops ? drops[dropNumber] : null),
    [deployment, hasUnmintedDrops]
  );

  const [dropNameToSell, setDropNameToSell] = useState(drops[0].name);

  const onMintDrop = task("mint drop", async () => {
    if (!providerId || !contractId)
      throw new Error("Must create provider first");

    await mintDrop(id, providerId, contractId, dropToMint);

    addOutput({
      title: "Minted",
      text: "",
      isCopiable: true,
    });

    increaseDropNumber();
  });

  const onSellDrop = task("sell drop", async () => {
    if (!providerEngineId)
      throw new Error("Must create provider with private key first");

    await sellDrop(
      id,
      providerEngineId,
      deployment,
      drops.find(({ name }) => name === dropNameToSell)
    );

    addOutput({
      title: "Listed",
      text: "",
      isCopiable: true,
    });
  });

  const dropsItems = drops.map(({ name }) => ({ name }));

  return (
    <>
      <View
        borderWidth="thin"
        borderColor="dark"
        borderRadius="medium"
        padding="size-100"
      >
        <Flex direction="column" gap="size-100">
          <Flex
            gap="size-100"
            alignItems="center"
            justifyContent="space-between"
          >
            <Heading>Mint drop</Heading>
            <ActionButton onPress={onMintDrop} isDisabled={!dropToMint}>
              <Play />
            </ActionButton>
          </Flex>
          {dropToMint && <Well>{dropToMint.name}</Well>}
        </Flex>
      </View>

      <View
        borderWidth="thin"
        borderColor="dark"
        borderRadius="medium"
        padding="size-100"
      >
        <Flex direction="column" gap="size-100">
          <Flex
            gap="size-100"
            alignItems="center"
            justifyContent="space-between"
          >
            <Heading>Sell drop</Heading>
            <ActionButton onPress={onSellDrop}>
              <Play />
            </ActionButton>
          </Flex>
          <MenuTrigger>
            <ActionButton width="100%">{dropNameToSell}</ActionButton>
            <Menu
              items={dropsItems}
              selectionMode="single"
              disallowEmptySelection={true}
              selectedKeys={[dropNameToSell]}
              onSelectionChange={(selectedKeys) => {
                const selectedKey = [...selectedKeys].shift() as string;
                setDropNameToSell(selectedKey);
              }}
            >
              {({ name }) => <Item key={name}>{name}</Item>}
            </Menu>
          </MenuTrigger>
        </Flex>
      </View>
    </>
  );
};
