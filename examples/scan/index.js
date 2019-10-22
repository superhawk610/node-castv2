var Client = require("../..").Client;
var mdns = require("multicast-dns")();

var connected = false;

mdns.on("response", function(res) {
  var service = parseresponse(res);
  console.log("found device", service);
  if (service.host && !connected) {
    console.log("connecting to", service);
    ondeviceup(service.host);
  }
});

mdns.query("._googlecast._tcp.local", "ANY");

function ondeviceup(host) {
  var client = new Client();
  client.connect(host, function() {
    // create various namespace handlers
    var connection = client.createChannel(
      "sender-0",
      "receiver-0",
      "urn:x-cast:com.google.cast.tp.connection",
      "JSON"
    );
    var heartbeat = client.createChannel(
      "sender-0",
      "receiver-0",
      "urn:x-cast:com.google.cast.tp.heartbeat",
      "JSON"
    );
    var receiver = client.createChannel(
      "sender-0",
      "receiver-0",
      "urn:x-cast:com.google.cast.receiver",
      "JSON"
    );

    // establish virtual connection to the receiver
    connection.send({ type: "CONNECT" });

    // start heartbeating
    setInterval(function() {
      heartbeat.send({ type: "PING" });
    }, 5000);

    // launch YouTube app
    receiver.send({ type: "LAUNCH", appId: "YouTube", requestId: 1 });

    // display receiver status updates
    receiver.on("message", function(data, broadcast) {
      if ((data.type = "RECEIVER_STATUS")) {
        console.log(data.status);
      }
    });
  });
}

function parseresponse(response) {
  var additionals = response.additionals;
  var service = {};

  for (var i = 0; i < additionals.length; i++) {
    var record = additionals[i];

    switch (record.type) {
      case "A":
        service.host = record.data;
        break;
      case "SRV":
        service.port = record.data.port;
        break;
      case "TXT":
        service.meta = parsemeta(record.data.map(buf => buf.toString("utf-8")));
    }
  }

  return service;
}

function parsemeta(kvpairs) {
  var meta = {};

  for (var i = 0; i < kvpairs.length; i++) {
    var kvp = kvpairs[i];
    var parts = kvp.split("=");
    meta[parts[0]] = parts[1];
  }

  return meta;
}
