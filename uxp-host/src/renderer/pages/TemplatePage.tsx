import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

import { Button, Flex, TextField } from "@adobe/react-spectrum";
import Back from "@spectrum-icons/workflow/Back";

import { useErrorHandler } from "../components/ErrorHandler";
import {
  Nodes,
  NodesContextProvider,
  NodesInstance,
} from "../components/NodesContext";
import { Sidebar } from "../components/NodesPageSidebar";
import { ToolbarContext } from "../components/Toolbar";
import { factoryGetTraitsByLayerName } from "../ipc";
import { Instance } from "../typings";
import { spacedName } from "../utils";

interface TemplatePageState {
  projectDir: string;
  instance: Instance;
  id: string;
  templateId?: string;
  dirty: boolean;
}

export function TemplatePage() {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    projectDir,
    instance,
    id,
    templateId,
    dirty: _dirty,
  } = state as TemplatePageState;
  const { configuration, templates } = instance;

  const [template] = useState(
    templateId ? templates.find(({ id }) => id == templateId) : undefined
  );

  const [dirty, setDirty] = useState(_dirty);

  const [workingId] = useState(templateId || uuid());
  const [name, setName] = useState(templateId ? template.name : spacedName());
  const [initialNodes] = useState(templateId ? template.nodes : undefined);
  const [initialEdges] = useState(templateId ? template.edges : undefined);
  const [initialRenderIds] = useState(
    templateId ? template.renderIds : undefined
  );
  const [initialNs] = useState(templateId ? template.ns : undefined);
  const [initialIgnored] = useState(templateId ? template.ignored : undefined);
  const [initialSalesTypes] = useState(
    templateId ? template.salesTypes : undefined
  );
  const [initialStartingPrices] = useState(
    templateId ? template.startingPrices : undefined
  );
  const [initialEndingPrices] = useState(
    templateId ? template.endingPrices : undefined
  );
  const [initialSalesTimes] = useState(
    templateId ? template.salesTimes : undefined
  );

  const [traits, setTraits] = useState(templateId ? template.traits : []);
  const getterRef = useRef<() => NodesInstance>(null);

  useEffect(() => {
    toolbarContext.addButton("back", "Back", <Back />, () => onBack());

    return () => {
      toolbarContext.removeButton("back");
    };
  }, []);

  useEffect(() => {
    task("preview", async () => {
      if (traits.length > 0) return;

      setTraits(
        await Promise.all(
          configuration.layers.map(async (layerName) =>
            (await factoryGetTraitsByLayerName(id, layerName)).shift()
          )
        )
      );
    })();
  }, []);

  const onBack = () =>
    navigate("/factory", { state: { projectDir, instance, id, dirty } });

  const onSave = () => {
    const {
      nodes,
      edges,
      renderIds,
      ns,
      ignored,
      salesTypes,
      startingPrices,
      endingPrices,
      salesTimes,
    } = getterRef.current();

    const index = instance.templates.findIndex(
      (template) => template.id === workingId
    );

    let templates;
    if (index === -1)
      templates = [
        ...instance.templates,
        {
          id: workingId,
          name,
          traits,
          nodes,
          edges,
          renderIds,
          ns,
          ignored,
          salesTypes,
          startingPrices,
          endingPrices,
          salesTimes,
        },
      ];
    else
      templates = instance.templates.map((template) =>
        template.id === workingId
          ? {
              ...template,
              traits,
              name,
              nodes,
              edges,
              renderIds,
              ns,
              ignored,
              salesTypes,
              startingPrices,
              endingPrices,
              salesTimes,
            }
          : template
      );

    templates = JSON.parse(JSON.stringify(templates));

    navigate("/factory", {
      state: { projectDir, instance: { ...instance, templates }, id, dirty },
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
      initialSalesTypes={initialSalesTypes}
      initialStartingPrices={initialStartingPrices}
      initialEndingPrices={initialEndingPrices}
      initialSalesTimes={initialSalesTimes}
      setDirty={setDirty}
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
            zIndex={1001}
            position="absolute"
            top={0}
            left={0}
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
            {dirty && "* "}Save
          </Button>
        </Nodes>
      </Flex>
    </NodesContextProvider>
  );
}
