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

	const resizeBase = {
		"table#blocks": {
			"height": ["{}px", 0.5, "height"],
			"border-spacing": ["{}px", 0.01, "height"]
		},
		"table#blocks>tr>td": {
			"border-radius": ["{}px", 0.01, "height"]
		},
		"div#paddleContainer": {
			"height": ["{}px", 0.07, "height"],
			"padding-left": ["{}px", 0.01, "width"],
			"padding-right": ["{}px", 0.01, "width"]
		},
		"div#paddleContainer>div.position": {
			"margin-top": ["{}px", 0.01, "height"],
			"margin-bottom": ["{}px", 0.01, "height"],
			"margin-left": ["{}px", 0.01, "width"],
			"margin-right": ["{}px", 0.01, "width"],
			"border-radius": ["{}px", 0.01, "height"]
		},
		"div#paddleContainer>div.position>div": {
			"padding-top": ["{}px", 0.009, "height"],
			"font-size": ["{}px", 0.025, "height"],
			"height": ["{}px", 0.041, "height"],
			"width": ["calc(100% + {}px)", 0.04, "width"],
			"margin-left": ["{}px", -0.02, "width"]
		},
		"div#ball": {
			"width": ["{}px", 10/300, "height"],
			"height": ["{}px", 10/300, "height"],
			"border-radius": ["{}px", 20/300, "height"]
		}
	}

	const sizes = {
		field: {
			width: 400,
			height: 300
		}
	};
	sizes.paddle = {
		height: sizes.field.height * 0.06
	}
	sizes.blocks = {
		width: sizes.field.width / 10,
		height: sizes.field.height / 20
	}
	sizes.ball = sizes.field.height * 10/300 / 2;

	const resize = () => {
		const cw = document.documentElement.clientWidth;
		const ch = document.documentElement.clientHeight;
		const dims = {
			width: Math.min(cw, (ch) * sizes.field.width/sizes.field.height),
			height: Math.min(ch, (cw) * sizes.field.height/sizes.field.width)
		}
		sizes.dims = dims;

		document.body.style.width = dims.width + "px";
		document.body.style.height = dims.height + "px";
		document.body.style.marginLeft = Math.max(0, (cw-dims.width)/2) + 'px';
		document.body.style.marginTop = Math.max(0, (ch-dims.height)/2) + 'px';

		const sheet = document.getElementById('resizingStyle').sheet;
		while(sheet.cssRules.length > 0){
			sheet.deleteRule(0);
		}
		for(let selector in resizeBase){
			let propertyText = "";
			for(let property in resizeBase[selector]){
				const template = resizeBase[selector][property];
				const value = template[0].replace(/\{\}/, template[1] * dims[template[2]]);
				propertyText += `${property}:${value};`
			}
			sheet.insertRule(`${selector}{${propertyText}}`)
		}
	}

	window.addEventListener('resize', resize);

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
	const paddle = {
		dom: document.getElementById('paddle')
	}

	const positions = [{active: true}];
	let activePosition = positions[0];
	let timeSinceGrow = 1;
	const growTime = 30000;

	let currentWord = '';

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

		currentWord = '';

		sizes.paddle.width = sizes.field.width * (0.02 + 0.98 / num);
	}

	let numPositions = 10;
	makePositions(numPositions);

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

	const ball = {
		pos: {
			x: 30,
			y: sizes.field.height - sizes.paddle.height - sizes.ball
		},
		speed: {
			x: 100,
			y: -100
		},
		dom: document.getElementById('ball')
	};

	console.log(sizes);

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
		ball.pos.x += ball.speed.x * delta / 1000;
		ball.pos.y += ball.speed.y * delta / 1000;
		//TODO collision
		ball.dom.style.left = (ball.pos.x * sizes.dims.width / sizes.field.width) + 'px';
		ball.dom.style.top = (ball.pos.y * sizes.dims.height / sizes.field.height) + 'px';
		window.requestAnimationFrame(step);
	}

	resize();
	window.requestAnimationFrame(step);
});