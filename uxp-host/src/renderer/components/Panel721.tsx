import React from "react";

import { Flex } from "@adobe/react-spectrum";
import { TaskItem } from "./TaskItem";
import { useErrorHandler } from "./ErrorHandler";
import {
  getBalanceOf,
  getCost,
  getTokenOfOwnerByIndex,
  getTokenUri,
  setCost,
  setMaxMintAmount,
  withdraw,
} from "../ipc";
import { OutputItemProps } from "./OutputItem";
import { Deployment } from "../typings";

interface Panel721Props {
  deployment: Deployment;
  id: string;
  contractId: string;
  setWorking: (working: boolean) => void;
  addOutput: (output: OutputItemProps) => void;
}

export const Panel721: React.FC<Panel721Props> = ({
  id,
  contractId,
  setWorking,
  addOutput,
}) => {
  const task = useErrorHandler();

  const onCost = task("cost", async () => {
    setWorking(true);

    const cost = await getCost(id, contractId);
    addOutput({
      title: "Cost",
      text: cost.toString(),
      isCopiable: true,
    });

    setWorking(false);
  });

  const onBalanceOf = task("balance of", async ({ address }) => {
    setWorking(true);

    const balance = await getBalanceOf(id, contractId, address);
    addOutput({
      title: "Balance",
      text: balance.toString(),
      isCopiable: true,
    });

    setWorking(false);
  });

  const onTokenOfOwnerByIndex = task(
    "token of owner by index",
    async ({ address, index }) => {
      setWorking(true);

      const token = await getTokenOfOwnerByIndex(
        id,
        contractId,
        address,
        index
      );
      addOutput({
        title: "Token of Owner by Index",
        text: token.toString(),
        isCopiable: true,
      });

      setWorking(false);
    }
  );

  const onTokenUri = task("token uri", async ({ index }) => {
    setWorking(true);

    const tokenUri = await getTokenUri(id, contractId, index);
    addOutput({
      title: "Token URI",
      text: tokenUri.toString(),
      isCopiable: true,
    });

    setWorking(false);
  });

  const onMint = task("mint", async ({ payable, mint }) => {
    setWorking(true);

    await mint(payable);
    addOutput({
      title: "Minted",
      text: mint.toString(),
      isCopiable: true,
    });

    setWorking(false);
  });

  const onSetCost = task("set cost", async ({ cost }) => {
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
      <TaskItem name="Cost" onRun={onCost} />
      <TaskItem
        name="Balance of"
        onRun={onBalanceOf}
        fields={[
          {
            key: "address",
            type: "address",
            label: "Address",
            value: "",
          },
        ]}
      />

      <TaskItem
        name="Token of owner by index"
        onRun={onTokenOfOwnerByIndex}
        fields={[
          {
            key: "address",
            type: "address",
            label: "Address",
            value: "",
          },
          {
            key: "index",
            type: "int",
            label: "Index",
            initial: 0,
            min: 0,
            max: Infinity,
            value: 0,
          },
        ]}
      />

      <TaskItem
        name="Token URI"
        onRun={onTokenUri}
        fields={[
          {
            key: "index",
            type: "int",
            label: "Token Index",
            initial: 0,
            min: 0,
            max: Infinity,
            value: 0,
          },
        ]}
      />

      <TaskItem
        name="Mint"
        onRun={onMint}
        fields={[
          {
            key: "payable",
            type: "string",
            label: "Payable amount",
            initial: "",
            value: "",
          },
          {
            key: "mint",
            type: "int",
            label: "Mint amount",
            initial: 0,
            min: 0,
            max: Infinity,
            value: 0,
          },
        ]}
      />

      <TaskItem
        name="Set cost"
        onRun={onSetCost}
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
        name="Set max Mint amount"
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

      <TaskItem name="Withdraw" onRun={onWithdraw} />
    </>
  );
};
