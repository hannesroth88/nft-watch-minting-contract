const axios = require('axios').default;
require('dotenv').config()
const Web3 = require('web3');



const CONTRACTADDRESS = "0x9C38Bc76f282EB881a387C04fB67e9fc60aECF78"
const ETHERSCANAPIKEY = process.env.ETHERSCANAPIKEY
const INFURAAPIKEY = process.env.INFURA_API_KEY
const MINT_FUNCTION_HEX = "0xa0712d68"
let web3 = new Web3(Web3.givenProvider || `https://mainnet.infura.io/v3/${INFURAAPIKEY}`);

// MAIN FUNCTION
start()

async function start() {
    var url = `https://api.etherscan.io/api?module=account&action=txlist&address=${CONTRACTADDRESS}&startblock=10000000&endblock=99999999&page=1&offset=100&sort=desc&apikey=${ETHERSCANAPIKEY}`
    const res = await axios.get(url)
        .catch((error) => {
            console.log(error);
        });
    var transactions = res.data.result
    for (const id in transactions as EtherscanTransaction) {
        const transaction = transactions[id] as EtherscanTransaction
        const today = new Date()
        const timestamp = new Date(0)
        timestamp.setUTCSeconds(parseInt(transaction.timeStamp));
        var diffMs = (today.getTime() - timestamp.getTime()); // milliseconds between now & Christmas
        var diffHrs = Math.round((diffMs % 86400000) / 3600000 * 100) / 100; // hours, round 2 decimals

        if (transaction.input.substring(0, 10) === MINT_FUNCTION_HEX && diffHrs < 3 * 24) {
            // console.log(transaction.input + "= MINT");

            await web3.eth.getBalance(transaction.from).then(res => {
                var ether = web3.utils.fromWei(res, "ether") as number
                if (ether > 5) {
                    var etherRounded = Math.round(ether * 100) / 100 // round 2 Decimals
                    console.log(`${diffHrs} Hours ago |  ${etherRounded.toString()} ETH |  MINT()`)
                }
            }
            )
        }
    }


}