import React, { useState } from "react";

import { ActionButton, Flex, Heading, View, Text } from "@adobe/react-spectrum";
import { TaskItem } from "./TaskItem";
import { useErrorHandler } from "./ErrorHandler";
import {
  getBalanceOf,
  getCost,
  getTokenOfOwnerByIndex,
  getTokenUri,
  mint,
  mintDrop,
  pause,
  reveal,
  sellDrop,
  setBaseUri,
  setCost,
  setMaxMintAmount,
  withdraw,
} from "../ipc";
import { OutputItemProps } from "./OutputItem";
import { Deployment } from "../typings";
import Play from "@spectrum-icons/workflow/Play";

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
  const task = useErrorHandler();

  const { dropNumber, generation } = deployment;
  const { drops } = generation;
  const [dropToMint, setDropToMint] = useState(
    dropNumber < drops.length ? drops[dropNumber] : null
  );

  const onGetMintingCost = task("get minting cost", async () => {
    setWorking(true);

    const cost = await getCost(id, contractId);
    addOutput({
      title: "Cost",
      text: cost.toString(),
      isCopiable: true,
    });

    setWorking(false);
  });

  const onSetMintingCost = task("set minting cost", async ({ cost }) => {
    setWorking(true);

    await setCost(id, contractId, cost);
    addOutput({
      title: "Cost set",
      text: cost.toString(),
      isCopiable: true,
    });

    setWorking(false);
  });

  const onSetMaxMintAmount = task("set max mint amount", async ({ amount }) => {
    setWorking(true);

    await setMaxMintAmount(id, contractId, amount);
    addOutput({
      title: "Max mint amount set",
      text: amount.toString(),
      isCopiable: true,
    });

    setWorking(false);
  });

  const onMintDrop = task("mint drop", async () => {
    setWorking(true);

    await mintDrop(id, contractId, "0.05", dropToMint);

    addOutput({
      title: "Minted",
      text: "",
      isCopiable: true,
    });

    increaseDropNumber();
    setWorking(false);
  });

  const onSellDrop = task("sell drop", async () => {
    setWorking(true);

    await sellDrop(id, providerId, deployment, deployment.generation.drops[0]);

    addOutput({
      title: "Listed",
      text: "",
      isCopiable: true,
    });

    // increaseDropNumber();
    setWorking(false);
  });

  const onWithdraw = task("withdraw", async () => {
    setWorking(true);

    await withdraw(id, contractId);
    addOutput({
      title: "Withdraw",
      text: "",
      isCopiable: true,
    });

    setWorking(false);
  });

  return (
    <>
      <TaskItem name="Get minting cost" onRun={onGetMintingCost} />

      <TaskItem
        name="Set minting cost"
        onRun={onSetMintingCost}
        fields={[
          {
            key: "cost",
            type: "string",
            label: "Cost",
            initial: "",
            value: "",
          },
        ]}
      />

      <TaskItem
        name="Set max mint amount"
        onRun={onSetMaxMintAmount}
        fields={[
          {
            key: "amount",
            type: "int",
            label: "Amount",
            initial: 0,
            min: 0,
            max: Infinity,
            value: 0,
          },
        ]}
      />

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
            <ActionButton onPress={onMintDrop}>
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
        </Flex>
      </View>

      <TaskItem name="Withdraw" onRun={onWithdraw} />
    </>
  );
};
