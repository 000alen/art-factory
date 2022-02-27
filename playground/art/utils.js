const RARITY_DELIMITER = "#";

function rarity(elementName) {
  let rarity = Number(elementName.split(RARITY_DELIMITER).pop());
  if (isNaN(rarity)) rarity = 1;
  return rarity;
}

function removeRarity(elementName) {
  return elementName.split(RARITY_DELIMITER).shift();
}

// Source: https://github.com/parmentf/random-weighted-choice
function rarityWeightedChoice(
  layerElements,
  temperature = 50,
  randomFunction = Math.random,
  influence = 2
) {
  const T = (temperature - 50) / 50;
  const nb = layerElements.length;
  if (!nb) return null;

  const total = layerElements.reduce(
    (previousTotal, element) => previousTotal + element.rarity,
    0
  );

  const avg = total / nb;

  const ur = {};
  const urgencySum = layerElements.reduce((previousSum, element) => {
    const { name, rarity } = element;
    let urgency = rarity + T * influence * (avg - rarity);
    if (urgency < 0) urgency = 0;
    ur[name] = (ur[name] || 0) + urgency;
    return previousSum + urgency;
  }, 0);

  let currentUrgency = 0;
  const cumulatedUrgencies = {};
  Object.keys(ur).forEach((id) => {
    currentUrgency += ur[id];
    cumulatedUrgencies[id] = currentUrgency;
  });

  if (urgencySum <= 0) return null;

  const choice = randomFunction() * urgencySum;
  const names = Object.keys(cumulatedUrgencies);
  const rarities = layerElements.map((element) => element.rarity);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const urgency = cumulatedUrgencies[name];
    if (choice <= urgency) {
      return { name, rarity: rarities[i] };
    }
  }
}

module.exports = {
  RARITY_DELIMITER,
  rarity,
  removeRarity,
  rarityWeightedChoice,
};
