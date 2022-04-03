import { useState } from "react";

export const useForceUpdate = (): [() => void, number] => {
  const [value, setValue] = useState(0);
  return [() => setValue((value) => value + 1), value];
};
