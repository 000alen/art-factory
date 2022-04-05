import {
  Node as FlowNode,
  Edge as FlowEdge,
  getOutgoers,
  isNode,
} from "react-flow-renderer";
import { LayerNodeComponentData } from "./components/LayerNode";
import { Trait } from "./typings";

export function getBranches(
  nodes: FlowNode[],
  edges: FlowEdge[]
): FlowNode[][] {
  const root = nodes.find((node) => node.type === "rootNode");

  const stack: {
    node: FlowNode;
    path: FlowNode[];
  }[] = [
    {
      node: root,
      path: [root],
    },
  ];

  const savedPaths = [];
  while (stack.length > 0) {
    const { node, path } = stack.pop();
    const neighbors = getOutgoers(node, nodes, edges);

    if (node.type === "renderNode") {
      savedPaths.push(path);
    } else {
      for (const neighbor of neighbors) {
        stack.push({
          node: neighbor,
          path: [...path, neighbor],
        });
      }
    }
  }

  return savedPaths;
}

export function getBranch(id: string, nodes: FlowNode[], edges: FlowEdge[]) {
  const root = nodes.find((node) => node.type === "rootNode");

  const stack: {
    node: FlowNode;
    path: FlowNode[];
  }[] = [
    {
      node: root,
      path: [root],
    },
  ];

  const savedPaths = [];
  while (stack.length > 0) {
    const { node, path } = stack.pop();
    const neighbors = getOutgoers(node, nodes, edges);

    if (node.id === id) {
      savedPaths.push(path);
    } else {
      for (const neighbor of neighbors) {
        stack.push({
          node: neighbor,
          path: [...path, neighbor],
        });
      }
    }
  }

  return savedPaths.shift();
}

export function getNotRevealedTraits(nodes: FlowNode[], edges: FlowEdge[]) {
  const { id } = nodes.find((node) => node.type === "notRevealedNode");
  const branch = getBranch(id, nodes, edges);

  return (branch.slice(1, -1) as FlowNode<LayerNodeComponentData>[])
    .map((node) => node.data)
    .map((data) => ({
      ...data.trait,
      id: data.id,
      opacity: data.opacity,
      blending: data.blending,
    }));
}
