import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@adobe/react-spectrum";

export function ReviewPage() {
  const navigator = useNavigate();
  const { state } = useLocation();
  const { id, toReview, attributes, inputDir, outputDir, configuration } =
    state;

  const onClickContinue = async () => {
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

  return (
    <>
      <Button variant="cta" onPress={onClickContinue}>
        Continue
      </Button>
    </>
  );
}
