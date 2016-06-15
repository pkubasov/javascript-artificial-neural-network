// declare namespace and put everything in it;

var PKNS={};
	
undef=function(obj) { return typeof(obj)==='undefined';};	

PKNS.Queue = function(size)
{ 
	if(undef(size)) size = Math.Infinity;
	// private
	var arr=[]; 

	return { 
		pop: function()
		{ 
			if(arr.length==0) {
				console.log("Queue is empty");
				return null; 
			}
			return arr.splice(0,1)[0]; 
		}, 
		push: function(obj) 
		{
			if(arr.length>=size) {
				console.log("Queue is full.");
				return null;
			}
			arr[arr.length]=obj;
			return arr.length;
		},
		getCurrentItemCount: function() {
			return arr.length;
		},
		contains: function(obj) {
			return arr.lastIndexOf(obj)!=-1;
		}
	};
};

PKNS.Stack = function(size) 
{
	if(undef(size)) size = Math.Infinity;
	// private
	var arr=[];
	
	return {
		pop: function() {
			if(arr.length==0) {
				console.log("Stack is empty");
				return null; 
			}
			return arr.pop();
		},
		push: function(obj) {
			if(arr.length>=size) {
				console.log("Stack is full.");
				return null;
			}
			return arr.push(obj);
		},
		getCurrentItemCount: function() {
			return arr.length;
		}
	};	
}


PKNS.Graph = function() {
	
	var arr = [];
	var meta=[];
	
	return {
		addNode: function(id) {
			if (undef(arr[id])) {
				arr[id]=[];
				return id;
			} else {
				console.log("Node already exists in the graph.");
				return null;
			}
		},
		setNodeMetaInfo: function(id,obj) {
			meta[id]= obj;
		},
		getNodeMetaInfo: function(id) {
			return meta[id];
		},
		addEdge: function(fromId, toId, weight) {
			if (undef(arr[fromId])) {
				this.addNode(fromId);
			}
			if(!undef(arr[fromId][toId])) {
				console.log("Edge between " + fromId + " and " + toId + " already exists.");
				return null;
			}
			if(undef(weight)) weight=1;
			arr[fromId][toId]=weight;
			if(undef(arr[toId])) this.addNode(toId);
		},
		getEdge: function(fromId, toId) {
			if (undef(arr[fromId]) || undef(arr[fromId][toId])) return null; 
			return arr[fromId][toId];
		},
		removeEdge: function(fromId, toId) {
			if (undef(arr[fromId]) || undef(arr[fromId][toId])) {
				console.log("Edge between " + fromId + " and " + toId + " does not exist.");
				return null;
			}
			return delete arr[fromId][toId];
		},
		addEdges: function(arr) {
			arr.forEach(function(x){
				this.addEdge(x[0],x[1],x[2]);
			}, this);
		},
		topologicalSort: function() {
			if(arr.length==0) return null;
			var q=new PKNS.Queue();
			var indegreeArray = [];
			
			var nodesLeft=0;
			
			// compute starting indegree array
			arr.forEach(function(srcNode, index){
				if(undef(srcNode)) return;
				
				nodesLeft++;
				
				if(undef(indegreeArray[index])) {
						indegreeArray[index]=0;						
				}
				srcNode.forEach(function(targetNode, index) {
					if(undef(indegreeArray[index])) {
						indegreeArray[index]=1;
					} else {
						indegreeArray[index]++;
					}					
				});
			});					
			
			while(nodesLeft>0) {
				var f1=function(x, index ){return x==0 && !q.contains(index)};
				
				if(!indegreeArray.some(f1)) {
					console.log("There are cycles in the graph, cannot create topological sort.");
					return null;
				}			
				
				var idx = indegreeArray.findIndex(f1);
				while(idx!=-1) {					
					nodesLeft--;				
					q.push(idx);
					// update indegree of connected nodes
					arr[idx].forEach(function(i, k){
						indegreeArray[k]--;
					});		
					idx = indegreeArray.findIndex(f1);
				}
					
			}
			
			console.log("Sort order:")
			var returnArray=[];
			while(q.getCurrentItemCount()>0) {
				returnArray.push(q.pop());
			}
			
			return returnArray;			
		}
	};
}

// usage
/*
g=new PKNS.Graph();
g.addEdge(0,1);
g.addEdge(3,4)
g.addEdge(3,5)
g.addEdge(0,2)
g.addEdge(2,4)
g.addEdge(4,5)
g.addEdge(1,3);
g.addEdge(2,1);
g.topologicalSort();

g2=new PKNS.Graph()
g2.addEdges([ [0,1],[0,2],[0,3],[3,4],[2,1],[4,2],[4,5],[5,1],[1,6],[6,7],[6,8],[7,9],[9,10],[8,10] ]);
g2.topologicalSort();
*/





