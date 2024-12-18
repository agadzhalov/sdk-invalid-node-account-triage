import {
    AccountId,
    PrivateKey,
    Client,
    Hbar,
    TransferTransaction,
} from "@hashgraph/sdk";
import { sortNodes } from '../utils/SortNodeList.js';
import { trimmedNodes } from "../utils/ListOfTrimmedNodes.js";
import { findMissingNodes } from "../utils/FindMissingNodes.js";

import dotenv from "dotenv";

dotenv.config();

/**
 * Case 4: Create a client that uses a default address book like Client.forTestnet and use it to create a transaction and sign but not submit it.
 * Create a second Client and modify the list of nodes for that network by creating a custom network. 
 * Remove two of the nodes from the network being used in the first client. Take the transaction from the first client and submit it using the next client.
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

    // 1. Configure account
    const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
    const operatorKey = PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY);

    // 2. Setup the first client
    const clientOne = Client.forMainnet();
    clientOne.setOperator(operatorId, operatorKey);

    // 3. Get nodes fro, clientOne
    const nodesClient = clientOne._network._network.keys();
    const sortedNodes = sortNodes([...nodesClient]);

    // 4. Defines the account which will receive the hbars after a TransferTransaction.
    const recipientAccountId = new AccountId(3941207);

    // 5. Setup the second client with trimmed nodes, Nodes 16 and Node 21 are removed
    // trimmedNodes are in utils/ListOfTrimmedNodes.js
    const clientTwo = Client.forNetwork(trimmedNodes);
    clientTwo.setOperator(operatorId, operatorKey);

    // 6. We run a loop in order to randomly hit some of the missing nodes
    // Each 5 seconds a transaction is submitted to one of the nodes.
    // If the transaction is submitted to one of the missing nodes INVALID_NODE_ACCOUNT error will be thrown
    setInterval(async () => {
        try {
            // 7. Only sign the transaction with ClientOne, but don't submit it.
            const signTransferTransaction = await new TransferTransaction()
                .addHbarTransfer(operatorId, Hbar.fromTinybars(-1)) //Sending account
                .addHbarTransfer(recipientAccountId, Hbar.fromTinybars(1)) //Receiving account
                .freezeWith(clientOne)
                .sign(operatorKey);


            // 8. Log the missing nodes
            const nodesTrimmedClient = sortNodes([...clientTwo._network._network.keys()]); 
            console.log("Missing nodes", findMissingNodes(sortedNodes, nodesTrimmedClient));
            
            // 9. Execute the transaction with ClientTwo.
            const transferTransaction = await signTransferTransaction.execute(clientTwo);
            // 10. Gets the record and logs it.
            const transactionRecord = await transferTransaction.getRecord(clientTwo);
            console.log(
                "The transfer transaction from account " +
                operatorId +
                " to account " +
                recipientAccountId +
                " was: " +
                transactionRecord.transactionId
                +
                " executed against node id "
                + transferTransaction.nodeId.toString()
            );
        } catch (e) {
            console.log(e);
        }
    }, 5000)
}

void main();
