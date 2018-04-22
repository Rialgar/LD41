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
		"body": {
			"font-size": ["{}px", 0.025, "height"],
		},
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
			"height": ["{}px", 0.041, "height"],
			"width": ["calc(100% + {}px)", 0.04, "width"],
			"margin-left": ["{}px", -0.02, "width"]
		},
		"div#ball": {
			"width": ["{}px", 10/300, "height"],
			"height": ["{}px", 10/300, "height"],
			"border-radius": ["{}px", 20/300, "height"]
		},
		"div#alert" : {
			"left": ["{}px", 0.2, "width"],
			"width": ["{}px", 0.6, "width"],
			"top": ["{}px", 0.2, "height"],
			"height": ["{}px", 0.6, "height"]
		},
		"svg": {
			"width": ["{}px", 1, "width"],
			"height": ["{}px", 1, "height"]
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
				dom: cell,
				alive: true,
				top: y*sizes.blocks.height,
				cy: (y+0.5)*sizes.blocks.height,
				bottom: (y+1)*sizes.blocks.height,
				left: x*sizes.blocks.width,
				cx: (x+0.5)*sizes.blocks.width,
				right: (x+1)*sizes.blocks.width
			}
		}

	}

	const findBlock = (px, py) => {
		for(let y = 0; y < blocks.length; y++){
			for(let x = 0; x < blocks.length; x++){
				if(
					blocks[y][x].left - sizes.ball < px && blocks[y][x].right + sizes.ball > px &&
					blocks[y][x].top - sizes.ball < py && blocks[y][x].bottom + sizes.ball > py &&
					blocks[y][x].alive
					)
				{
					return blocks[y][x];
				}
			}
		}
		return null;
	}

	const paddleContainer = document.getElementById('paddleContainer');
	const paddle = {
		dom: document.getElementById('paddle')
	}

	const positions = [{active: true, index: 0}];
	let activePosition = positions[0];
	let timeSinceGrow = 1;
	const growTime = 30000;

	let currentWord = '';

	const makePositions = (num, newWords) => {
		if(num < positions.length){
			positions.splice(Math.floor(positions.length/2), 1);
			if(!positions.includes(activePosition)){
				activePosition = positions[Math.floor(positions.length/2)];
				activePosition.active = true;
			}
		}

		const chosenWords = positions.map(p => p.word);

		if(newWords){
			currentWord = '';
			chosenWords.length = 0;
			const prefixCheck = wordA => wordB => wordA.startsWith(wordB) || wordB.startsWith(wordA);
			const maxLength = words.length - (num-3) - 1; //use max max length when only 3 are left
			const minLength = 10 - num; //use min min length when all 10 are left
			while(chosenWords.length < num){
				let word;
				let attempts = 0;
				do {
					let wordLength = minLength + Math.floor((maxLength-minLength + 1) * Math.pow(Math.random(), (3.5*growTime)/(timeSinceGrow + attempts)));
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
		}

		paddleContainer.innerHTML = '';
		for(let x = 0; x < num; x++){
			if(!positions[x]){
				positions[x] = {index:x};
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

		if(!newWords){
			checkWord();
		}

		sizes.paddle.width = sizes.field.width * (0.02 + 0.98 / num);
	}

	let numPositions = 10;
	makePositions(numPositions, true);

	const checkWord = () => {
		let found = false;
		for(let pos of positions){
			if(!pos.active && pos.word.startsWith(currentWord)){
				found = true;
				const tail = pos.word.substring(currentWord.length);
				pos.dom.firstElementChild.innerHTML = `<span class="match">${currentWord}</span>${tail}`;
			} else {
				pos.dom.firstElementChild.innerHTML = pos.word;
			}
		}
		if(!found){
			if(currentWord.length > 1){
				currentWord = currentWord.slice(1);
				checkWord();
			} else {
				currentWord = '';
			}
		}
	}

	window.addEventListener('keydown', ev => {
		if(ev.key.match(/^[a-z]$/i)){
			ev.preventDefault();
			currentWord += ev.key.toLowerCase();
			const match = positions.find(pos => !pos.active && pos.word === currentWord);
			if(match){
				activePosition.active = false;
				match.active = true;
				activePosition = match;
				currentWord = '';
				makePositions(numPositions, true);
			} else {
				checkWord();
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
			y: -60
		},
		dom: document.getElementById('ball'),
		previewSize: 0
	};

	const looseBall = () => {
		ball.pos = {
			x: 10 + Math.random() * (sizes.field.width - 20),
			y: sizes.field.height - sizes.paddle.height - sizes.ball
		};
		ball.speed = {
			x: 100 * (Math.random() > 0.5 ? 1 : -1),
			y: -60
		};
		ball.previewSize += 20;
	}

	const getPushout = (pos, block) => {
		const out = {x:0 , y:0};
		if(pos.x < block.cx && pos.x + sizes.ball > block.left){
			out.x = block.left - sizes.ball - pos.x;
		} else if (pos.x > block.cx && pos.x - sizes.ball < block.right) {
			out.x = block.right + sizes.ball - pos.x;
		}
		if(pos.y < block.cy && pos.y + sizes.ball > block.top){
			out.y = block.top - sizes.ball - pos.y;
		} else if (pos.y > block.cy && pos.y - sizes.ball < block.bottom) {
			out.y = block.bottom + sizes.ball - pos.y;
		}
		return out;
	}

	const checkCollision = (point, speed, damage) => {
		const block = findBlock(point.x, point.y);
		if(block){
			if(damage){
				block.alive = false;
				block.dom.style.backgroundColor = 'transparent';
			}

			const pushout = getPushout(point, block);
			if(pushout.x * speed.x <= 0 && (pushout.y * speed.y > 0 || Math.abs(pushout.x) < Math.abs(pushout.y))){
				const scale = pushout.x / speed.x;
				point.x += pushout.x;
				point.y += speed.y * scale;
				speed.x *= -1;
			} else {
				const scale = pushout.y / speed.y;
				point.x += speed.x * scale;
				point.y += pushout.y;
				speed.y *= -1;
			}
		} else {
			const paddleCenter = (activePosition.index + 0.5) * sizes.field.width/numPositions;
			if (
				speed.y > 0 &&
				point.y > sizes.field.height - sizes.paddle.height - sizes.ball &&
				point.x > paddleCenter - sizes.paddle.width * 0.5 &&
				point.x < paddleCenter + sizes.paddle.width * 0.5
				)
			{
				speed.y *= -1;
			} if (point.y > sizes.field.height - sizes.ball){
				if(damage){
					looseBall();
				} else {
					speed.x = 0;
					speed.y = 0;
				}
			} else if (speed.y < 0 && point.y < sizes.ball){
				speed.y *= -1;
			}
		}

		if (point.x < sizes.ball || point.x > sizes.field.width - sizes.ball){
			speed.x *= -1;
		}
	}

	const move = (point, speed, delta, damage) => {
		point.x += speed.x * delta / 1000;
		point.y += speed.y * delta / 1000;

		checkCollision(point, speed, damage);
	}

	const myalert = (text, cb) => {
		document.getElementById('alert').style.display = 'flex';
		document.getElementById('alertText').textContent = text;

		const button = document.getElementById('alertButton');
		const listener = () => {
			document.getElementById('alert').style.display = 'none';
			button.removeEventListener('click', listener);
			cb();
		};
		button.addEventListener('click', listener);
		button.focus();
	}

	const win = () => {
		myalert('You won!! Please rate and comment on ldjam.com! Click OK to go there.', () => {
			window.location.href = "https://ldjam.com/events/ludum-dare/41/$89582";
		});
	}

	const loose = () => {
		myalert('You lost :(. Please rate and comment on ldjam.com! Click OK to retry.', () => {
			window.reload();
		});
	}

	const polyline = document.getElementById("future");

	let lastTime = 0;
	let avgDelta = 16.666;
	const step = (time) => {
		const delta = Math.min(30, time - lastTime);
		avgDelta = (99*avgDelta + delta)/100;
		lastTime = time;
		timeSinceGrow += delta;
		if(timeSinceGrow > growTime && numPositions > 3){
			numPositions = numPositions-1;
			timeSinceGrow = 1;
			makePositions(numPositions);
		}

		move(ball.pos, ball.speed, delta, true);

		ball.dom.style.left = (ball.pos.x * sizes.dims.width / sizes.field.width) + 'px';
		ball.dom.style.top = (ball.pos.y * sizes.dims.height / sizes.field.height) + 'px';

		const nextPoint = {...ball.pos};
		const nextPoints = [{...nextPoint}];
		const nextDir = {...ball.speed};
		while(nextPoints.length < ball.previewSize && (nextDir.x !== 0 || nextDir.y !== 0)){
			move(nextPoint, nextDir, avgDelta, false);
			nextPoints.push({...nextPoint});
		};
		polyline.setAttribute('points', nextPoints.map(p => `${p.x} ${p.y}`).join(' '));

		if(!blocks.find(row => row.find(block => block.alive))){
			win();
		} else if(ball.previewSize > 600){
			loose();
		} else {
			window.requestAnimationFrame(step);
		}
	}

	resize();
	myalert('This is a typing game, type the words to move the paddle.', () => {
		window.requestAnimationFrame(step);
	});

	window.win = win;
});