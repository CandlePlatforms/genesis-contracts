const utils = require('./utils')

const SafeMath = artifacts.require(
  'openzeppelin-solidity/contracts/math/SafeMath.sol'
)
const ChildChain = artifacts.require('ChildChain')
const MRC20 = artifacts.require('MRC20')

module.exports = async function(deployer, network, accounts) {
  deployer.then(async() => {
    await deployer.deploy(SafeMath)
    await deployer.link(SafeMath, [ChildChain])
    await deployer.deploy(ChildChain)

    const childChain = await ChildChain.deployed()
    const contractAddresses = utils.getContractAddresses()

    let CndlWETH = await childChain.addToken(
      accounts[0],
      contractAddresses.root.tokens.CndlWETH,
      'Cndl WETH',
      'CTX',
      18,
      false // _isERC721
    )

    let TestToken = await childChain.addToken(
      accounts[0],
      contractAddresses.root.tokens.TestToken,
      'Test Token',
      'TST',
      18,
      false // _isERC721
    )

    let RootERC721 = await childChain.addToken(
      accounts[0],
      contractAddresses.root.tokens.RootERC721,
      'Test ERC721',
      'TST721',
      0,
      true // _isERC721
    )

    const cndlToken = await MRC20.at('0x0000000000000000000000000000000000001010')
    const cndlOwner = await cndlToken.owner()
    if (cndlOwner === '0x0000000000000000000000000000000000000000') {
      // matic contract at 0x1010 can only be initialized once, after the bor image starts to run
      await cndlToken.initialize(ChildChain.address, contractAddresses.root.tokens.CndlToken)
    }
    await childChain.mapToken(contractAddresses.root.tokens.CndlToken, '0x0000000000000000000000000000000000001010', false)

    contractAddresses.child = {
      ChildChain: ChildChain.address,
      tokens: {
        CndlWETH: CndlWETH.logs.find(log => log.event === 'NewToken').args.token,
        CndlToken: '0x0000000000000000000000000000000000001010',
        TestToken: TestToken.logs.find(log => log.event === 'NewToken').args.token,
        RootERC721: RootERC721.logs.find(log => log.event === 'NewToken').args.token
      }
    }
    utils.writeContractAddresses(contractAddresses)
  })
}
