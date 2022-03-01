import React, { useContext } from "react";
import {
  Flex,
  TextField,
  Switch,
  NumberField,
  ActionButton,
} from "@adobe/react-spectrum";
import FolderOpen from "@spectrum-icons/workflow/FolderOpen";
import { showOpenDialog } from "../ipc";
import { GenericDialogContext } from "./GenericDialog";

export function Configuration721({
  cost,
  setCost,
  maxMintAmount,
  setMaxMintAmount,
  revealed,
  setRevealed,
  notRevealedFilePath,
  setNotRevealedFilePath,
}) {
  const genericDialogContext = useContext(GenericDialogContext);

  const onOpenNotRevealedFile = async () => {
    let setNotRevealedFilePath;

    // ! TODO: proper error handling
    try {
      const { canceled, filePaths } = await showOpenDialog({
        properties: ["openFile"],
        filters: [
          {
            name: "Not Revealed File",
            extensions: ["png"],
          },
        ],
      });

      if (canceled) return;

      setNotRevealedFilePath = filePaths[0];
    } catch (error) {
      genericDialogContext.show("Error", error.message, null);
      return;
    }
    setNotRevealedFilePath(setNotRevealedFilePath);
  };

  return (
    <Flex direction="column">
      <TextField label="Cost" value={cost} onChange={setCost} />
      <NumberField
        label="Max Mint Amount"
        value={maxMintAmount}
        onChange={setMaxMintAmount}
      />

      <Switch margin="size-10" isSelected={revealed} onChange={setRevealed}>
        Revealed?
      </Switch>

      <Flex gap="size-100" justifyContent="space-between" alignItems="end">
        <TextField
          label="Not Revealed File"
          value={notRevealedFilePath}
          onChange={setNotRevealedFilePath}
          isReadOnly={true}
          isDisabled={revealed}
        />
        <ActionButton isDisabled={revealed} onPress={onOpenNotRevealedFile}>
          <FolderOpen />
        </ActionButton>
      </Flex>
    </Flex>
  );
}
