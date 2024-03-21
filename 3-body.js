function toExpr(expr) {
	return expr instanceof Expr ? expr : new Constant(expr);
}

class Expr {
	evalList = {}
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
	smartEval(val) {
		let k = JSON.stringify(val);
		return this.evalList[k] === undefined ? this.evalList[k] = this.eval(val) : this.evalList[k];
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
const r0 = 200;
const v0 = 130;
const k = v0 * v0 / r0 * 40000 * (Math.sqrt(3) + 4);
const Methods = {
	Leapfrog: {
		color: "#EEEE5F",
		x: [0, r0 * Math.sqrt(.75), -r0 * Math.sqrt(.75)],
		y: [r0, -r0 / 2, -r0 / 2],
		dx: [-v0, v0 / 2, v0 / 2],
		dy: [0, v0 * Math.sqrt(.75), -v0 * Math.sqrt(.75)],
	},
	"Third Order": {
		color: "#3EBCBC",
		x: [0, r0 * Math.sqrt(.75), -r0 * Math.sqrt(.75)],
		y: [r0, -r0 / 2, -r0 / 2],
		dx: [-v0, v0 / 2, v0 / 2],
		dy: [0, v0 * Math.sqrt(.75), -v0 * Math.sqrt(.75)],
	},
}
const X1 = new Var("x1");
const Y1 = new Var("y1");
const X2 = new Var("x2");
const Y2 = new Var("y2");
const X3 = new Var("x3");
const Y3 = new Var("y3");

const X12 = X1.sub(X2);
const Y12 = Y1.sub(Y2);
const X23 = X2.sub(X3);
const Y23 = Y2.sub(Y3);
const X31 = X3.sub(X1);
const Y31 = Y3.sub(Y1);
const F12 = Mul(k, X12.mul(X12).add(Y12.mul(Y12)).pow(-1.5));
const F23 = Mul(k, X23.mul(X23).add(Y23.mul(Y23)).pow(-1.5));
const F31 = Mul(k, X31.mul(X31).add(Y31.mul(Y31)).pow(-1.5));
const d2X1 = F31.mul(X31).sub(F12.mul(X12));
const d3X1 = d2X1.dt();
const d4X1 = d3X1.dt();
const d5X1 = d4X1.dt();
const d6X1 = d5X1.dt();
const d2X2 = F12.mul(X12).sub(F23.mul(X23));
const d3X2 = d2X2.dt();
const d4X2 = d3X2.dt();
const d5X2 = d4X2.dt();
const d6X2 = d5X2.dt();
const d2X3 = F23.mul(X23).sub(F31.mul(X31));
const d3X3 = d2X3.dt();
const d4X3 = d3X3.dt();
const d5X3 = d4X3.dt();
const d6X3 = d5X3.dt();
const d2Y1 = F31.mul(Y31).sub(F12.mul(Y12));
const d3Y1 = d2Y1.dt();
const d4Y1 = d3Y1.dt();
const d5Y1 = d4Y1.dt();
const d6Y1 = d5Y1.dt();
const d2Y2 = F12.mul(Y12).sub(F23.mul(Y23));
const d3Y2 = d2Y2.dt();
const d4Y2 = d3Y2.dt();
const d5Y2 = d4Y2.dt();
const d6Y2 = d5Y2.dt();
const d2Y3 = F23.mul(Y23).sub(F31.mul(Y31));
const d3Y3 = d2Y3.dt();
const d4Y3 = d3Y3.dt();
const d5Y3 = d4Y3.dt();
const d6Y3 = d5Y3.dt();
function d2x([x1, x2, x3], [y1, y2, y3]) {
	const v = { x1, x2, x3, y1, y2, y3 };
	return [d2X1.smartEval(v), d2X2.smartEval(v), d2X3.smartEval(v)];
}
function d2y([x1, x2, x3], [y1, y2, y3]) {
	const v = { x1, x2, x3, y1, y2, y3 };
	return [d2Y1.smartEval(v), d2Y2.smartEval(v), d2Y3.smartEval(v)];
}
function d3x([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]) {
	const [ddx1, ddx2, ddx3] = d2x([x1, x2, x3], [y1, y2, y3]);
	const [ddy1, ddy2, ddy3] = d2y([x1, x2, x3], [y1, y2, y3]);
	const v = { x1, x2, x3, y1, y2, y3, dx1, dx2, dx3, dy1, dy2, dy3, ddx1, ddx2, ddx3, ddy1, ddy2, ddy3 };
	return [d3X1.smartEval(v), d3X2.smartEval(v), d3X3.smartEval(v)];
}
function d3y([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]) {
	const [ddx1, ddx2, ddx3] = d2x([x1, x2, x3], [y1, y2, y3]);
	const [ddy1, ddy2, ddy3] = d2y([x1, x2, x3], [y1, y2, y3]);
	const v = { x1, x2, x3, y1, y2, y3, dx1, dx2, dx3, dy1, dy2, dy3, ddx1, ddx2, ddx3, ddy1, ddy2, ddy3 };
	return [d3Y1.smartEval(v), d3Y2.smartEval(v), d3Y3.smartEval(v)];
}
function d4x([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]) {
	const [ddx1, ddx2, ddx3] = d2x([x1, x2, x3], [y1, y2, y3]);
	const [ddy1, ddy2, ddy3] = d2y([x1, x2, x3], [y1, y2, y3]);
	const [dddx1, dddx2, dddx3] = d3x([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [dddy1, dddy2, dddy3] = d3y([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const v = { x1, x2, x3, y1, y2, y3, dx1, dx2, dx3, dy1, dy2, dy3, ddx1, ddx2, ddx3, ddy1, ddy2, ddy3, dddx1, dddx2, dddx3, dddy1, dddy2, dddy3 };
	return [d4X1.smartEval(v), d4X2.smartEval(v), d4X3.smartEval(v)];
}
function d4y([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]) {
	const [ddx1, ddx2, ddx3] = d2x([x1, x2, x3], [y1, y2, y3]);
	const [ddy1, ddy2, ddy3] = d2y([x1, x2, x3], [y1, y2, y3]);
	const [dddx1, dddx2, dddx3] = d3x([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [dddy1, dddy2, dddy3] = d3y([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const v = { x1, x2, x3, y1, y2, y3, dx1, dx2, dx3, dy1, dy2, dy3, ddx1, ddx2, ddx3, ddy1, ddy2, ddy3, dddx1, dddx2, dddx3, dddy1, dddy2, dddy3 };
	return [d4Y1.smartEval(v), d4Y2.smartEval(v), d4Y3.smartEval(v)];
}
function d5x([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]) {
	const [ddx1, ddx2, ddx3] = d2x([x1, x2, x3], [y1, y2, y3]);
	const [ddy1, ddy2, ddy3] = d2y([x1, x2, x3], [y1, y2, y3]);
	const [dddx1, dddx2, dddx3] = d3x([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [dddy1, dddy2, dddy3] = d3y([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [ddddx1, ddddx2, ddddx3] = d4x([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [ddddy1, ddddy2, ddddy3] = d4y([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const v = { x1, x2, x3, y1, y2, y3, dx1, dx2, dx3, dy1, dy2, dy3, ddx1, ddx2, ddx3, ddy1, ddy2, ddy3, dddx1, dddx2, dddx3, dddy1, dddy2, dddy3,
	ddddx1, ddddx2, ddddx3, ddddy1, ddddy2, ddddy3 };
	return [d5X1.smartEval(v), d5X2.smartEval(v), d5X3.smartEval(v)];
}
function d5y([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]) {
	const [ddx1, ddx2, ddx3] = d2x([x1, x2, x3], [y1, y2, y3]);
	const [ddy1, ddy2, ddy3] = d2y([x1, x2, x3], [y1, y2, y3]);
	const [dddx1, dddx2, dddx3] = d3x([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [dddy1, dddy2, dddy3] = d3y([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [ddddx1, ddddx2, ddddx3] = d4x([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [ddddy1, ddddy2, ddddy3] = d4y([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const v = { x1, x2, x3, y1, y2, y3, dx1, dx2, dx3, dy1, dy2, dy3, ddx1, ddx2, ddx3, ddy1, ddy2, ddy3, dddx1, dddx2, dddx3, dddy1, dddy2, dddy3,
	ddddx1, ddddx2, ddddx3, ddddy1, ddddy2, ddddy3 };
	return [d5Y1.smartEval(v), d5Y2.smartEval(v), d5Y3.smartEval(v)];
}
function d6x([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]) {
	const [ddx1, ddx2, ddx3] = d2x([x1, x2, x3], [y1, y2, y3]);
	const [ddy1, ddy2, ddy3] = d2y([x1, x2, x3], [y1, y2, y3]);
	const [dddx1, dddx2, dddx3] = d3x([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [dddy1, dddy2, dddy3] = d3y([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [ddddx1, ddddx2, ddddx3] = d4x([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [ddddy1, ddddy2, ddddy3] = d4y([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [dddddx1, dddddx2, dddddx3] = d5x([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [dddddy1, dddddy2, dddddy3] = d5y([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const v = { x1, x2, x3, y1, y2, y3, dx1, dx2, dx3, dy1, dy2, dy3, ddx1, ddx2, ddx3, ddy1, ddy2, ddy3, dddx1, dddx2, dddx3, dddy1, dddy2, dddy3,
	ddddx1, ddddx2, ddddx3, ddddy1, ddddy2, ddddy3, dddddx1, dddddx2, dddddx3, dddddy1, dddddy2, dddddy3 };
	return [d6X1.smartEval(v), d6X2.smartEval(v), d6X3.smartEval(v)];
}
function d6y([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]) {
	const [ddx1, ddx2, ddx3] = d2x([x1, x2, x3], [y1, y2, y3]);
	const [ddy1, ddy2, ddy3] = d2y([x1, x2, x3], [y1, y2, y3]);
	const [dddx1, dddx2, dddx3] = d3x([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [dddy1, dddy2, dddy3] = d3y([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [ddddx1, ddddx2, ddddx3] = d4x([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [ddddy1, ddddy2, ddddy3] = d4y([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [dddddx1, dddddx2, dddddx3] = d5x([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const [dddddy1, dddddy2, dddddy3] = d5y([x1, x2, x3], [y1, y2, y3], [dx1, dx2, dx3], [dy1, dy2, dy3]);
	const v = { x1, x2, x3, y1, y2, y3, dx1, dx2, dx3, dy1, dy2, dy3, ddx1, ddx2, ddx3, ddy1, ddy2, ddy3, dddx1, dddx2, dddx3, dddy1, dddy2, dddy3,
	ddddx1, ddddx2, ddddx3, ddddy1, ddddy2, ddddy3, dddddx1, dddddx2, dddddx3, dddddy1, dddddy2, dddddy3 };
	return [d6Y1.smartEval(v), d6Y2.smartEval(v), d6Y3.smartEval(v)];
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
	for (let i = 0; i < 3; i++) {
		L.x[i] += dt * (dx[i] + 0.5 * dt * ax[i]);
		L.y[i] += dt * (dy[i] + 0.5 * dt * ay[i]);
	}
	let newAx = d2x(L.x, L.y, L.dx, L.dy);
	let newAy = d2y(L.x, L.y, L.dx, L.dy);
	for (let i = 0; i < 3; i++) {
		L.dx[i] += dt * (ax[i] + newAx[i]) * 0.5;
		L.dy[i] += dt * (ay[i] + newAy[i]) * 0.5;
	}
	const T = Methods["Third Order"];
	x = [...T.x];
	y = [...T.y];
	dx = [...T.dx];
	dy = [...T.dy];
	ax = d2x(x, y, dx, dy);
	ay = d2y(x, y, dx, dy);
	let jx = d3x(x, y, dx, dy);
	let jy = d3y(x, y, dx, dy);
	let sx = d4x(x, y, dx, dy);
	let sy = d4y(x, y, dx, dy);
	let x5 = d5x(x, y, dx, dy);
	let y5 = d5y(x, y, dx, dy);
	let x6 = d6x(x, y, dx, dy);
	let y6 = d6y(x, y, dx, dy);
	for (let i = 0; i < 3; i++) {
		T.x[i] += dt * (dx[i] + dt * .5 * (ax[i] + dt / 3 * (jx[i] + dt * .25 * (sx[i] + dt * .2 * (x5[i] + dt / 6 * x6[i])))));
		T.y[i] += dt * (dy[i] + dt * 0.5 * (ay[i] + dt / 3 * (jy[i] + dt * .25 * (sy[i] + dt * .2 * (y5[i] + dt / 6 * y6[i])))));
		T.dx[i] += dt * (ax[i] + dt * 0.5 * (jx[i] + dt / 3 * (sx[i] + dt * .25 * (x5[i] + dt * .2 * x6[i]))));
		T.dy[i] += dt * (ay[i] + dt * 0.5 * (jy[i] + dt / 3 * (sy[i] + dt * .25 * (y5[i] + dt * .2 * y6[i]))));
	}
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
		ctx.fillStyle = m.color;
		ctx.beginPath();
		ctx.arc(innerWidth / 2 + m.x[0], innerHeight / 2 + m.y[0], 20, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(innerWidth / 2 + m.x[1], innerHeight / 2 + m.y[1], 20, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(innerWidth / 2 + m.x[2], innerHeight / 2 + m.y[2], 20, 0, Math.PI * 2);
		ctx.fill();
		// const KE = l*l*.5 * ((Math.cos(m.a[0]) * m.da[0] + Math.cos(m.a[1]) * m.da[1]) ** 2
		//	+ (Math.sin(m.a[0]) * m.da[0] + Math.sin(m.a[1]) * m.da[1]) ** 2
		//	+ (Math.cos(m.a[0]) * m.da[0]) ** 2 + (Math.sin(m.a[0]) * m.da[0]) ** 2);
		// const GPE = 10 - g * (y + y1);
		// ctx.fillText(((KE + GPE)/1000 + 31.937).toFixed(3) + "J energy", innerWidth / 2 + x, 140 + y);
	}
}
setInterval(render, dt*1000*bunch);