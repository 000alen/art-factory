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
        <Flex gap="size-500" justifyContent="center" width="100%">
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
                <TextField placeholder="Address" width="100%"/>
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

                <TextField label="Owner address" width="100%"/>

                <label className="spectrum-FieldLabel spectrum-FieldLabel--sizeS"> Index </label>

                <Flex justifyContent="space-between">
                  <NumberField value={0} marginX="size-10"/>
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
                <Text> Token URI </Text>

                <label className="spectrum-FieldLabel spectrum-FieldLabel--sizeS"> Token index </label>
                <Flex justifyContent="space-between">
                  <NumberField />
                    <ActionButton>
                      <Play />
                    </ActionButton>
                </Flex>
              </Flex>
            </View>
          </Flex>

          <Flex direction="column" gap="size-100">
            {/*
              mint <
              reveal < 
              setCost
              setmaxMintAmount
              withdrawal
            */}

            <View
              borderWidth="thin"
              borderColor="dark"
              borderRadius="medium"
              padding="size-100"
            >
              <Flex direction="column">
                <Text> Mint </Text>

                <TextField label="Payable amount" width="100%"/>

                <label className="spectrum-FieldLabel spectrum-FieldLabel--sizeS"> Mint amount </label>
                <Flex justifyContent="space-between">
                  <NumberField />
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
                  <Text>Set cost</Text>
                  <ActionButton>
                    <Play />
                  </ActionButton>
                </Flex>
                <NumberField width="100%" value={0} placeholder="Address" />
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
                  <Text>Set max mint amount</Text>
                  <ActionButton>
                    <Play />
                  </ActionButton>
                </Flex>
                <NumberField width="100%" value={0} placeholder="Address" />
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
                  <Text>Withdrawal</Text>
                  <ActionButton>
                    <Play />
                  </ActionButton>
                </Flex>
                <NumberField width="100%" value={0} placeholder="Address" />
              </Flex>
            </View>
            
            <View
              borderWidth="thin"
              borderColor="dark"
              borderRadius="medium"
              padding="size-100"
            >
              <Flex direction="column" gap="size-100">
                  <Text>Reveal</Text>
                  <ActionButton>
                    <Play />
                  </ActionButton>
                </Flex>
            </View>

          </Flex>

          <View>
            <Text>Outputs</Text>
            <View
              borderWidth="thin"
              borderColor="dark"
              borderRadius="medium"
              padding="size-100"
              width="30vw" overflow="auto" height="65vh"
            >
              <Flex direction="column" gap="size-100">
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>
                <Text> Hola </Text>

              </Flex>
            </View>
          </View>
        </Flex>


      </Flex>

      <Flex marginBottom={8} marginX={8} justifyContent="end">
        <ProgressBar label="Loading…" isIndeterminate />
      </Flex>
    </Flex>
  );
}
