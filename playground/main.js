const { tuple } = require("immutable-tuple");
const { v4: uuid } = require("uuid");

function getPrefixes(paths) {
  const prefixes = new Set();

  for (const path of paths) {
    const filteredPaths = paths.filter((_path) => _path[0] === path[0]);
    const subPaths = filteredPaths.map((_path) => _path.slice(1));

    if (subPaths.length > 1) {
      prefixes.add(tuple(path[0]));

      const subPrefixes = getPrefixes(subPaths);
      for (const subPrefix of subPrefixes) {
        prefixes.add(tuple(path[0], ...subPrefix));
      }
    }
  }

  return prefixes;
}

let input = [
  ["0", "a", "b"],
  ["0", "a", "c"],
  ["0", "a", "b", "c"],
];

const cache = new Map();

while (true) {
  const id = uuid();
  const prefix = [...getPrefixes(input)] // Convert Set to Array
    .map((prefix) => [...prefix]) // Convert tuple to Array
    .filter((prefix) => prefix.length > 1) // Filter root node and single node prefixes
    // .map((prefix) => prefix.slice(1)) // Remove root node
    .sort((a, b) => a.length - b.length)[0]; // Sort by length (increasing) and return first element

  if (prefix === undefined) break;

  cache.set(id, prefix);

  input = input.map((path) =>
    tuple(...path.slice(0, prefix.length)) === tuple(...prefix)
      ? [id, ...path.slice(prefix.length)]
      : path
  );
}

console.log(cache);
console.log(input);
