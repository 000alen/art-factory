import {
  ActionButton,
  Flex,
  Heading,
  ActionGroup,
  Item,
} from "@adobe/react-spectrum";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Back from "@spectrum-icons/workflow/Back";
import Forward from "@spectrum-icons/workflow/Forward";
import FastForward from "@spectrum-icons/workflow/FastForward";
import { factoryGetImage } from "../ipc";
import { SocketContext } from "../components/SocketContext";
import { DialogContext } from "../App";
import { ImageItem } from "../components/ImageItem";

export function QualityPage() {
  const dialogContext = useContext(DialogContext);
  const socket = useContext(SocketContext);
  const navigator = useNavigate();
  const { state } = useLocation();
  const { id, attributes, inputDir, outputDir, configuration } = state;

  const [index, setIndex] = useState(0);
  const [imagesUrls, setImagesUrls] = useState([]);

  useEffect(() => {
    Promise.all(
      [...Array(25).keys()].map(async (i) => {
        if (index + i >= attributes.length) return null;
        const buffer = await factoryGetImage(id, index + i);
        const url = URL.createObjectURL(
          new Blob([buffer], { type: "image/jpeg" })
        );
        return url;
      })
    )
      .then((urls) => {
        setImagesUrls(urls.filter((url) => url !== null));
      })
      .catch((error) => {
        console.log(error);
        dialogContext.setDialog("Error", error.message, null, true);
      });
  }, [index]);

  const onBack = () => {
    setIndex((prevIndex) => Math.max(prevIndex - 25, 0));
  };

  const onForward = () => {
    if (index < attributes.length - 25) setIndex((prevIndex) => prevIndex + 25);
  };

  const onFastForward = () => {
    navigator("/deploy", {
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
    // ! TODO: What if there's  no UXP connection?
    socket.emit("host-edit", {
      name: `EDIT-${i}`,
      traits: attributes[i],
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

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      justifyContent="space-between"
    >
      <Heading level={1} marginStart={16}>
        {Math.floor(index / 25) + 1} of {Math.ceil(attributes.length / 25)}
      </Heading>

      <div className="grid grid-cols-5 grid-rows-5 place-content-center place-self-center gap-5">
        {imagesUrls.map((url, i) => {
          return <ImageItem key={i} src={url} onEdit={() => onEdit(i)} />;
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
