import {
    AccountId,
    PrivateKey,
    Client,
    Hbar,
    TransferTransaction,
    Logger,
    LogLevel,
} from "@hashgraph/sdk";
import { sortNodes } from '../utils/SortNodeList.js';

import dotenv from "dotenv";

dotenv.config();
/**
 * Case 1: Creating, Signing, and Submitting a Transaction Using the Client with a Known Address Book
 */
async function main() {
    if (
        process.env.OPERATOR_ID == null ||
        process.env.OPERATOR_KEY == null ||
        process.env.HEDERA_NETWORK == null
    ) {
        throw new Error(
            "Environment variables OPERATOR_ID, HEDERA_NETWORK, and OPERATOR_KEY are required."
        );
    }

    // 1. Configure accounts and client
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

    // 2. Setup the client
    const client = Client.forName(process.env.HEDERA_NETWORK);
    client.setOperator(operatorId, operatorKey);

    // 3. Reading the data provided by the mirror node nodes query
    if (process.env.HEDERA_NETWORK.toLowerCase() === "mainnet") {
        client
            .setMirrorNetwork(["mainnet-public.mirrornode.hedera.com:443"])
            .setTransportSecurity(true);
    }

    // 4. Get nodes, sorts and logs them for visibility
    const nodes = client._network._network.keys();
    console.log(sortNodes([...nodes]));


    const traceLogger = new Logger(LogLevel.Trace);
    //client.setLogger(traceLogger);

    // 5. Defines the account which will receive the hbars after a TransferTransaction.
    const recipientAccountId = new AccountId(3941207);

    // 6. Creates a transaction, freezes it and then signs it.
    const signTransferTransaction = await new TransferTransaction()
        .addHbarTransfer(operatorId, Hbar.fromTinybars(-1)) //Sending account
        .addHbarTransfer(recipientAccountId, Hbar.fromTinybars(1)) //Receiving account
        .freezeWith(client)
        .sign(operatorKey);

    // 7. Executes the transaction.
    const transferTransaction = await signTransferTransaction.execute(client);

    // 8. Gets the record and logs it.
    const transactionRecord = await transferTransaction.getRecord(client);
    console.log(
        "The transfer transaction from account " +
        operatorId +
        " to account " +
        recipientAccountId +
        " was: " +
        transactionRecord.transactionId
    );
}

void main();
