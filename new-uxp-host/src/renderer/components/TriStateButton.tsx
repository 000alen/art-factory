import React from "react";
import { Flex, ProgressBar, ButtonGroup, Button } from "@adobe/react-spectrum";

interface TriStateButtonProps {
  preLabel: string;
  preAction: () => void;

  loadingLabel: string;
  loadingMaxValue?: number;
  loadingValue?: number;
  loading: boolean;
  loadingDone: boolean;

  postLabel: string;
  postAction: () => void;
}

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
}: TriStateButtonProps) {
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
        <Button variant="cta" onPress={postAction}>
          {postLabel}
        </Button>
      ) : (
        <Button variant="cta" onPress={preAction}>
          {preLabel}
        </Button>
      )}
    </ButtonGroup>
  );
}
