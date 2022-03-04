let id = 0;

export const getId = () => {
  id++;
  return id.toString();
};

export const setDocument = (id, documentName) =>
  localStorage.setItem(`document(${id})`, documentName);

export const getDocument = (id) => localStorage.getItem(`document(${id})`);

export const setFolder = (id, token) =>
  localStorage.setItem(`folder(${id})`, token);

export const getFolder = (id) => localStorage.getItem(`folder(${id})`);

export const setItem = (id, item) =>
  localStorage.setItem(`item(${id})`, JSON.stringify(item));

export const getItem = (id) => JSON.parse(localStorage.getItem(`item(${id})`));
