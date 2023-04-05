export function setUserNameInSessionStorage(username) {
  sessionStorage.setItem("username", username);
}

export function getJwtToken() {
  return sessionStorage.getItem("jwt");
}

export function setJwtToken(token) {
  sessionStorage.setItem("jwt", token);
}

export const removeJwtToken = () => sessionStorage.removeItem("jwt");
