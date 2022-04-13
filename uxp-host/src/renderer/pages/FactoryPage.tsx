import { Button, Flex, Heading, View, Text } from "@adobe/react-spectrum";
import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToolbarContext } from "../components/Toolbar";
import { CollectionItem, Instance } from "../typings";
import {
  createFactory,
  factoryGetImage,
  hasFactory,
  openInExplorer,
  writeProjectInstance,
} from "../ipc";
import { useErrorHandler } from "../components/ErrorHandler";
import Close from "@spectrum-icons/workflow/Close";
import Edit from "@spectrum-icons/workflow/Edit";
import Hammer from "@spectrum-icons/workflow/Hammer";

import SaveFloppy from "@spectrum-icons/workflow/SaveFloppy";
import Folder from "@spectrum-icons/workflow/Folder";
import { ImageItem } from "../components/ImageItem";

interface FactoryPageState {
  projectDir: string;
  instance: Instance;
  id: string;
}

export const FactoryPage: React.FC = () => {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { projectDir, instance, id } = state as FactoryPageState;
  const { configuration } = instance;

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));
    toolbarContext.addButton("save", "Save", <SaveFloppy />, () =>
      writeProjectInstance(projectDir, instance)
    );
    toolbarContext.addButton(
      "open-explorer",
      "Open in Explorer",
      <Folder />,
      () => {
        openInExplorer(projectDir);
      }
    );

    task("factory", async () => {
      if (await hasFactory(id)) return;

      await createFactory(id, configuration, projectDir);
    })();

    return () => {
      toolbarContext.removeButton("close");
      toolbarContext.removeButton("save");
      toolbarContext.removeButton("open-explorer");
    };
  }, []);

  const onConfiguration = () => {
    navigate("/configuration", {
      state: {
        projectDir,
        instance,
        id,
      },
    });
  };

  const onTemplate = (templateId?: string) => {
    navigate("/template", {
      state: {
        projectDir,
        instance,
        id,
        templateId,
      },
    });
  };

  const onGeneration = (templateId: string) => {
    navigate("/generation", {
      state: {
        projectDir,
        instance,
        id,
        templateId,
      },
    });
  };

  const onQuality = (generationId: string) => {
    navigate("/quality", {
      state: {
        projectDir,
        instance,
        id,
        generationId,
      },
    });
  };

  const onDeploy = () => {
    navigate("/deploy", {
      state: {
        projectDir,
        instance,
        id,
      },
    });
  };

  const onInstance = () => {
    navigate("/instance", {
      state: {
        projectDir,
        instance,
        id,
      },
    });
  };

  return (
    <Flex direction="column" gap="size-100" height="100vh">

      <Flex marginEnd="auto">
        <Button margin="size-100" variant="secondary" onPress={onConfiguration}>
          Project configuration
        </Button>

        <Button margin="size-100" variant="cta" onPress={() => onTemplate()}>
          Create a new template
        </Button>
      </Flex>

      <Heading margin="size-300">Templates &amp; Generation</Heading>
      
      <View overflow="auto" height="20vh" marginX="size-100">
      <Flex gap="size-100" marginX="size-500" justifyContent="space-around">
        {instance.templates.map((template) => (
          /* x si lo necesito
          <Button
            key={template.id}
            variant="secondary"
            onPress={() => onTemplate(template.id)}
          >
            {template.name}
          </Button>*/

          <View
            borderWidth="thin"
            borderColor="dark"
            borderRadius="medium"
            padding="size-100"
            height="size-1500"
            justifySelf="end"
            >
              <Heading UNSAFE_className="text-center"> {template.name} </Heading>
              <Flex>
                <Button 
                  variant="secondary"
                  margin="size-10"
                  key={`${template.id}_edit`}
                  onPress={() => onTemplate(template.id)}
                > <Edit/> </Button>
                <Button 
                  variant="secondary"
                  margin="size-10"
                  key={`${template.id}_generating`}
                  onPress={() => onGeneration(template.id)}
                > <Hammer/> </Button>
                <Button variant="secondary" margin="size-10" key={`${template.id}_close`}> <Close/> </Button>
              </Flex>
          </View>
        ))}
      </Flex>
      </View>

      <Heading margin="size-300">Quality control</Heading>

      <View overflow="auto" height="40vh" marginX="size-100">
        <Flex gap="size-100" marginX="size-500" justifyContent="center">

          { /*instance.generations.map((generation) => ( <- cambiarlo cuando no crashee*/ 
          instance.templates.map((generation) => (
            /*
            <Button
              key={generation.id}
              variant="secondary"
              onPress={() => onQuality(generation.id)}
            >
              {generation.name}
            </Button>
            */

            <View
            borderWidth="thin"
            borderColor="dark"
            borderRadius="medium"
            padding="size-100"
            height="size-1500"
            justifySelf="end"
            >
              <Heading UNSAFE_className="text-center"> {generation.name} </Heading>
              <div className="h-56 w-56"></div>
              <Flex justifyContent="space-around">
                <Button 
                  variant="secondary"
                  margin="size-10"
                  key={`${generation.id}_edit`}
                  onPress={() => onQuality(generation.id)}
                > <Edit/> </Button>
                <Button variant="secondary" margin="size-10" key={`${generation.id}_close`}> <Close/> </Button>
              </Flex>
            </View>
          ))}
           
           
        </Flex>
      </View>
      
      <Flex marginStart="auto" marginTop="auto">
        <Button variant="cta" margin="size-100" onPress={onDeploy}>
          Deploy
        </Button>
        <Button variant="cta" margin="size-100" onPress={onInstance} >
          Instance
        </Button>
      </Flex>

    </Flex>
  );
};
