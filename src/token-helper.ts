//import the necessary packages
import {
    TOKEN_2022_PROGRAM_ID,
    getAccountLen,
    ExtensionType,
    createInitializeAccountInstruction,
    createEnableRequiredMemoTransfersInstruction,
} from "@solana/spl-token";

//import helper functions
import {
    sendAndConfirmTransaction,
    Connection,
    Keypair,
    Transaction,
    PublicKey,
    SystemProgram,
    TransactionSignature,
} from "@solana/web3.js";

//creating function to create the token account with memo extension
export async function createTokenWithMemoExtension(
    connection : Connection,
    payer : Keypair,
    tokenAccountKeypair: Keypair,
    mint: PublicKey,
): Promise<TransactionSignature>{
    //constants to create the account
    const extensions = [ExtensionType.MemoTransfer];
    const accountLen = getAccountLen(extensions);
    const lamports = await connection.getMinimumBalanceForRentExemption(accountLen);

    //create account instruction
    const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey : payer.publicKey,
        newAccountPubkey : tokenAccountKeypair.publicKey,
        space : accountLen,
        lamports,
        programId : TOKEN_2022_PROGRAM_ID
    });

    //create initialize account instruction -> initialize this particular account with this particular mint
    const initializeAccountInstruction = createInitializeAccountInstruction(
        tokenAccountKeypair.publicKey,
        mint,
        payer.publicKey,
        TOKEN_2022_PROGRAM_ID
    );

    //enable the memo transfers extension on this token account
    const enableMemoInstruction = createEnableRequiredMemoTransfersInstruction(
        tokenAccountKeypair.publicKey,
        payer.publicKey,
        undefined,
        TOKEN_2022_PROGRAM_ID
    );

    //send and confirm the transaction
    const transaction = new Transaction().add(
        createAccountInstruction,
        initializeAccountInstruction,
        enableMemoInstruction
    );

    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,

        //signers for the transaction
        [payer, tokenAccountKeypair],
    );
    
    return signature;
}
