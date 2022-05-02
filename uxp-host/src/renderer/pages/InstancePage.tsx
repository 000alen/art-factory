import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

import {
  ActionButton,
  Button,
  ButtonGroup,
  Flex,
  Grid,
  Heading,
  ProgressBar,
  repeat,
  View,
} from "@adobe/react-spectrum";
import Back from "@spectrum-icons/workflow/Back";
import Copy from "@spectrum-icons/workflow/Copy";
import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";

import { useErrorHandler } from "../components/ErrorHandler";
import { OutputItem, OutputItemProps } from "../components/OutputItem";
import { Panel721 } from "../components/Panel721";
import { Panel721_reveal_pause } from "../components/Panel721_reveal_pause";
import { TaskItem } from "../components/TaskItem";
import { useToolbar } from "../components/Toolbar";
import { createContract, createProvider, createProviderWithKey } from "../ipc";
import { Deployment, Instance } from "../typings";
import { chopAddress } from "../utils";
import { save } from "../commands";

interface InstancePageState {
  projectDir: string;
  id: string;
  instance: Instance;
  dirty: boolean;
}

export function InstancePage() {
  useToolbar([
    {
      key: "back",
      label: "Back",
      icon: <Back />,
      onClick: () => onBack(),
    },
  ]);

  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    projectDir,
    id,
    instance,
    dirty: _dirty,
  } = state as InstancePageState;
  const { configuration, deployment: _deployment } = instance;

  const [deployment, setDeployment] = useState(_deployment);
  const [error] = useState(!deployment);

  const [contractAddress] = useState(error ? null : deployment.contractAddress);
  const [abi] = useState(error ? null : deployment.abi);
  const [network] = useState(error ? null : deployment.network);

  // const [dirty, setDirty] = useState(_dirty);
  const [dirty] = useState(_dirty);

  const [working, setWorking] = useState(false);
  const [outputs, setOutputs] = useState<OutputItemProps[]>([]);
  const [providerId, setProviderId] = useState<string>(null);
  const [contractId, setContractId] = useState<string>(null);
  const [providerEngineId, setProviderEngineId] = useState<string>(null);

  useEffect(() => {
    task("provider & contract", async () => {
      if (error) return;
      const providerId = uuid();
      const contractId = uuid();

      const uri = await createProvider(
        providerId,
        network,
        async ({ connected }) => {
          WalletConnectQRCodeModal.close();

          if (!connected) throw Error("Could not connect");

          await createContract(contractId, providerId, contractAddress, abi);
          setProviderId(providerId);
          setContractId(contractId);
        }
      );
      WalletConnectQRCodeModal.open(uri, () => {});
    })();
  }, []);

  const onBack = () =>
    navigate("/factory", { state: { projectDir, id, instance, dirty } });

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

    await save(projectDir, {
      ...instance,
      deployment: newDeployment,
    });

    setDeployment(newDeployment);
  };

  const onConnect = task("connect", async () => {
    const providerId = uuid();
    const contractId = uuid();

    const uri = await createProvider(
      providerId,
      network,
      async ({ connected }) => {
        WalletConnectQRCodeModal.close();

        if (!connected) throw Error("Could not connect");

        await createContract(contractId, providerId, contractAddress, abi);
        setProviderId(providerId);
        setContractId(contractId);
      }
    );
    WalletConnectQRCodeModal.open(uri, () => {});
  });

  const onConnectWithPrivateKey = task(
    "connect with private key",
    async ({ privateKey }) => {
      const providerEngineId = uuid();
      await createProviderWithKey(
        providerEngineId,
        privateKey,
        deployment.network
      );
      setProviderEngineId(providerEngineId);
    }
  );

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
              <TaskItem name="Connect" onRun={onConnect} />

              <TaskItem
                name="Connect with private key"
                fields={[
                  {
                    key: "privateKey",
                    type: "password",
                    label: "Private key",
                    initial: "",
                    value: "",
                  },
                ]}
                onRun={onConnectWithPrivateKey}
              />

              {configuration.contractType === "721" ? (
                <Panel721
                  {...{
                    deployment,
                    id,
                    providerId,
                    contractId,
                    providerEngineId,
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
                    providerEngineId,
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
