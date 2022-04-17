import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  ActionButton,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  ProgressBar,
  Text,
  View,
} from "@adobe/react-spectrum";
import Back from "@spectrum-icons/workflow/Back";
import Copy from "@spectrum-icons/workflow/Copy";

import { useErrorHandler } from "../components/ErrorHandler";
import { OutputItem } from "../components/OutputItem";
import { Panel721 } from "../components/Panel721";
import { ToolbarContext } from "../components/Toolbar";
import { Networks } from "../constants";
import { Instance } from "../typings";
import { chopAddress } from "../utils";
import { Panel721_reveal_pause } from "../components/Panel721_reveal_pause";

interface InstancePageState {
  projectDir: string;
  instance: Instance;
  id: string;
  dirty: boolean;
}

export function InstancePage() {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    projectDir,
    instance,
    id,
    dirty: _dirty,
  } = state as InstancePageState;
  const { configuration, deployment } = instance;

  const [dirty, setDirty] = useState(_dirty);

  const [error] = useState(!deployment);

  const [isWorking, setIsWorking] = useState(false);
  const [outputs, setOutputs] = useState([]);

  useEffect(() => {
    toolbarContext.addButton("back", "Back", <Back />, () => onBack());

    return () => {
      toolbarContext.removeButton("back");
    };
  }, []);

  const onBack = () =>
    navigate("/factory", { state: { projectDir, instance, id, dirty } });

  const addOutput = (output: {
    title: string;
    text: string;
    isCopiable: boolean;
  }) => {
    setOutputs((prevOutputs) => [...prevOutputs, output]);
  };

  const onCopy = () =>
    navigator.clipboard.writeText(deployment.contractAddress);

  const _task =
    (name: string, callback: (...args: any[]) => void) =>
    async (...args: any[]) => {
      setIsWorking(true);
      await task(name, callback)(...args);
      setIsWorking(false);
    };

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      justifyContent="space-between"
    >
      {error ? (
        <>
          <Heading level={1}>You need to deploy a contract first</Heading>
          <ButtonGroup align="end">
            <Button variant="cta" onPress={onBack}>
              Back
            </Button>
          </ButtonGroup>
        </>
      ) : (
        <>
          <Flex justifyContent="space-between" alignItems="center">
            <Flex gap="size-100" alignItems="center">
              <Heading level={1} marginStart={16}>
                <pre className="inline">
                  {chopAddress(deployment.contractAddress)}
                </pre>{" "}
                at {Networks[deployment.network].name}
              </Heading>
              <ActionButton onPress={onCopy}>
                <Copy />
              </ActionButton>
            </Flex>
          </Flex>

          <Flex height="60vh" gap="size-100" justifyContent="space-evenly">
            {configuration.contractType === "721" ? (
              <Panel721
                {...{
                  task: _task,
                  contractAddress: deployment.contractAddress,
                  addOutput,
                }}
              />
            ) : configuration.contractType === "721_reveal_pause" ? (
              <Panel721_reveal_pause
                {...{
                  task: _task,
                  contractAddress: deployment.contractAddress,
                  addOutput,
                }}
              />
            ) : null}

            <View>
              <label className="spectrum-FieldLabel">Output</label>

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
                  {outputs.map(({ title, text, isCopiable }, i) => (
                    <OutputItem
                      key={i}
                      title={title}
                      text={text}
                      isCopiable={isCopiable}
                    />
                  ))}
                </Flex>
              </View>
            </View>
          </Flex>

          <Flex marginBottom={8} marginX={8} justifyContent="space-between">
            <Text>Made with love by KODKOD ❤️</Text>

            <ProgressBar
              UNSAFE_className={isWorking ? "opacity-100" : "opacity-0"}
              label="Loading…"
              isIndeterminate
            />
          </Flex>
        </>
      )}
    </Flex>
  );
}
