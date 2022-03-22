declare global {
  const fabric: any;
}

import React, { useContext } from "react";
import {
  Dialog,
  Content,
  ButtonGroup,
  Button,
  Flex,
} from "@adobe/react-spectrum";
import { FabricJSCanvas, useFabricJSEditor } from "fabricjs-react";
import { factoryGetTraitImage } from "../ipc";
import { CollectionItem, Trait } from "../typings";
import { GenericDialogContext } from "./GenericDialog";
import { useErrorHandler } from "./ErrorHandler";

interface EditorDialogProps {
  id: string;
  configuration: any;
  onHide: () => void;
  onSave: (i: number, dataURL: string) => void;
  i: number;
  collectionItem: CollectionItem;
}

export const loadImage = (url: string, canvas: any) =>
  new Promise((resolve) =>
    fabric.Image.fromURL(url, (image: any) => resolve(image))
  );

export const EditorDialog: React.FC<EditorDialogProps> = ({
  id,
  configuration,
  onHide,
  onSave,
  i,
  collectionItem,
}) => {
  const genericDialogContext = useContext(GenericDialogContext);
  const { task } = useErrorHandler(genericDialogContext);
  const { editor, onReady } = useFabricJSEditor();

  const onLoad = task("loading image", async (canvas: any) => {
    await Promise.all(
      collectionItem.traits.map(async (trait) => {
        const buffer = await factoryGetTraitImage(id, trait, 500);
        const url = URL.createObjectURL(
          new Blob([buffer as BlobPart], { type: "image/png" })
        );
        const image: any = await loadImage(url, canvas);
        image.perPixelTargetFind = true;
        image.targetFindTolerance = 4;
        image.hasControls = false;
        image.hasBorders = false;
        image.globalCompositeOperation =
          trait.blending === "normal"
            ? "source-over" // TODO: Check
            : trait.blending === "screen"
            ? "screen"
            : trait.blending === "multiply"
            ? "multiply"
            : trait.blending === "darken"
            ? "darken"
            : trait.blending === "overlay"
            ? "overlay"
            : "source-over";
        image.opacity = trait.opacity;
        canvas.add(image);
      })
    );
  });

  const _onReady = (canvas: any) => {
    onReady(canvas);
    onLoad(canvas);
  };

  const _onSave = async () => {
    await onSave(i, editor.canvas.toDataURL());
    onHide();
  };

  // ! TODO: Fixed size
  return (
    <Dialog>
      <Content>
        <Flex justifyContent="center">
          <div
            style={{ width: configuration.width, height: configuration.height }}
          >
            <FabricJSCanvas
              className="w-full h-full border-2 border-solid border-white rounded"
              onReady={_onReady}
            />
          </div>
        </Flex>
      </Content>

      <ButtonGroup>
        <Button variant="secondary" onPress={onHide}>
          Close
        </Button>
        <Button variant="cta" onPress={_onSave}>
          Save
        </Button>
      </ButtonGroup>
    </Dialog>
  );
};
