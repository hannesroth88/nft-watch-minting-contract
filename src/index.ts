const axios = require('axios').default;
require('dotenv').config()
const Web3 = require('web3');

const CONTRACTADDRESS = "0x9C38Bc76f282EB881a387C04fB67e9fc60aECF78"
const ETHERSCANAPIKEY = process.env.ETHERSCANAPIKEY
const INFURAAPIKEY = process.env.INFURA_API_KEY
const MINT_FUNCTION_HEX = "0xa0712d68"
const AMOUNT_TRANSACTION_SCANNED = 500
const ZAPPER_MAX_ADDRESSES = 15
const ETHERPRICE = 3500 // TODO get it from somewhere
const DATE_TODAY = new Date()

// MAIN FUNCTION

let web3 = new Web3(Web3.givenProvider || `https://mainnet.infura.io/v3/${INFURAAPIKEY}`);
start()

async function start() {
    var url = `https://api.etherscan.io/api?module=account&action=txlist&address=${CONTRACTADDRESS}&startblock=10000000&endblock=999999999&page=1&offset=${AMOUNT_TRANSACTION_SCANNED}&sort=desc&apikey=${ETHERSCANAPIKEY}`
    const res = await axios.get(url)
        .catch((error) => {
            console.log(error);
        });
    var resultEtherscan = res.data.result
    console.log('all transactions=' + resultEtherscan.length);

    // Delete Duplicate "From Addresses"
    var transactions = resultEtherscan.filter((v, i, a) => a.findIndex(t => (t.from === v.from)) === i)
    console.log('delete duplicates=' + transactions.length);

    // Filter for MINT Fuction and Within Timespan
    transactions = transactions.filter((transaction) => {
        var diffHrs = getDiffHours(transaction.timeStamp); // hours, round 2 decimals
        return transaction.input.substring(0, 10) === MINT_FUNCTION_HEX && diffHrs < 3 * 24
    })
    console.log('MINT + Timespan=' + transactions.length);

    var transactionsArray = transactions.map(transaction => {
        return transaction.from
    });
    // reduce max elements
    // transactionsArray = transactionsArray.slice(0, ZAPPER_MAX_ADDRESSES)
    // console.log("get Balance of=" + transactionsArray.length);

    var url = `https://api.zapper.fi/v1/protocols/tokens/balances`

    // Batch Requests
    const transactionBatches = chunkArray(transactionsArray, ZAPPER_MAX_ADDRESSES);
    var i = 0
    for (const transactionBatch of transactionBatches) {
        i++
        console.log("##### Batch " + i + " ####");
        
        var request = {
            params: {
                addresses: transactionBatch,
                api_key: "96e0cc51-a62e-42ca-acee-910ea7d2a241",
                network: "ethereum",
                newBalances: true
            }
        }
        await axios.get(url, request).then(res => {
            var accountBalances = res.data
            // for loop because of dynamic key in JSON
            for (var ethAddress in accountBalances) {
                var acc = accountBalances[ethAddress]
                var totalUsdBalance = acc.meta[0].value;
                var balanceRounded = Math.round(totalUsdBalance) // round
                var diffHrsArray = resultEtherscan
                    .filter(trans => trans.from == ethAddress)
                    .map(trans => getDiffHours(trans.timeStamp))
                if (totalUsdBalance > 100000) {
                    // get diffHours of an Account
                    console.log(`--> [${diffHrsArray}] Hours ago |  ${balanceRounded.toString()} USD (${Math.round(totalUsdBalance / ETHERPRICE)} ETH)|  MINT() ${ethAddress}`)
                } 
            }
        })
    }
}

function getDiffHours(timeStamp: string) {
    const date = new Date(0);
    date.setUTCSeconds(parseInt(timeStamp));
    var diffMs = (DATE_TODAY.getTime() - date.getTime()); // milliseconds between now & Christmas
    var diffHrs = Math.round((diffMs % 86400000) / 3600000 * 100) / 100; // hours, round 2 decimals
    return diffHrs;
}

function chunkArray(array, chunkSize) {
    return Array.from(
      { length: Math.ceil(array.length / chunkSize) },
      (_, index) => array.slice(index * chunkSize, (index + 1) * chunkSize)   
    );
  }