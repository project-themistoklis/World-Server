import {
  approve,
  Aquarius,
  balance,
  Datatoken,
  Pool,
  ProviderInstance,
} from "@oceanprotocol/lib";
import { getAddresses, getTestConfig, web3 } from "./config";

export async function buy(
  poolDatatokenAddress,
  ddo_id,
  poolAddress,
  useLocal,
  ddo_services0_id
) {
  const config = await getTestConfig(web3);
  const providerUrl = useLocal ? "http://localhost:8030/" : config.providerUri;
  const accounts = await web3.eth.getAccounts();
  const consumerAccount = accounts[1];
  const addresses = getAddresses();
  const aquarius = new Aquarius(config.metadataCacheUri);

  const datatoken = new Datatoken(web3);

  let consumerOCEANBalance = await balance(
    web3,
    addresses.Ocean,
    consumerAccount
  );

  let consumerDTBalance = await balance(
    web3,
    poolDatatokenAddress,
    consumerAccount
  );

  await approve(web3, consumerAccount, addresses.Ocean, poolAddress, "100");
  const pool = new Pool(web3);
  const tokenInOutMarket = {
    tokenIn: addresses.Ocean,
    tokenOut: poolDatatokenAddress,
    marketFeeAddress: consumerAccount,
  };
  const amountsInOutMaxFee = {
    maxAmountIn: "10",
    tokenAmountOut: "1",
    swapMarketFee: "0.1",
  };

  await pool.swapExactAmountOut(
    consumerAccount,
    poolAddress,
    tokenInOutMarket,
    amountsInOutMaxFee
  );

  consumerOCEANBalance = await balance(web3, addresses.Ocean, consumerAccount);

  consumerDTBalance = await balance(
    web3,
    poolDatatokenAddress,
    consumerAccount
  );

  const resolvedDDO = await aquarius.waitForAqua(ddo_id);
  const initializeData = await ProviderInstance.initialize(
    resolvedDDO.id,
    resolvedDDO.services[0].id,
    0,
    consumerAccount,
    providerUrl
  );

  const providerFees = {
    providerFeeAddress: initializeData.providerFee.providerFeeAddress,
    providerFeeToken: initializeData.providerFee.providerFeeToken,
    providerFeeAmount: initializeData.providerFee.providerFeeAmount,
    v: initializeData.providerFee.v,
    r: initializeData.providerFee.r,
    s: initializeData.providerFee.s,
    providerData: initializeData.providerFee.providerData,
    validUntil: initializeData.providerFee.validUntil,
  };

  const tx = await datatoken.startOrder(
    poolDatatokenAddress,
    consumerAccount,
    consumerAccount,
    0,
    providerFees
  );

  const downloadURL = await ProviderInstance.getDownloadUrl(
    ddo_id,
    consumerAccount,
    ddo_services0_id,
    0,
    tx.transactionHash,
    providerUrl,
    web3
  );

  return downloadURL;
}
