import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  ActionButton,
  Button,
  ButtonGroup,
  Flex,
  Grid,
  Heading,
  ProgressBar,
  repeat,
  Text,
  View,
} from "@adobe/react-spectrum";
import Back from "@spectrum-icons/workflow/Back";
import Copy from "@spectrum-icons/workflow/Copy";

import { useErrorHandler } from "../components/ErrorHandler";
import { OutputItem, OutputItemProps } from "../components/OutputItem";
import { Panel721 } from "../components/Panel721";
import { ToolbarContext } from "../components/Toolbar";
import { Networks } from "../constants";
import { Deployment, Instance } from "../typings";
import { chopAddress } from "../utils";
import { Panel721_reveal_pause } from "../components/Panel721_reveal_pause";
import { v4 as uuid } from "uuid";
import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";
import { createContract, createProvider, writeProjectInstance } from "../ipc";

interface InstancePageState {
  projectDir: string;
  instance: Instance;
  id: string;
  dirty: boolean;
}

export function InstancePage() {
  const task = useErrorHandler();
  const toolbarContext = useContext(ToolbarContext);
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    projectDir,
    instance,
    id,
    dirty: _dirty,
  } = state as InstancePageState;
  const { configuration, deployment: _deployment } = instance;

  const [deployment, setDeployment] = useState(_deployment);
  const [error] = useState(!deployment);

  const [contractAddress] = useState(error ? null : deployment.contractAddress);
  const [abi] = useState(error ? null : deployment.abi);
  const [network] = useState(error ? null : deployment.network);

  const [dirty, setDirty] = useState(_dirty);

  const [working, setWorking] = useState(false);
  const [outputs, setOutputs] = useState<OutputItemProps[]>([]);
  const [providerId, setProviderId] = useState<string>(null);
  const [contractId, setContractId] = useState<string>(null);

  useEffect(() => {
    toolbarContext.addButton("back", "Back", <Back />, () => onBack());

    return () => {
      toolbarContext.removeButton("back");
    };
  }, []);

  useEffect(() => {
    task("provider & contract", async () => {
      if (error) return;
      const providerId = uuid();
      const uri = await createProvider(providerId, async ({ connected }) => {
        WalletConnectQRCodeModal.close();
        const contractId = uuid();
        await createContract(contractId, providerId, contractAddress, abi);
        setProviderId(providerId);
        setContractId(contractId);
      });
      WalletConnectQRCodeModal.open(uri, () => {});
    })();
  }, []);

  const onBack = () =>
    navigate("/factory", { state: { projectDir, instance, id, dirty } });

  const onCopy = () =>
    navigator.clipboard.writeText(deployment.contractAddress);

  const addOutput = (output: {
    title: string;
    text: string;
    isCopiable: boolean;
  }) => {
    setOutputs((prevOutputs) => [...prevOutputs, output]);
  };

  const increaseDropNumber = async () => {
    const newDeployment: Deployment = {
      ...deployment,
      dropNumber: deployment.dropNumber + 1,
    };

    await writeProjectInstance(projectDir, {
      ...instance,
      deployment: newDeployment,
    });

    setDeployment(newDeployment);
  };

  return (
    <Grid
      UNSAFE_className="overflow-hidden"
      areas={["left right"]}
      columns={["2fr", "1fr"]}
      rows={["auto"]}
      height="100%"
      gap="size-100"
      margin="size-100"
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
          <View
            UNSAFE_className="p-2 space-y-2"
            gridArea="left"
            overflow="auto"
          >
            <Grid columns={repeat("auto-fit", "300px")} gap="size-100">
              {configuration.contractType === "721" ? (
                <Panel721
                  {...{
                    deployment,
                    id,
                    providerId,
                    contractId,
                    setWorking,
                    addOutput,
                    increaseDropNumber,
                  }}
                />
              ) : configuration.contractType === "721_reveal_pause" ? (
                <Panel721_reveal_pause
                  {...{
                    deployment,
                    id,
                    providerId,
                    contractId,
                    setWorking,
                    addOutput,
                    increaseDropNumber,
                  }}
                />
              ) : null}
            </Grid>
          </View>

          <View
            UNSAFE_className="p-2 space-y-2"
            gridArea="right"
            overflow="auto"
          >
            <Flex
              zIndex={1001}
              position="sticky"
              top={0}
              gap="size-100"
              alignItems="center"
            >
              <Heading level={1}>
                {chopAddress(contractAddress)} at {network}
              </Heading>
              <ActionButton onPress={onCopy}>
                <Copy />
              </ActionButton>
            </Flex>

            <View
              padding="size-100"
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

            <Flex
              zIndex={1001}
              position="sticky"
              bottom={0}
              direction="row-reverse"
            >
              <ProgressBar
                UNSAFE_className={working ? "opacity-100" : "opacity-0"}
                label="Loading…"
                isIndeterminate
              />
            </Flex>
          </View>
        </>
      )}
    </Grid>
  );
}
