import React, { useState } from "react";
import { v4 as uuid } from "uuid";

import {
  ActionButton,
  Flex,
  Heading,
  Item,
  Menu,
  MenuTrigger,
  Text,
  TextField,
  View,
} from "@adobe/react-spectrum";
import Play from "@spectrum-icons/workflow/Play";

import { createProviderWithKey, mintDrop, sellDrop, withdraw } from "../ipc";
import { Deployment } from "../typings";
import { useErrorHandler } from "./ErrorHandler";
import { OutputItemProps } from "./OutputItem";
import { TaskItem } from "./TaskItem";

interface Panel721Props {
  deployment: Deployment;
  id: string;
  providerId: string;
  contractId: string;
  setWorking: (working: boolean) => void;
  addOutput: (output: OutputItemProps) => void;
  increaseDropNumber: () => void;
}

export const Panel721: React.FC<Panel721Props> = ({
  deployment,
  id,
  providerId,
  contractId,
  setWorking,
  addOutput,
  increaseDropNumber,
}) => {
  const task = useErrorHandler(setWorking);

  const { dropNumber, generation } = deployment;
  const { drops } = generation;

  const [dropToMint, setDropToMint] = useState(
    dropNumber < drops.length ? drops[dropNumber] : null
  );

  const [dropNameToSell, setDropNameToSell] = useState(drops[0].name);
  const [dropsItems] = useState(drops.map(({ name }) => ({ name })));

  const [privateKey, setPrivateKey] = useState("");

  const onMintDrop = task("mint drop", async () => {
    await mintDrop(id, contractId, dropToMint);

    addOutput({
      title: "Minted",
      text: "",
      isCopiable: true,
    });

    increaseDropNumber();
  });

  const onSellDrop = task("sell drop", async () => {
    const providerEngineId = uuid();
    await createProviderWithKey(
      providerEngineId,
      privateKey,
      deployment.network
    );

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

  // const onWithdraw = task("withdraw", async () => {
  //   await withdraw(id, contractId);
  //   addOutput({
  //     title: "Withdraw",
  //     text: "",
  //     isCopiable: true,
  //   });
  // });

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
          {dropToMint && <Text>{dropToMint.name}</Text>}
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
          <TextField
            label="Private key"
            type="password"
            value={privateKey}
            onChange={setPrivateKey}
          />
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

      {/* <TaskItem name="Withdraw" onRun={onWithdraw} /> */}
    </>
  );
};
