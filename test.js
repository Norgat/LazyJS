
describe("Lazy module", function () {

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

	it ("deep next", function () {
	    var I = new ArrayIterator([1,2,3]);
	    for (var i = 1; i < 4; ++i) {
		assert.equal(I.next(), i);
	    }

	    assert.equal(I.hasNext(), false);
	});
    });

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
