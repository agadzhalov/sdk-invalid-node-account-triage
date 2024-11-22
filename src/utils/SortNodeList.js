export function sortNodes(list) {
    return list.sort((a, b) => {
      const numA = a.split('.').map(Number);
      const numB = b.split('.').map(Number);
  
      for (let i = 0; i < numA.length; i++) {
        if (numA[i] !== numB[i]) {
          return numA[i] - numB[i];
        }
      }
      return 0; // If all parts are equal
    });
  }