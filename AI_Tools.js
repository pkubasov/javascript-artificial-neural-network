/**
   Tools used in AI Algorithms
*/

/**
 * Depth-first search implementation
 *
 * @param arr - a tree structure, represented as array of arrays, to search
 * @param found_func - function that defines what we are looking for
 * @param depth_limit  optional depth limit
 */
function dfs( arr, found_func, depth_limit) {
    var i =0; // array index
    var ret_val = undefined; // return value
    while(arr[i]) {
        if(arr[i] instanceof Array) {
           if(depth_limit !== undefined && depth_limit < 1) {
               i++;
               continue;
           } else {
               ret_val = dfs(arr[i], found_func, depth_limit-1);
           }
       } else {
           if(found_func(arr[i])) {
               ret_val = arr[i];
           }
       }
       // if we found it, return, otherwise, keep looping
       if(ret_val !== undefined) return ret_val;
       i++;
    }
    // didn't find it
    return ret_val;
}

/**
 * Creates an unbalanced binary tree for dfs testing
 *
 * @param depth  max depth
 * @return {Array}
 */
function create_test_tree( depth ) {
    var j = new Array();
    for(var i=0; i< 5; i++) {
        var randValue = Math.round(Math.random()*100);
        if(depth ==0 || randValue < 50) {
            j[i] = new Array();
            for(var x=0; x<7; x++) {
                j[i][x] = (x+1)*(i+1)+randValue;
            }
        } else {
            j[i] = create_test_tree(depth -1);
        }
    }
    return j;
}

function found( l) {
    return l%89==0;
}

/*
  Sample usage

  var tree1 = create_test_tree(5);
  dfs(tree1, found, 3);

 */
 
 /**
  * Function that computes similarity between two vectors
  * vector A and B should be arrays
  */ 
 function cosineSim(vectorA, vectorB) { 
    if (!vectorA instanceof Array || ! vectorB instanceof Array) {
       console.log("Both vectors must be arrays");
       return null;
    }
    var length = Math.max(vectorA.length, vectorB.length);
    var dotProduct=0; 
    var normA=0; 
    var normB=0; 
    for(var i=0; i<length;i++) { 
       var dim1= isNaN(vectorA[i])? 0 : vectorA[i];
       var dim2 = isNaN(vectorB[i])? 0: vectorB[i];
       dotProduct+=dim1*dim2; 
       normA+=Math.pow(dim1,2);
       normB+=Math.pow(dim2,2);
       
    } 
    if(normA==0 || normB=0) return 0;
    return dotProduct/( Math.sqrt(normA) * Math.sqrt(normB) ); 
    
 }
