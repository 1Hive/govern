import { ethers, network, waffle } from 'hardhat'
import { expect } from 'chai'
import { createDao, CreateDaoParams, CreateDaoOptions } from '../../public/create-dao'

// use rinkeby addresses as the tests run on a hardhat network forked from rinkeby
const tokenAddress = '0x9fB402A33761b88D5DcbA55439e6668Ec8D4F2E8'
const daoFactoryAddress = '0x1791E1D949c21703f49FC2C9a24570FA72ed62Ae'
const registryAddress = '0x8Adf949ADBAB3614f5340b21d9D9AD928d218096'
import * as registryAbi from './registryAbi.json'

describe("Create Dao", function() {
  it("Should create a dao successfully", async function() {
    const params: CreateDaoParams = {
      name: 'magic',
      token: {
        name: 'magical',
        symbol: 'MAG'
      },
      useProxies: false
    }

    const provider = network.provider
    const options: CreateDaoOptions = {
      provider,
      daoFactoryAddress
    }

    const result = await createDao(params, options)
    const receipt = await result.wait()
    expect(result).to.have.property('hash');
    expect(receipt).to.have.property('transactionHash')
    expect(receipt.status).to.equal(1)
    expect(result.hash).to.equal(receipt.transactionHash)

    // make sure register event is emitted
    const registryContract = new ethers.Contract(registryAddress, registryAbi, ethers.provider)
    
    const args = receipt.logs
    .filter(({ address }: { address: string }) => address === registryContract.address)
    .map((log: any) => registryContract.interface.parseLog(log))
    .find(({ name }: { name: string }) => name === 'Registered')

    const queueAddress = args?.args[1] as string
    const governAddress = args?.args[0] as string
    const daoName = args?.args[4] as string

    expect(ethers.utils.isAddress(queueAddress)).to.equal(true)
    expect(ethers.utils.isAddress(governAddress)).to.equal(true)
    expect(daoName).to.equal(params.name)

    // make sure the name is used
    const used = await registryContract.nameUsed(params.name)
    expect(used).to.equal(true)
  });

  it("Should reject duplicate Dao name", async function() {
    const params: CreateDaoParams = {
      name: 'sunny',
      token: {
        name: 'magical',
        symbol: 'MAG'
      },
      useProxies: false
    }

    const provider = network.provider
    const options: CreateDaoOptions = {
      provider,
      daoFactoryAddress
    }

    const result = await createDao(params, options)
    await result.wait()

    await expect(createDao(params, options)).to.be.reverted;
  })

  it("Should throw if token address and token symbol are missing", async function() {
    const params: CreateDaoParams = {
      name: 'moon',
      token: { name: 'moon' },
      useProxies: false
    }

    const provider = network.provider
    const options: CreateDaoOptions = {
      provider,
      daoFactoryAddress
    }

    try {
      const result = await createDao(params, options);
      expect(result).to.be.undefined

    } catch (err) {
      expect(err).to.have.property('message')
    }
  })

  it("Should throw if token address and token name are missing", async function() {
    const params: CreateDaoParams = {
      name: 'moon2',
      token: { symbol: 'moon' },
      useProxies: false
    }

    const provider = network.provider
    const options: CreateDaoOptions = {
      provider,
      daoFactoryAddress
    }

    try {
      const result = await createDao(params, options);
      expect(result).to.be.undefined

    } catch (err) {
      expect(err).to.have.property('message')
    }
  })

  it("Should create a dao successfully if only token address is given", async function() {
    const params: CreateDaoParams = {
      name: 'awesome',
      token: { address: '0x9fB402A33761b88D5DcbA55439e6668Ec8D4F2E8' },
      useProxies: false
    }

    const provider = network.provider
    const options: CreateDaoOptions = {
      provider,
      daoFactoryAddress
    }

    const result = await createDao(params, options);
    expect(result).to.have.property('hash')
    const receipt = await result.wait()
    expect(receipt.status).to.equal(1)

  })


  it("Should throw if provider is not provided and window.ethereum is not available", async function() {
    const params: CreateDaoParams = {
      name: 'spring',
      token: { name: 'spring' },
      useProxies: false
    }

    const options: CreateDaoOptions = {
      daoFactoryAddress
    }

    try {
      const result = await createDao(params, options);
      expect(result).to.be.undefined

    } catch (err) {
      expect(err).to.have.property('message')
    }
  })

  it("Should throw if token address is zero and name is missing", async function() {
    const params: CreateDaoParams = {
      name: 'summer',
      token: { address: ethers.constants.AddressZero },
    }

    const options: CreateDaoOptions = {
      provider: network.provider,
      daoFactoryAddress
    }

    try {
      const result = await createDao(params, options);
      expect(result).to.be.undefined

    } catch (err) {
      expect(err).to.have.property('message')
    }

  })

  it("Should create a dao successfully if useProxies is true", async function() {
    const params: CreateDaoParams = {
      name: 'rainbow',
      token: { address: tokenAddress },
      useProxies: true
    }

    const options: CreateDaoOptions = {
      provider: network.provider,
      daoFactoryAddress
    }

    const result = await createDao(params, options);
    expect(result).to.have.property('hash')

  })

  it("Should create a dao successfully if useProxies is missing", async function() {
    const params: CreateDaoParams = {
      name: 'bridge',
      token: { address: tokenAddress }
    }

    const options: CreateDaoOptions = {
      provider: network.provider,
      daoFactoryAddress
    }

    const result = await createDao(params, options);
    expect(result).to.have.property('hash')

  })

})

