export const capitalize = (string: string) =>
  string.charAt(0).toUpperCase() + string.slice(1);

export const chopAddress = (address: string) =>
  address.substring(0, 5) + "(...)" + address.substring(address.length - 3);
