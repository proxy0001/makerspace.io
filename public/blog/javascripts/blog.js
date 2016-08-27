(function() {
  var el = $('[data-posts]');

  var ws = new WebSocket("ws://push.proxy0001.com", ['echo-protocol']);
  // var ws = new WebSocket("ws://localhost:8080", ['echo-protocol']);
  
  ws.onopen = function() {
    console.log('websocket server connected');
  };

  ws.onmessage = function(message) {
    console.log(message)
    var payload = JSON.parse(message.data);
    el.html(payload.data);
  }
}());