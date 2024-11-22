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

    // Configure accounts and client
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

    const client = Client.forName(process.env.HEDERA_NETWORK);

    if (process.env.HEDERA_NETWORK.toLowerCase() === "mainnet") {
        client
            .setMirrorNetwork(["mainnet-public.mirrornode.hedera.com:443"])
            .setTransportSecurity(true);
    }

    // get nodes
    const nodes = client._network._network.keys();
    console.log(sortNodes([...nodes]));

    client.setOperator(operatorId, operatorKey);

    const traceLogger = new Logger(LogLevel.Trace);
    //client.setLogger(traceLogger);

    const recipientAccountId = new AccountId(3941207);

    const signTransferTransaction = await new TransferTransaction()
        .addHbarTransfer(operatorId, Hbar.fromTinybars(-1)) //Sending account
        .addHbarTransfer(recipientAccountId, Hbar.fromTinybars(1)) //Receiving account
        .freezeWith(client)
        .sign(operatorKey);

    const transferTransaction = await signTransferTransaction.execute(client);

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
