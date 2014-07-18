/**
 * Created with TextPad.
 * User: PhilipK
 * Date: 7/13/14
 * Time: 9:44 AM
 * To change this template use File | Settings | File Templates.
 */

// namespace
var ga= {};
ga.mutationProbability = 0.001;
ga.crossOveProbability = 0.0045;
ga.bestFitBias = 0; // just use best fit for parents

LOG_LEVEL = 4;
/**
 * General purpose logging function
 *
 * @param msg
 * @param level
 */
ga.log=function (msg, level) {
    if(!level) level = 0; // DEBUG by default
    if(level >= LOG_LEVEL) console.log(msg);
};

ga.calculateFitness = function(chromosome) {
	// needs to be overridden for each specific GA algorithm
	// returns value between 0 and 1
	var fitnessScore = 0;
	var baseScore =0;
	for(var i=0; i< chromosome.size; i++) {
		if(chromosome.data[i]) fitnessScore++;
		baseScore++;
	}
	return fitnessScore/baseScore;
}

ga.crossOver = function(c1, c2, locus) {
	var i=0;
	while( i+locus < c1.size) {
		var temp = c1.data[i+locus];
		c1.data[i+locus]=c2.data[i+locus];
		c2.data[i+locus] = temp;
		i++;
	}
}

// Chromosome to mutate
ga.Chromosome = function(size, mutationProbability) {
		this.size = size;
		this.data = new Array();
		this.mutationProbability = mutationProbability;

		var id = "C" + Math.round(Math.random() * 100000000000000000);

		// initialize
		for(var i=0; i< this.size; i++) {
			this.data[i] = Math.random() > 0.5 ? true : false;
		}

		this.getId = function() {
			return id;
		}
}

ga.Chromosome.prototype.clone = function() {
	var c = new ga.Chromosome(this.size, this.mutationProbability);
	c.data = this.data;
	return c;
}

ga.Chromosome.prototype.getValue = function(index) {
	if(index >= size) {
		ga.log("Chromosome size exceeded", 4);
		return;
	}
	return this.data[index];
}

ga.Chromosome.prototype.mutate = function() {
	for(var i=0; i< this.size; i++) {
		if(Math.random() <= this.mutationProbability) this.data[i]=!this.data[i];
	}
}

ga.Chromosome.prototype.getFitness = function() {
	return ga.calculateFitness(this);
}

ga.Chromosome.prototype.getBits = function() {
	var bits = "";
	for(var i=0; i< this.size; i++) {
		bits+= (0 + this.data[i]);
	}
	return bits;
}

// ascending
ga.Chromosome.prototype.sort = function(c1, c2) {
	return c1.getFitness() - c2.getFitness();
}

ga.ChromosomePool = function(poolSize, chromosomeSize, numOfOffspringToKeep) {
	this.pool = new Array();
	this.poolSize = poolSize;
	this.numOfOffspringToKeep = numOfOffspringToKeep;

	for(var i =0; i< this.poolSize; i++) {
		this.pool[i] = new ga.Chromosome(chromosomeSize, ga.mutationProbability);
	}

	this.getAverageFitness = function() {
		var sum = 0;
		var pSize = this.poolSize;
		var p = this.pool;
		
		for(var i =0; i < pSize; i++) {
			sum+= p[i].getFitness()*100000;
		}
		return sum/(pSize*100000);
	}

	this.getMinimumFitness = function() {
		var min = 100000;
		
		var pSize = this.poolSize;
		var p = this.pool;
		
		for(var i =0; i< pSize; i++) {
			if(p[i].getFitness()*100000 < min) {
				min = p[i].getFitness()*100000;
			}
		}
		return min/100000;
	}

	this.getMaximumFitness = function() {
		var max = 0;
		
		var pSize = this.poolSize;
		var p = this.pool;
		
		for(var i =0; i< pSize; i++) {
			if(p[i].getFitness() > max) {
				max = p[i].getFitness();
			}
		}
		return max;
	}
	
	this.selectParents = function() {
		var p = this.pool; //shortcut
		var pSize = this.poolSize;
		
		// calc cumulative fitness for parent selection
		if(!this.cumFitness) {		
			var c = new Array();
			p.sort(p[0].sort);
			c[0] = p[0].getFitness();
			for (var i=1; i<pSize; i++) {
				c[i] = c[i-1] + p[i].getFitness();
			}
			this.cumFitness = c;
		}
		
		var cumFitness = this.cumFitness;

		var maxCumFitness = cumFitness[cumFitness.length-1];
		var aFitness = this.getAverageFitness();
		var mFitness = this.getMaximumFitness();

		// pick two parents based on fitness
		var randomFitness1 = Math.random() * maxCumFitness;
		var randomFitness2 = Math.random() * maxCumFitness;

		/*
		while(randomFitness1 <= (aFitness * maxCumFitness + mFitness * maxCumFitness * 2)/3.1) {
			randomFitness1 = Math.random() * maxCumFitness;
		}
		while(randomFitness2 <= (aFitness * maxCumFitness + mFitness * maxCumFitness * 2)/3.1) {
			randomFitness2 = Math.random() * maxCumFitness;
		}
		*/


		var parent1 = null;
		var parent2 = null;
		var i = cumFitness.length-1;
		var j1=0;
		var j2=0;


		if(ga.bestFitBias > Math.random()) {
			parent1 = p[pSize-1];
			parent2 = p[pSize-2];
		}


		while(parent1 == null || parent2 == null) {
			if(randomFitness1 >= cumFitness[i-j1]) {
				if(parent1 == null) {
					var idx = Math.round(i - j1*Math.random());
					if(idx == (i-j1)) {
						idx++;
					}
					ga.log("Idx: " + idx);
					parent1 = p[idx];
					if(parent2!=null && parent2.getId() == parent1.getId()) {
						if(idx<i){
							idx++;
						} else {
							idx--;
						}
						parent1 = p[idx];
						ga.log("Picked parent1 with id of " + parent1.getId() + " and fitness of " + parent1.getFitness());
						j1=0;
						break; // done
					}
				}
			} else {
				if(j1<i) {
					j1++;
				} else {
					// pick the highest fitness parent as last resort
					parent1 = p[i];
					ga.log("Picked parent1 with id of " + parent1.getId() + " and fitness of " + parent1.getFitness());
					j1=0;
				}
			}

			if(randomFitness2 >= cumFitness[i-j2]) {
				if(parent2 == null) {
					var idx = Math.round(i - j2*Math.random());
					if(idx == (i-j2)) {
						idx++;
					}
					ga.log("Idx: " + idx);
					parent2 = p[idx];
					if(parent1!=null && parent2.getId() == parent1.getId()) {
						if(idx<i){
							idx++;
						} else {
							idx--;
						}
						parent2 = p[idx];
						ga.log("Picked parent2 with id of " + parent2.getId() + " and fitness of " + parent2.getFitness());
						j2=0;
						break; // done
					}
				}
			} else {
				if(j2<i) {
					j2++;
				} else {
					// pick the next highest fitness parent as last resort
					parent2 = p[i-1];
					ga.log("Picked parent2 with id of " + parent1.getId() + " and fitness of " + parent1.getFitness());
					j2=0;
				}
			}
		}
		
		return [parent1,parent2];	
	
	}
	
	this.runGeneration = function() {
		var newPool = new Array();
		this.cumFitness = null;
		
		// pool size counter
		var i=0;
		var fn = this.selectParents; //shortcut
		var p = this.pool; //shortcut

		while(newPool.length < this.numOfOffspringToKeep) {			
		
			var parents = fn.call(this);
			if(!parents || !parents.length || parents.length!=2) {
				ga.log("Fatal error: could not find parents!", LOG_LEVEL);
				return false;				
			}
			
			var offspring1 = parents[0].clone();
			var offspring2 = parents[1].clone();
			

			// cross over
			if(Math.random() > ga.crossOveProbability) {
				// locus point in each chromosome where to perform the crossover
				var loci = Math.round((p[i].size-1) * Math.random())
				ga.log("Original offspring chromosome values: " + offspring1.getBits() + " , " + offspring2.getBits());
				ga.crossOver(offspring1, offspring2, loci);
				ga.log("Offspring chromosome values after crossover at locus " + loci + ": " + offspring1.getBits() + " , " + offspring2.getBits());
			} else {
				ga.log("No crossover this time");
			}


			// mutate each offspring
			ga.log("Offspring chromosome values prior to possible mutation: " + offspring1.getBits() + " , " + offspring2.getBits());
			offspring1.mutate();
			offspring2.mutate();
			ga.log("Offspring chromosome values after possible mutation: " + offspring1.getBits() + " , " + offspring2.getBits());

			// add to the pool
			newPool.push(offspring1);
			ga.log("Added offspring with ID of " + offspring1.getId() + " and fitness of " + offspring1.getFitness());
			newPool.push(offspring2);
			ga.log("Added offspring with ID of " + offspring2.getId() + " and fitness of " + offspring2.getFitness());
			
			i++;
		}
		// release pool memory
		
		for(var i=0; i< p.length ; i++) {
			p[i] = null;
			delete(p[i]);
		}

		this.pool = newPool;
		this.poolSize = numOfOffspringToKeep;
		ga.log("Generation complete!", LOG_LEVEL);
		ga.log("New pool stats: Avg fitness - " + this.getAverageFitness() + " Min fitness - " + this.getMinimumFitness() + " Max fitness - " + this.getMaximumFitness(), LOG_LEVEL );
	}

	this.runNGenerations = function(n) {
		for(var i=0; i< n; i++) {
			this.runGeneration();
		}
	}

	this.printPool = function() {
		var str = "|";
		for(var i=0; i<this.poolSize; i++) {
			str+=(this.pool[i].getBits() + "|");
		}
		ga.log(str, LOG_LEVEL);
		return str;
	}

}









