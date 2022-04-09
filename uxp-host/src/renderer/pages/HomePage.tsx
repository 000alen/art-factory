import React, { useContext } from "react";
import { Flex, Heading, Button, ButtonGroup } from "@adobe/react-spectrum";
import { useNavigate } from "react-router-dom";
import { openProject } from "../actions";
import { useErrorHandler } from "../components/ErrorHandler";
import { UXPContext } from "../components/UXPContext";

export function HomePage() {
  const navigate = useNavigate();
  const uxpContext = useContext(UXPContext);
  const task = useErrorHandler();

  // useEffect(() => {
  //   const uxpGenerate = async ({
  //     inputDir,
  //     partialConfiguration,
  //   }: {
  //     inputDir: string;
  //     partialConfiguration: any;
  //   }) => {
  //     const outputDir = await getOutputDir(inputDir);

  //     navigate("/configuration", {
  //       state: {
  //         inputDir,
  //         outputDir,
  //         partialConfiguration,
  //       },
  //     });
  //   };

  //   uxpContext.on("uxp-generate", uxpGenerate);
  //   return () => {
  //     uxpContext.off("uxp-generate", uxpGenerate);
  //   };
  // }, []);

  const onOpenProject = task("open project", async () => {
    navigate("/factory")
    // const result = await openProject();

    // if (result) {
    //   const { inputDir, outputDir } = result;
    //   navigate("/configuration", {
    //     state: {
    //       inputDir,
    //       outputDir,
    //     },
    //   });
    // }
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
        Welcome to the Art Factory!
      </Heading>

      <ButtonGroup>
        <Button variant="cta" onPress={onOpenProject}>
          Open Project!
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
