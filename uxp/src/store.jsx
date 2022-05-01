let id = 0;
export const getId = () => `${id++}`;

export const getConnectionStatus = () =>
  localStorage.getItem("connectionStatus") || false;

export const setConnectionStatus = (connectionStatus) =>
  localStorage.setItem("connectionStatus", connectionStatus);

export const setProjectFolderToken = (token) =>
  localStorage.setItem("projectFolderToken", token);

export const getProjectFolderToken = () =>
  localStorage.getItem("projectFolderToken");

export const setItem = (id, item) =>
  localStorage.setItem(`item(${id})`, JSON.stringify(item));

export const getItem = (id) => JSON.parse(localStorage.getItem(`item(${id})`));
