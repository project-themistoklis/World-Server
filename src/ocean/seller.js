import sha256 from "crypto-js/sha256";
import { AbiItem } from "web3-utils/types";
import * as MockERC20 from "@oceanprotocol/contracts/artifacts/contracts/utils/mock/MockERC20Decimals.sol/MockERC20Decimals.json";
import {
  approve,
  Aquarius,
  Config,
  Erc20CreateParams,
  getHash,
  Nft,
  NftCreateData,
  NftFactory,
  Pool,
  PoolCreationParams,
  ProviderInstance,
  ZERO_ADDRESS,
} from "@oceanprotocol/lib";
import { web3, getTestConfig, getAddresses } from "./config";

let config;
let aquarius;
let providerUrl;
let publisherAccount;
let consumerAccount;
let stakerAccount;
let addresses;
let poolNftAddress;
let poolDatatokenAddress;
let poolAddress;

const POOL_NFT_NAME = "Datatoken 1";
const POOL_NFT_SYMBOL = "DT1";

///test: https://raw.githubusercontent.com/oceanprotocol/testdatasets/main/shs_dataset_test.txt
async function init(
  fileUrl,
  objectName,
  version,
  chainId,
  nftAddress,
  useLocal = false
) {
  if (!fileUrl || fileUrl.length <= 0) {
    console.error(
      "Invalid File URL! Set arguments like this: node index.js fileUrl=<url>"
    );
    return;
  }

  const ASSET_URL = [
    {
      type: "url",
      url: fileUrl,
      method: "GET",
    },
  ];

  const DDO = {
    "@context": ["https://w3id.org/did/v1"],
    id: "",
    version: version,
    chainId,
    nftAddress,
    metadata: {
      created: Date.now().toString(),
      updated: Date.now().toString(),
      type: "dataset",
      name: "dataset-name",
      description: "Ocean protocol test dataset description",
      author: "oceanprotocol-team",
      license: "MIT",
    },
    services: [
      {
        id: "testFakeId",
        type: "access",
        files: "",
        datatokenAddress: "0x0",
        serviceEndpoint: "https://providerv4.rinkeby.oceanprotocol.com",
        timeout: 0,
      },
    ],
  };

  config = await getTestConfig(web3);
  aquarius = new Aquarius(config.metadataCacheUri);
  providerUrl = useLocal ? "http://localhost:8030/" : config.providerUri;

  const accounts = await web3.eth.getAccounts();
  publisherAccount = accounts[0];
  consumerAccount = accounts[1];
  stakerAccount = accounts[2];

  addresses = getAddresses();

  const oceanContract = new web3.eth.Contract(MockERC20.abi, addresses.Ocean);

  await oceanContract.methods
    .transfer(consumerAccount, web3.utils.toWei("100"))
    .send({ from: publisherAccount });

  await oceanContract.methods
    .transfer(stakerAccount, web3.utils.toWei("100"))
    .send({ from: publisherAccount });

  const factory = new NftFactory(addresses.ERC721Factory, web3);

  const nftParams = {
    name: POOL_NFT_NAME,
    symbol: POOL_NFT_SYMBOL,
    templateIndex: 1,
    tokenURI: "",
    transferable: true,
    owner: publisherAccount,
  };

  const erc20Params = {
    templateIndex: 1,
    cap: "100000",
    feeAmount: "0",
    paymentCollector: ZERO_ADDRESS,
    feeToken: ZERO_ADDRESS,
    minter: publisherAccount,
    mpFeeAddress: ZERO_ADDRESS,
  };

  const poolParams = {
    ssContract: addresses.Staking,
    baseTokenAddress: addresses.Ocean,
    baseTokenSender: addresses.ERC721Factory,
    publisherAddress: publisherAccount,
    marketFeeCollector: publisherAccount,
    poolTemplateAddress: addresses.poolTemplate,
    rate: "1",
    baseTokenDecimals: 18,
    vestingAmount: "10000",
    vestedBlocks: 2500000,
    initialBaseTokenLiquidity: "2000",
    swapFeeLiquidityProvider: "0.001",
    swapFeeMarketRunner: "0.001",
  };

  await approve(
    web3,
    publisherAccount,
    addresses.Ocean,
    addresses.ERC721Factory,
    poolParams.vestingAmount
  );

  const tx = await factory.createNftErc20WithPool(
    publisherAccount,
    nftParams,
    erc20Params,
    poolParams
  );

  poolNftAddress = tx.events.NFTCreated.returnValues[0];
  poolDatatokenAddress = tx.events.TokenCreated.returnValues[0];
  poolAddress = tx.events.NewPool.returnValues[0];

  const nft = new Nft(web3);
  DDO.chainId = await web3.eth.getChainId();
  const checksum = sha256(
    web3.utils.toChecksumAddress(poolNftAddress) + DDO.chainId.toString(10)
  );
  DDO.id = "did:op:" + checksum;
  DDO.nftAddress = poolNftAddress;

  const encryptedFiles = await ProviderInstance.encrypt(ASSET_URL, providerUrl);
  DDO.services[0].files = encryptedFiles;
  DDO.services[0].datatokenAddress = poolDatatokenAddress;

  const providerResponse = await ProviderInstance.encrypt(DDO, providerUrl);
  const encryptedDDO = providerResponse;
  const metadataHash = getHash(JSON.stringify(DDO));
  await nft.setMetadata(
    poolNftAddress,
    publisherAccount,
    0,
    providerUrl,
    "",
    "0x2",
    encryptedDDO,
    "0x" + metadataHash
  );

  const pool = new Pool(web3);
  await approve(web3, stakerAccount, addresses.Ocean, poolAddress, "5", true);
  await pool.joinswapExternAmountIn(stakerAccount, poolAddress, "5", "0.1");

  await pool.getAmountInExactOut(
    poolAddress,
    poolDatatokenAddress,
    addresses.Ocean,
    "1",
    "0.01"
  );

  return {
    objectName,
    poolDatatokenAddress,
    ddo_id: DDO.id,
    ddo_server_id: DDO.services[0].id,
  };
}
