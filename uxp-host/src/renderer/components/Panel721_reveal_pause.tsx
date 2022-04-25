import React, { useState } from "react";

import {
  ActionButton,
  Flex,
  Heading,
  Item,
  Menu,
  MenuTrigger,
  Text,
  View,
} from "@adobe/react-spectrum";
import Play from "@spectrum-icons/workflow/Play";

import { mintDrop, pause, reveal, sellDrop, withdraw } from "../ipc";
import { Deployment } from "../typings";
import { useErrorHandler } from "./ErrorHandler";
import { OutputItemProps } from "./OutputItem";
import { TaskItem } from "./TaskItem";

interface Panel721_reveal_pauseProps {
  deployment: Deployment;
  id: string;
  providerId: string;
  contractId: string;
  setWorking: (working: boolean) => void;
  addOutput: (output: OutputItemProps) => void;
  increaseDropNumber: () => void;
}

export const Panel721_reveal_pause: React.FC<Panel721_reveal_pauseProps> = ({
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

  // const [dropToMint, setDropToMint] = useState(
  //   dropNumber < drops.length ? drops[dropNumber] : null
  // );

  const [dropToMint] = useState(
    dropNumber < drops.length ? drops[dropNumber] : null
  );

  const [dropNameToSell, setDropNameToSell] = useState(drops[0].name);
  const [dropsItems] = useState(drops.map(({ name }) => ({ name })));

  const onPause = task("pause", async () => {
    await pause(id, contractId);
    addOutput({
      title: "Paused",
      text: "",
      isCopiable: true,
    });
  });

  const onReveal = task("reveal", async () => {
    await reveal(id, contractId);
    addOutput({
      title: "Revealed",
      text: "",
      isCopiable: true,
    });
  });

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
    await sellDrop(
      id,
      providerId,
      deployment,
      drops.find(({ name }) => name === dropNameToSell)
    );

    addOutput({
      title: "Listed",
      text: "",
      isCopiable: true,
    });
  });

  const onWithdraw = task("withdraw", async () => {
    await withdraw(id, contractId);
    addOutput({
      title: "Withdraw",
      text: "",
      isCopiable: true,
    });
  });

  return (
    <>
      <TaskItem name="Pause" onRun={onPause} />

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

      <TaskItem name="Withdraw" onRun={onWithdraw} />
    </>
  );
};
