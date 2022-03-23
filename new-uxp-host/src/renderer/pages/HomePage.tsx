import React, { useContext, useEffect } from "react";
import {
  Flex,
  Heading,
  Text,
  Button,
  ButtonGroup,
} from "@adobe/react-spectrum";
import { useNavigate } from "react-router-dom";
import { createFactory, getOutputDir } from "../ipc";
import { GenericDialogContext } from "../components/GenericDialog";
import {
  openDirectory,
  openInstance,
  resolvePathFromInstance,
} from "../actions";
import { useErrorHandler } from "../components/ErrorHandler";
import { UXPContext } from "../components/UXPContext";
import { v4 as uuid } from "uuid";

export function HomePage() {
  const navigate = useNavigate();
  const uxpContext = useContext(UXPContext);
  const task = useErrorHandler();

  useEffect(() => {
    const uxpGenerate = async ({
      photoshopId,
      inputDir,
      partialConfiguration,
    }: {
      photoshopId: string;
      inputDir: string;
      partialConfiguration: any;
    }) => {
      const outputDir = await getOutputDir(inputDir);

      navigate("/configuration", {
        state: {
          inputDir,
          outputDir,
          partialConfiguration,
          photoshopId,
          photoshop: true,
        },
      });
    };

    uxpContext.on("uxp-generate", uxpGenerate);
    return () => {
      uxpContext.off("uxp-generate", uxpGenerate);
    };
  }, []);

  const onOpenDirectory = task("open directory", async () => {
    const result = await openDirectory();

    if (result) {
      const { inputDir, outputDir, photoshopId, photoshop } = result;
      navigate("/configuration", {
        state: {
          inputDir,
          outputDir,
          photoshopId,
          photoshop,
        },
      });
    }
  });

  const onOpenInstance = task("open instance", async () => {
    const result = await openInstance();

    if (result) {
      const { id, instance } = result;

      const resolution = resolvePathFromInstance(id, instance);
      if (resolution) {
        const [path, state] = resolution as [string, any];
        navigate(path, { state });
      } else {
        throw new Error("Could not resolve path for given instance");
      }
    }
  });

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      alignItems="center"
      justifyContent="center"
    >
      <Heading level={1} marginBottom={-2}>
        Welcome to the NFT Factory App
      </Heading>

      <Text marginBottom={8}>
        To start, load the UXP plugin into Photoshop or open a directory
      </Text>

      <ButtonGroup>
        <Button variant="cta" onPress={onOpenDirectory}>
          Open Directory!
        </Button>

        <Button variant="secondary" onPress={onOpenInstance}>
          Open Instance!
        </Button>

        <Button
          variant="secondary"
          onPress={async () => {
            const id = uuid();

            const configuration = {
              name: "BoredApes",
              description: "A",
              symbol: "A",
              width: 500,
              height: 500,
              generateBackground: true,
              defaultBackground: "#ffffff",
              contractType: "721",
              cost: 0.05,
              maxMintAmount: 20,
              layers: [
                "Background",
                "Clothes",
                "Eyes",
                "Fur",
                "Head Accessories",
                "Mouth Accessories",
              ],
            };
            const inputDir = "C:\\Users\\alenk\\Desktop\\sample\\BoredApes";
            const outputDir =
              "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\.build";

            const collection = [
              {
                name: "1",
                traits: [
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Background",
                    name: "Background",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Orange.png",
                    value: "Orange",
                    rarity: 1,
                    type: "png",
                  },
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Fur",
                    name: "Fur",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Purple.png",
                    value: "Purple",
                    rarity: 1,
                    type: "png",
                  },
                ],
              },
              {
                name: "2",
                traits: [
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Background",
                    name: "Background",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Pink.png",
                    value: "Pink",
                    rarity: 1,
                    type: "png",
                  },
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Fur",
                    name: "Fur",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Green.png",
                    value: "Green",
                    rarity: 1,
                    type: "png",
                  },
                ],
              },
              {
                name: "3",
                traits: [
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Background",
                    name: "Background",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Red.png",
                    value: "Red",
                    rarity: 1,
                    type: "png",
                  },
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Fur",
                    name: "Fur",
                    blending: "normal",
                    opacity: 1,
                    fileName: "DMT 3.png",
                    value: "DMT 3",
                    rarity: 1,
                    type: "png",
                  },
                ],
              },
              {
                name: "4",
                traits: [
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Background",
                    name: "Background",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Pink.png",
                    value: "Pink",
                    rarity: 1,
                    type: "png",
                  },
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Fur",
                    name: "Fur",
                    blending: "normal",
                    opacity: 1,
                    fileName: "DMT 2.png",
                    value: "DMT 2",
                    rarity: 1,
                    type: "png",
                  },
                ],
              },
              {
                name: "5",
                traits: [
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Background",
                    name: "Background",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Pink.png",
                    value: "Pink",
                    rarity: 1,
                    type: "png",
                  },
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Fur",
                    name: "Fur",
                    blending: "normal",
                    opacity: 1,
                    fileName: "White .png",
                    value: "White ",
                    rarity: 1,
                    type: "png",
                  },
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Head Accessories",
                    name: "Head Accessories",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Horns.png",
                    value: "Horns",
                    rarity: 1,
                    type: "png",
                  },
                ],
              },
              {
                name: "6",
                traits: [
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Background",
                    name: "Background",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Orange.png",
                    value: "Orange",
                    rarity: 1,
                    type: "png",
                  },
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Fur",
                    name: "Fur",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Purple.png",
                    value: "Purple",
                    rarity: 1,
                    type: "png",
                  },
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Head Accessories",
                    name: "Head Accessories",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Shriners Hat.png",
                    value: "Shriners Hat",
                    rarity: 1,
                    type: "png",
                  },
                ],
              },
              {
                name: "7",
                traits: [
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Background",
                    name: "Background",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Pink.png",
                    value: "Pink",
                    rarity: 1,
                    type: "png",
                  },
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Fur",
                    name: "Fur",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Green.png",
                    value: "Green",
                    rarity: 1,
                    type: "png",
                  },
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Head Accessories",
                    name: "Head Accessories",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Round Hat.png",
                    value: "Round Hat",
                    rarity: 1,
                    type: "png",
                  },
                ],
              },
              {
                name: "8",
                traits: [
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Background",
                    name: "Background",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Red.png",
                    value: "Red",
                    rarity: 1,
                    type: "png",
                  },
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Fur",
                    name: "Fur",
                    blending: "normal",
                    opacity: 1,
                    fileName: "DMT 3.png",
                    value: "DMT 3",
                    rarity: 1,
                    type: "png",
                  },
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Head Accessories",
                    name: "Head Accessories",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Visor Hat.png",
                    value: "Visor Hat",
                    rarity: 1,
                    type: "png",
                  },
                ],
              },
              {
                name: "9",
                traits: [
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Background",
                    name: "Background",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Pink.png",
                    value: "Pink",
                    rarity: 1,
                    type: "png",
                  },
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Fur",
                    name: "Fur",
                    blending: "normal",
                    opacity: 1,
                    fileName: "DMT 2.png",
                    value: "DMT 2",
                    rarity: 1,
                    type: "png",
                  },
                  {
                    basePath:
                      "C:\\Users\\alenk\\Desktop\\sample\\BoredApes\\Head Accessories",
                    name: "Head Accessories",
                    blending: "normal",
                    opacity: 1,
                    fileName: "Shriners Hat.png",
                    value: "Shriners Hat",
                    rarity: 1,
                    type: "png",
                  },
                ],
              },
            ];

            await createFactory(id, configuration, inputDir, outputDir, {
              collection,
            });

            navigate("/quality", {
              state: {
                id,
                inputDir,
                outputDir,
                configuration,
                collection,
                photoshopId: "",
                photoshop: false,
              },
            });
          }}
        >
          Test
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
