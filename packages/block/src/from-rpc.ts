import { Transaction, TxData, Address } from '@ethereumjs/tx'
import Common from '@ethereumjs/common'
import { toBuffer, setLengthLeft } from 'ethereumjs-util'
import { Block, ChainOptions } from './index'

import blockHeaderFromRpc from './header-from-rpc'

/**
 * Creates a new block object from Ethereum JSON RPC.
 *
 * @param blockParams - Ethereum JSON RPC of block (eth_getBlockByNumber)
 * @param uncles - Optional list of Ethereum JSON RPC of uncles (eth_getUncleByBlockHashAndIndex)
 * @param chainOptions - An object describing the blockchain
 */
export default function blockFromRpc(
  blockParams: any,
  uncles?: any[],
  chainOptions?: ChainOptions,
) {
  uncles = uncles || []

  const header = blockHeaderFromRpc(blockParams, chainOptions)

  const block = new Block(
    {
      header: header.toJSON(true),
      transactions: [],
      uncleHeaders: uncles.map((uh) => blockHeaderFromRpc(uh, chainOptions).toJSON(true)),
    },
    chainOptions,
  )

  if (blockParams.transactions) {
    for (const _txParams of blockParams.transactions) {
      const txParams = normalizeTxParams(_txParams)

      // override from address
      const fromAddress = new Address(toBuffer(txParams.from))
      delete txParams.from

      // get common based on block's number
      // since hardfork param may not be set
      // (see TODO in block.constructor)
      const blockNumber = parseInt(block.header.number.toString('hex'), 16)
      const hfs = (block as any)._common.activeHardforks(blockNumber)
      const hf = hfs[hfs.length - 1].name
      const common = new Common((block as any)._common.chainId(), hf)

      const frozenTx = Transaction.fromTxData(txParams as TxData, common)
      const tx = Object.create(frozenTx)

      // override getSenderAddress
      tx.getSenderAddress = function () {
        return fromAddress
      }

      // override hash
      tx.hash = function () {
        return toBuffer(txParams.hash)
      }

      block.transactions.push(tx)
    }
  }
  return block
}

function normalizeTxParams(_txParams: any) {
  const txParams = Object.assign({}, _txParams)

  txParams.gasLimit = txParams.gasLimit === undefined ? txParams.gas : txParams.gasLimit
  txParams.data = txParams.data === undefined ? txParams.input : txParams.data

  // strict byte length checking
  txParams.to = txParams.to ? setLengthLeft(toBuffer(txParams.to), 20) : null

  // v as raw signature value {0,1}
  // v is the recovery bit and can be either {0,1} or {27,28}.
  // https://ethereum.stackexchange.com/questions/40679/why-the-value-of-v-is-always-either-27-11011-or-28-11100
  const v: number = txParams.v
  txParams.v = v < 27 ? v + 27 : v

  return txParams
}
