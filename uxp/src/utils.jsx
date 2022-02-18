export const getConnectionStatus = () => {
  const connectionStatus = localStorage.getItem("connectionStatus");
  return connectionStatus === null ? false : connectionStatus;
};

export const setConnectionStatus = (connectionStatus) => {
  localStorage.setItem("connectionStatus", connectionStatus);
};
