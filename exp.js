
isArray = function (obj) {
    return Array.isArray(obj);
}


ArrayIterator = function (obj) {
    if (!isArray(obj)) {
	throw new Error("Argument isn't Array.");
    }

    state = 0;

    this.hasNext = function () {
	return state < obj.length;
    }

    this.next = function () {
	if (this.hasNext()) {
	    return obj[state++];
	}
    }

    this.reset = function () {
	state = 0;
    }

    return this;
}


MapIterator = function (iterator, fun) {
    var next = function () {
	if (iterator.hasNext()) {
	    return fun(iterator.next());
	}
    }

    return {
	next: next,
	hasNext: iterator.hasNext,
	reset: iterator.reset
    }
}


FilterIterator = function (iterator, pred) {
    var buff = undefined;
    var not_erased_flag = false;
    
    var hasNext = function () {
	if (not_erased_flag) { return true; }
	
	while (iterator.hasNext()) {
	    var item = iterator.next();
	    if (pred(item)) {
		buff = item;
		not_erased_flag = true;
		return true;
	    }
	}
	
	return false;
    }

    var next = function () {
	if (this.hasNext()) {
	    not_erased_flag = false;
	    return buff;
	}
    }

    return {
	next: next,
	hasNext: hasNext,
	reset: iterator.reset
    }
}


WhileIterator = function (iterator, pred) {
    var stop_flag = false;
    var buff = undefined;
    var buff_flag = false;

    var hasNext = function () {
	if (stop_flag) { return false; }
	if (iterator.hasNext()) {
	    buff = iterator.next();
	    if (pred(buff)) {
		buff_flag = true;
		return true;
	    } else {
		buff_flag = false;
		return false;
	    }
	} else {
	    stop_flag = true;
	}
    }

    var next = function () {
	if (buff_flag) {
	    buff_flag = false;
	    return buff;
	} else {
	    if (this.hasNext()) {
		buff_flag = false;
		return buff;
	    }
	}	    
    }

    return {
	hasNext: hasNext,
	next: next,
	reset: iterator.reset
    }
}


ZipIterator = function (iterator, n) {
    var next = function () {
	var buff = new Array(n);
	for (var i = 0; i < n; ++i) {
	    if (iterator.hasNext()) {
		buff[i] = iterator.next();
	    } else {
		buff[i] = undefined;
	    }
	}

	return buff;
    }
    
    return {
	reset: iterator.reset,
	hasNext: iterator.hasNext,
	next: next
    }
}


Chain = function (iterator, deep) {
    var current_deep = -1;
    var buffer = [];
    var indices = [];

    var hasNext = function () {
	if (current_deep == -1) {
	    return iterator.hasNext();
	}
    }

    var next = function () {
	if (hasNext()) {
	    if (current_deep == -1) {
		buffer = iterator.next();
		if (isArray(buffer)) {
		    current_deep = 1;
		    indices.push(0);
		}
	    }
	}
    }

    var reset = function () {
	iterator.reset();
    }

    return {
	next: next,
	hasNext: hasNext,
	reset: reset
    }
}


Fold = function (iterator, fun, init) {
    var state = init;

    while (iterator.hasNext()) {
	state = fun(state, iterator.next());
    }

    return state;
}


lazy = function (arr) {    
    var source = arr;
    if (isArray(arr)) {
	source = ArrayIterator(arr);
    }

    var where = function (pred) {
	this.source = FilterIterator(this.source, pred);
	return this;
    }

    var map = function (fun) {
	this.source = MapIterator(this.source, fun);
	return this;
    }

    var until = function (pred) {
	this.source = WhileIterator(this.source, pred);
	return this;
    }

    var fold = function (fun, init) {
	return Fold(this.source, fun, init);
    }

    var zip = function (n) {
	this.source = ZipIterator(this.source, n);
	return this;
    }

    var force = function () {
	var result = [];
	while (this.hasNext()) {
	    result.push(this.next());
	}
	return result;
    }

    var take = function (n) {
	if (n > 0) {
	    var result = [];
	    while(this.hasNext() && n-- > 0) {
		result.push(this.next());
	    }
	    return result;
	}
    }

    var drop = function (n) {
	if (n > 0) {
	    while(this.hasNext() && n-- > 0) {
		this.next();
	    }
	    return this;
	}
    }

    var next = function () {
	return this.source.next();
    }

    var hasNext = function () {
	return this.source.hasNext();
    }

    var reset = function () {
	this.source.reset();
	return this;
    }

    return {
	source: source,
	where: where,
	map: map,
	until: until,
	fold: fold,
	force: force,
	take: take,
	drop: drop,
	hasNext: hasNext,
	next: next,
	reset: reset,
	zip: zip
    }
}
