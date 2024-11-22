export function findMissingNodes(allNodes, availableNodes) {
    const missingNodes = allNodes.filter(node => !availableNodes.includes(node));
    return missingNodes;
}
  