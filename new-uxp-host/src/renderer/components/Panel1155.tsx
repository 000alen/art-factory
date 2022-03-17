import React from "react";
import { TaskItem } from "./TaskItem";
import { Flex } from "@adobe/react-spectrum";
import { chopAddress } from "../utils";
import { Contract } from "ethers";

// ! TODO: Test
export function Panel1155({
  task,
  contract,
  addOutput,
}: {
  task: (name: string, callback: (...args: any[]) => void) => () => void;
  contract: Contract;
  addOutput: (output: any) => void;
}) {
  const onBalanceOf = task("balance of", async ({ address, id }) => {
    const balance = await contract.balanceOf(address, id);

    addOutput({
      title: `Balance of ${chopAddress(address)} (id: ${id})`,
      text: balance.toString(),
      isCopiable: true,
    });
  });

  const onUri = task("URI", async ({ id }) => {
    const uri = await contract.tokenUri(id);

    addOutput({
      title: `Token URI (id: ${id})`,
      text: uri,
      isCopiable: true,
    });
  });

  const onBurn = task("burn", async ({ id, amount }) => {
    await contract.burn(id, amount);

    addOutput({
      title: `Burnt (id: ${id})`,
      text: amount.toString(),
      isCopiable: true,
    });
  });

  const onMint = task("mint", async ({ to, id, amount }) => {
    await contract.mint(to, id, amount);

    addOutput({
      title: `Minted to ${chopAddress(to)} (id: ${id})`,
      text: amount.toString(),
      isCopiable: true,
    });
  });

  const onSetUri = task("set URI", async ({ id, uri }) => {
    await contract.setURI(id, uri);

    addOutput({
      title: `Set URI of ${id}`,
      text: uri,
      isCopiable: true,
    });
  });

  const onBalanceOfBatch = task(
    "balance of batch",
    async ({ addresses, ids }) => {
      const balances = await contract.balanceOfBatch(addresses, ids);

      addOutput({
        title: `Balance of Batch`,
        text: balances.toString(),
        isCopiable: true,
      });
    }
  );

  const onMintBatch = task("on mint batch", async ({ ids, amounts }) => {
    await contract.mintBatch(ids, amounts);

    // @ts-ignore
    const n = amounts.reduce((a, b) => a + b, 0);
    addOutput({
      title: `Minted`,
      text: n.toString(),
      isCopiable: true,
    });
  });

  return (
    <>
      <Flex direction="column" gap="size-100">
        <TaskItem
          onRun={onBalanceOf}
          task="Balance of"
          fields={[
            {
              key: "address",
              type: "address",
              label: "Address",
            },
            {
              key: "id",
              type: "int",
              label: "Id",
            },
          ]}
          dialog={true}
        />

        <TaskItem
          onRun={onUri}
          task="URI"
          fields={[
            {
              key: "id",
              type: "int",
              label: "Id",
            },
          ]}
        />
      </Flex>

      <Flex direction="column" gap="size-100">
        <TaskItem
          onRun={onBurn}
          task="Burn"
          fields={[
            {
              key: "id",
              type: "int",
              label: "Id",
            },
            {
              key: "amount",
              type: "int",
              label: "Amount",
            },
          ]}
        />

        <TaskItem
          onRun={onMint}
          task="Mint"
          fields={[
            {
              key: "to",
              type: "address",
              label: "To",
            },
            {
              key: "id",
              type: "int",
              label: "Id",
            },
            {
              key: "amount",
              type: "int",
              label: "Amount",
            },
          ]}
        />

        <TaskItem
          onRun={onSetUri}
          task="Set URI"
          fields={[
            {
              key: "id",
              type: "int",
              label: "Id",
            },
            {
              key: "uri",
              type: "string",
              label: "URI",
            },
          ]}
        />
      </Flex>

      <Flex direction="column" gap="size-100">
        <TaskItem
          onRun={onBalanceOfBatch}
          task="Balance of Batch"
          dialog={true}
          fields={[
            {
              key: "addresses",
              type: "address[]",
              label: "Addresses",
            },
            {
              key: "ids",
              type: "int[]",
              label: "Ids",
            },
          ]}
        />

        <TaskItem
          onRun={onMintBatch}
          task="Mint batch"
          dialog={true}
          fields={[
            {
              key: "ids",
              type: "int[]",
              label: "Ids",
            },
            {
              key: "amounts",
              type: "int[]",
              label: "Amounts",
            },
          ]}
        />
      </Flex>
    </>
  );
}