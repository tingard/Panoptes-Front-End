class ChatClient {
  send(message) {
    const request = new XMLHttpRequest();
    request.open("POST", "http://localhost:3000/messages");
    request.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    request.setRequestHeader("Authorization", zooAPI.headers.Authorization);

    new Promise(function(resolve, reject) {
      request.onload = function() {
          if (request.status == 200) {
            resolve(request.response);
          } else {
            reject(Error(request.statusText));
          }
        }

      request.onerror = function() {
        reject(Error("Network Error"));
      }

      request.send(JSON.stringify({message: message}))
    });
  }
}

module.exports = ChatClient;
