import React from "react";
import { Flex, Heading, Button, ButtonGroup } from "@adobe/react-spectrum";
import { useNavigate } from "react-router-dom";
import { useErrorHandler } from "../components/ErrorHandler";
import { newProject, openProject } from "../commands";
import { AAA } from "../ipc";
import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";

export function HomePage() {
  const task = useErrorHandler();
  const navigate = useNavigate();

  const onNew = task("new", async () => {
    const { projectDir, instance, id } = await newProject();

    navigate("/factory", {
      state: {
        projectDir,
        instance,
        id,
      },
    });
  });

  const onOpen = task("open", async () => {
    const { projectDir, instance, id } = await openProject();

    navigate("/factory", {
      state: {
        projectDir,
        instance,
        id,
      },
    });
  });

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      alignItems="center"
      justifyContent="center"
    >
      <Heading level={1}>Welcome to the Art Factory!</Heading>

      <ButtonGroup>
        <Button variant="cta" onPress={onNew}>
          New
        </Button>

        <Button variant="secondary" onPress={onOpen}>
          Open
        </Button>

        <Button
          variant="secondary"
          onPress={async () => {
            const uri = await AAA();

            WalletConnectQRCodeModal.open(uri, () => {
              console.log("QR Code Modal closed");
            });
          }}
        >
          AAA
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
