"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var yargs_1 = require("yargs");
var helpers_1 = require("yargs/helpers");
var ethers_1 = require("ethers");
var crypto_1 = require("crypto");
var bitcoin = require("bitcoinjs-lib");
var ecpair_1 = require("ecpair");
var ecc = require("tiny-secp256k1");
function hashString(inputString) {
    var sha256Hash = (0, crypto_1.createHash)("sha256");
    sha256Hash.update(inputString);
    var hashedString = sha256Hash.digest("hex");
    return hashedString;
}
function computeSecrets(nonce, wallet) {
    return __awaiter(this, void 0, void 0, function () {
        var types, message, domain, typedData, signature, privateKey, secret, secretHash, signer, aliceBTCAddress;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    types = {
                        Data: [
                            { name: "Message", type: "string" },
                            { name: "Version", type: "string" },
                            { name: "Nonce", type: "uint256" },
                        ],
                    };
                    message = {
                        Message: "Initialize your swap",
                        Version: "1.1.0",
                        Nonce: nonce,
                    };
                    domain = {
                        name: "CATALOG x WBTC GARDEN",
                        version: "1",
                        // chainId: selectedChainId,
                    };
                    typedData = {
                        types: types,
                        domain: domain,
                        primaryType: "Data",
                        message: message,
                    };
                    return [4 /*yield*/, wallet._signTypedData(domain, types, message)];
                case 1:
                    signature = _a.sent();
                    privateKey = hashString(signature);
                    secret = hashString(privateKey);
                    secretHash = ethers_1.ethers.utils.sha256("0x".concat(secret));
                    signer = (0, ecpair_1.ECPairFactory)(ecc).fromPrivateKey(Buffer.from(privateKey, "hex"));
                    aliceBTCAddress = bitcoin.payments.p2pkh({
                        pubkey: signer.publicKey,
                        network: bitcoin.networks.bitcoin,
                    }).address;
                    return [2 /*return*/, {
                            secret: secret,
                            secretHash: secretHash,
                            aliceBTCAddress: aliceBTCAddress,
                            privateKey: privateKey
                        }];
            }
        });
    });
}
(0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .option('seedPhrase', {
    alias: 'sp',
    type: 'string',
    describe: 'A 12-word or 24-word phrase',
    demandOption: true,
}).option('secretHash', {
    alias: 'sh',
    type: 'string',
    describe: 'secret hash of the order',
    demandOption: true,
}).option('maxNonce', {
    alias: 'n',
    type: 'number',
    describe: 'maximum nonce to check for the secret',
    demandOption: true,
})
    .command('process', 'process a phrase', {}, function (argv) { return __awaiter(void 0, void 0, void 0, function () {
    var words, maximumNonce, i, path, wallet, nonce, _a, secret, secretHash, privateKey, aliceBTCAddress, orderId;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                words = argv.seedPhrase.split(' ');
                if (words.length !== 12 && words.length !== 24) {
                    console.error('Phrase must be 12 or 24 words');
                    process.exit(1);
                }
                // Generate the first 20 accounts from the mnemonic
                console.log('Generating accounts...');
                maximumNonce = argv.maxNonce;
                i = 0;
                _b.label = 1;
            case 1:
                if (!(i < 20)) return [3 /*break*/, 6];
                path = "m/44'/60'/0'/0/".concat(i);
                wallet = ethers_1.ethers.Wallet.fromMnemonic(argv.seedPhrase, path);
                console.log("Trying with: ".concat(wallet.address));
                nonce = maximumNonce;
                _b.label = 2;
            case 2:
                if (!(nonce > 0)) return [3 /*break*/, 5];
                return [4 /*yield*/, computeSecrets(nonce, wallet)];
            case 3:
                _a = _b.sent(), secret = _a.secret, secretHash = _a.secretHash, privateKey = _a.privateKey, aliceBTCAddress = _a.aliceBTCAddress;
                if (aliceBTCAddress.toLowerCase() === argv.secretHash.toLowerCase()) {
                    console.log('OTA Key: ', privateKey);
                    console.log("Found secret for nonce ".concat(nonce, "\nsecret: ").concat(secret));
                    console.log("account: ".concat(wallet.address));
                    orderId = ethers_1.ethers.utils.sha256(ethers_1.ethers.utils.defaultAbiCoder.encode(["bytes32", "address"], [secretHash, wallet.address]));
                    console.log('orderId: ', orderId);
                    process.exit(0);
                }
                _b.label = 4;
            case 4:
                nonce--;
                return [3 /*break*/, 2];
            case 5:
                i++;
                return [3 /*break*/, 1];
            case 6:
                console.error('Secret not found for the given seed phrase');
                return [2 /*return*/];
        }
    });
}); })
    .help()
    .argv;
