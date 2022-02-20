import React from "react";
import {
  Flex,
  Heading,
  TextField,
  NumberField,
  Button,
  ProgressBar,
  View,
  Text,
  Checkbox,
  ActionButton,
  Well,
} from "@adobe/react-spectrum";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import Play from "@spectrum-icons/workflow/Play";

export function InstancePage() {
  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      justifyContent="space-between"
    >
      <Heading level={1} marginStart={16}>
        Instance
      </Heading>

      <Flex
        direction="row"
        height="100%"
        gap="size-100"
        justifyContent="space-between"
      >
        <Flex>
          <Flex direction="column" gap="size-100">
            <View
              borderWidth="thin"
              borderColor="dark"
              borderRadius="medium"
              padding="size-100"
            >
              <Flex direction="column" gap="size-100">
                <Flex alignItems="center" justifyContent="space-between">
                  <Text>Balance of</Text>
                  <ActionButton>
                    <Play />
                  </ActionButton>
                </Flex>
                <TextField placeholder="Address" />
              </Flex>
            </View>

            <View
              borderWidth="thin"
              borderColor="dark"
              borderRadius="medium"
              padding="size-100"
            >
              <Flex direction="column" gap="size-100">
                <Flex alignItems="center" justifyContent="space-between">
                  <Text>Cost</Text>
                  <ActionButton>
                    <Play />
                  </ActionButton>
                </Flex>
              </Flex>
            </View>

            <View
              borderWidth="thin"
              borderColor="dark"
              borderRadius="medium"
              padding="size-100"
            >
              <Flex direction="column" gap="size-100">
                <Flex alignItems="center" justifyContent="space-between">
                  <Checkbox isSelected={true} isReadOnly={true}>
                    Revealed
                  </Checkbox>
                  <ActionButton>
                    <Play />
                  </ActionButton>
                </Flex>
              </Flex>
            </View>

            <View
              borderWidth="thin"
              borderColor="dark"
              borderRadius="medium"
              padding="size-100"
            >
              <Flex direction="column">
                <Text> Token of owner by index </Text>
                <TextField label="Owner address" />
                <NumberField label="Index" />
              </Flex>
            </View>

            <NumberField label="Token URI" />
          </Flex>

          <Flex direction="column" gap="size-100">
            <View
              borderWidth="thin"
              borderColor="dark"
              borderRadius="medium"
              padding="size-100"
            >
              <Flex direction="column" gap="size-100">
                <Flex alignItems="center" justifyContent="space-between">
                  <Text>Balance of</Text>
                  <ActionButton>
                    <Play />
                  </ActionButton>
                </Flex>
                <TextField placeholder="Address" />
              </Flex>
            </View>
          </Flex>
        </Flex>

        <View overflow="auto">
          <Text>
            LOREM IPSUM <br />
            LOREM IPSUM <br />
            LOREM IPSUM <br />
          </Text>
        </View>
      </Flex>

      <Flex marginBottom={8} marginX={8} justifyContent="end">
        <ProgressBar label="Loading…" isIndeterminate />
      </Flex>
    </Flex>
  );
}
