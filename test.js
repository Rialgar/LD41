window.addEventListener('load', () => {
	const growTime = 30000;
	const growSteps = 4;
	const func = (minLength, maxLength, timeSinceGrow, attempts) => minLength + Math.floor((maxLength-minLength + 1) * Math.pow(Math.random(), (2.6*growTime)/(timeSinceGrow + attempts)));
	const test = timeSinceStart => {
		minLength = Math.floor(timeSinceStart / growTime);
		maxLength = minLength + 4;
		timeSinceGrow = Math.max(1, timeSinceStart % growTime);
		return func(minLength, maxLength, timeSinceGrow, 0);
	}

	const canvas = document.querySelector('canvas');
	canvas.width = 1000;
	canvas.height = 800;

	const counting_ms = 1000;
	const fps = 70;
	const msPerFrame = 1000 / fps;

	let count = 0;
	let start = Date.now();
	while(Date.now() - start < counting_ms) {
		test(growTime/2);
		count = count+1;
	}
	const timePerPx = (growTime * growSteps) / canvas.width;
	const sampleCountPerFrame = count / counting_ms * msPerFrame;
	const widthCoveredPerFrame = Math.ceil(msPerFrame / timePerPx);
	const sampleCount = sampleCountPerFrame / widthCoveredPerFrame;

	const sample = (x) => {
		const results = [];
		while(results.length < sampleCount || results.length%2 === 0){
			results.push(test(x * timePerPx));
		}
		results.sort((a,b) => a-b);
		const min = results[0];
		const max = results[results.length-1];
		const median = results[(results.length+1)/2];
		const sum = results.reduce( (a, b) => a+b, 0);
		const avg = sum/results.length;

		return {min, max, avg, median};
	}

	const yFromValue = y => 5 + Math.floor( (1-y/(growSteps+4)) * (canvas.height-10) );

	let x = 0
	const ctx = canvas.getContext('2d');

	let startTime = 0;
	frame = time => {
		while(x < canvas.width && x * timePerPx < time-startTime){
			const result = sample(x);
			ctx.fillStyle = 'white';
			ctx.fillRect(x, yFromValue(result.avg), 1, 1);
			ctx.fillStyle = 'red';
			ctx.fillRect(x, yFromValue(result.min), 1, 1);
			ctx.fillStyle = 'green';
			ctx.fillRect(x, yFromValue(result.max), 1, 1);
			ctx.fillStyle = 'yellow';
			ctx.fillRect(x, yFromValue(result.median), 1, 1);
			x = x+1;
		}
		if(x < canvas.width) {
			window.requestAnimationFrame(frame);
		} else {
			canvas.style.borderColor = 'gold';
		}
	}
	first = time => {
		startTime = time;
		window.requestAnimationFrame(frame);
	}
	window.requestAnimationFrame(first);
});