const slice = (n) => (x) => x.slice(n);

function getPrefix(paths) {
  const prefixes = [];

  for (const path of paths) {
    const filteredPaths = paths.filter((_path) => _path[0] === path[0]);
    if (filteredPaths.length > 1) {
      prefixes.push([path[0], ...getPrefix(filteredPaths.map(slice(1)))]);
    }
  }

  return prefixes.length ? prefixes.sort((a, b) => a.length - b.length)[0] : [];
}

console.log(
  getPrefix([
    ["0", "a", "b", "c", "d"],
    ["0", "a", "b", "e", "f"],
    ["0", "a", "b", "c", "h"],
    ["0", "e", "f", "g", "h"],
  ])
);
