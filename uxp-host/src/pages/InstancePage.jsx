import React, { useState, useContext, useEffect } from "react";
import {
  Flex,
  Heading,
  TextField,
  NumberField,
  ProgressBar,
  View,
} from "@adobe/react-spectrum";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { TaskItem } from "../components/TaskItem";
import { OutputItem } from "../components/OutputItem";
import { useLocation, useNavigate } from "react-router-dom";
import { DialogContext } from "../App";

// ! TODO:
// Implement, link to Etherscan
export function InstancePage() {
  const dialogContext = useContext(DialogContext);
  const navigator = useNavigate();
  const { state } = useLocation();
  const {
    id,
    attributes,
    inputDir,
    outputDir,
    configuration,
    imagesCID,
    metadataCID,
    contractAddress,
  } = state;

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {}, []);

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      justifyContent="space-between"
    >
      <Heading level={1} marginStart={16}>
        Instance
      </Heading>

      <Flex gap="size-100" justifyContent="space-evenly">
        <Flex direction="column" gap="size-100" justifyContent="space-between">
          <TaskItem task="Cost" />

          <TaskItem task="Is revealed?" />

          <TaskItem task="Balance of">
            <TextField label="Address" placeholder="0x" width="100%" />
          </TaskItem>

          <TaskItem task="Token of owner by index">
            <TextField label="Address" placeholder="0x" />
            <NumberField label="Index" />
          </TaskItem>

          <TaskItem task="Token URI">
            <NumberField label="Token Index" />
          </TaskItem>
        </Flex>

        <Flex direction="column" gap="size-100" justifyContent="space-between">
          <TaskItem task="Reveal" />

          <TaskItem task="Mint">
            <TextField label="Payable amount" />
            <NumberField label="Mint amount" />
          </TaskItem>

          <TaskItem task="Set cost">
            <NumberField label="Cost" />
          </TaskItem>

          <TaskItem task="Set max Mint amount">
            <NumberField label="Max Mint amount" />
          </TaskItem>

          <TaskItem task="Withdrawal">
            <NumberField label="Amount" />
          </TaskItem>
        </Flex>

        <View>
          <View
            width="30vw"
            height="100%"
            padding="size-100"
            overflow="auto"
            borderWidth="thin"
            borderColor="dark"
            borderRadius="medium"
          >
            <Flex direction="column" gap="size-100">
              <OutputItem
                text="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                isCopiable
              />
              <OutputItem
                text="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                isCopiable
              />
            </Flex>
          </View>
        </View>
      </Flex>

      {isLoading && (
        <Flex marginBottom={8} marginX={8} justifyContent="end">
          <ProgressBar label="Loading…" isIndeterminate />
        </Flex>
      )}
    </Flex>
  );
}
