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
		/**
		 * @param countObj optional in/out object that allows the function to set # of possible topological orderings as "count" field, 
		 * and also allows user to specify nth order he wants returned by setting "ordinal" field in the countObj; any number that turns 
		 * out to be greater than the N possible orders is ignored and the first available order is returned 
		 */
		topologicalSort: function(countObj ) {
			if(arr.length==0) return null;
			var q=new PKNS.Queue();
			var indegreeArray = [];
			
			if(countObj) {
				/// init count of possible sorts
				countObj.count=1;
			}
			
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
					if(countObj) countObj.count=0;
					return null;
				}			
				
				var idx = indegreeArray.findIndex(f1);				
				while(idx!=-1) {					
					
					// check for alternatives
					var start=idx+1;
					var newIndex = indegreeArray.indexOf(0,start);											
					while(newIndex!=-1 && start < indegreeArray.length) {						
						if(newIndex!=-1 && !q.contains(newIndex)) {
							if(countObj) {
								countObj.count+=1;							
								if(countObj.ordinal && countObj.ordinal == countObj.count) idx=newIndex; // return nth topological sort
							}
						}
						start=newIndex+1;
						newIndex = indegreeArray.indexOf(0,start);
					}
										
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



/**
 * Binary Heap data structure
 * allows storage of numbers or objects in a min or max heap (see params)
 *
 * @param arr_in array of numbers or objects to store in a heap; if array of objects is passed in objects must define value() method used for comparisons
 * @param m mode allows either "min" or "max" ; default value is "max"
 *
*/
PKNS.Heap = function(arr_in, m) {
	
	var mode;
	
	if(!m) mode = "max"; //mode can be "max" or "min"
	var operator = mode=="max" ? Math.max : Math.min;
	var storage_type = typeof arr_in[0];
	if(storage_type!="number" && storage_type!="object") {
		throw new Error("Only number and object arrays are supported");
		return null;
	}
	if(storage_type=="object" && !arr_in.every( function(o) { return typeof o.value !== "undefined" && !isNaN(o.value())})) {
		throw new Error("Object arrays must define value() method for all objects that return a numeric value");
		return null;
	}
	
	var arr = arr_in;
	// insert null element in position 0 - unused
	arr.splice(0,0,null);
	buildHeap();
	
	function heapify ( i ) {
		
		var left = 2*i;
		var right = 2*i + 1;
		var largest = i;
		
		if(storage_type=="number") {
			if(left < arr.length && operator(arr[left],arr[largest])===arr[left]) {
				largest = left;
			} 
			
			if ( right < arr.length && operator(arr[right],arr[largest])===arr[right]) {
				largest = right;
			}
		} else {
			if(left < arr.length && operator(arr[left].value(),arr[largest].value())===arr[left].value()) {
				largest = left;
			} 
			
			if ( right < arr.length && operator(arr[right].value(),arr[largest].value())===arr[right].value()) {
				largest = right;
			}
		}
		
		if(largest!=i) {
			swap(i, largest);			
			heapify(largest);
		}		
	}
	
	function swap(i1, i2) {
		var temp = arr[i1];
		arr[i1]=arr[i2];
		arr[i2]=temp;
	}
	
	function buildHeap() {
		for(var i = Math.ceil(arr.length/2) ; i>=1; i--) {
			heapify(i);
		}
	}
	
	function increaseKey(i, val) {
		if(storage_type=="number") {
			if(val < arr[i]) {
				throw new Error("New values is less than the current one");
				return;
			}
			arr[i] = val;
			while(i>1 && arr[Math.floor(i/2)] < arr[i]) {
				swap(i, Math.floor(i/2));
				i = Math.floor(i/2);
			}
		} else {
			if(val.value() < arr[i].value()) {
				throw new Error("New values is less than the current one");
				return;
			}
			arr[i] = val;
			while(i>1 && arr[Math.floor(i/2)].value() < arr[i].value()) {
				swap(i, Math.floor(i/2));
				i = Math.floor(i/2);
			}
		}
		
	}
	
	function decreaseKey(i, val) {
		if(storage_type=="number") {
			if(val > arr[i]) {
				throw new Error("New values is greater than the current one");
				return;
			}
			arr[i] = val;
			while(i<= Math.floor(arr.length/2) && (arr[2*i] < arr[i] || arr[2*i+1] < arr[i])) {
				var swap_i = Math.min(arr[2*i], arr[2*i+1])==arr[2*i] ? 2*i : 2*i+1; 
				swap(i, swap_i );
				i = swap_i;
			}
		} else {			
			if(val.value() > arr[i].value()) {
				throw new Error("New values is greater than the current one");
				return;
			}
			arr[i] = val;
			while(i<= Math.floor(arr.length/2) && (arr[2*i].value() < arr[i].value() || arr[2*i+1].value() < arr[i].value())) {
				var swap_i = Math.min(arr[2*i], arr[2*i+1])==arr[2*i] ? 2*i : 2*i+1; 
				swap(i, swap_i );
				i = swap_i;
			}
		}
	}
	
	return {		
		
		insertElement: function( val ) {
			
			if(typeof val !== storage_type) {
				throw new Error("Incompatible value for this heap");
				return null;
			}
			
			if(storage_type=="object" && (typeof val.value === "undefined" || isNaN(val.value()))) {
				throw new Error("Object's value() method is not properly defined.");
				return null;
			}
			
			if(mode=="max") {
				if(storage_type=="number") {
					arr.push(val-1);
				} else {
					// need to create a dummy object with greater value
					var value = val.value();
					var o = {value: function() { return val.value()-1}};
					arr.push(o);
				}
				increaseKey (arr.length-1, val);				
			} else {
				if(storage_type=="number") {
					arr.splice(1,0, val+1);
				} else {
					// need to create a dummy object with greater value
					var value = val.value();
					var o = {value: function() { return val.value()+1}};
					arr.splice(1,0,o);
				}
				decreaseKey(1, val);
			}
		},
		
		getSortedArray: function() {
			// copy existing arr
			var arr_temp = [].concat(arr);
			
			var return_arr = [];
			
			while(arr.length>1) {
				return_arr.push(arr.splice(1,1)[0]);
				buildHeap();
			}
			arr = arr_temp;
			return return_arr;
			
		}
		
	};
	
}

//usage
/*

function Car(year) { this.year=year; }
Car.prototype.value = function() { return this.year }
var cars = [];
var x=0;
while(x++< 50) cars.push(new Car( Math.floor(Math.random()*2000) ));

var heap = new PKNS.Heap(cars, "min")	
var sorted = heap.getSortedArray();
sorted.forEach(function(x) { console.log(x.year) });

heap = new PKNS.Heap([9,2,0,-1,3,11,1,2,6,1]); // max heap by default
heap.getSortedArray();
heap.insertElement(52);
heap.getSortedArray();

*/




//////////////////   SICP ///////////////////////////

function fixed_point(f,start,tolerance) { 
	var closeEnough = function(u,v) { return Math.abs(u-v)<tolerance; };
	if( closeEnough(start, f(start))) { return start;} 
	else { console.log("Last value: " + start); return fixed_point(f, f(start), tolerance);} 
}

function averageDamp(f) {
	// private function 
    var average=function(x, y) { return (x+y)/2; }
	
	return function(x) {
		return average(x, f(x));
	};
}

function sqrt(x) { 
	// private function to average damp - the function whose fixed point approaches the value of square root
	var f=function(y) {return x/y}; 
	return fixed_point(averageDamp(f), 1, 0.00001); 
}

function derivative (f) {
	return function(x) {
		var dx = 0.0001;
		return (f(x)-f(x+dx))/dx;
	};
}

function newtonMethod(f, x) {
	var df = derivative(f);	
	return fixed_point(function(y) { return y - f(y)/df(y);} , x, 0.0001);
}

/**
* determines if n is a power of 2
*/
function isP2(n) { 
	return (n & (n - 1)) == 0;
}

function gcd(x,y) {
	var lesser = x>y ? y : x;
	var greater = x>y? x : y;
	
	if(greater%lesser ==0) return lesser;
	
	var x=1;
	var gcdNum = 1;	
	
	while(Math.floor(lesser/x++)>1) {
		var mod1, mod2;
		if(isP2(x)) {
			// x is a power of two
			mod1 = greater & (x-1);
			mod2 = lesser & (x-1);
		} else {
			mod1 = greater%x;
			mod2 = lesser%x
		}
		
		if(mod1 ==0 &&  mod2 == 0) {
			gcdNum*= x;
			greater/=x;
			lesser/=x;
			x=1;
		}
	}
	return gcdNum;
}

function cons(a,b) {
	return function(x) {
	    if(x!=1 && x!=2) throw new Error("Arguments can only be 1 or 2");
		return x==1? a: b;
	};
}

function car(f) {
	if(f==null) { return null; /* reached end of the list */ }
	if(typeof f!=='function') throw new Error("Invalid object used as argument");
	return f(1);
}

function cdr(f) {
	if(f==null) { return null; /* reached end of the list */ }
	if(typeof f!=='function') throw new Error("Invalid object used as argument");
	return f(2);
}

function list() {
	if(arguments.length==0) {
		return null;
	} else {
		return cons( arguments[0], arguments.callee.apply(this, Array.prototype.slice.call(arguments,1)));
	}
}



