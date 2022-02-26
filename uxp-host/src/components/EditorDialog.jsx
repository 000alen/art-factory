import React from "react";
import {
  Dialog,
  Content,
  ButtonGroup,
  Button,
  Flex,
} from "@adobe/react-spectrum";
import { FabricJSCanvas, useFabricJSEditor } from "fabricjs-react";
import { fabric } from "fabric";
import { factoryGetTraitImage } from "../ipc";

export const loadImage = (url) =>
  new Promise((resolve, reject) => {
    fabric.Image.fromURL(url, (image) => {
      resolve(image);
    });
  });

export function EditorDialog({
  id,
  configuration,
  onHide,
  onSave,
  i,
  attributes,
}) {
  const { editor, onReady } = useFabricJSEditor();

  const onLoad = (canvas) => {
    Promise.all(
      attributes.map(async (trait) => {
        const buffer = await factoryGetTraitImage(id, trait);
        return URL.createObjectURL(new Blob([buffer], { type: "image/png" }));
      })
    )
      .then((urls) => Promise.all(urls.map(loadImage)))
      .then((images) => {
        images.forEach((image) => {
          image.perPixelTargetFind = true;
          image.targetFindTolerance = 4;
          image.hasControls = false;
          image.hasBorders = false;
          canvas.add(image);
        });
      });
  };

  const _onReady = (canvas) => {
    onReady(canvas);
    onLoad(canvas);
  };

  const _onSave = async () => {
    await onSave(i, editor.canvas.toDataURL());
    onHide();
  };

  // ! TODO: UN-hardcode width and height
  return (
    <Dialog>
      <Content>
        <Flex justifyContent="center">
          <div style={{ width: 500, height: 500 }}>
            <FabricJSCanvas
              className={`w-full h-full border-2 border-solid border-white rounded`}
              onReady={_onReady}
            />
          </div>
        </Flex>
      </Content>

      <ButtonGroup>
        <Button onPress={onHide}>Close</Button>
        <Button variant="cta" onPress={_onSave}>
          Save
        </Button>
      </ButtonGroup>
    </Dialog>
  );
}
