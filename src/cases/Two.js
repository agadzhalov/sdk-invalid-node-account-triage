import {
    AccountId,
    PrivateKey,
    Client,
    Hbar,
    TransferTransaction,
    Transaction,
    Logger,
    LogLevel,
} from "@hashgraph/sdk";
import { sortNodes } from '../utils/SortNodeList.js';

import dotenv from "dotenv";

dotenv.config();

/**
 * Case 2: Creating, Signing, and Submitting a Transaction Using the Client with a Known Address Book. 
 * In Addition, Serialize and Deserialize the Signed Transaction
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
    client.setOperator(operatorId, operatorKey);

    if (process.env.HEDERA_NETWORK.toLowerCase() === "mainnet") {
        client
            .setMirrorNetwork(["mainnet-public.mirrornode.hedera.com:443"])
            .setTransportSecurity(true);
    }

    const recipientAccountId = new AccountId(3941207);

    // 1. Create transaction and freeze it
    let transaction = new TransferTransaction()
        .addHbarTransfer(operatorId, Hbar.fromTinybars(-1))
        .addHbarTransfer(recipientAccountId, Hbar.fromTinybars(1))
        .freezeWith(client);

    // 2. Sign transaction
    await transaction.sign(operatorKey);

    // 3. Serialize transaction into bytes
    const transactionBytes = transaction.toBytes();

    // 4. Deserialize transaction from bytes
    const transactionFromBytes = Transaction.fromBytes(transactionBytes);

    // 5. Execute transaction
    const executedTransaction = await transactionFromBytes.execute(client);

    // 6. Get record
    const record = await executedTransaction.getRecord(client);
    console.log(
        "The transfer transaction from account " +
        operatorId +
        " to account " +
        recipientAccountId +
        " was: " +
        record.transactionId
        +
        " executed against node id "
        + executedTransaction.nodeId.toString()
    );

    client.close();
}

void main();
