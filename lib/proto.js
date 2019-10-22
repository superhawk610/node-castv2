var fs = require("fs");
var protobuf = require("protobufjs");

var ns = "extensions.api.cast_channel";
var proto = __dirname + "/cast_channel.proto";
var messages = [
  "CastMessage",
  "AuthChallenge",
  "AuthResponse",
  "AuthError",
  "DeviceAuthMessage"
];

var root = protobuf.loadSync(proto);

messages.forEach(function(message) {
  var Message = root.lookupType(ns + "." + message);

  module.exports[message] = {
    serialize: function(payload) {
      var msg = Message.create(payload);
      return Message.encode(msg).finish();
    },
    parse: function(buffer) {
      return Message.decode(buffer);
    }
  };
});
