import {
  ActionButton,
  Flex,
  Text,
  Button,
  ButtonGroup,
} from "@adobe/react-spectrum";
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Back from "@spectrum-icons/workflow/Back";
import Forward from "@spectrum-icons/workflow/Forward";
import FastForward from "@spectrum-icons/workflow/FastForward";
import { factoryGetImage } from "../ipc";
import { SocketContext } from "../components/SocketContext";
import { DialogContext } from "../App";

const Item = ({ src, onEdit }) => {
  return (
    <div className="relative w-32 h-32 rounded-md">
      <div className="absolute w-full h-full bg-gray-600 bg-opacity-75 flex justify-center items-center opacity-0 hover:opacity-100">
        <Button onPress={onEdit}>Edit</Button>
      </div>

      <img className="w-full h-full" src={src} alt="" />
    </div>
  );
};

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
      [...Array(9).keys()].map(async (i) => {
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

  const onClickBack = () => {
    setIndex((prevIndex) => Math.max(prevIndex - 9, 0));
  };

  const onClickForward = () => {
    if (index < attributes.length - 9) setIndex((prevIndex) => prevIndex + 9);
  };

  const onClickFastForward = () => {
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

  const onClickEdit = (i) => {
    socket.emit("host-edit", {
      name: `EDIT-${i}`,
      traits: attributes[i],
    });
  };

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      alignItems="center"
      justifyContent="center"
    >
      <Text marginBottom={8}>
        {Math.floor(index / 9) + 1} of {Math.ceil(attributes.length / 9)}
      </Text>
      <div className="grid grid-cols-3 grid-rows-3 place-items-center gap-5">
        {imagesUrls.map((url, i) => {
          return <Item key={i} src={url} onEdit={() => onClickEdit(i)} />;
        })}
      </div>
      <ButtonGroup>
        <ActionButton onPress={onClickBack}>
          <Back />
        </ActionButton>
        <ActionButton onPress={onClickForward}>
          <Forward />
        </ActionButton>
        <ActionButton onPress={onClickFastForward}>
          <FastForward />
        </ActionButton>
      </ButtonGroup>
    </Flex>
  );
}
