
LZY = (function () {
    var exports = {};
	
    exports.isArray = function (obj) {
	return Array.isArray(obj);
    };


    // HACK
    exports.isObject = function (obj) {
	return (typeof obj == "object");
    };


    exports.getKeys = function (obj) {
	var lst = [];
	for (var k in obj) {
	    if (obj.hasOwnProperty(k)) {
		lst.push(k);
	    }
	}

	return lst;
    };


    exports.FakeMultiArg = function () {};


    exports.argToIterator = function (arr) {
	if (exports.LazyIterator.prototype.isPrototypeOf(arr)) {
	    return arr;
	} else if (exports.isArray(arr)) {
	    return new exports.ArrayIterator(arr);
	} else if (exports.isObject(arr)) {
	    return new exports.ObjectIterator(arr);
	}
	throw new Error("Ivalid argument type!");
    };


    exports.LazyIterator = function () {};

    exports.LazyIterator.prototype.next = function () {
	throw new Error("Realization of next() is undefined.");
    };

    exports.LazyIterator.prototype.hasNext = function () {
	throw new Error("Realization of hasNext() is undefined.");
    };

    exports.LazyIterator.prototype.reset = function () {
	throw new Error("Realisation of reset() is undefined.");
    };


    exports.ArrayIterator = function (obj) {
	if (!exports.isArray(obj)) {
	    throw new Error("Argument isn't Array.");
	}

	var state = 0;

	this.hasNext = function () {
	    return state < obj.length;
	};

	this.next = function () {
	    if (this.hasNext()) {
		return obj[state++];
	    }
	    return undefined;
	}; 

	this.reset = function () {
	    state = 0;
	};

	this.type = 1;
    };

    exports.ArrayIterator.prototype = exports.LazyIterator.prototype;


    exports.ObjectIterator = function (obj) {
	var keyIterator = new exports.ArrayIterator(exports.getKeys(obj));

	this.next = function () {
	    if (keyIterator.hasNext()) {
		var key = keyIterator.next();
		var val = obj[key];
		return [key, val];
	    };

	    return undefined;
	};

	this.hasNext = keyIterator.hasNext;
	this.reset = keyIterator.reset;
	this.type = 2;
    };

    exports.ObjectIterator.prototype = exports.LazyIterator.prototype;


    exports.MapIterator = function (iterator, fun) {
	if (iterator.type == 1) {
	    this.next = function () {
		if (iterator.hasNext()) {
		    return fun(iterator.next());
		}
		return undefined;
	    };
	} else if (iterator.type == 2) {
	    this.next = function () {
		if (iterator.hasNext()) {
		    return fun.apply(this, iterator.next());
		}
		return undefined;
	    };
	}

	this.hasNext = iterator.hasNext;
	this.reset = iterator.reset;
	this.type = iterator.type;
    };

    exports.MapIterator.prototype = exports.LazyIterator.prototype;


    exports.FilterIterator = function (iterator, pred) {
	var buff = undefined;
	var not_erased_flag = false;

	var pred_fun = undefined;
	if (iterator.type == 1) {
	    pred_fun = pred;
	} else if (iterator.type == 2) {
	    pred_fun = function (key_value) { return pred.apply(this, key_value); };
	}
	
	this.hasNext = function () {
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

	this.next = function () {
	    if (this.hasNext()) {
		not_erased_flag = false;
		return buff;
	    }
	    return undefined;
	};

	this.reset = iterator.reset;
	this.type = iterator.type;
    };

    exports.FilterIterator.prototype = exports.LazyIterator.prototype;


    exports.WhileIterator = function (iterator, pred) {
	var stop_flag = false;
	var buff = undefined;
	var buff_flag = false;

	var pred_fun = undefined;
	if (iterator.type == 1) {
	    pred_fun = pred;
	} else if (iterator.type == 2) {
	    pred_fun = function(kv) { return pred.apply(this, kv); };
	}

	this.hasNext = function () {
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

	this.next = function () {
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

	this.reset = iterator.reset;
	this.type = iterator.type;
    };

    exports.WhileIterator.prototype = exports.LazyIterator.prototype;


    exports.ZipIterator = function (iterator, n) {
	if (typeof n != "number" || n < 1) {
	    throw new Error("ZipIterator: Invalid zip number");
	}
	
	this.next = function () {
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

	this.hasNext = iterator.hasNext;
	this.reset = iterator.reset;
	this.type = 1;
    };

    exports.ZipIterator.prototype = exports.LazyIterator.prototype;


    exports.MultiZipIterator = function () {
	var iters = arguments;

	if (arguments.length < 1) {
	    throw new Error("Too few arguments passed to MultiZipiterator.");
	}

	if (arguments.length == 1) {
	    iters = [exports.argToIterator(arguments[0])];
	}

	if (arguments.length > 1 && exports.FakeMultiArg.prototype.isPrototypeOf(arguments[0])) {
	    iters = [];
	    for (var i = 0; i < arguments[1].length; ++i) {
		iters.push(exports.argToIterator(arguments[1][i]));
	    }
	} else {
	    iters = [];
	    for (var j = 0; j < arguments.length; ++j) {
		iters.push(exports.argToIterator(arguments[j]));
	    }
	}
	
	var buffer = undefined;
	var returned_p = true;

	this.hasNext = function () {
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

	this.next = function () {
	    if (this.hasNext()) {
		returned_p = true;
		return buffer;
	    }
	    return undefined;
	};

	this.reset = function () {
	    for (var i = 0; i < iters.length; ++i) {
		iters[i].reset();
	    }
	    returned_p = true;
	};

	this.type = 1;
    };

    exports.MultiZipIterator.prototype = exports.LazyIterator.prototype;


    exports.ChainIterator = function (iterator, max_deep) {
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
	    
	    if (exports.isArray(elem)) {
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
	};
	
	this.hasNext = function () {
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
		    if (exports.isArray(elem)) {
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
	

	this.next = function () {
	    if (!returned_p) {
		returned_p = true;
		return elem_buffer;
	    }

	    if (this.hasNext()) {
		returned_p = true;
		return elem_buffer;
	    }

	    return undefined;
	};

	this.reset = function () {
	    buffer = [];
	    indices = [];
	    elem_buffer = undefined;
	    returned_p = true;
	    iterator.reset();
	};

	this.type = 1;
    };

    exports.ChainIterator.prototype = exports.LazyIterator.prototype;


    exports.MultiChainIterator = function () {
	if (arguments.length < 1) {
	    throw new Error("Too few arguments passed to MailtiChainIterator.");
	}

	var args = arguments;
	if (arguments.length == 2 && exports.FakeMultiArg.prototype.isPrototypeOf(arguments[0])) {
	    args = arguments[1];
	}

	if (args.length == 1) {
	    return exports.argToIterator(args[0]);
	}

	var iterators = [];
	for (var i in args) {
	    iterators.push(exports.argToIterator(args[i]));
	}

	var indx = 0;

	this.hasNext = function () {
	    while (indx < iterators.length && !iterators[indx].hasNext()) {
		indx++;
	    }

	    if (indx >= iterators.length) {
		return false;
	    } else {
		return true;
	    }	
	};

	this.next = function () {
	    if (this.hasNext()) {
		return iterators[indx].next();
	    } else {
		return undefined;
	    }
	};

	this.reset = function () {
	    for (var i in iterators) {
		iterators[i].reset();
	    }
	    indx = 0;
	};

	this.type = 1;
    };

    exports.MultiChainIterator.prototype = exports.LazyIterator.prototype;


    exports.GeneratorIterator = function (start, gen_fun) {
	var state = start;

	this.hasNext = function () { return true; };
	
	this.next = function () {
	    state = gen_fun(state);
	    return state;
	};

	this.reset = function () {
	    state = start;
	};

	this.type = 1;    
    };

    exports.GeneratorIterator.prototype = exports.LazyIterator.prototype;

    exports.gen = function (start, gen_fun) {
	return new exports.GeneratorIterator(start, gen_fun);
    };


    exports.Fold = function (iterator, fun, init) {
	var state = init;

	var apply_fun = undefined;
	if (iterator.type == 1) {
	    apply_fun = fun;
	} else if (iterator.type == 2) {
	    apply_fun = function (state, kv) {
		return fun(state, kv[0], kv[1]);
	    };
	}

	while (iterator.hasNext()) {
	    state = apply_fun(state, iterator.next());
	}

	return state;
    };


    exports.BaseIterator = function () {};

    exports.BaseIterator.prototype = exports.LazyIterator.prototype;

    exports.BaseIterator.prototype.where = function (pred) {
	this.source = new exports.FilterIterator(this.source, pred);
	return this;
    };

    exports.BaseIterator.prototype.map = function (fun) {
	this.source = new exports.MapIterator(this.source, fun);
	return this;
    };

    exports.BaseIterator.prototype.until = function (pred) {
	this.source = new exports.WhileIterator(this.source, pred);
	return this;
    };

    exports.BaseIterator.prototype.fold = function (fun, init) {
	return exports.Fold(this.source, fun, init);
    };

    exports.BaseIterator.prototype.zip = function (n) {
	this.source = new exports.ZipIterator(this.source, n);
	return this;
    };

    exports.BaseIterator.prototype.force = function () {
	var result = [];
	while (this.hasNext()) {
	    result.push(this.next());
	}
	return result;
    };

    exports.BaseIterator.prototype.take = function (n) {
	if (n > 0) {
	    var result = [];
	    while(this.hasNext() && n-- > 0) {
		result.push(this.next());
	    }
	    return result;
	}
	return undefined;
    };

    exports.BaseIterator.prototype.drop = function (n) {
	if (n > 0) {
	    while(this.hasNext() && n-- > 0) {
		this.next();
	    }
	    return this;
	}
	return undefined;
    };

    exports.BaseIterator.prototype.chain = function (deep) {
	this.source = new exports.ChainIterator(this.source, deep);
	return this;
    };    

    exports.BaseIterator.prototype.next = function () {
	return this.source.next();
    };

    exports.BaseIterator.prototype.hasNext = function () {
	return this.source.hasNext();
    };

    exports.BaseIterator.prototype.reset = function () {
	this.source.reset();
	return this;
    };


    exports.lazy = function () {
	this.source = new exports.MultiChainIterator(new exports.FakeMultiArg(), arguments);
    };

    exports.lazy.prototype = exports.BaseIterator.prototype;


    exports.zip = function () {
	this.source = new exports.MultiZipIterator(new exports.FakeMultiArg(), arguments);
    };

    exports.zip.prototype = exports.BaseIterator.prototype;

    return exports;
}());
