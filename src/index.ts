const axios = require('axios').default;
require('dotenv').config()
const Web3 = require('web3');

enum TokenBalanceFrom {
    Etherscan,
    Zapper
}

const CONTRACTADDRESS = "0x9C38Bc76f282EB881a387C04fB67e9fc60aECF78"
const ETHERSCANAPIKEY = process.env.ETHERSCANAPIKEY
const INFURAAPIKEY = process.env.INFURA_API_KEY
const MINT_FUNCTION_HEX = "0xa0712d68"
const AMOUNT_TRANSACTION_SCANNED = 100
const GET_TOKENBALANCE = TokenBalanceFrom.Etherscan
const ETHERPRICE = 3500 // TODO get it from somewhere

// MAIN FUNCTION

let web3 = new Web3(Web3.givenProvider || `https://mainnet.infura.io/v3/${INFURAAPIKEY}`);
start()

async function start() {
    var url = `https://api.etherscan.io/api?module=account&action=txlist&address=${CONTRACTADDRESS}&startblock=10000000&endblock=999999999&page=1&offset=${AMOUNT_TRANSACTION_SCANNED}&sort=desc&apikey=${ETHERSCANAPIKEY}`
    const res = await axios.get(url)
        .catch((error) => {
            console.log(error);
        });
    var transactions = res.data.result
    // Delete Duplicate "From Addresses"
    await transactions.filter((v, i, a) => a.findIndex(t => (t.from === v.from)) === i)

    for (const id in transactions as EtherscanTransaction) {
        const transaction = transactions[id] as EtherscanTransaction
        const today = new Date()
        const timestamp = new Date(0)
        timestamp.setUTCSeconds(parseInt(transaction.timeStamp));
        var diffMs = (today.getTime() - timestamp.getTime()); // milliseconds between now & Christmas
        var diffHrs = Math.round((diffMs % 86400000) / 3600000 * 100) / 100; // hours, round 2 decimals
        if (transaction.input.substring(0, 10) === MINT_FUNCTION_HEX && diffHrs < 3 * 24) {
            // console.log(transaction.input + "= MINT");
            var balanceUSD = 0
            if (GET_TOKENBALANCE == TokenBalanceFrom.Etherscan) {
                balanceUSD = await getBalanceEtherscan(transaction.from)
            } else {

            }
            if (balanceUSD > 10000) {
                var balanceRounded = Math.round(balanceUSD) // round
                console.log(`${diffHrs} Hours ago |  ${balanceRounded.toString()} USD (ETH ${balanceRounded / ETHERPRICE})|  MINT() ${transaction.from}`)
            }
        }


    }


    async function getBalanceEtherscan(fromAddress: string): Promise<number> {
        var balance = await web3.eth.getBalance(fromAddress)
        var ether = web3.utils.fromWei(balance, "ether")
        return ether * ETHERPRICE;
    }

}