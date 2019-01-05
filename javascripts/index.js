function $(ele) {
	return document.querySelectorAll(ele);
}
//设置当前选中效果
var list = $('#list li');
var i = 0;
var j = 0;
var k = 0;
var h = 0;
var line;
var columnar = $('#columnar')[0];
var punctiform = $('#punctiform')[0];
var size = 64; //绘制的柱子的个数
var box = $('#box')[0];
var height, width;
var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
box.appendChild(canvas);
var Dots = [];
var mv = new MusicVisualizer({
	size: size,
	visualizer: draw
});
var move = 'move';

for (i = 0, j = list.length; i < j; i++) {
	list[i].onclick = function () {
		for (k = 0, h = list.length; k < h; k++) {
			list[k].className = '';
		}
		this.className = 'selected';
		mv.play('/media/' + this.title);
	};
}

add.onchange = function (event) {
	if (event.target.files[0]) {
		var fr = new FileReader();
		fr.readAsDataURL(event.target.files[0]);
		fr.onloadend = function (e) {
			base64Data = e.target.result;
			var arr = base64Data.split(','), 
			mime = arr[0].match(/:(.*?);/)[1],
			bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
			while(n--){
				u8arr[n] = bstr.charCodeAt(n);
			}
			mv.localPlay(new Blob([u8arr], {type:mime}))
		}
	}
}

columnar.onclick = function () {
	columnar.style.backgroundColor = 'rgba(0,0,0,0.5)';
	punctiform.style.backgroundColor = 'rgba(0,0,0,0.1)';
	draw.type = columnar.getAttribute('value');
};
punctiform.onclick = function () {
	columnar.style.backgroundColor = 'rgba(0,0,0,0.1)';
	punctiform.style.backgroundColor = 'rgba(0,0,0,0.5)';
	draw.type = punctiform.getAttribute('value');
};
columnar.onclick();

//绑定音量调节
$('#volume')[0].onchange = function () {
	mv.changeVolume(this.value / this.max);
};
$('#volume')[0].onchange(); //触发一次，使默认数值生效

box.onclick = function () {
	if (move === 'move') {
		move = 'static';
		for (var i = 0; i < Dots.length; i++) {
			Dots[i].odx = Dots[i].dx;
			Dots[i].ody = Dots[i].dy;
			Dots[i].dx = 0;
			Dots[i].dy = 0;
		}
	} else if (move === 'static') {
		move = 'move';
		for (var j = 0; j < Dots.length; j++) {
			Dots[j].dx = Dots[j].odx;
			Dots[j].dy = Dots[j].ody;
		}
	}
};

function random(m, n) {
	return Math.round(Math.random() * (n - m) + m);
}

function getDots() {
	Dots = [];
	for (var i = 0; i < size; i++) {
		var x = random(0, width);
		var y = random(0, height);
		var color = 'rgba(' + random(0, 255) + ',' + random(0, 255) + ',' + random(0, 255) + ',0)';
		Dots.push({
			x: x,
			y: y,
			dx: random(1, 2),
			dy: random(1, 2),
			odx: 0,
			ody: 0,
			vx: Math.pow(-1, random(1, 4)),
			vy: Math.pow(-1, random(1, 4)),
			color: color,
			cap: 0
		});
	}
}

function resize() {
	height = box.clientHeight;
	width = box.clientWidth;
	canvas.height = height;
	canvas.width = width;
	//创建渐变
	line = ctx.createLinearGradient(0, 0, 0, height);
	line.addColorStop(0, '#333');
	line.addColorStop(0.1, '#555');
	line.addColorStop(0.3, '#777');
	line.addColorStop(0.5, '#999');
	line.addColorStop(0.7, '#bbb');
	line.addColorStop(0.9, '#ddd');
	line.addColorStop(1, '#333');
	getDots();
}
resize();
window.onresize = resize;

function draw(arr) {
	ctx.clearRect(0, 0, width, height);
	var w = width / size; //每一个柱子的宽度
	var cw = w * 0.6;
	var capH = cw > 10 ? 10 : cw;
	var i = 0,
		o, r, h, g;
	ctx.fillStyle = line;
	if (draw.type == 'columnar') {
		for (i = 0; i < size; i++) {
			o = Dots[i];
			h = arr[i] / (size * 5) * height;
			//由定义可知：arr[i] / size * 2绝对在0-1之间，就可算出一个矩形要绘制的高度
			ctx.fillRect(w * i, height - h, cw, h);
			ctx.fillRect(w * i, height - (o.cap + capH), cw, capH);
			o.cap--;
			if (o.cap < 0) o.cap = 0;
			if (h > 0 && o.cap < h + 10) o.cap = h + 10 > height - capH ? height - capH : h + 10;
		}
	} else if (draw.type == 'punctiform') {
		for (i = 0; i < size; i++) {
			o = Dots[i];
			ctx.beginPath();
			r = 5 + arr[i] / (size * 4) * (height > width ? width : height) / 10;
			ctx.arc(o.x, o.y, r, 0, Math.PI * 2);
			g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r);
			g.addColorStop(0, '#fff');
			g.addColorStop(1, o.color);
			ctx.fillStyle = g;
			ctx.fill();
			o.x += (o.vx * o.dx);
			o.y += (o.vy * o.dy);
			o.vx = (o.x > width - r || o.x < r) ? -1 * o.vx : o.vx;
			o.vy = (o.y > height - r || o.y < r) ? -1 * o.vy : o.vy;
		}
	}
}
draw.type = 'columnar';