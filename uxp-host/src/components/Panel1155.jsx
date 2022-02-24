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
              label: "Id"
            }
          ]}
        />

        <TaskItem
          task="Token URI"
          fields={[
            {
              key: "input",
              type: "int",
              label: "Input"
            }
          ]}
        />

        <TaskItem
          task="URI"
          fields={[
            {
              key: "id",
              type: "int",
              label: "Id"
            }
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
                label: "Id"
              },
              {
                key: "amount",
                type: "int",
                label: "Amount"
              }
            ]}
          />

          <TaskItem
            task="Mint"
            fields={[
              {
                key: "to",
                type: "address",
                label: "To"
              },
              {
                key: "id",
                type: "int",
                label: "Id"
              },
              {
                key: "amount",
                type: "int",
                label: "Amount"
              }
            ]}
          />

          <TaskItem
            task="Set URI"
            fields={[
              {
                key: "id",
                type: "int",
                label: "Id"
              },
              {
                key: "uri",
                type: "string",
                label: "URI"
              }
            ]}
          />
      </Flex>
    </>
  );
}

/*
balanceOf       <
balanceOfBatch  Missing (Array)
tokenURI        <
uri             <

burn            <
burnBatch       Missing (Array)
burnFromMint    Missing (Array)
Mint            <
MintBatch       Missing (Array)
safeBatchTransferFRom Missing (Array)
setURI
*/
