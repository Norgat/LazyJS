
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
		res.push(I.next());
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
		    ArrayIterator([1,2,3]),
		    function (x) { return x % 2 == 1; }
		);
	    });

	    it ("apply iterator", function () {
		var I = new FilterIterator(
		    ArrayIterator([0,1,2,3,4,5]),
		    function (x) { return x % 2 == 0; }
		);

		apply_test(I, [0,2,4]);
	    });

	    it ("reset", function () {
		var I = new FilterIterator(
		    ArrayIterator([0,1,2,3,4,5]),
		    function (x) { return x % 2 == 0; }
		);

		apply_test(I, [0,2,4]);
		I.reset();
		apply_test(I, [0,2,4]);
	    });
	});

	describe("WhileIterator", function () {
	    it ("new", function () {
		var I = new WhileIterator(
		    ArrayIterator([1,2,3]),
		    function (x) { return x < 3; }
		);
	    });

	    it ("apply iterator", function () {
		var I = new WhileIterator(
		    ArrayIterator([0,1,2,3,4,5]),
		    function (x) { return x < 3; }
		);

		apply_test(I, [0,1,2]);
	    });

	    it ("reset", function () {
		var I = new WhileIterator(
		    ArrayIterator([0,1,2,3,4,5]),
		    function (x) { return x < 3; }
		);

		apply_test(I, [0,1,2]);
		I.reset();
		apply_test(I, [0,1,2]);
	    });
	});

	describe("ZipIterator", function () {
	    it ("new", function () {
		var I = new ZipIterator(
		    ArrayIterator([1,2,3,4]),
		    2);
	    });

	    it ("apply iterator", function () {
		var I = new ZipIterator(
		    ArrayIterator([0,1,2,3]),
		    2
		);

		apply_test(I, [[0,1],[2,3]]);
	    });

	    it ("reset", function () {
		var I = new ZipIterator(
		    ArrayIterator([0,1,2,3]),
		    2
		);

		apply_test(I, [[0,1],[2,3]]);
		I.reset();
		apply_test(I, [[0,1],[2,3]]);
	    });
	});
	
	describe("Multizipiterator", function () {
	    it ("new", function () {
		var I = new MultizipIterator(
		    ArrayIterator([1,2]), ArrayIterator([1,2])
		);
	    });

	    it ("apply iterator", function () {
		var I = new MultizipIterator(
		    new ArrayIterator(["a", "b"]), new ArrayIterator([1,2])
		);

		apply_test(I, [["a", 1], ["b", 2]]);
	    });

	    it ("reset", function () {
		var I = new MultizipIterator(
		    new ArrayIterator(["a", "b"]), new ArrayIterator([1,2])
		);

		apply_test(I, [["a", 1], ["b", 2]]);
		I.reset();
		apply_test(I, [["a", 1], ["b", 2]]);
	    });
	});
    });
    
    
    describe("lazy", function () {
	this.timeout(5000);
	
	it ("new lazy", function () {
	    var I = new lazy([1,2,3,4]);
	});

	it ("force", function () {
	    var I = new lazy([1,2,3,4]);
	    var res = I.force();
	    assert.deepEqual(res, [1,2,3,4]);
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

	it ("map", function () {
	    var I = new lazy([1,2,3,4]);
	    var res = I.map(function (x) { return x + 2; });

	    var first = res.hasNext();
	    assert.deepEqual(res.force(), [3,4,5,6]);
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
    });
});
