'use strict';
window.addEventListener('load', () => {

	Array.prototype.random = function() {
		const index = Math.floor(this.length * Math.random());
		return this[index];
	}
	Array.prototype.shuffle = function() {
		for (let i = this.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i+1));
			[this[i], this[j]] = [this[j], this[i]];
		}
		return this;
	}

	const words = [];
	(() => {
		let i = 0, list = [];
		do {
			list = window.commonWords.filter( w => w.length == i+2); // we skip words of length 1, because those break everything when we try to be prefix free
			words[i] = list;
			i = i+1;
		} while (list.length > 0)
		words.length = words.length-1;
	})()

	const blocksTable = document.getElementById('blocks');
	const blocks = [];
	for(let y = 0; y < 10; y++){
		blocks[y] = [];
		const row = document.createElement('tr');
		blocksTable.appendChild(row);
		for(let x = 0; x < 10; x++){
			const cell = document.createElement('td');
			row.appendChild(cell);
			blocks[y][x] = {
				dom: cell
			}
		}

	}
	const paddleContainer = document.getElementById('paddleContainer');

	const positions = [];
	let timeSinceGrow = 1;
	const growTime = 30000;

	const makePositions = num => {
		positions.length = 0;

		const chosenWords = [];
		const prefixCheck = wordA => wordB => wordA.startsWith(wordB) || wordB.startsWith(wordA);
		const maxLength = words.length - (num-2) - 1; //use max max length when only 2 are left
		const minLength = 10 - num; //use min min length when all 10 are left
		for (let x=0; x < num; x++){
			let word;
			let attempts = 0;
			do {
				let wordLength = minLength + Math.floor((maxLength-minLength + 1) * Math.pow(Math.random(), (2.6*growTime)/(timeSinceGrow + attempts)));
				if(!words[wordLength]){
					console.error(wordLength, words, maxLength, minLength, timeSinceGrow, attempts);
					wordLength = wordLength - 1;
				}
				word = words[wordLength].random();
				attempts = attempts + 1;
			} while (!!chosenWords.find(prefixCheck(word)))
			chosenWords.push(word);

			positions[x] = {
				word: word
			}
		}
		positions.shuffle();

		paddleContainer.innerHTML = '';
		for(let pos of positions){
			const div = document.createElement('div');
			div.textContent = pos.word;
			pos.dom = div;
			paddleContainer.appendChild(div);
		}
	}

	let numPositions = 10;
	makePositions(numPositions);

	const keysDown = {};
	window.addEventListener('keydown', ev => {
		keysDown[ev.key] = true;
		console.log(ev.key);
	});
	window.addEventListener('keyup', ev => {
		keysDown[ev.key] = false;
	});

	let lastTime = 0;
	const step = (time) => {
		const delta = time - lastTime;
		lastTime = time;
		timeSinceGrow += delta;
		if(timeSinceGrow > growTime && numPositions > 2){
			numPositions = numPositions-1;
			timeSinceGrow = 1;
			makePositions(numPositions);
		} else if (keysDown['Enter']) {
			makePositions(numPositions);
		}
		window.requestAnimationFrame(step);
	}

	window.requestAnimationFrame(step);
});