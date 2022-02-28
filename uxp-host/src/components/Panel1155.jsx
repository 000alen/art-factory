import React from "react";
import { TaskItem } from "./TaskItem";
import { Flex } from "@adobe/react-spectrum";

export function Panel1155({
  contract,
  contractAddress,
  setIsLoading,
  addOutput,
  dialogContext,
}) {
  return (
    <>
      <Flex direction="column" gap="size-100">
        <TaskItem
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
          task="Token URI"
          fields={[
            {
              key: "input",
              type: "int",
              label: "Input",
            },
          ]}
        />

        <TaskItem
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

/*
balanceOf       <
balanceOfBatch  < 50%
tokenURI        <
uri             <

burn            <
burnBatch       50%
burnForMInt    Missing (Array) (?)
Mint            <
MintBatch       Missing (Array)
safeBatchTransferFrom Missing (Array)
setURI
*/
