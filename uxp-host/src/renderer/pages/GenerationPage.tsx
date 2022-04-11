import {
  ActionButton,
  Button,
  Flex,
  Item,
  Menu,
  MenuTrigger,
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
import { factoryGenerate } from "../actions";
import { factoryGenerateNotRevealedImage } from "../ipc";
import { hash } from "../utils";
import { Node as FlowNode } from "react-flow-renderer";

interface GenerationPageState {
  projectDir: string;
  instance: Instance;
  id: string;
  generationId?: string;
}

export const GenerationPage: React.FC = () => {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { projectDir, instance, id, generationId } =
    state as GenerationPageState;
  const { configuration, templates } = instance;

  const [workingId] = useState(generationId || id);
  const [workingTemplateId, setWorkingTemplateId] = useState(templates[0].id);
  const [workingTemplateName, setWorkingTemplateName] = useState(templates[0].name);

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
    // setCurrentGeneration((prevGeneration) => prevGeneration + 1);
  };

  const onGenerate = task("generation", async () => {
    const { nodes, edges, ns, ignored } = templates.find(
      (nodes) => nodes.id === workingId
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

    const { collection, bundles } = await factoryGenerate(
      id,
      configuration,
      keys,
      nTraits,
      ns,
      nBundles,
      onProgress
    );
    if (configuration.contractType === "721_reveal_pause") {
      const notRevealedTraits = getNotRevealedTraits(nodes, edges);
      await factoryGenerateNotRevealedImage(id, notRevealedTraits);
    }
    const b = performance.now();

    console.log(b - a, collection, bundles);
  });

  const onSave = () => {};

  const items = templates.map(({ id, name }) => ({ id, name }));

  return (
    <Flex gap="size-100">
      <MenuTrigger>
        <ActionButton>{workingTemplateName}</ActionButton>
        <Menu
          items={items}
          selectionMode="single"
          disallowEmptySelection={true}
          selectedKeys={[workingTemplateId]}
          onSelectionChange={(selectedKeys) => {
            const selectedKey = [...selectedKeys].shift() as string;
            setWorkingTemplateId(selectedKey);
            setWorkingTemplateName(
              templates.find((nodes) => nodes.id === selectedKey).name
            );
          }}
        >
          {({ id, name }) => <Item key={id}>{name}</Item>}
        </Menu>
      </MenuTrigger>
      <Button variant="cta" onPress={onGenerate}>
        Generate
      </Button>
      <Button variant="cta">Save</Button>
    </Flex>
  );
};
