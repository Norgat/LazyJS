
describe("Lazy module", function () {

    describe("Common iterators", function () {
	describe("ArrayIterator", function () {
	    it ("new", function () {
		var I = new ArrayIterator([1,2,3]);
	    });

	    it ("next", function () {
		var I = new ArrayIterator([1,2,3]);
		assert.equal(I.next(), 1);
	    });

	    it ("hasNext", function () {
		var I = new ArrayIterator([1,2,3]);
		assert.equal(I.hasNext(), true);
	    });

	    it ("reset", function () {
		var I = new ArrayIterator([0,1,2,3]);
		for (var i = 0; i < 4; ++i) {
		    assert.equal(I.next(), i);
		}

		I.reset();
		for (var j = 0; j < 4; ++j) {
		    assert.equal(I.next(), j);
		}
	    });

	    it ("deep next", function () {
		var I = new ArrayIterator([1,2,3]);
		for (var i = 1; i < 4; ++i) {
		    assert.equal(I.next(), i);
		}

		assert.equal(I.hasNext(), false);
	    });
	});

	describe("ObjectIterator", function () {
	    it ("new", function () {
		var I = new ObjectIterator({a: 2, b: 3});
	    });

	    it ("hasNext", function () {
		var I = new ObjectIterator({a: 2, b: 3});
		assert.equal(I.hasNext(), true);
	    });

	    it ("next", function () {
		var I = new ObjectIterator({a: 2});
		assert.deepEqual(I.next(), ["a", 2]);
	    });

	    it ("reset", function () {
		var I = new ObjectIterator({a: 2});
		assert.deepEqual(I.next(), ["a", 2]);
		assert.equal(I.hasNext(), false);
		I.reset();
		assert.deepEqual(I.next(), ["a", 2]);
	    });
	});

    });


    describe("Wrap iterators", function () {

	var apply_test = function (I, result) {
	    var res = [];
	    while (I.hasNext()) {
		var tmp = I.next();
		res.push(tmp);
	    }
	    assert.deepEqual(res, result);
	};
	
	describe("MapIterator", function () {
	    it ("new", function () {
		var I = new MapIterator(new ArrayIterator([1,2,3]), function (x) { return x; });
	    });

	    it ("apply iterator", function () {
		var I = new MapIterator(
		    new ArrayIterator([1,2,3]),
		    function (x) { return x; }
		);

		for (var i = 1; i < 4; ++i) {
		    assert.equal(I.next(), i);
		}

		assert.equal(I.hasNext(), false);
	    });

	    it ("reset", function () {
		var I = new MapIterator(
		    new ArrayIterator([1,2,3]),
		    function (x) { return x; }
		);

		for (var i = 1; i < 4; ++i) {
		    assert.equal(I.next(), i);
		}

		assert.equal(I.hasNext(), false);

		I.reset();

		for (var i = 1; i < 4; ++i) {
		    assert.equal(I.next(), i);
		}

		assert.equal(I.hasNext(), false);
	    });

	    it ("Key-Value map", function () {
		var I = new MapIterator(
		    new ObjectIterator({a: 2, b: 3}),
		    function (k, v) { return [k, v]; }
		);
		var res = {};
		while (I.hasNext()) {
		    var tmp = I.next();
		    res[tmp[0]] = tmp[1];
		}

		assert.deepEqual(res, {a: 2, b: 3});
	    });
	});


	describe("FilterIterator", function () {
	    it ("new", function () {
		var I = new FilterIterator(
		    new ArrayIterator([1,2,3]),
		    function (x) { return x % 2 == 1; }
		);
	    });

	    it ("apply iterator", function () {
		var I = new FilterIterator(
		    new ArrayIterator([0,1,2,3,4,5]),
		    function (x) { return x % 2 == 0; }
		);

		apply_test(I, [0,2,4]);
	    });

	    it ("reset", function () {
		var I = new FilterIterator(
		    new ArrayIterator([0,1,2,3,4,5]),
		    function (x) { return x % 2 == 0; }
		);

		apply_test(I, [0,2,4]);
		I.reset();
		apply_test(I, [0,2,4]);
	    });

	    it ("Key-Value", function () {
		var I = new FilterIterator(
		    new ObjectIterator({"a": 2, "b": 3, "c": 4, "d": 5}),
		    function(k, v) { return v % 2 == 0; }
		);

		var res = {};
		while (I.hasNext()) {
		    var kv = I.next();
		    res[kv[0]] = kv[1];
		}

		assert.deepEqual(res, {"a": 2, "c": 4});
	    });
	});

	describe("WhileIterator", function () {
	    it ("new", function () {
		var I = new WhileIterator(
		    new ArrayIterator([1,2,3]),
		    function (x) { return x < 3; }
		);
	    });

	    it ("apply iterator", function () {
		var I = new WhileIterator(
		    new ArrayIterator([0,1,2,3,4,5]),
		    function (x) { return x < 3; }
		);

		apply_test(I, [0,1,2]);
	    });

	    it ("reset", function () {
		var I = new WhileIterator(
		    new ArrayIterator([0,1,2,3,4,5]),
		    function (x) { return x < 3; }
		);

		apply_test(I, [0,1,2]);
		I.reset();
		apply_test(I, [0,1,2]);
	    });

	    it ("Key-Value", function () {
		var source = new ArrayIterator([[2,2], [2,1], [3,4], [6,6], [7,8]]);
		source.type = 2;
		var I = new WhileIterator(
		    source,
		    function (k, v) { return k % 2 == 0; }
		);

		apply_test(I, [[2,2], [2,1]]);
	    });
	});

	describe("ZipIterator", function () {
	    it ("new", function () {
		var I = new ZipIterator(
		    new ArrayIterator([1,2,3,4]),
		    2);
	    });

	    it ("apply iterator", function () {
		var I = new ZipIterator(
		    new ArrayIterator([0,1,2,3]),
		    2
		);

		apply_test(I, [[0,1],[2,3]]);
	    });

	    it ("reset", function () {
		var I = new ZipIterator(
		    new ArrayIterator([0,1,2,3]),
		    2
		);

		apply_test(I, [[0,1],[2,3]]);
		I.reset();
		apply_test(I, [[0,1],[2,3]]);
	    });
	});
	
	describe("MultiZipiterator", function () {
	    it ("new", function () {
		var I = new MultiZipIterator(
		    new ArrayIterator([1,2]),
		    new ArrayIterator([1,2])
		);

		var J = new MultiZipIterator([1,2], [3,4]);
	    });

	    it ("apply iterator", function () {
		var I = new MultiZipIterator(
		    new ArrayIterator(["a", "b"]), new ArrayIterator([1,2])
		);

		apply_test(I, [["a", 1], ["b", 2]]);
	    });

	    it ("reset", function () {
		var I = new MultiZipIterator(
		    new ArrayIterator(["a", "b"]), new ArrayIterator([1,2])
		);

		apply_test(I, [["a", 1], ["b", 2]]);
		I.reset();
		apply_test(I, [["a", 1], ["b", 2]]);
	    });
	});


	describe("MuiltiChainIterator", function () {
	    it ("new", function () {
		var I = new MultiChainIterator(
		    new ArrayIterator([1,2,3]),
		    [1,2,3]);		
	    });

	    it ("hasNext", function () {
		var I = new MultiChainIterator(
		    new ArrayIterator([1,2,3]),
		    [1,2,3]);

		for (var i = 0; i < 6; ++i) {
		    I.next();
		}

		assert.equal(I.hasNext(), false);
	    });

	    it ("next", function () {
		var I = new MultiChainIterator(
		    new ArrayIterator([1,2,3]),
		    [1,2,3]);

		assert.equal(I.next(), 1);
	    });

	    it ("reset", function () {
		var I = new MultiChainIterator(
		    new ArrayIterator([1,2,3]),
		    [1,2,3]);

		I.next();
		I.reset();

		for (var i = 0; i < 6; ++i) {
		    assert.equal(I.hasNext(), true);
		    I.next();
		}

		assert.equal(I.hasNext(), false);
	    });
	});
    });
    

    describe("Single functions", function () {
	it ("Fold Key-Value", function () {
	    var I = new ArrayIterator([[2,2], [2,2], [2,2], [2,2]]);
	    I.type = 2;
	    
	    var res = Fold(I, function (st, k, v) { return st + k + v; }, 0);
	    assert.equal(res, 16);
	});
    });
    
    
    describe("lazy", function () {
	this.timeout(5000);
	
	it ("new lazy", function () {
	    var I = new lazy([1,2,3,4]);
	});

	it ("new KV lazy", function () {
	    var I = new lazy({"a": 1, "b": 2});
	});

	it ("next & hasNext this KV lazy", function () {
	    var I = new lazy({"a": 1, "b": 2});

	    assert.equal(I.hasNext(), true);

	    var res = {};
	    while (I.hasNext()) {
		var kv = I.next();
		res[kv[0]] = kv[1];
	    }

	    assert.deepEqual(res, {"a": 1, "b": 2});
	});

	it ("force", function () {
	    var I = new lazy([1,2,3,4]);
	    var res = I.force();
	    assert.deepEqual(res, [1,2,3,4]);
	});

	it ("KV force", function () {
	    var d = {"a": 1, "b": 2};
	    var I = new lazy(d);

	    var res = {};
	    while (I.hasNext()) {
		var kv = I.next();
		res[kv[0]] = kv[1];
	    }

	    assert.deepEqual(res, d);
	});

	it ("drop", function () {
	    var I = new lazy([1,2,3,4]);
	    var res = I.drop(1).force();
	    assert.deepEqual(res, [2,3,4]);
	});

	it ("take", function () {
	    var I = new lazy([1,2,3,4]);
	    var res = I.take(2);
	    assert.deepEqual(res, [1,2]);
	});

	it ("fold", function () {
	    var I = new lazy([1,2,3,4]);
	    var res = I.fold(function (state, x) { return state + x; }, 0);
	    assert.equal(res, 10);
	});

	it ("KV fold", function () {
	    var d = {2: 3, 4: 5};
	    var I = new lazy(d);
	    
	    var res = I.fold(function (state, k, v) { return state + parseInt(k) + v;}, 0);
	    assert.equal(res, 14);
	});

	it ("reset", function () {
	    var I = new lazy([1,2,3,4]);
	    assert.deepEqual(I.force(), [1,2,3,4]);
	    assert.deepEqual(I.reset().force(), [1,2,3,4]);
	});

	it ("next", function () {
	    var I = new lazy([1,2,3,4]);
	    assert.equal(I.next(), 1);
	});

	it ("until", function () {
	    var I = new lazy([1,2,3,4]);
	    assert.deepEqual(
		I.until(function (x) {
		    return x < 3;
		}).force(), [1,2]);
	});

	it ("where", function () {
	    var I = new lazy([1,2,3,4]);
	    var res = I.where(function (x) { return x % 2 == 1; }).force();
	    assert.deepEqual(res, [1,3]);
	});

	it ("KV where", function () {
	    var d = {"a": 2, "b": 3};
	    var I = new lazy(d);
	    
	    var res = I.where(function (k, v) { return v % 2 == 0;}).force();
	    assert.deepEqual(res, [["a", 2]]);
	});

	it ("map", function () {
	    var I = new lazy([1,2,3,4]);
	    var res = I.map(function (x) { return x + 2; });

	    var first = res.hasNext();
	    assert.deepEqual(res.force(), [3,4,5,6]);
	});

	it ("KV map", function () {
	    var d = {"b": 3};
	    var I = new lazy(d);
	    var res = I.map(function (k, v) { return [k, v+1]; }).force();

	    assert.deepEqual(res, [["b", 4]]);
	});

	it ("zip", function () {
	    var I = new lazy([1,2,3,4]);
	    var res = I.zip(2).force();

	    assert.deepEqual(res, [[1,2], [3,4]]);
	});

	it ("chain", function () {
	    var I = new lazy([[[1,2],3],4]);
	    var res = I.chain().force();

	    assert.deepEqual(res, [1,2,3,4]);

	    var J = new lazy([[[1],2],3,4]);
	    assert.deepEqual(J.chain(1).force(), [[1],2,3,4]);
	});

	it ("Iterator as intial value", function () {
	    var I = new ArrayIterator([1,2,3]);
	    var J = new lazy(I);

	    assert.deepEqual(J.force(), [1,2,3]);
	});

	it ("Multi input value", function () {
	    var I = new lazy([1,2,3], [2,3]);
	    assert.deepEqual(I.force(), [1,2,3,2,3]);
	});
    });


    describe ("zip", function () {
	it ("new", function () {
	    var I = new zip([1,2], [3,4]);
	});

	it ("hasNext", function () {
	    var I = new zip([1,2], [3,4]);
	    assert.equal(I.hasNext(), true);
	});

	it ("next", function () {
	    var I = new zip([1,2], [3,4]);
	    var res = I.next();
	    assert.deepEqual(res, [1,3]);
	});

	it ("force", function () {
	    var I = new zip([1,2], [3,4]);
	    assert.deepEqual(I.force(), [[1,3], [2,4]]);
	});

	it ("reset", function () {
	    var I = new zip([1,2], [3,4]);
	    assert.deepEqual(I.force(), [[1,3], [2,4]]);
	    I.reset();
	    assert.deepEqual(I.force(), [[1,3], [2,4]]);
	});

	it ("drop", function () {
	    var I = new zip([1,2], [3,4]);
	    assert.deepEqual(I.drop(1).force(), [[2,4]]);
	});

	it ("take", function () {
	    var I = new zip([1,1,1], [2,2,2]);
	    assert.deepEqual(I.take(2), [[1,2], [1,2]]);
	});

	it ("fold", function () {
	    var I = new zip([1,1,1], [2,2,2]);
	    assert.equal(I.fold(function (st, x) {
		return st + x[0];
	    }, 0), 3);
	});

	it ("until", function () {
	    var I = new zip([1,2,3,4,5], [2,2,2,2,2]);
	    assert.equal(
		I.until(function (x) { return x[0] < 4; }).fold(
		    function (st, x) { return st + x[1]; }, 0),
		6);
	});

	it ("where", function () {
	    var I = new zip([1,2,3,4,5], [2,2,2,2,2]);
	    assert.equal(
		I.where(function (x) { return x[0] % 2 == 1; }).fold(
		    function (st, x) { return st + x[1]; }, 0),
		6);
	});

	it ("zip", function () {
	    var I = new zip([1,1,1,1], [2,2,2,2]);
	    assert.deepEqual(I.zip(2).force(), [[[1,2], [1,2]], [[1,2], [1,2]]]);
	});

	it ("chain", function() {
	    var I = new zip([1,1], [2,2]);
	    assert.deepEqual(I.chain().force(), [1,2,1,2]);
	});
    });
});
