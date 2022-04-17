import React from "react";

import { Flex } from "@adobe/react-spectrum";
import { TaskItem } from "./TaskItem";

interface Panel721Props {
  task: (name: string, callback: (...args: any[]) => void) => () => void;
  addOutput: (output: any) => void;
}

export const Panel721: React.FC<Panel721Props> = ({ task, addOutput }) => {
  const onCost = task("cost", async () => {});

  const onBalanceOf = task("balance of", async ({ address }) => {});

  const onTokenOfOwnerByIndex = task(
    "token of owner by index",
    async ({ address, index }) => {}
  );

  const onTokenURI = task("token URI", async ({ index }) => {});

  const onMint = task("mint", async ({ payable, mint }) => {});

  const onSetCost = task("set cost", async ({ cost }) => {});

  const onSetMaxMintAmount = task(
    "set max mint amount",
    async ({ amount }) => {}
  );

  const onWithdraw = task("withdraw", async () => {});

  const onSell = task("sell", async () => {});

  return (
    <>
      <Flex direction="column" gap="size-100">
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
          onRun={onTokenURI}
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
      </Flex>

      <Flex direction="column" gap="size-100">
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

        <TaskItem name="Sell" onRun={onSell} />
      </Flex>
    </>
  );
};
