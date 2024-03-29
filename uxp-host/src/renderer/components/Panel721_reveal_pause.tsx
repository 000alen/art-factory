import React, { useMemo, useState } from "react";

import {
  ActionButton,
  Flex,
  Heading,
  Item,
  Menu,
  MenuTrigger,
  NumberField,
  Switch,
  View,
  Well,
} from "@adobe/react-spectrum";
import Play from "@spectrum-icons/workflow/Play";

import { mintDrop, pause, reveal, sellDrop } from "../ipc";
import { Deployment } from "../typings";
import { useErrorHandler } from "./ErrorHandler";
import { OutputItemProps } from "./OutputItem";
import { TaskItem } from "./TaskItem";
import { MINT_N } from "../constants";

interface Panel721_reveal_pauseProps {
  deployment: Deployment;
  id: string;
  providerId: string;
  contractId: string;
  providerEngineId: string;
  setWorking: (working: boolean) => void;
  addOutput: (output: OutputItemProps) => void;
  increaseDropNumber: () => void;
}

export const Panel721_reveal_pause: React.FC<Panel721_reveal_pauseProps> = ({
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

  const [gasLimit, setGasLimit] = useState(250000);

  const hasUnmintedDrops = useMemo(
    () => dropNumber < drops.length,
    [deployment]
  );

  const [dropToMint, setDropToMint] = useState(
    hasUnmintedDrops ? drops[dropNumber].name : drops[0].name
  );
  const [automaticDropToMint, setAutomaticDropToMint] = useState(true);

  const [dropNameToSell, setDropNameToSell] = useState(drops[0].name);

  const onMintDrop = task("mint drop", async () => {
    if (!providerId || !contractId)
      throw new Error("Must create provider first");

    await mintDrop(
      id,
      providerId,
      contractId,
      drops.find(({ name }) => name === dropToMint),
      gasLimit
    );

    addOutput({
      title: "Minted",
      text: "",
      isCopiable: true,
    });

    increaseDropNumber();
  });

  const onReveal = task("reveal", async () => {
    if (!providerId || !contractId)
      throw new Error("Must create provider first");

    await reveal(id, contractId);
    addOutput({
      title: "Revealed",
      text: "",
      isCopiable: true,
    });
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

          <Switch
            isSelected={automaticDropToMint}
            onChange={setAutomaticDropToMint}
          >
            Automatic
          </Switch>

          <MenuTrigger>
            <ActionButton width="100%" isDisabled={automaticDropToMint}>
              {dropToMint}
            </ActionButton>
            <Menu
              items={dropsItems}
              selectionMode="single"
              disallowEmptySelection={true}
              selectedKeys={[dropToMint]}
              onSelectionChange={(selectedKeys) => {
                const selectedKey = [...selectedKeys].shift() as string;
                setDropToMint(selectedKey);
              }}
            >
              {({ name }) => <Item key={name}>{name}</Item>}
            </Menu>
          </MenuTrigger>

          <NumberField
            width="100%"
            label="Gas limit per transaction"
            value={gasLimit}
            onChange={setGasLimit}
          />

          <Well>
            {Math.ceil(
              drops.find(({ name }) => name === dropToMint).ids.length / MINT_N
            )}{" "}
            transactions
          </Well>
        </Flex>
      </View>

      <TaskItem name="Reveal" onRun={onReveal} />

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
