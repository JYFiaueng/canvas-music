function MusicVisualizer(obj){
	this.source = null;
	this.count = 0;
	this.analyser = MusicVisualizer.ac.createAnalyser();
	this.size = obj.size;
	this.analyser.fftSize = this.size * 2;
	this.gainNode = MusicVisualizer.ac[MusicVisualizer.ac.createGain ? 'createGain' : 'createGainNode']();
	this.gainNode.connect(MusicVisualizer.ac.destination);
	this.analyser.connect(this.gainNode);
	this.xhr = new XMLHttpRequest();
	this.visualizer = obj.visualizer;
	this.visualize();
}

MusicVisualizer.ac = new (window.AudioContext || window.webkitAudioContext)();

MusicVisualizer.prototype.load = function(url, fn){
	this.xhr.abort();
	this.xhr.open('GET', url);
	this.xhr.responseType = 'arraybuffer';
	var self = this;
	this.xhr.onload = function(){
		fn(self.xhr.response);
	};
	this.xhr.send();
};

MusicVisualizer.prototype.decode = function(arraybuffer, fn){
	MusicVisualizer.ac.decodeAudioData(arraybuffer, function(buffer){
		fn(buffer);
	}, function(err){
		console.log(err);
	});
};

MusicVisualizer.prototype.localPlay = function(blob){
	var reader = new FileReader();
	var _this = this;
	var n = ++this.count;
	this.source && this.stop();
	reader.onload = function(e) {
		if(n !== _this.count) return;
		_this.decode(e.target.result, function(buffer){
			if(n !== _this.count) return;
			var bs = MusicVisualizer.ac.createBufferSource();
			bs.connect(_this.analyser);
			bs.buffer = buffer;
			bs[bs.start ? 'start' : 'noteOn'](0);
			_this.source = bs;
		});
	}; 
	reader.readAsArrayBuffer(blob);
}

MusicVisualizer.prototype.play = function(url){
	var self = this;
	var n = ++this.count;
	this.source && this.stop();
	this.load(url, function(arraybuffer){
		if(n !== self.count) return;
		self.decode(arraybuffer, function(buffer){
			if(n !== self.count) return;
			var bs = MusicVisualizer.ac.createBufferSource();
			bs.connect(self.analyser);
			bs.buffer = buffer;
			bs[bs.start ? 'start' : 'noteOn'](0);
			self.source = bs;
		});
	});
};

MusicVisualizer.prototype.stop = function(){
	this.source[this.source.stop ? 'stop' : 'noteOff'](0);
};

MusicVisualizer.prototype.changeVolume = function(percent){
	this.gainNode.gain.value = percent * percent;
};

MusicVisualizer.prototype.visualize = function(){
	var arr = new  Uint8Array(this.analyser.frequencyBinCount);//创建一个类型化的数组
	requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
	var self = this;
	function v(){
		self.analyser.getByteFrequencyData(arr);//实时拿到音频数据
		self.visualizer(arr);
		requestAnimationFrame(v);
	}
	requestAnimationFrame(v);
};