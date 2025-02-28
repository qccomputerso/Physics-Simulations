const c = document.getElementById("c"), ctx = c.getContext("2d");
const initial = [200, 0];
const dt = 0.02;
const Methods = {
	Euler: {
		color: "#C13F3F",
		y: [...initial]
	},
	Leapfrog: {
		color: "#EEEE5F",
		y: [...initial]
	},
	"Third Order": {
		color: "#3EBCBC",
		y: [...initial]
	},
	Exact: {
		color: "#3FBF47",
		y: [...initial]
	},
}
let t = 0;
let paused = false;
function d2y(x) {
	return -9 * x;
}
function d3y(dx) {
	return -9 * dx;
}

function calculate() {
	t += dt;
	Methods.Exact.y[0] = 200 * Math.cos(3 * t);
	Methods.Exact.y[1] = -400 * Math.sin(3 * t);
	const oldCE = Methods.Euler.y[0];
	Methods.Euler.y[0] += dt * Methods.Euler.y[1];
	Methods.Euler.y[1] += d2y(oldCE) * dt;
	const oldCL = Methods.Leapfrog.y[0];
	Methods.Leapfrog.y[0] += dt * (Methods.Leapfrog.y[1] + 0.5 * d2y(Methods.Leapfrog.y[0]) * dt);
	Methods.Leapfrog.y[1] += (d2y(oldCL) + d2y(Methods.Leapfrog.y[0])) / 2 * dt;
	const oldCT = Methods["Third Order"].y[0];
	Methods["Third Order"].y[0] += dt * (Methods["Third Order"].y[1] + dt * 0.5 * (d2y(oldCT) + d3y(Methods["Third Order"].y[1]) * dt / 3));
	Methods["Third Order"].y[1] += dt * (d2y(oldCT) + dt * 0.5 * (d3y(Methods["Third Order"].y[1]) + d2y(d2y(oldCT + Methods["Third Order"].y[0])) * dt / 6));
}
function render() {
	if (!paused) calculate();
	c.width = innerWidth;
	c.height = innerHeight;
	ctx.textAlign = "center";
	ctx.textAnchor = "middle";
	ctx.font = "20px Arial";
	let i = 0;
	for (let method in Methods) {
		i++
		ctx.beginPath();
		ctx.arc(innerWidth / 2 + Methods.Exact.y[0], i * 150, 50, 0, Math.PI * 2);
		ctx.fillStyle = Methods.Exact.color + "90";
		ctx.fill();
	}
	i = 0;
	for (let method in Methods) {
		i++
		ctx.beginPath();
		ctx.arc(innerWidth / 2 + Methods[method].y[0], i * 150, 50, 0, Math.PI * 2);
		ctx.fillStyle = Methods[method].color;
		ctx.fill();
		ctx.fillStyle = "white";
		ctx.fillText(method, innerWidth / 2 - 300, i * 150);
	}
}
setInterval(render, dt*1000);