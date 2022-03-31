import {
  Node as FlowNode,
  Edge as FlowEdge,
  getOutgoers,
  isNode,
} from "react-flow-renderer";

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

export const getChildren = (
  node: FlowNode,
  nodes: FlowNode[],
  edges: FlowEdge[]
) => {
  if (!isNode(node)) {
    return [];
  }
  return nodes.filter((n) => n.parentNode === node.id);
};
