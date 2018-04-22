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
			console.log(list[0]);
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
	const paddle = {
		dom: document.getElementById('paddle')
	}

	const positions = [{active: true}];
	let activePosition = positions[0];
	let timeSinceGrow = 1;
	const growTime = 30000;

	const makePositions = num => {
		positions.length = num;
		if(!positions.includes(activePosition)){
			activePosition = positions[positions.length-1]
			activePosition.active = true;
		}

		const chosenWords = [];
		const prefixCheck = wordA => wordB => wordA.startsWith(wordB) || wordB.startsWith(wordA);
		const maxLength = words.length - (num-2) - 1; //use max max length when only 2 are left
		const minLength = 10 - num; //use min min length when all 10 are left
		while(chosenWords.length < num){
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
		}
		chosenWords.shuffle();

		paddleContainer.innerHTML = '';
		for(let x = 0; x < num; x++){
			if(!positions[x]){
				positions[x] = {};
			}
			const pos = positions[x];
			pos.word = chosenWords[x];
			const div = document.createElement('div');
			div.className = 'position';
			div.appendChild(document.createElement('div'));
			div.firstElementChild.textContent = pos.word;
			pos.dom = div;
			if(pos.active){
				pos.dom.classList.add('active');
			}
			paddleContainer.appendChild(div);
		}
	}

	let numPositions = 10;
	makePositions(numPositions);

	let currentWord = '';
	window.addEventListener('keydown', ev => {
		if(ev.key.match(/^[a-z]$/i)){
			currentWord += ev.key.toLowerCase();
			const match = positions.find(pos => pos.word === currentWord);
			if(match){
				activePosition.active = false;
				match.active = true;
				activePosition = match;
				currentWord = '';
				makePositions(numPositions);
			} else {
				let found = false;
				for(let pos of positions){
					if(pos.word.startsWith(currentWord)){
						found = true;
						const tail = pos.word.substring(currentWord.length);
						pos.dom.firstElementChild.innerHTML = `<span class="match">${currentWord}</span>${tail}`;
					} else {
						pos.dom.firstElementChild.innerHTML = pos.word;
					}
				}
				if(!found){
					currentWord = '';
				}
			}
		}
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
		}
		window.requestAnimationFrame(step);
	}

	window.requestAnimationFrame(step);
});