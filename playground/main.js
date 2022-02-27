const { Factory } = require("./art");

const nodes = [
  {
    id: "1",
    type: "input",
    sourcePosition: "right",
    data: { label: "Root" },
    position: { x: 0, y: 0 },
  },
  {
    id: "2",
    type: "layerNode",
    sourcePosition: "right",
    targetPosition: "left",
    data: { layer: "1. Background" },
    position: { x: 250, y: 0 },
  },
  {
    id: "3",
    type: "layerNode",
    sourcePosition: "right",
    targetPosition: "left",
    data: { layer: "2. Fur" },
    position: { x: 500, y: 100 },
  },
  {
    id: "4",
    type: "layerNode",
    sourcePosition: "right",
    targetPosition: "left",
    data: { layer: "3. Clothes" },
    position: { x: 750, y: 200 },
  },
  {
    id: "7",
    type: "layerNode",
    sourcePosition: "right",
    targetPosition: "left",
    data: { layer: "6. Head Accessories" },
    position: { x: 1500, y: 500 },
  },
  {
    id: "-1",
    type: "renderNode",
    targetPosition: "left",
    data: { n: 5 },
    position: { x: 0, y: 100 },
  },
  {
    id: "dndnode_0",
    type: "renderNode",
    targetPosition: "left",
    data: { n: 5 },
    position: { x: 1059.8236881354726, y: -10.299988330170606 },
  },
  {
    id: "dndnode_1",
    type: "renderNode",
    targetPosition: "left",
    data: { n: 5 },
    position: { x: 1303.1481134653777, y: 366.6534246809116 },
  },
  {
    source: "1",
    sourceHandle: null,
    target: "2",
    targetHandle: "a",
    id: "reactflow__edge-1null-2a",
  },
  {
    source: "2",
    sourceHandle: "b",
    target: "3",
    targetHandle: "a",
    id: "reactflow__edge-2b-3a",
  },
  {
    source: "3",
    sourceHandle: "b",
    target: "-1",
    targetHandle: "a",
    id: "reactflow__edge-3b--1a",
  },
  {
    source: "3",
    sourceHandle: "b",
    target: "4",
    targetHandle: "a",
    id: "reactflow__edge-3b-4a",
  },
  {
    source: "4",
    sourceHandle: "b",
    target: "dndnode_0",
    targetHandle: "a",
    id: "reactflow__edge-4b-dndnode_0a",
  },
  {
    source: "4",
    sourceHandle: "b",
    target: "7",
    targetHandle: "a",
    id: "reactflow__edge-4b-7a",
  },
  {
    source: "7",
    sourceHandle: "b",
    target: "dndnode_1",
    targetHandle: "a",
    id: "reactflow__edge-7b-dndnode_1a",
  },
];

const factory = new Factory(
  {
    name: "APE",
    description: "APE",
    symbol: "APE",
    width: 500,
    height: 500,
    generateBackground: true,
    defaultBackground: "#1e1e1e",
    contractType: "721",
    cost: "0.05",
    maxMintAmount: 20,
    revealed: true,
    notRevealedUri: "",
    layers: [
      "1. Background",
      "2. Fur",
      "3. Clothes",
      "4. Mouth Accessories",
      "5. Eyes",
      "6. Head Accessories",
    ],
  },
  "C:\\Users\\alenk\\Desktop\\art-factory\\sample\\BoredApes",
  "C:\\Users\\alenk\\Desktop\\art-factory\\sample\\BoredApes_build"
);

async function main() {
  await factory.ensureLayers();
  const attributes = factory.generateRandomAttributesFromNodes(nodes);
  console.log(
    attributes[0][0].value === attributes[5][0].value &&
      attributes[5][0].value === attributes[10][0].value,
    attributes[5][0].value === attributes[10][0].value
  );
  // console.log(JSON.stringify(attributes));
}

main();
