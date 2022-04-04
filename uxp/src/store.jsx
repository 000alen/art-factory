let id = 0;

export const getId = () => `${id++}`;

export const setActiveDocument = (documentName) =>
  localStorage.setItem("activeDocument", documentName);

export const getActiveDocument = () => localStorage.getItem("activeDocument");

export const setActiveFolder = (token) =>
  localStorage.setItem("activeFolder", token);

export const getActiveFolder = () => localStorage.getItem("activeFolder");

export const setItem = (id, item) =>
  localStorage.setItem(`item(${id})`, JSON.stringify(item));

export const getItem = (id) => JSON.parse(localStorage.getItem(`item(${id})`));

export const getConnectionStatus = () => {
  const connectionStatus = localStorage.getItem("connectionStatus");
  return connectionStatus === null ? false : connectionStatus;
};

export const setConnectionStatus = (connectionStatus) => {
  localStorage.setItem("connectionStatus", connectionStatus);
};
