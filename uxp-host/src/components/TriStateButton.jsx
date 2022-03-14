import React from "react";
import { Flex, ProgressBar, ButtonGroup, Button } from "@adobe/react-spectrum";

export function TriStateButton({
  preLabel,
  preAction,

  loadingLabel,
  loadingMaxValue,
  loadingValue,
  loading,
  loadingDone,

  postLabel,
  postAction,
}) {
  return loading ? (
    <Flex marginBottom={8} marginX={8} justifyContent="end">
      <ProgressBar
        label={loadingLabel}
        {...(loadingMaxValue
          ? {
              maxValue: loadingMaxValue,
              value: loadingValue,
            }
          : {
              isIndeterminate: true,
            })}
      />
    </Flex>
  ) : (
    <ButtonGroup align="end" marginBottom={8} marginEnd={8}>
      {loadingDone ? (
        <Button variant="cta" onPress={preAction}>
          {preLabel}
        </Button>
      ) : (
        <Button variant="cta" onPress={postAction}>
          {postLabel}
        </Button>
      )}
    </ButtonGroup>
  );
}
