//importing the necessary packages from SPL token
import {
    TOKEN_2022_PROGRAM_ID,
    getAccount,
    mintTo,
    createTransferInstruction,
    createMint,
    disableRequiredMemoTransfers,
    enableRequiredMemoTransfers,
} from "@solana/spl-token";

//import helper functions
import {
    sendAndConfirmTransaction,
    Connection,
    Transaction,
    PublicKey,
    TransactionInstruction,
} from "@solana/web3.js";

//import token creation helper
import { createTokenWithMemoExtension } from "./token-helper";

import { initializeKeypair, makeKeypairs } from "@solana-developers/helpers";  
require("dotenv").config();

//create a new connection
const connection = new Connection("http://127.0.0.1:8899", "confirmed");
const payer = await initializeKeypair(connection);
const mintDecimals = 9;

//creating our token account and other token account -> keypairs -> accounts will be created later on
const [ourTokenAccountKeypair, otherTokenAccountKeypair] = makeKeypairs(2);
const ourTokenAccount = ourTokenAccountKeypair.publicKey;
const otherTokenAccount = otherTokenAccountKeypair.publicKey;

const amountToMint = 1000;
const amountToTransfer = 300;

//creating the mint -> creating a standard mint since the memo extension will be on the token account that we will use to send the tokens from the mint
const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    mintDecimals,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
);

//create our token account
await createTokenWithMemoExtension(
    connection,
    payer,
    ourTokenAccountKeypair,
    mint
);

//other token account -> both are enabled for memo token transfers
await createTokenWithMemoExtension(
    connection,
    payer,
    otherTokenAccountKeypair,
    mint,
);

//mint the tokens to our token account
await mintTo(
    connection,
    payer,
    mint,
    ourTokenAccount,
    payer,
    amountToMint,
    undefined,
    undefined,
    TOKEN_2022_PROGRAM_ID
);

//tests -> attempting to transfer writing a memo
const message = "UDA-TRB-NYS2024A-SNR-INV789-STL456";
const transaction = new Transaction().add(
    //using this we can send instruction to any particular public key/program and enabling memo allows us to do this
    new TransactionInstruction({
        keys : [{
            pubkey : payer.publicKey,
            isSigner : true,
            isWritable : true
        }],
        data : Buffer.from(message, "utf-8"),

        //memo extension public key
        programId : new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
    }),

    //transfer instruction -> no need to specify mint since only one kind of token is being held by this token account
    createTransferInstruction(
        ourTokenAccount,
        otherTokenAccount,
        payer.publicKey,
        amountToTransfer,
        undefined,
        TOKEN_2022_PROGRAM_ID
    )
);

//send and confirm transaction
await sendAndConfirmTransaction(connection, transaction, [payer]);

//get the state of the account after the transfer
const accountAfterMemoTransfer = await getAccount(
    connection,
    otherTokenAccount,
    undefined,
    TOKEN_2022_PROGRAM_ID
);

console.log(
    `✅ - We have transferred ${accountAfterMemoTransfer.amount} tokens to ${otherTokenAccount} with the memo: ${message}`,
);

//disable memo extension and try again
await disableRequiredMemoTransfers(connection, payer, otherTokenAccount, payer, undefined, undefined, TOKEN_2022_PROGRAM_ID);

//now try transferring the tokens to the other account
const transfer = new Transaction().add(
    createTransferInstruction(
        ourTokenAccount,
        otherTokenAccount,
        payer.publicKey,
        amountToTransfer,
        undefined,
        TOKEN_2022_PROGRAM_ID
    )
);

await sendAndConfirmTransaction(connection, transfer, [payer]);

//get the state of the account after the transfer
const accountAfterDisable = await getAccount(
    connection,
    otherTokenAccount,
    undefined,
    TOKEN_2022_PROGRAM_ID,
);

//re-enable memo transfers to show it exists
await enableRequiredMemoTransfers(connection, payer, otherTokenAccount, payer, undefined, undefined, TOKEN_2022_PROGRAM_ID)

console.log(
    `✅ - We have transferred ${accountAfterDisable.amount} tokens to ${otherTokenAccount} without a memo after disabling memo tranfers.`,
);





