import {
  ActionButton,
  Button,
  Flex,
  Item,
  Menu,
  MenuTrigger,
  Text,
  TextField,
} from "@adobe/react-spectrum";
import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useErrorHandler } from "../components/ErrorHandler";
import { ToolbarContext } from "../components/Toolbar";
import { Instance } from "../typings";
import Back from "@spectrum-icons/workflow/Back";
import Close from "@spectrum-icons/workflow/Close";
import { getBranches, getNotRevealedTraits } from "../nodesUtils";
import { LayerNodeComponentData } from "../components/LayerNode";
import { Trait } from "../typings";
import {
  factoryGenerateCollection,
  factoryGenerateImages,
  factoryGenerateNotRevealedImage,
} from "../ipc";
import { hash, spacedName } from "../utils";
import { Node as FlowNode } from "react-flow-renderer";
import { v4 as uuid } from "uuid";

interface GenerationPageState {
  projectDir: string;
  instance: Instance;
  id: string;
  templateId: string;
}

export const GenerationPage: React.FC = () => {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { projectDir, instance, id, templateId } = state as GenerationPageState;
  const { configuration, templates } = instance;

  const [templateName] = useState(
    templates.find((template) => template.id === templateId).name
  );

  const [name, setName] = useState(spacedName());
  const [collection, setCollection] = useState(null);
  const [bundles, setBundles] = useState(null);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));
    toolbarContext.addButton("back", "Back", <Back />, () =>
      navigate("/factory", { state: { projectDir, instance, id } })
    );

    return () => {
      toolbarContext.removeButton("close");
      toolbarContext.removeButton("back");
    };
  }, []);

  const onProgress = (name: string) => {
    //   setCurrentGeneration((prevGeneration) => prevGeneration + 1);
  };

  const onGenerate = task("generation", async () => {
    const { nodes, edges, ns, ignored } = templates.find(
      (nodes) => nodes.id === templateId
    );

    const nData = (
      getBranches(nodes, edges).map((branch) =>
        branch.slice(1, -1)
      ) as FlowNode<LayerNodeComponentData>[][]
    ).map((branch) => branch.map((node) => node.data));
    let keys = nData
      .map((branch) =>
        branch.map((data) => ({
          ...data.trait,
          id: data.id,
        }))
      )
      .map(hash);

    const nTraits: Trait[][] = nData
      .map((branch) =>
        branch.map((data) => ({
          ...data.trait,
          id: data.id,
          opacity: data.opacity,
          blending: data.blending,
        }))
      )
      .filter((_, i) => !ignored.includes(keys[i]));

    keys = keys.filter((key) => !ignored.includes(key));

    const nBundles = nodes
      .filter((node) => node.type === "bundleNode")
      .map((node) => node.data)
      .map((data) => ({
        name: data.name,
        ids: data.ids,
      }));
    const n = keys.reduce((acc, key) => ns[key] + acc, 0);

    const a = performance.now();

    const { collection, bundles } = await factoryGenerateCollection(
      id,
      keys,
      nTraits,
      ns,
      nBundles
    );

    await factoryGenerateImages(id, name, collection, onProgress);

    // ! TODO
    // if (configuration.contractType === "721_reveal_pause") {
    //   const notRevealedTraits = getNotRevealedTraits(nodes, edges);
    //   await factoryGenerateNotRevealedImage(id, notRevealedTraits);
    // }

    const b = performance.now();

    console.log(b - a);

    setCollection(collection);
    // setBundles(bundles);
  });

  const onSave = () => {
    let generations = [
      ...instance.generations,
      { id: uuid(), name, collection, bundles },
    ];

    generations = JSON.parse(JSON.stringify(generations));

    navigate("/factory", {
      state: {
        projectDir,
        instance: { ...instance, generations },
        id,
      },
    });
  };

  return (
    <Flex gap="size-100">
      <Text>{templateName}</Text>
      <TextField label="Name" value={name} onChange={setName} />
      <Button variant="cta" onPress={onGenerate}>
        Generate
      </Button>
      <Button variant="cta" onPress={onSave}>
        Save
      </Button>
    </Flex>
  );
};
