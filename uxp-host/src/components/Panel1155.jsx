import React from "react";
import { TaskItem } from "./TaskItem";
import { Flex, TextField, ActionGroup, Item, View, Text, ActionButton, NumberField } from "@adobe/react-spectrum";

import Remove from "@spectrum-icons/workflow/Remove";
import ChevronUp from "@spectrum-icons/workflow/ChevronUp";
import ChevronDown from "@spectrum-icons/workflow/ChevronDown";
import Play from "@spectrum-icons/workflow/Play";

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

      {/* ! TODO: Modularizar esto */}
      <Flex direction="column" gap="size-100">

        <View
        borderWidth="thin"
        borderColor="dark"
        borderRadius="medium"
        padding="size-100"
        >
          <Flex alignItems="center" justifyContent="space-between">
            <Text>Balance of Batch</Text>
            <ActionButton>
              <Play />
            </ActionButton>
          </Flex>

          <label className="spectrum-FieldLabel">Accounts</label>
          <View padding="size-100" height="6vh" overflow="auto">
            <Flex gap="size-100" justifyContent="space-between" marginTop="size-50" marginBottom="size-50">
                <TextField
                placeholder="0x"
                width="100%"
              />

              <ActionGroup overflowMode="collapse">
                <Item key="moveDown">
                  <ChevronDown />
                </Item>
                <Item key="moveUp">
                  <ChevronUp />
                </Item>
                <Item key="remove">
                  <Remove />
                </Item>
              </ActionGroup>
            </Flex>
            
          </View>

          <label className="spectrum-FieldLabel">Ids</label>
          <View padding="size-100" height="6vh" overflow="auto">
            <Flex gap="size-100" justifyContent="space-between" marginTop="size-50" marginBottom="size-50">
              <NumberField
                width="100%"
              />

              <ActionGroup overflowMode="collapse">
                <Item key="moveDown">
                  <ChevronDown />
                </Item>
                <Item key="moveUp">
                  <ChevronUp />
                </Item>
                <Item key="remove">
                  <Remove />
                </Item>
              </ActionGroup>
            </Flex>
          </View>


        </View>

        <View
        borderWidth="thin"
        borderColor="dark"
        borderRadius="medium"
        padding="size-100"
        >
          <Flex alignItems="center" justifyContent="space-between">
            <Text>Mint batch</Text>
            <ActionButton>
              <Play />
            </ActionButton>
          </Flex>

          <label className="spectrum-FieldLabel">Ids</label>
          <View padding="size-100" height="6vh" overflow="auto">
            <Flex gap="size-100" justifyContent="space-between" marginTop="size-50" marginBottom="size-50">
              <TextField
                width="100%"
              />

              <ActionGroup overflowMode="collapse">
                <Item key="moveDown">
                  <ChevronDown />
                </Item>
                <Item key="moveUp">
                  <ChevronUp />
                </Item>
                <Item key="remove">
                  <Remove />
                </Item>
              </ActionGroup>
            </Flex>
            
          </View>

          <label className="spectrum-FieldLabel">Amounts</label>
          <View padding="size-100" height="6vh" overflow="auto">
            <Flex gap="size-100" justifyContent="space-between" marginTop="size-50" marginBottom="size-50">
              <TextField
                width="100%"
              />

              <ActionGroup overflowMode="collapse">
                <Item key="moveDown">
                  <ChevronDown />
                </Item>
                <Item key="moveUp">
                  <ChevronUp />
                </Item>
                <Item key="remove">
                  <Remove />
                </Item>
              </ActionGroup>
            </Flex>
          </View>


        </View>

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
