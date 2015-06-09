var Readable = require('stream').Readable,
  TrieNode = require('./trieNode'),
  util = require('util');

module.exports = TrieReadStream


function TrieReadStream(trie) {
  this.trie = trie;
  this.next = null;
  Readable.call(this, {
    objectMode: true
  });
};

util.inherits(TrieReadStream, Readable);

TrieReadStream.prototype._read = function () {
  var self = this;
  if (!self._started) {
    self._started = true;
    self.trie._findValueNodes(function (root, node, key, next) {
      
      self.push({
        key: TrieNode.nibblesToBuffer(key),
        value: node.value
      })
      next();

    }, function () {
      // close stream
      self.push(null);
    });
  }
};
