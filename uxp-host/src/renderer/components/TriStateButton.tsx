import React from "react";
import {
  Flex,
  ProgressBar,
  ButtonGroup,
  Button,
  ContextualHelp,
  Heading,
  Content,
  Text,
} from "@adobe/react-spectrum";

interface TriStateButtonProps {
  preLabel: string;
  preAction: () => void;
  preDisabled?: boolean;

  loadingLabel: string;
  loadingMaxValue?: number;
  loadingValue?: number;
  loading: boolean;
  loadingDone: boolean;
  loadingTime?: number;

  postLabel: string;
  postAction: () => void;
  postDisabled?: boolean;
}

export const TriStateButton: React.FC<TriStateButtonProps> = ({
  preLabel,
  preAction,
  preDisabled,

  loadingLabel,
  loadingMaxValue,
  loadingValue,
  loading,
  loadingDone,
  loadingTime,

  postLabel,
  postAction,
  postDisabled,
}) => {
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
        <Flex gap="size-100" alignItems="center">
          {loadingTime && (
            <ContextualHelp variant="info" defaultOpen>
              <Heading>Time elapsed</Heading>
              <Content>
                <Flex direction="column" gap="size-100">
                  <Text>{loadingTime} ms</Text>
                </Flex>
              </Content>
            </ContextualHelp>
          )}
          <Button
            variant="cta"
            onPress={postAction}
            isDisabled={!!postDisabled}
          >
            {postLabel}
          </Button>
        </Flex>
      ) : (
        <Button variant="cta" onPress={preAction} isDisabled={!!preDisabled}>
          {preLabel}
        </Button>
      )}
    </ButtonGroup>
  );
};
