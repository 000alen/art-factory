/* global fabric */
/* eslint no-undef: "error" */

import React from "react";
import {
  Dialog,
  Content,
  ButtonGroup,
  Button,
  Flex,
} from "@adobe/react-spectrum";
import { FabricJSCanvas, useFabricJSEditor } from "fabricjs-react";
import { factoryGetTraitImage } from "../ipc";
import { Trait } from "../typings";

export const loadImage = (url: string) =>
  new Promise((resolve, reject) => {
    // @ts-ignore
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
  traits,
}: {
  id: string;
  configuration: any;
  onHide: () => void;
  onSave: (i: number, dataURL: string) => void;
  i: number;
  traits: Trait[];
}) {
  const { editor, onReady } = useFabricJSEditor();

  const onLoad = (canvas: any) => {
    Promise.all(
      traits.map(async (trait) => {
        const buffer = await factoryGetTraitImage(id, trait, 500); // ! TODO
        // @ts-ignore
        return URL.createObjectURL(new Blob([buffer], { type: "image/png" }));
      })
    )
      .then((urls) => Promise.all(urls.map(loadImage)))
      .then((images) => {
        images.forEach((image) => {
          // @ts-ignore
          image.perPixelTargetFind = true;
          // @ts-ignore
          image.targetFindTolerance = 4;
          // @ts-ignore
          image.hasControls = false;
          // @ts-ignore
          image.hasBorders = false;
          canvas.add(image);
        });
      })
      .catch((err) => {
        console.error(i, traits, err);
      });
  };

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
              className={`w-full h-full border-2 border-solid border-white rounded`}
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
}
