import BN = require('bn.js')
import { StateManager } from './state'
import Common from 'ethereumjs-common'
import Account from 'ethereumjs-account'
import { default as runCode, RunCodeOpts } from './runCode'
import { default as runCall, RunCallOpts } from './runCall'
import { default as runTx, RunTxOpts, RunTxResult } from './runTx'
import { default as runBlock, RunBlockOpts, RunBlockResult } from './runBlock'
import { EVMResult, ExecResult } from './evm/evm'
import runBlockchain from './runBlockchain'
const promisify = require('util.promisify')
const AsyncEventEmitter = require('async-eventemitter')
const Blockchain = require('ethereumjs-blockchain')
const Trie = require('merkle-patricia-tree/secure.js')

/**
 * Options for instantiating a [[VM]].
 */
export interface VMOpts {
  /**
   * The chain the VM operates on
   */
  chain?: string
  /**
   * Hardfork rules to be used
   */
  hardfork?: string
  /**
   * A [[StateManager]] instance to use as the state store (Beta API)
   */
  stateManager?: StateManager
  /**
   * A [merkle-patricia-tree](https://github.com/ethereumjs/merkle-patricia-tree) instance for the state tree (ignored if stateManager is passed)
   * @deprecated
   */
  state?: any // TODO
  /**
   * A [blockchain](https://github.com/ethereumjs/ethereumjs-blockchain) object for storing/retrieving blocks
   */
  blockchain?: any // TODO
  /**
   * If true, create entries in the state tree for the precompiled contracts
   */
  activatePrecompiles?: boolean
  /**
   * Allows unlimited contract sizes while debugging. By setting this to `true`, the check for contract size limit of 24KB (see [EIP-170](https://git.io/vxZkK)) is bypassed
   */
  allowUnlimitedContractSize?: boolean
  common?: Common
}

/**
 * Execution engine which can be used to run a blockchain, individual
 * blocks, individual transactions, or snippets of EVM bytecode.
 */
export default class VM extends AsyncEventEmitter {
  opts: VMOpts
  _common: Common
  stateManager: StateManager
  blockchain: any
  allowUnlimitedContractSize: boolean

  /**
   * Instantiates a new [[VM]] Object.
   * @param opts - Default values for the options are:
   *  - `chain`: 'mainnet'
   *  - `hardfork`: 'petersburg' [supported: 'byzantium', 'constantinople', 'petersburg', 'istanbul' (DRAFT) (will throw on unsupported)]
   *  - `activatePrecompiles`: false
   *  - `allowUnlimitedContractSize`: false [ONLY set to `true` during debugging]
   */
  constructor(opts: VMOpts = {}) {
    super()

    this.opts = opts

    if (opts.common) {
      if (opts.chain || opts.hardfork) {
        throw new Error(
          'You can only instantiate the VM class with one of: opts.common, or opts.chain and opts.hardfork',
        )
      }

      this._common = opts.common
    } else {
      const chain = opts.chain ? opts.chain : 'mainnet'
      const hardfork = opts.hardfork ? opts.hardfork : 'petersburg'
      const supportedHardforks = ['byzantium', 'constantinople', 'petersburg', 'istanbul']

      this._common = new Common(chain, hardfork, supportedHardforks)
    }

    if (opts.stateManager) {
      this.stateManager = opts.stateManager
    } else {
      const trie = opts.state || new Trie()
      if (opts.activatePrecompiles) {
        for (let i = 1; i <= 8; i++) {
          trie.put(new BN(i).toArrayLike(Buffer, 'be', 20), new Account().serialize())
        }
      }
      this.stateManager = new StateManager({ trie, common: this._common })
    }

    this.blockchain = opts.blockchain || new Blockchain({ common: this._common })

    this.allowUnlimitedContractSize =
      opts.allowUnlimitedContractSize === undefined ? false : opts.allowUnlimitedContractSize
  }

  /**
   * Processes blocks and adds them to the blockchain.
   * @param blockchain -  A [blockchain](https://github.com/ethereum/ethereumjs-blockchain) object to process
   * @param cb - the callback function
   */
  runBlockchain(blockchain: any): Promise<void> {
    return runBlockchain.bind(this)(blockchain)
  }

  /**
   * Processes the `block` running all of the transactions it contains and updating the miner's account
   * @param opts - Default values for options:
   *  - `generate`: false
   */
  runBlock(opts: RunBlockOpts): Promise<RunBlockResult> {
    return runBlock.bind(this)(opts)
  }

  /**
   * Process a transaction. Run the vm. Transfers eth. Checks balances.
   */
  runTx(opts: RunTxOpts): Promise<RunTxResult> {
    return runTx.bind(this)(opts)
  }

  /**
   * runs a call (or create) operation.
   */
  runCall(opts: RunCallOpts): Promise<EVMResult> {
    return runCall.bind(this)(opts)
  }

  /**
   * Runs EVM code.
   */
  runCode(opts: RunCodeOpts): Promise<ExecResult> {
    return runCode.bind(this)(opts)
  }

  /**
   * Returns a copy of the [[VM]] instance.
   */
  copy(): VM {
    return new VM({
      stateManager: this.stateManager.copy(),
      blockchain: this.blockchain,
      common: this._common,
    })
  }

  async _emit(topic: string, data: any) {
    return promisify(this.emit.bind(this))(topic, data)
  }
}
