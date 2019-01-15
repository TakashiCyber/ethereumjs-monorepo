const ethUtil = require('ethereumjs-util')
const CheckpointTrie = require('./checkpoint-trie')

/**
 * You can create a secure Trie where the keys are automatically hashed
 * using **keccak256** by using `require('merkle-patricia-tree/secure')`.
 * It has the same methods and constructor as `Trie`.
 * @class SecureTrie
 * @extends Trie
 * @public
 */
module.exports = class SecureTrie extends CheckpointTrie {
  constructor (...args) {
    super(...args)
  }

  copy () {
    return new SecureTrie(this.db, this.root)
  }

  get (key, cb) {
    const hash = ethUtil.keccak256(key)
    super.get(hash, cb)
  }

  /**
   * For a falsey value, use the original key
   * to avoid double hashing the key.
   */
  put (key, val, cb) {
    if (!val) {
      this.del(key, cb)
    } else {
      const hash = ethUtil.keccak256(key)
      super.put(hash, val, cb)
    }
  }

  del (key, cb) {
    const hash = ethUtil.keccak256(key)
    super.del(hash, cb)
  }
}
