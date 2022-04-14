import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Sidebar } from "../components/NodesPageSidebar";
import { useLocation, useNavigate } from "react-router-dom";
import { factoryGetLayerByName, factoryGetRandomTraitImage } from "../ipc";
import {
  Nodes,
  NodesContextProvider,
  NodesInstance,
} from "../components/NodesContext";
import { useErrorHandler } from "../components/ErrorHandler";
import { ToolbarContext } from "../components/Toolbar";
import { Trait } from "../typings";
import { MAX_SIZE } from "../constants";
import { Instance } from "../typings";
import { Button, Flex, TextField } from "@adobe/react-spectrum";
import { v4 as uuid } from "uuid";
import Close from "@spectrum-icons/workflow/Close";
import Back from "@spectrum-icons/workflow/Back";
import { spacedName } from "../utils";

interface TemplatePageState {
  projectDir: string;
  instance: Instance;
  id: string;
  templateId?: string;
}

export function TemplatePage() {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { projectDir, instance, id, templateId } = state as TemplatePageState;
  const { configuration, templates } = instance;

  const [workingId] = useState(templateId || uuid());
  const [name, setName] = useState(
    templateId
      ? templates.find(({ id }) => id == templateId).name
      : spacedName()
  );
  const [initialNodes] = useState(
    templateId ? templates.find(({ id }) => id == templateId).nodes : undefined
  );
  const [initialEdges] = useState(
    templateId ? templates.find(({ id }) => id == templateId).edges : undefined
  );
  const [initialRenderIds] = useState(
    templateId
      ? templates.find(({ id }) => id == templateId).renderIds
      : undefined
  );
  const [initialNs] = useState(
    templateId ? templates.find(({ id }) => id == templateId).ns : undefined
  );
  const [initialIgnored] = useState(
    templateId
      ? templates.find(({ id }) => id == templateId).ignored
      : undefined
  );

  const [traits, setTraits] = useState(
    templateId ? templates.find(({ id }) => id == templateId).traits : []
  );
  const getterRef = useRef<() => NodesInstance>(null);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));
    toolbarContext.addButton("back", "Back", <Back />, () =>
      navigate("/factory", { state: { projectDir, instance, id } })
    );

    task("loading preview", async () => {
      if (traits.length > 0) return;

      const layers = await Promise.all(
        configuration.layers.map(
          async (layerName) => await factoryGetLayerByName(id, layerName)
        )
      );

      // ! TODO URLS ARE NOT USED
      const traitsAndBase64Strings = await Promise.all(
        layers.map((layer) => factoryGetRandomTraitImage(id, layer, MAX_SIZE))
      );

      const _traits: Trait[] = traitsAndBase64Strings.map(([trait]) => trait);
      setTraits(_traits);
    })();

    return () => {
      toolbarContext.removeButton("close");
      toolbarContext.removeButton("back");
    };
  }, []);

  const onSave = () => {
    const { nodes, edges, renderIds, ns, ignored } = getterRef.current();

    const index = instance.templates.findIndex(
      (template) => template.id === workingId
    );

    let templates;
    if (index === -1)
      templates = [
        ...instance.templates,
        { id: workingId, name, traits, nodes, edges, renderIds, ns, ignored },
      ];
    else
      templates = instance.templates.map((template) =>
        template.id === workingId
          ? { ...template, traits, name, nodes, edges, renderIds, ns, ignored }
          : template
      );

    templates = JSON.parse(JSON.stringify(templates));

    navigate("/factory", {
      state: { projectDir, instance: { ...instance, templates }, id },
    });
  };

  const setter = useCallback(
    (getter: () => any) => (getterRef.current = getter),
    []
  );

  return (
    <NodesContextProvider
      id={id}
      autoPlace={false}
      layers={configuration.layers}
      traits={traits}
      setter={setter}
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      initialRenderIds={initialRenderIds}
      initialNs={initialNs}
      initialIgnored={initialIgnored}
    >
      <Flex
        UNSAFE_className="overflow-hidden"
        height="100%"
        margin="size-100"
        gap="size-100"
      >
        <Sidebar
          id={id}
          layers={configuration.layers}
          contractType={configuration.contractType}
          traits={traits}
        />
        <Nodes>
          <TextField
            position="absolute"
            top={0}
            right={0}
            label="Name"
            value={name}
            onChange={setName}
          />
          <Button
            zIndex={1001}
            position="absolute"
            bottom={0}
            right={0}
            variant="cta"
            onPress={onSave}
          >
            Save
          </Button>
        </Nodes>
      </Flex>
    </NodesContextProvider>
  );
}
