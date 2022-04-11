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
import { Instance } from "../newTypings";
import { Button } from "@adobe/react-spectrum";
import { v4 as uuid } from "uuid";
import Close from "@spectrum-icons/workflow/Close";
import Back from "@spectrum-icons/workflow/Back";
import { spacedName } from "../utils";

interface NodesPageState {
  projectDir: string;
  instance: Instance;
  id: string;
  nodesId?: string;
}

export function NodesPage() {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { projectDir, instance, id, nodesId } = state as NodesPageState;
  const { configuration, nodes } = instance;

  const [workingId] = useState(nodesId || uuid());
  const [initialNodes] = useState(
    nodesId ? nodes.find(({ id }) => id == nodesId).nodes : undefined
  );
  const [initialEdges] = useState(
    nodesId ? nodes.find(({ id }) => id == nodesId).edges : undefined
  );
  const [initialRenderIds] = useState(
    nodesId ? nodes.find(({ id }) => id == nodesId).renderIds : undefined
  );
  const [initialNs] = useState(
    nodesId ? nodes.find(({ id }) => id == nodesId).ns : undefined
  );
  const [initialIgnored] = useState(
    nodesId ? nodes.find(({ id }) => id == nodesId).ignored : undefined
  );

  const [traits, setTraits] = useState([]);
  const getterRef = useRef<() => NodesInstance>(null);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));
    toolbarContext.addButton("back", "Back", <Back />, () =>
      navigate("/factory", { state: { projectDir, instance, id } })
    );

    task("loading preview", async () => {
      const layers = await Promise.all(
        configuration.layers.map(
          async (layerName) => await factoryGetLayerByName(id, layerName)
        )
      );

      const traitsAndBase64Strings = await Promise.all(
        layers.map((layer) => factoryGetRandomTraitImage(id, layer, MAX_SIZE))
      );

      const traits: Trait[] = traitsAndBase64Strings.map(([trait]) => trait);
      setTraits(traits);
    })();

    return () => {
      toolbarContext.removeButton("close");
      toolbarContext.removeButton("back");
    };
  }, []);

  const onSave = () => {
    const {
      nodes: _nodes,
      edges,
      renderIds,
      ns,
      ignored,
    } = getterRef.current();
    const index = instance.nodes.findIndex((nodes) => nodes.id === workingId);
    const name = spacedName();

    let nNodes;
    if (index === -1) {
      nNodes = [
        ...instance.nodes,
        { id: workingId, name, nodes: _nodes, edges, renderIds, ns, ignored },
      ];
    } else {
      nNodes = instance.nodes.map((nodes) =>
        nodes.id === workingId
          ? { ...nodes, name, nodes: _nodes, edges, renderIds, ns, ignored }
          : nodes
      );
    }

    nNodes = JSON.parse(JSON.stringify(nNodes));

    navigate("/factory", {
      state: { projectDir, instance: { ...instance, nodes: nNodes }, id },
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
      <div className="w-full h-full flex overflow-hidden">
        <Sidebar
          id={id}
          layers={configuration.layers}
          contractType={configuration.contractType}
          traits={traits}
        />
        <Nodes>
          <div className="absolute z-10 bottom-4 right-4">
            <Button variant="cta" onPress={onSave}>
              Save
            </Button>
          </div>
        </Nodes>
      </div>
    </NodesContextProvider>
  );
}
