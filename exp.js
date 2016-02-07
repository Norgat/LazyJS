
isArray = function (obj) {
    return Array.isArray(obj);
};


getKeys = function (obj) {
    var lst = [];
    for (var k in obj) {
	if (obj.hasOwnProperty(k)) {
	    lst.push(k);
	}
    }

    return lst;
};


ArrayIterator = function (obj) {
    if (!isArray(obj)) {
	throw new Error("Argument isn't Array.");
    }

    var state = 0;

    var hasNext = function () {
	return state < obj.length;
    };

    var next = function () {
	if (this.hasNext()) {
	    return obj[state++];
	}
	return undefined;
    }; 

    var reset = function () {
	state = 0;
    };

    return {
	hasNext: hasNext,
	next: next,
	reset: reset,
	type: 1
    };
};


ObjectIterator = function (obj) {
    var keyIterator = ArrayIterator(getKeys(obj));

    var next = function () {
	if (keyIterator.hasNext()) {
	    var key = keyIterator.next();
	    var val = obj[key];
	    return [key, val];
	};

	return undefined;
    };

    return {
	hasNext: keyIterator.hasNext,
	next: next,
	reset: keyIterator.reset,
	type: 2
    };
};


MapIterator = function (iterator, fun) {

    var next = undefined;
    if (iterator.type == 1) {
	next = function () {
	    if (iterator.hasNext()) {
		return fun(iterator.next());
	    }
	    return undefined;
	};
    } else if (iterator.type == 2) {
	next = function () {
	    if (iterator.hasNext()) {
		return fun.apply(this, iterator.next());
	    }
	    return undefined;
	};
    }

    return {
	next: next,
	hasNext: iterator.hasNext,
	reset: iterator.reset
    };
};


FilterIterator = function (iterator, pred) {
    var buff = undefined;
    var not_erased_flag = false;

    var pred_fun = undefined;
    if (iterator.type == 1) {
	pred_fun = pred;
    } else if (iterator.type == 2) {
	pred_fun = function (key_value) { return pred.apply(this, key_value); };
    }
    
    var hasNext = function () {
	if (not_erased_flag) { return true; }
	
	while (iterator.hasNext()) {
	    var item = iterator.next();
	    if (pred_fun(item)) {
		buff = item;
		not_erased_flag = true;
		return true;
	    }
	}
	
	return false;
    };

    var next = function () {
	if (this.hasNext()) {
	    not_erased_flag = false;
	    return buff;
	}
	return undefined;
    };

    return {
	next: next,
	hasNext: hasNext,
	reset: iterator.reset,
	type: iterator.type
    };
};


WhileIterator = function (iterator, pred) {
    var stop_flag = false;
    var buff = undefined;
    var buff_flag = false;

    var pred_fun = undefined;
    if (iterator.type == 1) {
	pred_fun = pred;
    } else if (iterator.type == 2) {
	pred_fun = function(kv) { return pred.apply(this, kv); };
    }

    var hasNext = function () {
	if (stop_flag) { return false; }
	if (iterator.hasNext()) {
	    buff = iterator.next();
	    if (pred_fun(buff)) {
		buff_flag = true;
		return true;
	    } else {
		buff_flag = false;
		return false;
	    }
	} else {
	    stop_flag = true;
	}
	return undefined;
    };

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
	return undefined;
    };

    return {
	hasNext: hasNext,
	next: next,
	reset: iterator.reset,
	type: iterator.type
    };
};


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
    };
    
    return {
	reset: iterator.reset,
	hasNext: iterator.hasNext,
	next: next
    };
};


MultizipIterator = function () {

    var iters = arguments;

    var buffer = undefined;
    var returned_p = true;

    var hasNext = function () {
	if (!returned_p) { return true; }
	
	var tmp_buf = [];
	for (var i = 0; i < iters.length; ++i) {
	    if (iters[i].hasNext()) {
		tmp_buf.push(iters[i].next());
	    } else {
		return false;
	    }
	}

	buffer = tmp_buf;
	returned_p = false;
	return true;
    };

    var next = function () {
	if (hasNext()) {
	    returned_p = true;
	    return buffer;
	}

	return undefined;
    };

    var reset = function () {
	for (var i = 0; i < iters.length; ++i) {
	    iters[i].reset();
	}
	returned_p = true;
    };
    
    return {
	next: next,
	hasNext: hasNext,
	reset: reset
    };
};


ChainIterator = function (iterator, max_deep) {
    var buffer = [];
    var indices = [];

    var elem_buffer = undefined;
    var returned_p = true;

    var buffer_extract = function () {
	var arr = buffer[buffer.length - 1];
	var indx = indices[indices.length - 1];

	var elem = arr[indx++];

	var process_indx = function () {
	    if (indx >= arr.length) {
		buffer.pop();
		indices.pop();

		// Update index on prev array
		if (buffer.length > 0) {
		    indices[indices.length - 1]++;
		}
	    } else {
		indices[indices.length - 1] = indx;
	    }
	};
	
	if (isArray(elem)) {
	    if (!(buffer.length >= max_deep)) {
		buffer.push(elem);
		indices.push(0);
		return false;
	    } else {
		elem_buffer = elem;
		returned_p = false;

		process_indx();		
		return true;
	    }
	} else {
	    elem_buffer = elem;
	    returned_p = false;

	    process_indx();
	    return true;
	}	
	
	return false;
    };
    
    var hasNext = function () {
	while (buffer.length > 0 || iterator.hasNext()) {
	    // Try extract elem from buffer
	    if (buffer.length > 0) {
		var result = buffer_extract();
		if (result) {
		    return result;
		}
		// Try extract elem from iterator
	    } else if (iterator.hasNext()) {
		var elem = iterator.next();
		if (isArray(elem)) {
		    // if (deep == undefined) this pred is true
		    // if (deep is int) then it's equal to (buffer.length < deep)
		    if (!(buffer.length >= max_deep)) {
			buffer.push(elem);
			indices.push(0);
		    } else {
			elem_buffer = elem;
			returned_p = false;
			return true;
		    }
		} else {
		    elem_buffer = elem;
		    returned_p = false;
		    return true;
		}
	    }
	}

	return false;
    };
	

    var next = function () {
	if (!returned_p) {
	    returned_p = true;
	    return elem_buffer;
	}

	if (hasNext()) {
	    returned_p = true;
	    return elem_buffer;
	}

	return undefined;
    };

    var reset = function () {
	buffer = [];
	indices = [];
	elem_buffer = undefined;
	returned_p = true;
	iterator.reset();
    };

    return {
	next: next,
	hasNext: hasNext,
	reset: reset
    };
};


Fold = function (iterator, fun, init) {
    var state = init;

    while (iterator.hasNext()) {
	state = fun(state, iterator.next());
    }

    return state;
};


lazy = function (arr) {    
    var source = arr;
    if (isArray(arr)) {
	source = ArrayIterator(arr);
    }

    var where = function (pred) {
	this.source = FilterIterator(this.source, pred);
	return this;
    };

    var map = function (fun) {
	this.source = MapIterator(this.source, fun);
	return this;
    };

    var until = function (pred) {
	this.source = WhileIterator(this.source, pred);
	return this;
    };

    var fold = function (fun, init) {
	return Fold(this.source, fun, init);
    };

    var zip = function (n) {
	this.source = ZipIterator(this.source, n);
	return this;
    };

    var force = function () {
	var result = [];
	while (this.hasNext()) {
	    result.push(this.next());
	}
	return result;
    };

    var take = function (n) {
	if (n > 0) {
	    var result = [];
	    while(this.hasNext() && n-- > 0) {
		result.push(this.next());
	    }
	    return result;
	}
	return undefined;
    };

    var drop = function (n) {
	if (n > 0) {
	    while(this.hasNext() && n-- > 0) {
		this.next();
	    }
	    return this;
	}
	return undefined;
    };

    var chain = function (deep) {
	this.source = ChainIterator(this.source, deep);
	return this;
    };    

    var next = function () {
	return this.source.next();
    };

    var hasNext = function () {
	return this.source.hasNext();
    };

    var reset = function () {
	this.source.reset();
	return this;
    };

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
	zip: zip,
	chain: chain
    };
};
