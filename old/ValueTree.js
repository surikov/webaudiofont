console.log('ValueTree v1.01');
function ValueTree(name) {
	this.children = [];
	this.value = "";
	this.name = name;
	return this;
}
ValueTree.prototype.of = function (name) {
	for (var i = 0; i < this.children.length; i++) {
		if (this.children[i].name == name) {
			return this.children[i];
		}
	}
	var v = new ValueTree(name);
	this.children.push(v);
	return v;
};
ValueTree.prototype.numeric = function (minValue, defaultValue, maxValue) {
	var r = defaultValue;
	try {
		r = Number.parseFloat(this.value);
	} catch (ex) {
		console.log(ex);
	}
	if (isNaN(r)) {
		r = defaultValue;
	}
	if (r < minValue) {
		r = minValue;
	}
	if (r > maxValue) {
		r = maxValue;
	}
	return r;
};
ValueTree.prototype.inlist = function (values) {
	for(var i=0;i<values.length;i++){
		if(this.value==values[i]){
			return this.value;
		}
	}
	return values[0];
};
ValueTree.prototype.all = function (name) {
	var r = [];
	for (var i = 0; i < this.children.length; i++) {
		if (this.children[i].name == name) {
			r.push(this.children[i]);
		}
	}
	return r;
};
ValueTree.prototype.fromXMLstring = function (xml) {
	var windowDOMParser = new window.DOMParser();
	var dom = windowDOMParser.parseFromString(xml, "text/xml");
	this.fromNodes(dom.childNodes);
};
ValueTree.prototype.dump = function (pad,symbol) {
	console.log(pad,this.name,':',this.value);
	for (var i = 0; i < this.children.length; i++) {
		this.children[i].dump(pad+symbol,symbol);
	}
};
ValueTree.prototype.fromNodes = function (nodes) {
	for (var i = 0; i < nodes.length; i++) {
		if (nodes[i].nodeType == 1) {
			var v = new ValueTree(nodes[i].nodeName);
			this.children.push(v);
			v.fromNodes(nodes[i].childNodes);
			for (var n = 0; n < nodes[i].attributes.length; n++) {
				var a = new ValueTree(nodes[i].attributes[n].name);
				a.value = nodes[i].attributes[n].value;
				v.children.push(a);
			}
		} else {
			if (nodes[i].nodeType == 3) {
				this.value = this.value + nodes[i].nodeValue.trim();
			}
		}
	}
};
