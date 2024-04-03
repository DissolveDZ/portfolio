window.addEventListener('scroll', function() {
	var scrollPosition = 1 - window.scrollY / 750; // Adjust 500 as needed for the fade-out speed
	var fadeOutText = document.querySelector('.fade-out-text');
	if (fadeOutText) {
		fadeOutText.style.opacity = scrollPosition > 0 ? scrollPosition : 0;
	}
});

// Fade-in

const observer = new IntersectionObserver((entries) => {
	entries.forEach((entry) => {
		console.log(entry);
		if (entry.isIntersecting) {
			entry.target.classList.add('show');
		} else {
			entry.target.classList.remove('show');
		}
	});
});


// LOD Toggle

const hiddenElements = document.querySelectorAll('.hidden');
hiddenElements.forEach((el) => observer.observe(el));

let isHigh = true;

const toggleText = document.getElementById('toggleText');

toggleText.addEventListener('click', function() {
	isHigh = !isHigh; // Toggle the boolean value

	if (isHigh) {
		toggleText.textContent = 'High';
		toggleText.style.textShadow = '0 0 10px deepskyblue';
		toggleText.style.color = 'deepskyblue';
	} else {
		toggleText.textContent = 'Low';
		toggleText.style.textShadow = '0 0 10px red';
		toggleText.style.color = 'red';
	}
});

// Canvas
document.addEventListener('DOMContentLoaded', function() {
	const canvas = document.getElementById('graphCanvas');
	const ctx = canvas.getContext('2d');


	// Generate unique CSS classes for each image with alternating rotation directions
	function generateCSSClasses() {
		const images = document.querySelectorAll('.panel-wrapper img');
		images.forEach((image, index) => {
			let rotationDegrees;
			if (index % 2 === 0) {
				rotationDegrees = (5); // Rotate clockwise for even indices
			} else {
				rotationDegrees = -(5); // Rotate counterclockwise for odd indices
			}
			const scalePercentage = 125; // Example: Vary scale by index
			const cssClass = `.image${index + 1}:hover {
            transform: rotate(${rotationDegrees}deg) scale(${scalePercentage}%);
        }`;
			// Create <style> element and append to <head>
			const style = document.createElement('style');
			style.innerHTML = cssClass;
			document.head.appendChild(style);
			// Add unique class to image element
			image.classList.add(`image${index + 1}`);
		});
	}

	// Call the function to generate CSS classes
	generateCSSClasses();


	// Function to set canvas size
	function setCanvasSize() {
		const { width, height } = canvas.getBoundingClientRect();
		canvas.width = width > 100 ? width : 100;
		canvas.height = height > 100 ? height : 100;
	}
	setCanvasSize();

	window.addEventListener('resize', () => {
		const oldCanvasWidth = canvas.width;
		setCanvasSize();
		const widthRatio = canvas.width / oldCanvasWidth;
		adjustGraphScale(widthRatio);
	});

	// Array to hold plotted points
	const points = [];

	// Function to draw axes
	function drawAxes() {
		ctx.beginPath();
		ctx.strokeStyle = '#888';
		ctx.lineWidth = 2.5;
		// X axis
		ctx.moveTo(0, canvas.height / 2);
		ctx.lineTo(canvas.width, canvas.height / 2);
		// Y axis
		ctx.moveTo(canvas.width / 2, 0);
		ctx.lineTo(canvas.width / 2, canvas.height);
		ctx.stroke();
	}

	// Function to draw a circle
	function drawCircle(pos, radius, color) {
		ctx.beginPath();
		ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
		ctx.fillStyle = color;
		ctx.fill();
	}

	// Function to draw text
	function drawText(text, x, y, color, align) {
		ctx.fillStyle = color;
		ctx.textAlign = align;
		ctx.font = 'bold 30px Arial';
		ctx.fillStyle = 'white';
		ctx.fillText(text, x, y);
	}

	// Set the desired plotting speed (in pixels per second)
	const POINT_SPEED = 150;

	// Function to adjust the graph's x position to account for the change of scale
	function adjustGraphScale(widthRatio) {
		points.forEach(point => {
			point.x *= widthRatio;
		});
	}

	// Function to animate graph
	function animate() {
		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (isHigh) {
		// Draw axes
		drawAxes();
			// Draw lines with cubic Bezier curves
			for (let i = 0; i < points.length - 1; i++) {
				if (i === 0) {

					// First point, draw a line to it
					ctx.beginPath();
					ctx.moveTo(points[i].x, points[i].y);
					ctx.lineTo(points[i].x, points[i].y);
					ctx.stroke();
				} else {
					// Draw a cubic Bezier curve from the previous to the current point
					const cp1x = (points[i - 1].x + points[i].x) / 2;
					const cp1y = points[i - 1].y;
					const cp2x = (points[i - 1].x + points[i].x) / 2;
					const cp2y = points[i].y;

					const lineColor = (cp1y > cp2y) ? 'lightgreen' : 'rgb(255, 150, 150)';
					ctx.lineWidth = 10;
					ctx.strokeStyle = lineColor;
					ctx.beginPath();
					ctx.moveTo(points[i - 1].x, points[i - 1].y);
					ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i].x, points[i].y);
					ctx.stroke();
				}
			}

			// Draw circles
			points.forEach(point => {
				drawCircle(point, 20, 'deepskyblue');
				const textHeight = 20;
				const textOffset = point.y < canvas.height / 2 ? textHeight + 10 : -10;
				drawText((canvas.height / 2 - point.y).toFixed(2) + '$', point.x, point.y + textOffset, '#fff', 'center');
			});

		}
		// Calculate delta time since last frame
		const currentTime = Date.now();
		const deltaTime = (currentTime - previousTime) / 1000; // Convert to seconds
		previousTime = currentTime;

		// Move points to the left with distance relative to screen width
		const screenWidth = window.innerWidth;
		const distanceToMove = (POINT_SPEED * deltaTime) * (canvas.width / screenWidth);
		points.forEach(point => {
			point.x -= distanceToMove;
		});

		// Check if it's time to add a new point
		if (currentTime - lastPointAddTime >= 250) { // Add new point every half second
			const lastX = points.length > 0 ? points[points.length - 1].x : canvas.width;
			const newY = Math.random() * canvas.height;
			points.push({ x: lastX + 50 + POINT_SPEED * 0.5, y: newY });
			lastPointAddTime = currentTime;
		}

		// Remove points that are off-screen
		while (points.length > 0 && points[0].x < -250) {
			points.shift();
		}


		requestAnimationFrame(animate);
	}

	let previousTime = Date.now();
	let lastPointAddTime = Date.now();
	animate();
});
