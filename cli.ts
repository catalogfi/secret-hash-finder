import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { ethers, Wallet } from 'ethers';
import { createHash } from "crypto";

function hashString(inputString: string) {
    const sha256Hash = createHash("sha256");
    sha256Hash.update(inputString);
    const hashedString = sha256Hash.digest("hex");
    return hashedString;
}

async function computeSecrets(
    nonce: number,
    wallet: Wallet
): Promise<{secret:string, secretHash: string}> {
    //TODO: reafactor this function and enable backward compatibility for the old version where we pass chainId in the typed data
    const types = {
        Data: [
            { name: "Message", type: "string" },
            { name: "Version", type: "string" },
            { name: "Nonce", type: "uint256" },
        ],
    };

    // Important: This message is used for managing accounts pertaining to a
    // given swap. This means any claim attempt must use the same data as an
    // order creation. It *should not* be modified without careful consideration.
    const message = {
        Message: "Initialize your swap",
        Version: "1.1.0",
        Nonce: nonce,
    };

    const domain = {
        name: "CATALOG x WBTC GARDEN",
        version: "1",
        // chainId: selectedChainId,
    };

    const typedData = {
        types,
        domain,
        primaryType: "Data",
        message,
    };

    const signature = await wallet._signTypedData(domain, types, message);

    const privateKey = hashString(signature);

    const secret = hashString(privateKey);

    const secretHash = ethers.utils.sha256(`0x${secret}`);

    return {
        secret,
        secretHash,
    };
}


yargs(hideBin(process.argv))
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
    .command(
        'process',
        'process a phrase',
        {},
        async (argv) => {
            const words = (argv.seedPhrase as string).split(' ');
            if (words.length !== 12 && words.length !== 24) {
                console.error('Phrase must be 12 or 24 words');
                process.exit(1);
            }

            // Generate the first 20 accounts from the mnemonic
            console.log('Generating accounts...');
            const maximumNonce = argv.maxNonce as number;

            for (let i = 0; i < 20; i++) {
                const path = `m/44'/60'/0'/0/${i}`;
                const wallet = ethers.Wallet.fromMnemonic(argv.seedPhrase as string, path);

                console.log(`Trying with: ${wallet.address}`);

                for (let nonce = maximumNonce; nonce > 0; nonce--) {
                    const { secret, secretHash } = await computeSecrets(nonce, wallet);

                    if (secretHash.toLowerCase() === (argv.secretHash as string).toLowerCase()) {
                        console.log(`Found secret for nonce ${nonce}\nsecret: ${secret}`);
                        console.log(`account: ${wallet.address}`);

                        const orderId = ethers.utils.sha256(
                            ethers.utils.defaultAbiCoder.encode(
                                ["bytes32", "address"],
                                [secretHash, wallet.address]
                            )
                        );
                        
                        console.log('orderId: ', orderId);

                        process.exit(0);
                    }
                }

            }
            console.error('Secret not found for the given seed phrase');
        }
    )
    .help()
    .argv;