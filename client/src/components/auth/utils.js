export function setUserNameInSessionStorage(username) {
  sessionStorage.setItem("username", username);
}
export function setUserIdInSessionStorage(userId) {
  sessionStorage.setItem("userId", userId);
}
export function getUserIdInSessionStorage() {
  return sessionStorage.getItem("userId");
}
export function getJwtToken() {
  return sessionStorage.getItem("jwt");
}

export function setJwtToken(token) {
  sessionStorage.setItem("jwt", token);
}

export const removeJwtToken = () => sessionStorage.removeItem("jwt");
