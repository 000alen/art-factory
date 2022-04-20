import React from "react";

import { Flex } from "@adobe/react-spectrum";
import { TaskItem } from "./TaskItem";
import { useErrorHandler } from "./ErrorHandler";
import {
  getBalanceOf,
  getCost,
  getTokenOfOwnerByIndex,
  getTokenUri,
  mint,
  pause,
  reveal,
  setBaseUri,
  setCost,
  setMaxMintAmount,
  withdraw,
} from "../ipc";
import { OutputItemProps } from "./OutputItem";
import { Deployment } from "../typings";

interface Panel721_reveal_pauseProps {
  deployment: Deployment;
  id: string;
  contractId: string;
  setWorking: (working: boolean) => void;
  addOutput: (output: OutputItemProps) => void;
}

export const Panel721_reveal_pause: React.FC<Panel721_reveal_pauseProps> = ({
  deployment,
  id,
  contractId,
  setWorking,
  addOutput,
}) => {
  const task = useErrorHandler();

  const onMintingCost = task("cost", async () => {
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

  const onMint = task("mint", async ({ payable, mint: _mint }) => {
    setWorking(true);

    await mint(id, contractId, payable, _mint);
    addOutput({
      title: "Minted",
      text: _mint.toString(),
      isCopiable: true,
    });

    setWorking(false);
  });

  const onSetMintingCost = task("set cost", async ({ cost }) => {
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

  const onMintDrop = task("mint drop", async () => {});

  const onSellDrop = task("sell drop", async () => {});

  const onPause = task("pause", async () => {
    setWorking(true);

    await pause(id, contractId);
    addOutput({
      title: "Paused",
      text: "",
      isCopiable: true,
    });

    setWorking(false);
  });

  const onReveal = task("reveal", async () => {
    setWorking(true);

    await reveal(id, contractId);
    addOutput({
      title: "Revealed",
      text: "",
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
      <TaskItem name="Get minting cost" onRun={onMintingCost} />

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

      <TaskItem name="Pause" onRun={onPause} />

      <TaskItem name="Reveal" onRun={onReveal} />

      <TaskItem name="Mint drop" onRun={onMintDrop} />

      <TaskItem name="Sell drop" onRun={onSellDrop} />

      <TaskItem name="Withdraw" onRun={onWithdraw} />
    </>
  );
};
