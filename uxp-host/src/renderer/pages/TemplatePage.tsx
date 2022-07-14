import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

import { Button, Checkbox, Flex, TextArea, TextField } from "@adobe/react-spectrum";
import Back from "@spectrum-icons/workflow/Back";

import { useErrorHandler } from "../components/ErrorHandler";
import { Nodes, NodesContextProvider, NodesInstance } from "../components/NodesContext";
import { Sidebar } from "../components/NodesPageSidebar";
import { useToolbar } from "../components/Toolbar";
import { DEFAULT_SEED } from "../constants";
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
  useToolbar([
    {
      key: "back",
      label: "Exit without saving",
      icon: <Back />,
      onClick: () => onBack(),
    },
  ]);

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
  const [seed, setSeed] = useState(templateId ? template.seed : DEFAULT_SEED);
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
  const [initialOrders] = useState(templateId ? template.orders : undefined);

  const [customSeed, setCustomSeed] = useState(false);

  const [traits, setTraits] = useState(templateId ? template.traits : []);
  const getterRef = useRef<() => NodesInstance>(null);

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
    navigate("/factory", { state: { projectDir, id, instance, dirty } });

  const onSave = () => {
    let {
      nodes,
      edges,
      renderIds,
      ns,
      ignored,
      salesTypes,
      startingPrices,
      endingPrices,
      salesTimes,
      orders,
    } = getterRef.current();

    nodes = nodes.map((node) => {
      const { type } = node;
      if (type === "renderNode") {
        const { composedUrls, ..._data } = node.data;
        return {
          ...node,
          data: _data,
        };
      } else if (type === "layerNode") {
        const { urls, ..._data } = node.data;
        return {
          ...node,
          data: _data,
        };
      } else if (type === "bundleNode") {
        const { composedUrls, ..._data } = node.data;
        return {
          ...node,
          data: _data,
        };
      } else return node;
    });

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
          seed,
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
          orders,
        },
      ];
    else
      templates = instance.templates.map((template) =>
        template.id === workingId
          ? {
              ...template,
              traits,
              name,
              seed,
              nodes,
              edges,
              renderIds,
              ns,
              ignored,
              salesTypes,
              startingPrices,
              endingPrices,
              salesTimes,
              orders,
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
      initialOrders={initialOrders}
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
          <div className="absolute flex flex-col gap-2 z-[1001] top-0 left-0">
            <TextField label="Name" value={name} onChange={setName} />

            <Checkbox isSelected={customSeed} onChange={setCustomSeed}>
              Custom seed?
            </Checkbox>

            {customSeed && (
              <TextArea label="Seed" value={seed} onChange={setSeed} />
            )}
          </div>

          <div className="absolute flex flex-col gap-2 z-[1001] bottom-0 right-0">
            <Button variant="cta" onPress={onSave}>
              {dirty && "* "}Save
            </Button>
          </div>
        </Nodes>
      </Flex>
    </NodesContextProvider>
  );
}
