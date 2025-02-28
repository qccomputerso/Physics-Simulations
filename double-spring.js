function toExpr(expr) {
	return expr instanceof Expr ? expr : new Constant(expr);
}

class Expr {
	add(expr) {
		return Add(this, expr);
	}
	sub(expr) {
		return Sub(this, expr);
	}
	mul(expr) {
		return Mul(this, expr);
	}
	div(expr) {
		return Div(this, expr);
	}
	pow(num) {
		return Pow(this, num);
	}
}

class Constant extends Expr {
	value;
	constructor(value) {
		super();
		this.value = value;
	}

	eval() {return this.value;}

	dt() {return 0;}

	get opCount() { return 1; }
}

class Var extends Expr {
	name = "x";
	constructor(name) {
		super();
		this.name = name;
	}

	eval(obj) {
		if (obj[this.name] !== undefined) return obj[this.name];
		else throw "Var not found";
	}

	dt() {
		return new Var("d" + this.name);
	}

	get opCount() { return 1; }
}

class ExprNeg extends Expr {
	expr1;
	constructor(expr1) {
		super();
		this.expr1 = toExpr(expr1);
	}

	eval(obj) {
		return -this.expr1.eval(obj);
	}

	dt() {
		return Neg(this.expr1.dt());
	}

	
	get opCount() { return 1 + this.expr1.opCount; }
}

class ExprAdd extends Expr {
	expr1;
	expr2;
	constructor(expr1, expr2) {
		super();
		this.expr1 = toExpr(expr1); this.expr2 = toExpr(expr2);
	}

	eval(obj) {
		return this.expr1.eval(obj) + this.expr2.eval(obj);
	}

	dt() {
		if (this.expr1 instanceof Constant) return this.expr2.dt();
		if (this.expr2 instanceof Constant) return this.expr1.dt();
		return Add(this.expr1.dt(), this.expr2.dt());
	}

	get opCount() { return this.expr1.opCount + this.expr2.opCount + 1; }
}

class ExprSub extends Expr {
	expr1;
	expr2;
	constructor(expr1, expr2) {
		super();
		this.expr1 = toExpr(expr1); this.expr2 = toExpr(expr2);
	}

	eval(obj) {
		return this.expr1.eval(obj) - this.expr2.eval(obj);
	}

	dt() {
		if (this.expr1 instanceof Constant) return Neg(this.expr2.dt());
		if (this.expr2 instanceof Constant) return this.expr1.dt();
		return Sub(this.expr1.dt(), this.expr2.dt());
	}

	get opCount() { return this.expr1.opCount + this.expr2.opCount + 1; }
}

class ExprMul extends Expr {
	expr1;
	expr2;
	constructor(expr1, expr2) {
		super();
		this.expr1 = toExpr(expr1); this.expr2 = toExpr(expr2);
	}

	eval(obj) {
		return this.expr1.eval(obj) * this.expr2.eval(obj);
	}

	dt() {
		if (this.expr1 instanceof Constant) return Mul(this.expr2.dt(), this.expr1);
		if (this.expr2 instanceof Constant) return Mul(this.expr1.dt(), this.expr2);
		return Add(Mul(this.expr1.dt(), this.expr2), Mul(this.expr1, this.expr2.dt()));
	}

	get opCount() { return this.expr1.opCount + this.expr2.opCount + 1; }
}

class ExprDiv extends Expr {
	expr1;
	expr2;
	constructor(expr1, expr2) {
		super();
		this.expr1 = toExpr(expr1); this.expr2 = toExpr(expr2);
	}

	eval(obj) {
		return this.expr1.eval(obj) / this.expr2.eval(obj);
	}

	dt() {
		return Sub(Div(this.expr1.dt(), this.expr2), Mul(this.expr1, this.expr2.dt()).mul(this.expr2.pow(-2)));
	}

	get opCount() { return this.expr1.opCount + this.expr2.opCount + 1; }
}

class ExprPow extends Expr {
	expr1;
	num;
	constructor(expr1, num) {
		super();
		this.expr1 = toExpr(expr1); this.num = num;
	}

	eval(obj) {
		return Math.pow(this.expr1.eval(obj), this.num);
	}

	dt() {
		return Mul(Mul(this.num, Pow(this.expr1, this.num - 1)), this.expr1.dt());
	}

	get opCount() { return this.expr1.opCount + 1; }
}

class ExprSin extends Expr {
	expr;
	amplitude;
	constructor(expr, am = 1) {
		super();
		this.expr = toExpr(expr);
		this.amplitude = am;
	}

	eval(obj) {
		return this.amplitude * Math.sin(this.expr.eval(obj));
	}

	dt() {
		return Mul(this.amplitude, Mul(Cos(this.expr), this.expr.dt()));
	}

	get opCount() { return this.expr.opCount + 1; }
}

class ExprCos extends Expr {
	expr;
	amplitude;
	constructor(expr, am = 1) {
		super();
		this.expr = toExpr(expr);
		this.amplitude = am;
	}

	eval(obj) {
		return this.amplitude * Math.cos(this.expr.eval(obj));
	}

	dt() {
		return Mul(this.amplitude, Mul(Neg(Sin(this.expr)), this.expr.dt()));
	}

	get opCount() { return this.expr.opCount + 1; }
}

function Neg(expr1) { return new ExprNeg(expr1); }
function Add(expr1, expr2) { return new ExprAdd(expr1, expr2); }
function Sub(expr1, expr2) { return new ExprSub(expr1, expr2); }
function Mul(expr1, expr2) { return new ExprMul(expr1, expr2); }
function Div(expr1, expr2) { return new ExprDiv(expr1, expr2); }
function Pow(expr1, num) { return new ExprPow(expr1, num); }
function Sin(expr, num = 1) { return new ExprSin(expr, num); }
function Cos(expr, num = 1) { return new ExprCos(expr, num); }


const c = document.getElementById("c"), ctx = c.getContext("2d");
const dt = 0.005;
const Methods = {
	Leapfrog: {
		color: "#EEEE5F",
		x: [140, 280],
		y: [0, 0],
		dx: [0, 0],
		dy: [0, 100],
	},
	"Third Order": {
		color: "#3EBCBC",
		x: [140, 280],
		y: [0, 0],
		dx: [0, 0],
		dy: [0, 100],
	},
	//Exact: {
	//	color: "#3FBF47",
	//	a: [...initial],
	//	da: [0, 0]
	//},
}
const g = 800;
const k = 30;
const l = 140;
const X1 = new Var("x1");
const dX1 = X1.dt();
const Y1 = new Var("y1");
const dY1 = X1.dt();
const X2 = new Var("x2");
const dX2 = X2.dt();
const Y2 = new Var("y2");
const dY2 = X2.dt();

const F1 = Div(l, X1.mul(X1).add(Y1.mul(Y1)).pow(0.5)).sub(1).mul(k);
const XDiff = X2.sub(X1), YDiff = Y2.sub(Y1);
const F2 = Div(l, XDiff.mul(XDiff).add(YDiff.mul(YDiff)).pow(0.5)).sub(1).mul(k);
const d2X1 = F1.mul(X1).sub(F2.mul(XDiff));
const d3X1 = d2X1.dt();
const d4X1 = d3X1.dt();
const d2Y1 = F1.mul(Y1).sub(F2.mul(YDiff)).add(g);
const d3Y1 = d2Y1.dt();
const d4Y1 = d3Y1.dt();
const d2X2 = F2.mul(XDiff);
const d3X2 = d2X2.dt();
const d4X2 = d3X1.dt();
const d2Y2 = F2.mul(YDiff).add(g);
const d3Y2 = d2Y2.dt();
const d4Y2 = d3Y2.dt();
function d2x([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]) {
	const v = { x1, x2, y1, y2, dx1, dx2, dy1, dy2 };
	return [d2X1.eval(v), d2X2.eval(v)];
}
function d2y([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]) {
	const v = { x1, x2, y1, y2, dx1, dx2, dy1, dy2 };
	return [d2Y1.eval(v), d2Y2.eval(v)];
}
function d3x([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]) {
	const [ddx1, ddx2] = d2x([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]);
	const [ddy1, ddy2] = d2y([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]);
	const v = { x1, x2, y1, y2, dx1, dx2, dy1, dy2, ddx1, ddx2, ddy1, ddy2 };
	return [d3X1.eval(v), d3X2.eval(v)];
}
function d3y([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]) {
	const [ddx1, ddx2] = d2x([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]);
	const [ddy1, ddy2] = d2y([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]);
	const v = { x1, x2, y1, y2, dx1, dx2, dy1, dy2, ddx1, ddx2, ddy1, ddy2 };
	return [d3Y1.eval(v), d3Y2.eval(v)];
}
function d4x([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]) {
	const [ddx1, ddx2] = d2x([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]);
	const [ddy1, ddy2] = d2y([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]);
	const [dddx1, dddx2] = d3x([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]);
	const [dddy1, dddy2] = d3y([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]);
	const v = { x1, x2, y1, y2, dx1, dx2, dy1, dy2, ddx1, ddx2, ddy1, ddy2, dddx1, dddx2, dddy1, dddy2 };
	return [d4X1.eval(v), d4X2.eval(v)];
}
function d4y([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]) {
	const [ddx1, ddx2] = d2x([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]);
	const [ddy1, ddy2] = d2y([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]);
	const [dddx1, dddx2] = d3x([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]);
	const [dddy1, dddy2] = d3y([x1, x2], [y1, y2], [dx1, dx2], [dy1, dy2]);
	const v = { x1, x2, y1, y2, dx1, dx2, dy1, dy2, ddx1, ddx2, ddy1, ddy2, dddx1, dddx2, dddy1, dddy2 };
	return [d4Y1.eval(v), d4Y2.eval(v)];
}


let t = 0;
let paused = false;

function calculate() {
	t += dt;
	let x, y, dx, dy, ax, ay;
	const L = Methods.Leapfrog;
	x = [...L.x];
	y = [...L.y];
	dx = [...L.dx];
	dy = [...L.dy];
	ax = d2x(x, y, dx, dy);
	ay = d2y(x, y, dx, dy);
	L.x[0] += dt * (dx[0] + 0.5 * dt * ax[0]);
	L.x[1] += dt * (dx[1] + 0.5 * dt * ax[1]);
	L.y[0] += dt * (dy[0] + 0.5 * dt * ay[0]);
	L.y[1] += dt * (dy[1] + 0.5 * dt * ay[1]);
	for (let i = 0; i < 100; i++) {
		let newAx = d2x(L.x, L.y, L.dx, L.dy);
		let newAy = d2y(L.x, L.y, L.dx, L.dy);
		L.dx[0] = dx[0] + (ax[0] + newAx[0]) * 0.5 * dt;
		L.dx[1] = dx[1] + (ax[1] + newAx[1]) * 0.5 * dt;
		L.dy[0] = dy[0] + (ay[0] + newAy[0]) * 0.5 * dt;
		L.dy[1] = dy[1] + (ay[1] + newAy[1]) * 0.5 * dt;
	}
	const T = Methods["Third Order"];
	x = [...T.x];
	y = [...T.y];
	dx = [...T.dx];
	dy = [...T.dy];
	ax = d2x(x, y, dx, dy);
	ay = d2y(x, y, dx, dy);
	jx = d3x(x, y, dx, dy);
	jy = d3y(x, y, dx, dy);
	sx = d4x(x, y, dx, dy);
	sy = d4y(x, y, dx, dy);
	T.x[0] += dt * (dx[0] + dt * 0.5 * (ax[0] + dt / 3 * (jx[0] + dt * 0.25 * sx[0])));
	T.x[1] += dt * (dx[1] + dt * 0.5 * (ax[1] + dt / 3 * (jx[1] + dt * 0.25 * sx[1])));
	T.y[0] += dt * (dy[0] + dt * 0.5 * (ay[0] + dt / 3 * (jy[0] + dt * 0.25 * sx[0])));
	T.y[1] += dt * (dy[1] + dt * 0.5 * (ay[1] + dt / 3 * (jy[1] + dt * 0.25 * sx[1])));
	T.dx[0] = dx[0] + dt * (ax[0] + dt * 0.5 * (jx[0] + (sx[0]) * dt / 3));
	T.dx[1] = dx[1] + dt * (ax[1] + dt * 0.5 * (jx[1] + (sx[1]) * dt / 3));
	T.dy[0] = dy[0] + dt * (ay[0] + dt * 0.5 * (jy[0] + (sy[0]) * dt / 3));
	T.dy[1] = dy[1] + dt * (ay[1] + dt * 0.5 * (jy[1] + (sy[1]) * dt / 3));
	//Methods["Third Order"].y[1] += dt * (d2y(oldCT) + dt * 0.5 * (d3y(Methods["Third Order"].y[1]) + d2y(d2y(oldCT + Methods["Third Order"].y[0])) * dt / 6));
}
const bunch = 4;
function render() {
	if (!paused) Array(bunch).fill(0).forEach(calculate);
	c.width = innerWidth;
	c.height = innerHeight;
	ctx.textAlign = "center";
	ctx.textAnchor = "middle";
	ctx.font = "20px Arial";
	let i = 0;
	for (let method in Methods) {
		i++;
		const m = Methods[method];
		ctx.beginPath();
		ctx.moveTo(innerWidth / 2, 100);
		ctx.lineTo(innerWidth / 2 + m.x[0], 100 + m.y[0]);
		ctx.lineTo(innerWidth / 2 + m.x[1], 100 + m.y[1]);
		ctx.strokeStyle = "white";
		ctx.lineWidth = 5;
		ctx.stroke();
		ctx.fillStyle = m.color;
		ctx.beginPath();
		ctx.arc(innerWidth / 2 + m.x[0], 100 + m.y[0], 20, 0, Math.PI * 2);
		ctx.arc(innerWidth / 2 + m.x[1], 100 + m.y[1], 20, 0, Math.PI * 2);
		ctx.fill();
		// const KE = l*l*.5 * ((Math.cos(m.a[0]) * m.da[0] + Math.cos(m.a[1]) * m.da[1]) ** 2
		//	+ (Math.sin(m.a[0]) * m.da[0] + Math.sin(m.a[1]) * m.da[1]) ** 2
		//	+ (Math.cos(m.a[0]) * m.da[0]) ** 2 + (Math.sin(m.a[0]) * m.da[0]) ** 2);
		// const GPE = 10 - g * (y + y1);
		// ctx.fillText(((KE + GPE)/1000 + 31.937).toFixed(3) + "J energy", innerWidth / 2 + x, 140 + y);
	}
}
setInterval(render, dt*1000*bunch);