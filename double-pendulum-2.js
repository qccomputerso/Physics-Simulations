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

	eval() { return this.value; }

	dt() { return 0; }

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
const initial = [Math.PI / 2 - 0.1, Math.PI / 2];
const dt = 0.005;
const Methods = [
	{
		color: "#3EBCBC",
		a: [Math.PI / 2 - 0.01, Math.PI / 2],
		da: [0, 0]
	},
	{
		color: "#3EBCBC",
		a: [Math.PI / 2 - 0.009, Math.PI / 2],
		da: [0, 0]
	},
	{
		color: "#3EBCBC",
		a: [Math.PI / 2 - 0.008, Math.PI / 2],
		da: [0, 0]
	},
	{
		color: "#3EBCBC",
		a: [Math.PI / 2 - 0.007, Math.PI / 2],
		da: [0, 0]
	},
	{
		color: "#3EBCBC",
		a: [Math.PI / 2 - 0.006, Math.PI / 2],
		da: [0, 0]
	},
	{
		color: "#3EBCBC",
		a: [Math.PI / 2 - 0.005, Math.PI / 2],
		da: [0, 0]
	},
	{
		color: "#3EBCBC",
		a: [Math.PI / 2 - 0.004, Math.PI / 2],
		da: [0, 0]
	},
	{
		color: "#3EBCBC",
		a: [Math.PI / 2 - 0.003, Math.PI / 2],
		da: [0, 0]
	},
	{
		color: "#3EBCBC",
		a: [Math.PI / 2 - 0.002, Math.PI / 2],
		da: [0, 0]
	},
	{
		color: "#3EBCBC",
		a: [Math.PI / 2 - 0.001, Math.PI / 2],
		da: [0, 0]
	},
	{
		color: "#3EBCBC",
		a: [Math.PI / 2 - 0.0, Math.PI / 2],
		da: [0, 0]
	},
];
const k = 4;
const A1 = new Var("a1");
const dA1 = A1.dt();
const A2 = new Var("a2");
const dA2 = A2.dt();

const SinA12 = Sin(A1.sub(A2));
const CosA12 = Cos(A1.sub(A2));
const __above1 = Mul(k, Sin(A2, 0.5).mul(CosA12).sub(Sin(A1))).sub(SinA12.mul(0.5).mul(dA2.mul(dA2).add(dA1.mul(dA1).mul(CosA12))));
const __below = Sub(1, CosA12.mul(CosA12).mul(0.5));
const d2A1 = __above1.div(__below);
const d3A1 = d2A1.dt();
const d4A1 = d3A1.dt();
const __above2 = Mul(k, Sin(A1).mul(CosA12).sub(Sin(A2))).add(SinA12.mul(dA2.mul(dA2).mul(CosA12).mul(0.5).add(dA1.mul(dA1))));
const d2A2 = __above2.div(__below);
const d3A2 = d2A2.dt();
const d4A2 = d3A2.dt();
// d2a1 = (k*(.5*sin(a2) - sin(a1)) - .5*sin(a1-a2)*(da2*da2 + da1*da1*cos(a1-a2)))/(1-.5*(cos(a1-a2)**2));
// d2a2 = da1*da1*sin(a1-a2) - k*sin(a2) - d2a1*cos(a1-a2);
function d2a([a1, a2], [da1, da2]) {
	return [d2A1.eval({ a1, a2, da1, da2 }), d2A2.eval({ a1, a2, da1, da2 })];
}
function d3a([a1, a2], [da1, da2]) {
	const [dda1, dda2] = d2a([a1, a2], [da1, da2]);
	return [d3A1.eval({ a1, a2, da1, da2, dda1, dda2 }), d3A2.eval({ a1, a2, da1, da2, dda1, dda2 })];
}
function d4a([a1, a2], [da1, da2]) {
	const [dda1, dda2] = d2a([a1, a2], [da1, da2]);
	const [ddda1, ddda2] = d3a([a1, a2], [da1, da2]);
	return [d4A1.eval({ a1, a2, da1, da2, dda1, dda2, ddda1, ddda2 }), d4A2.eval({ a1, a2, da1, da2, dda1, dda2, ddda1, ddda2 })];
}


let t = 0;
let paused = false;

function calculate() {
	t += dt;
	for (let i = 0; i <= 10; i++) {
		const T = Methods[i];
		a = [...T.a];
		da = [...T.da];
		acc = d2a(a, da);
		jrk = d3a(a, da);
		jnc = d4a(a, da);
		let newJnc = jnc;
		for (let i = 0; i > -1; i++) {
			T.a[0] = a[0] + dt * (da[0] + dt * 0.5 * (acc[0] + dt / 3 * (jrk[0] + (jnc[0] * 0.2 + newJnc[0] * 0.05) * dt)));
			T.a[1] = a[1] + dt * (da[1] + dt * 0.5 * (acc[1] + dt / 3 * (jrk[1] + (jnc[1] * 0.2 + newJnc[1] * 0.05) * dt)));
			T.da[0] = da[0] + dt * (acc[0] + dt * 0.5 * (jrk[0] + (jnc[0] / 4 + newJnc[0] / 12) * dt));
			T.da[1] = da[1] + dt * (acc[1] + dt * 0.5 * (jrk[1] + (jnc[1] / 4 + newJnc[1] / 12) * dt));
			if (i == 4) break;
			newJnc = d4a(T.a, T.da);
		}
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
		ctx.beginPath();
		ctx.moveTo(innerWidth / 2, 100);
		const l = 200, g = k * l;
		let x = l * Math.sin(m.a[0]), y = l * Math.cos(m.a[0]);
		ctx.lineTo(innerWidth / 2 + x, 100 + y);
		const x1 = x, y1 = y;
		x += l * Math.sin(m.a[1]);
		y += l * Math.cos(m.a[1]);
		ctx.lineTo(innerWidth / 2 + x, 100 + y);
		ctx.strokeStyle = "white";
		ctx.lineWidth = 5;
		ctx.stroke();
		ctx.fillStyle = m.color;
		ctx.beginPath();
		ctx.arc(innerWidth / 2 + x1, 100 + y1, 20, 0, Math.PI * 2);
		ctx.arc(innerWidth / 2 + x, 100 + y, 20, 0, Math.PI * 2);
		ctx.fill();
		const KE = l * l * .5 * ((Math.cos(m.a[0]) * m.da[0] + Math.cos(m.a[1]) * m.da[1]) ** 2
			+ (Math.sin(m.a[0]) * m.da[0] + Math.sin(m.a[1]) * m.da[1]) ** 2
			+ (Math.cos(m.a[0]) * m.da[0]) ** 2 + (Math.sin(m.a[0]) * m.da[0]) ** 2);
		const GPE = 10 - g * (y + y1);
		//ctx.fillText(((KE + GPE) / 1000 + 31.937).toFixed(3) + "J energy", innerWidth / 2 + x, 140 + y);
	}
}
setInterval(render, dt * 1000 * bunch);