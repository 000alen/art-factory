import { ActionButton, Flex, Text } from "@adobe/react-spectrum";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Back from "@spectrum-icons/workflow/Back";
import Forward from "@spectrum-icons/workflow/Forward";
import FastForward from "@spectrum-icons/workflow/FastForward";
import { factoryGetImage } from "../ipcRenderer";

export function QualityPage() {
  const navigator = useNavigate();
  const { state } = useLocation();
  const { id, attributes, inputDir, outputDir, configuration } = state;

  const [index, setIndex] = useState(0);
  const [imagesUrls, setImagesUrls] = useState(null);
  const [toReview, setToReview] = useState([]);

  useEffect(() => {
    Promise.all(
      [...Array(9).keys()].map(async (i) => {
        if (index + i >= attributes.length) return;

        const buffer = await factoryGetImage(id, index + i);
        const url = URL.createObjectURL(
          new Blob([buffer], { type: "image/jpeg" })
        );
        return url;
      })
    ).then((urls) => {
      setImagesUrls(urls);
    });
  }, [index]);

  const onClickBack = () => {
    setIndex((prevIndex) => Math.max(prevIndex - 9, 0));
  };

  const onClickForward = () => {
    if (index < attributes.length - 9) setIndex((prevIndex) => prevIndex + 9);
  };

  const addToReview = (i) => {
    if (toReview.includes(i)) {
      setToReview((prevToReview) => prevToReview.filter((j) => j !== i));
    } else {
      setToReview((prevToReview) => [...prevToReview, i]);
    }
  };

  const onClickFastForward = () => {
    navigator("/review", {
      state: {
        id,
        toReview,
        attributes,
        inputDir,
        outputDir,
        configuration,
      },
    });
  };

  return (
    <Flex
      direction="column"
      height="100vh"
      alignItems="center"
      justifyContent="center"
    >
      <Text>
        Slide {Math.floor(index / 9) + 1} of {Math.ceil(attributes.length / 9)}
      </Text>
      <div className="grid grid-cols-3 grid-rows-3 place-items-center m-5 gap-5">
        {imagesUrls &&
          imagesUrls.map((url, i) => {
            return url ? (
              <div
                key={i}
                className={`w-32 h-32 border-2 border-solid rounded-md ${
                  toReview.includes(index + i)
                    ? "border-red-500"
                    : "border-white hover:border-red-500"
                }  hover:cursor-pointer`}
                onClick={() => addToReview(index + i)}
              >
                <img
                  className={`w-full h-full ${
                    toReview.includes(index + i)
                      ? "opacity-50"
                      : "hover:opacity-50"
                  }`}
                  src={url}
                  alt="image"
                />
              </div>
            ) : (
              <></>
            );
          })}
      </div>
      <Flex gap="size-100">
        <ActionButton onPress={onClickBack}>
          <Back />
        </ActionButton>
        <ActionButton onPress={onClickForward}>
          <Forward />
        </ActionButton>
        <ActionButton onPress={onClickFastForward}>
          <FastForward />
        </ActionButton>
      </Flex>
    </Flex>
  );
}
