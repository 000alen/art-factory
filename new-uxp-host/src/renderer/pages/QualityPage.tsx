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
import {
  factoryGetImage,
  factoryRemoveCollectionItems,
  factoryRewriteImage,
} from "../ipc";
import { EditorDialog } from "../components/EditorDialog";
import { GenericDialogContext } from "../components/GenericDialog";
import { UXPContext } from "../components/UXPContext";
import { ToolbarContext } from "../components/Toolbar";
import Close from "@spectrum-icons/workflow/Close";
import { Collection, CollectionItem, Configuration } from "../typings";
import { useErrorHandler } from "../components/ErrorHandler";
import { ImageItem } from "../components/ImageItem";

interface QualityPageState {
  id: string;
  collection: Collection;
  inputDir: string;
  outputDir: string;
  photoshopId: string;
  photoshop: boolean;
  configuration: Partial<Configuration>;
}

export function QualityPage() {
  const genericDialogContext = useContext(GenericDialogContext);
  const toolbarContext = useContext(ToolbarContext);
  const uxpContext = useContext(UXPContext);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { task } = useErrorHandler(genericDialogContext);

  const {
    id,
    collection,
    inputDir,
    outputDir,
    photoshopId,
    photoshop,
    configuration,
  } = state as QualityPageState;

  const [index, setIndex] = useState(0);
  const [imagesUrls, setImagesUrls] = useState([]);
  const [editorShown, setEditorShown] = useState(false);
  const [editorI, setEditorI] = useState(null);
  const [collectionItem, setCollectionItem] = useState(null);
  const [indexesToRemove, setIndexesToRemove] = useState([]);

  useEffect(() => {
    const uxpReload = async ({
      photoshopId,
      name,
    }: {
      photoshopId: string;
      name: string;
    }) => {
      const i = Number(name) - index - 1;
      const buffer = await factoryGetImage(id, collection[index + i], 500);
      const url = URL.createObjectURL(
        new Blob([buffer as BlobPart], { type: "image/png" })
      );

      setImagesUrls((prevUrls) =>
        prevUrls.map(([u, j]) => (j === i ? [url, i] : [u, j]))
      );
    };

    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));
    uxpContext.on("uxp-reload", uxpReload);

    task("loading previews", async () => {
      const urls = (
        await Promise.all(
          Array.from({ length: 25 }).map(async (_, i) => {
            if (index + i >= collection.length) return null;
            const buffer = await factoryGetImage(
              id,
              collection[index + i],
              500
            );
            const url = URL.createObjectURL(
              new Blob([buffer as BlobPart], { type: "image/png" })
            );
            return url;
          })
        )
      ).filter((url) => url !== null);
      setImagesUrls(urls);
    })();

    return () => {
      toolbarContext.removeButton("close");
      uxpContext.off("uxp-reload", uxpReload);
    };
  }, [index, id]);

  const onShowEditor = () => {
    setEditorShown(true);
  };

  const onSetEditor = (
    i: number,
    collectionItem: CollectionItem,
    show: boolean
  ) => {
    setEditorI(i);
    setCollectionItem(collectionItem);
    if (show) onShowEditor();
  };

  const onHideEditor = () => {
    setEditorShown(false);
  };

  const onEdit = (i: number) => {
    if (photoshop) {
      uxpContext.hostEdit({
        photoshopId,
        ...collection[i],
      });
    } else {
      onSetEditor(i, collection[i], true);
    }
  };

  const onSave = task("saving", async (i: number, dataURL: string) => {
    await factoryRewriteImage(id, collection[i], dataURL);
    setImagesUrls((prevUrls) => {
      const urls = [...prevUrls];
      urls[i % 25] = [dataURL, i];
      return urls;
    });
  });

  const onAction = (action: string) => {
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

  const onBack = () => {
    if (index === 0) return;
    setImagesUrls([]);
    setIndex((prevIndex) => Math.max(prevIndex - 25, 0));
  };

  const onForward = () => {
    if (index >= collection.length - 25) return;
    setImagesUrls([]);
    setIndex((prevIndex) => prevIndex + 25);
  };

  const onFastForward = task("filtering", async () => {
    const collectionItemsToRemove: Collection = indexesToRemove.map(
      (i) => collection[i]
    );
    const _collection = await factoryRemoveCollectionItems(
      id,
      collectionItemsToRemove
    );
    const _configuration = {
      ...configuration,
      n: _collection.length,
    };

    navigate("/deploy", {
      state: {
        id,
        inputDir,
        outputDir,
        collection: _collection,
        configuration: _configuration,
      },
    });
  });

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
          collectionItem={collectionItem}
        />
      </DialogTrigger>

      <Heading level={1} marginStart={16}>
        {Math.floor(index / 25) + 1} of {Math.ceil(collection.length / 25)}
      </Heading>

      <div className="grid grid-cols-5 grid-rows-5 place-content-center place-self-center gap-5 overflow-auto">
        {imagesUrls.map((url, i) =>
          indexesToRemove.includes(index + i) ? (
            <div className="w-32 h-32 m-auto rounded border-2 border-dashed border-white flex justify-center items-center">
              <Button
                variant="secondary"
                onPress={() =>
                  setIndexesToRemove(
                    indexesToRemove.filter((j) => j !== index + i)
                  )
                }
              >
                Undo
              </Button>
            </div>
          ) : (
            <ImageItem
              key={`${url.slice(10)}-${index + i}`}
              name={`${index + i + 1}`}
              src={url}
              actions={[
                {
                  label: "Edit",
                  onClick: () => onEdit(index + i),
                },
                {
                  label: "Remove",
                  onClick: () =>
                    setIndexesToRemove((prev) => [...prev, index + i]),
                },
              ]}
            />
          )
        )}
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
