import tape from 'tape'
import Common from '../src/'

tape('[Common]: Initialization / Chain params', function (t: tape.Test) {
  t.test('Correct initialization', function (st: tape.Test) {
    const eips = [2537, 2929]
    const c = new Common({ chain: 'mainnet', eips })
    st.equal(c.eips(), eips, 'should initialize with supported EIP')
    st.end()
  })

  t.test('Initialization errors', function (st: tape.Test) {
    const UNSUPPORTED_EIP = 1000000
    const eips = [UNSUPPORTED_EIP]
    const msg = 'should throw on an unsupported EIP'
    const f = () => {
      new Common({ chain: 'mainnet', eips })
    }
    st.throws(f, /not supported$/, msg)

    /*
    // Manual test since no test triggering EIP config available
    // TODO: recheck on addition of new EIP configs
    // To run manually change minimumHardfork in EIP2537 config to petersburg
    eips = [ 2537, ]
    msg = 'should throw on not meeting minimum hardfork requirements'
    f = () => {
      new Common({ chain: 'mainnet', hardfork: 'byzantium', eips })
    }
    st.throws(f, /minimumHardfork/, msg)
    */

    st.end()
  })

  t.test('isActivatedEIP()', function (st) {
    let c = new Common({ chain: 'rinkeby', hardfork: 'istanbul' })
    st.equal(c.isActivatedEIP(2315), false, 'istanbul, eips: [] -> false (EIP-2315)')
    c = new Common({ chain: 'rinkeby', hardfork: 'istanbul', eips: [2315] })
    st.equal(c.isActivatedEIP(2315), true, 'istanbul, eips: [2315] -> true (EIP-2315)')
    c = new Common({ chain: 'rinkeby', hardfork: 'berlin' })
    st.equal(c.isActivatedEIP(2315), true, 'berlin, eips: [] -> true (EIP-2315)')
    st.equal(c.isActivatedEIP(2537), false, 'berlin, eips: [] -> false (EIP-2537)')

    st.end()
  })
})
