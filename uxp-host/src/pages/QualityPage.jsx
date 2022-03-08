import {
  Flex,
  Heading,
  ActionGroup,
  DialogTrigger,
  Item,
  Button,
} from "@adobe/react-spectrum";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Back from "@spectrum-icons/workflow/Back";
import Forward from "@spectrum-icons/workflow/Forward";
import FastForward from "@spectrum-icons/workflow/FastForward";
import { factoryGetImage, factoryRewriteImage } from "../ipc";
import { EditorDialog } from "../components/EditorDialog";
import { GenericDialogContext } from "../components/GenericDialog";
import { UXPContext } from "../components/UXPContext";
import { ToolbarContext } from "../components/Toolbar";
import Close from "@spectrum-icons/workflow/Close";

export function _ImageItem({ src, onEdit }) {
  return (
    <div className="relative w-32 h-32 m-auto rounded">
      {onEdit && (
        <div className="absolute w-full h-full bg-gray-600 bg-opacity-75 flex justify-center items-center opacity-0 hover:opacity-100">
          <Button onPress={onEdit}>Edit</Button>
        </div>
      )}

      <img
        className="w-full h-full select-none rounded"
        draggable="false"
        src={src}
        alt=""
      />
    </div>
  );
}

export function QualityPage() {
  const genericDialogContext = useContext(GenericDialogContext);
  const toolbarContext = useContext(ToolbarContext);
  const uxpContext = useContext(UXPContext);
  const navigate = useNavigate();
  const { state } = useLocation();

  const {
    id,
    attributes,
    inputDir,
    outputDir,
    photoshopId,
    photoshop,
    configuration,
  } = state;

  const [index, setIndex] = useState(0);
  const [imagesUrls, setImagesUrls] = useState([]);
  const [editorShown, setEditorShown] = useState(false);
  const [editorI, setEditorI] = useState(null);
  const [editorAttributes, setEditorAttributes] = useState(null);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));

    Array.from({ length: 25 })
      .map((_, i) =>
        (async () => {
          if (index + i >= attributes.length) return null;
          const buffer = await factoryGetImage(id, index + i, 500);
          const url = URL.createObjectURL(
            new Blob([buffer], { type: "image/png" })
          );
          return url;
        })()
      )
      .forEach((f, i) =>
        f.then((url) => {
          if (url) setImagesUrls((imagesUrls) => [...imagesUrls, [url, i]]);
        })
      );

    const uxpReload = async ({ photoshopId, name }) => {
      const i = Number(name) - index - 1;
      const buffer = await factoryGetImage(id, index + i, 500);
      const url = URL.createObjectURL(
        new Blob([buffer], { type: "image/png" })
      );

      setImagesUrls((prevUrls) =>
        prevUrls.map(([u, j]) => (j === i ? [url, i] : [u, j]))
      );
    };

    uxpContext.on("uxp-reload", uxpReload);

    return () => {
      toolbarContext.removeButton("close");
      uxpContext.off("uxp-reload", uxpReload);
    };
  }, [index, attributes.length, genericDialogContext, id]);

  const onBack = () => {
    if (index === 0) return;
    setImagesUrls([]);
    setIndex((prevIndex) => Math.max(prevIndex - 25, 0));
  };

  const onForward = () => {
    if (index >= attributes.length - 25) return;
    setImagesUrls([]);
    setIndex((prevIndex) => prevIndex + 25);
  };

  const onFastForward = () => {
    navigate("/deploy", {
      state: {
        id,
        attributes,
        inputDir,
        outputDir,
        configuration,
      },
    });
  };

  const onEdit = (i) => {
    if (photoshop) {
      uxpContext.hostEdit({
        photoshopId,
        name: (i + index + 1).toString(),
        traits: attributes[i],
      });
    } else {
      onSetEditor(i, attributes[i], true);
    }
  };

  const onSave = async (i, dataURL) => {
    await factoryRewriteImage(id, i, dataURL);
    setImagesUrls((prevUrls) => {
      const urls = [...prevUrls];
      urls[i % 25] = [dataURL, i];
      return urls;
    });
  };

  const onAction = (action) => {
    switch (action) {
      case "back":
        onBack();
        break;
      case "forward":
        onForward();
        break;
      case "fastForward":
        onFastForward();
        break;
      default:
        break;
    }
  };

  const onShowEditor = () => {
    setEditorShown(true);
  };

  const onSetEditor = (i, attributes, show) => {
    setEditorI(i);
    setEditorAttributes(attributes);
    if (show) onShowEditor(show);
  };

  const onHideEditor = () => {
    setEditorShown(false);
  };

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      justifyContent="space-between"
    >
      <DialogTrigger isOpen={editorShown}>
        {null}
        <EditorDialog
          id={id}
          configuration={configuration}
          onHide={onHideEditor}
          onSave={onSave}
          i={editorI}
          attributes={editorAttributes}
        />
      </DialogTrigger>

      <Heading level={1} marginStart={16}>
        {Math.floor(index / 25) + 1} of {Math.ceil(attributes.length / 25)}
      </Heading>

      <div className="grid grid-cols-5 grid-rows-5 place-content-center place-self-center gap-5 overflow-auto">
        {imagesUrls.map(([url, _i]) => {
          return (
            <_ImageItem key={_i} src={url} onEdit={() => onEdit(index + _i)} />
          );
        })}
      </div>

      <Flex direction="row-reverse">
        <ActionGroup onAction={onAction}>
          <Item key="back">
            <Back />
          </Item>
          <Item key="forward">
            <Forward />
          </Item>
          <Item key="fastForward">
            <FastForward />
          </Item>
        </ActionGroup>
      </Flex>
    </Flex>
  );
}
