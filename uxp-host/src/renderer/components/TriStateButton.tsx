import React from "react";

import {
  Button,
  ButtonGroup,
  Content,
  ContextualHelp,
  Flex,
  Heading,
  ProgressBar,
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

  postLabel: string;
  postAction: () => void;
  postDisabled?: boolean;
  postTooltip?: boolean;
  postTooltipHeading?: string;
  postTooltipText?: string;
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

  postLabel,
  postAction,
  postDisabled,

  postTooltip,
  postTooltipHeading,
  postTooltipText,
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
          {postTooltip && (
            <ContextualHelp variant="info" defaultOpen>
              <Heading>{postTooltipHeading}</Heading>
              <Content>
                <Flex direction="column" gap="size-100">
                  <Text>{postTooltipText}</Text>
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
