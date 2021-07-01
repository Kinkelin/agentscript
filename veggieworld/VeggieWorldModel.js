import World from '../src/World.js'
import Model from '../src/Model.js'
import * as util from '../src/utils.js'

export default class VeggieWorldModel extends Model {
	reproductionThreshold = 0; //Config constants here

    // ======================

    constructor(worldDptions = World.defaultOptions(100)) { //World size
        super(worldDptions)
    }
	
	randomTerrain() {
		return this.patchTypes[util.randomInt(4)];
	}
	
	randomTerrainWeighted() {
		let r = Math.random();
		if (r < 0.35) return 'plains';
		if (r < 0.60) return 'jungle';
		if (r < 0.87) return 'desert';
		return 'mountain';
	}
	
	randomMountain(p) {
		return (Math.random() < 0.15) ? 'mountain' : p.oldType;
	}
	
	spawnVegetation() {
		//Bush
		this.patches.ask(p => {
			if (Math.random() < this.bushSpawnRates[p.type]) this.bush.createOne(t => {
				t.x = p.x;
				t.y = p.y;
				t.heading = 90;
				t.energy = 30;
			})
        });
		//grass
		this.patches.ask(p => {
			if (p.type == 'plains' && Math.random() < this.grassSpawnRate) this.grass.createOne(t => {
				t.x = p.x;
				t.y = p.y;
				t.heading = 90;
				t.energy = 5;
			})
        });
		//Fern
		this.patches.ask(p => {
			if (p.type == 'jungle' && Math.random() < this.fernSpawnRate) this.fern.createOne(t => {
				t.x = p.x;
				t.y = p.y;
				t.heading = 90;
				t.energy = 15;
			})
        });
		//cactus
		this.patches.ask(p => {
			if (p.type == 'desert' && Math.random() < this.cactusSpawnRate) this.cactus.createOne(t => {
				t.x = p.x;
				t.y = p.y;
				t.heading = 90;
				t.energy = 10;
			})
        });
		//Fruit
		this.spawner.ask(p => {
			let r1 = Math.random();
			let r2 = util.randomInt(10)-5;
			let r3 = util.randomInt(10)-5;
			if (p.breed.name == 'tree' && r1 < this.fruitSpawnRateTree) this.fruit.createOne(t => {
				t.x = p.x+r2;
				t.y = p.y+r3;
				t.heading = 90;
				t.energy = 20;
			})
			if (p.breed.name == 'sequoia' && r1 < this.fruitSpawnRateTree) this.fruit.createOne(t => {
				t.x = p.x+r2;
				t.y = p.y+r3;
				t.heading = 90;
				t.energy = 20;
			})
        });
	}
	
	setup() {
		
		this.turtleBreeds('spawner energySource agent')
		this.spawner.breeds = {}
		this.energySource.breeds = {}
		this.agent.breeds = {}
		
		this.tree = this.spawner.newBreed('tree');
		this.sequoia = this.spawner.newBreed('sequoia');
		
		this.grass = this.energySource.newBreed('grass');
		this.fern = this.energySource.newBreed('fern');
		this.cactus = this.energySource.newBreed('cactus');
		this.bush = this.energySource.newBreed('bush');
		this.fruit = this.energySource.newBreed('fruit');
		
		this.patchBreeds('plains jungle mountain desert');
		
        this.patchTypes = [
            'plains',
            'jungle', 
            'mountain',
            'desert'
        ]
		
		this.terrainEnergyCost = {
			plains: 1,
			mountain: 2,
			jungle: 3,
			desert: 4
		}
		
		this.treeSpawnRates = {
			plains: 0.002,
			jungle: 0.005,
			mountain: 0.005,
			desert: 0
		}
		
		this.bushSpawnRates = {
			plains: 0.00002,
			jungle: 0.00004,
			mountain: 0.00001,
			desert: 0
		}
		
		this.sequoiaSpawnRate = 0.0002;
		this.fernSpawnRate = 0.00005;
		this.cactusSpawnRate = 0.00005;
		this.grassSpawnRate = 0.00005;
		this.fruitSpawnRateTree = 0.010;
		this.fruitSpawnRateSequoia = 0.020;
		
		//Initialize randomly weighted 
		this.patches.ask(p => {
            p.type = this.randomTerrainWeighted();
        });
		
		//Smooth out biomes, multiple cellular automata algorithm passes
		for (let i = 0; i<15;i++) this.patches.ask(p => {
			let neighbours = this.patches.neighbors(p);
			let typeCount = 0;
			for (let j = 0; j < neighbours.length; j++) {
				if (neighbours[j].type == p.type) typeCount++;
			}
			if (typeCount < Math.ceil((15-i)/3)) p.type = this.randomTerrain();
		});
		
		//Plant trees
		this.patches.ask(p => {
			if (Math.random() < this.treeSpawnRates[p.type]) this.tree.create(1, t => {
				t.x = p.x;
				t.y = p.y;
				t.heading = 90;
			})
        });
		
		//Plant sequoias
		this.patches.ask(p => {
			if (p.type == 'jungle' && Math.random() < this.sequoiaSpawnRate) this.sequoia.create(1, t => {
				t.x = p.x;
				t.y = p.y;
				t.heading = 90;
			})
        });
		
		for (let i = 0; i < 10; i++) this.spawnVegetation();
		
		this.agent.create(50, t => {
			t.x = util.randomInt(100);
			t.y = util.randomInt(100);
			t.energy = 20;
		});
	   
	 
	}
	
	agentStepMonkey() {
		let direction = Math.random() * 360;
		let speed = Math.random() * 3;
		return [direction, speed];
	}
	
	 step() {

		 this.spawnVegetation();
			
		 this.agent.ask(a => {
			let decisions = this.agentStepMonkey();
			a.heading = decisions[0];
			a.forward(decisions[1]);
			a.energy -= this.terrainEnergyCost[a.patch.type];
			if (a.energy <= 0) a.die();
			 
		 });
		 	
		 this.agent.ask(a => {
			let neighbour = this.agent.closestTurtle(a.x,a.y,1.5);
			if (neighbour != null) {
				let agentEnergy = a.energy;
				a.energy -= neighbour.energy;
				neighbour.energy -= agentEnergy;
				if (a.energy <= 0) a.die();
				if (neighbour.energy <= 0) neighbour.die();
			}
		 });
		 this.agent.ask(a => {
			let food = this.energySource.closestTurtle(a.x,a.y,1);
			if (food != null) {
				a.energy += food.energy;
				food.die();
			}	
			 
		 });
		 console.log("step");
	 }
}
