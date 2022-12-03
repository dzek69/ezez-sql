import { select } from "./select.js";

describe("select", function() {
    it("works with the most basic query", function() {
        const q = select("*").from("whatever");
        q.query().must.equal(`SELECT *
FROM whatever`);
        q.queryValues().must.eql([]);
    });

    it("works with multiple columns query", function() {
        const q = select("id", "name").from("table");
        q.query().must.equal(`SELECT id, name
FROM table`);
        q.queryValues().must.eql([]);
    });

    it("works with named columns", function() {
        const q = select("id", "name", { bookTitle: "title" }).from("table");
        q.query().must.equal(`SELECT id, name, bookTitle AS title
FROM table`);
        q.queryValues().must.eql([]);
    });

    it("works with named columns with objects with more than one property", function() {
        const q = select("id", "name", { bookTitle: "title", bookPrice: "price" }).from("table");
        q.query().must.equal(`SELECT id, name, bookTitle AS title, bookPrice AS price
FROM table`);
        q.queryValues().must.eql([]);
    });

    it("works with basic where query", function() {
        const q = select("*").from("table").where([{ a: 5 }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a = ?`);
        q.queryValues().must.eql([5]);
    });

    it("works with where query with OR operator", function() {
        const q = select("*").from("table").where([{ a: 5 }, "or", { a: 3 }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a = ? OR a = ?`);
        q.queryValues().must.eql([5, 3]);
    });

    it("works with where query with multiple columns in object", function() {
        const q = select("*").from("table").where([{ a: 1, b: 2 }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a = ? AND b = ?)`);
        q.queryValues().must.eql([1, 2]);
    });

    it("works with mixed and/or, multiple columns, and array values", function() {
        const q = select("*").from("table").where([{ a: 1, b: 2 }, "or", { title: ["John A", "John B"] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a = ? AND b = ?) OR title IN (?, ?)`);
        q.queryValues().must.eql([1, 2, "John A", "John B"]);
    });

    it("works with nested conditions", function() {
        const q = select("*").from("table").where([{ a: 1, b: 2 }, "or", [[{ title: "John A" }, "OR", { title: "John B" }]]]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a = ? AND b = ?) OR (
    title = ? OR title = ?
)`);
        q.queryValues().must.eql([1, 2, "John A", "John B"]);
    });

    it("works with multiple nested conditions", function() {
        const q = select("*").from("table").where([[[{ a: 1 }, "AND", [[{ b: 2 }, "or", { b: 3 }]]]], "or", [[{ title: "John A" }, "OR", { title: "John B" }]]]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (
    a = ? AND (
        b = ? OR b = ?
    )
) OR (
    title = ? OR title = ?
)`);
        q.queryValues().must.eql([1, 2, 3, "John A", "John B"]);
    });

    it("works with like statements", function() {
        const q = select("*").from("table").where([{ "%a": "any" }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a LIKE ?`);
        q.queryValues().must.eql(["any"]);
    });

    it("works with like statements (multiple variants)", function() {
        const q = select("*").from("table").where([{ "%a": ["any", "thing"] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a LIKE ? OR a LIKE ?)`);
        q.queryValues().must.eql(["any", "thing"]);
    });

    it("works with null with like statements (single value)", function() {
        const q = select("*").from("table").where([{ "%a": null }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a IS NULL`);
        q.queryValues().must.eql([]);
    });

    it("works with null with like statements (multiple values)", function() {
        const q = select("*").from("table").where([{ "%a": [null, "s"] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a LIKE ? OR a IS NULL)`);
        q.queryValues().must.eql(["s"]);
    });

    it("works with null with like statements (multiple values, multiple null)", function() {
        const q = select("*").from("table").where([{ "%a": [null, "s", null, "a"] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a LIKE ? OR a LIKE ? OR a IS NULL)`);
        q.queryValues().must.eql(["s", "a"]);
    });

    it("works with null with IN statements", function() {
        const q = select("*").from("table").where([{ a: ["x", null] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a IS NULL OR a IN (?))`);
        q.queryValues().must.eql(["x"]);
    });

    it("works with null with IN statements", function() {
        const q = select("*").from("table").where([{ a: ["x", null] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a IS NULL OR a IN (?))`);
        q.queryValues().must.eql(["x"]);
    });

    it("works with null with IN statements (multiple nulls)", function() {
        const q = select("*").from("table").where([{ a: [null, "x", null] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a IS NULL OR a IN (?))`);
        q.queryValues().must.eql(["x"]);
    });

    it("works with empty values with IN statements (impossible query)", function() {
        const q = select("*").from("table").where([{ a: [] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE 1=0`);
        q.queryValues().must.eql([]);
    });

    it("works with empty values with LIKE statements (impossible query)", function() {
        const q = select("*").from("table").where([{ "%a": [] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE 1=2`);
        q.queryValues().must.eql([]);
    });

    it("works with less than", function() {
        const q = select("*").from("table").where([{ "<a": 5 }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a < ?`);
        q.queryValues().must.eql([5]);
    });

    it("crashes with less than NULL", function() {
        const q = select("*").from("table").where([{ "<a": null }]);
        (() => q.pair()).must.throw();
    });

    it("works with less than (multiple values)", function() {
        const q = select("*").from("table").where([{ "<a": [5, 10] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a < ? AND a < ?)`);
        q.queryValues().must.eql([5, 10]);
    });

    it("works with less than (empty values, impossible query)", function() {
        const q = select("*").from("table").where([{ "<a": [] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE 0=2`);
        q.queryValues().must.eql([]);
    });

    it("crashes with less than (multiple values, null)", function() {
        const q = select("*").from("table").where([{ "<a": [5, null, 10] }]);
        (() => q.pair()).must.throw();
    });

    it("works with less than/equal", function() {
        const q = select("*").from("table").where([{ "<=a": 5 }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a <= ?`);
        q.queryValues().must.eql([5]);
    });

    it("crashes with less than/equal NULL", function() {
        const q = select("*").from("table").where([{ "<=a": null }]);
        (() => q.pair()).must.throw();
    });

    it("works with less than/equal (multiple values)", function() {
        const q = select("*").from("table").where([{ "<=a": [5, 10] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a <= ? AND a <= ?)`);
        q.queryValues().must.eql([5, 10]);
    });

    it("works with less than/equal (empty values, impossible query)", function() {
        const q = select("*").from("table").where([{ "<=a": [] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE 0=2`);
        q.queryValues().must.eql([]);
    });

    it("crashes with less than/equal (multiple values, null)", function() {
        const q = select("*").from("table").where([{ "<=a": [5, null, 10] }]);
        (() => q.pair()).must.throw();
    });

    it("crashes with between as number", function() {
        const q = select("*").from("table").where([{ "<>a": 5 }]);
        (() => q.pair()).must.throw();
    });

    it("crashes with between as empty array", function() {
        const q = select("*").from("table").where([{ "<>a": [] }]);
        (() => q.pair()).must.throw();
    });

    it("crashes with between as 1 element array", function() {
        const q = select("*").from("table").where([{ "<>a": [1] }]);
        (() => q.pair()).must.throw();
    });

    it("crashes with between as 3 elements array", function() {
        const q = select("*").from("table").where([{ "<>a": [1, 2, 3] }]);
        (() => q.pair()).must.throw();
    });

    it("works with between", function() {
        const q = select("*").from("table").where([{ "<>a": [10, 20] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a >= ? AND a <= ?)`);
        q.queryValues().must.eql([10, 20]);
    });

    it("works with greater than", function() {
        const q = select("*").from("table").where([{ ">a": 5 }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a > ?`);
        q.queryValues().must.eql([5]);
    });

    it("crashes with greater than NULL", function() {
        const q = select("*").from("table").where([{ ">a": null }]);
        (() => q.pair()).must.throw();
    });

    it("works with greater than (multiple values)", function() {
        const q = select("*").from("table").where([{ ">a": [5, 10] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a > ? AND a > ?)`);
        q.queryValues().must.eql([5, 10]);
    });

    it("works with greater than (empty values, impossible query)", function() {
        const q = select("*").from("table").where([{ ">a": [] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE 0=2`);
        q.queryValues().must.eql([]);
    });

    it("crashes with greater than (multiple values, null)", function() {
        const q = select("*").from("table").where([{ ">a": [5, null, 10] }]);
        (() => q.pair()).must.throw();
    });

    it("works with greater than/equal", function() {
        const q = select("*").from("table").where([{ ">=a": 5 }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a >= ?`);
        q.queryValues().must.eql([5]);
    });

    it("crashes with greater than/equal NULL", function() {
        const q = select("*").from("table").where([{ ">=a": null }]);
        (() => q.pair()).must.throw();
    });

    it("works with greater than/equal (multiple values)", function() {
        const q = select("*").from("table").where([{ ">=a": [5, 10] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a >= ? AND a >= ?)`);
        q.queryValues().must.eql([5, 10]);
    });

    it("works with greater than/equal (empty values, impossible query)", function() {
        const q = select("*").from("table").where([{ ">=a": [] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE 0=2`);
        q.queryValues().must.eql([]);
    });

    it("crashes with greater than/equal (multiple values, null)", function() {
        const q = select("*").from("table").where([{ ">=a": [5, null, 10] }]);
        (() => q.pair()).must.throw();
    });

    it("works with not greater than", function() {
        const q = select("*").from("table").where([{ "!>a": 5 }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a <= ?`);
        q.queryValues().must.eql([5]);
    });

    it("crashes with not greater than NULL", function() {
        const q = select("*").from("table").where([{ "!>a": null }]);
        (() => q.pair()).must.throw();
    });

    it("works with not greater than (multiple values)", function() {
        const q = select("*").from("table").where([{ "!>a": [5, 10] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a <= ? AND a <= ?)`);
        q.queryValues().must.eql([5, 10]);
    });

    it("works with not greater than (empty values, impossible query)", function() {
        const q = select("*").from("table").where([{ "!>a": [] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE 0=2`);
        q.queryValues().must.eql([]);
    });

    it("crashes with not greater than (multiple values, null)", function() {
        const q = select("*").from("table").where([{ "!>a": [5, null, 10] }]);
        (() => q.pair()).must.throw();
    });

    it("works with not greater than/equal", function() {
        const q = select("*").from("table").where([{ "!>=a": 5 }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a < ?`);
        q.queryValues().must.eql([5]);
    });

    it("crashes with not greater than/equal NULL", function() {
        const q = select("*").from("table").where([{ "!>=a": null }]);
        (() => q.pair()).must.throw();
    });

    it("works with not greater than/equal (multiple values)", function() {
        const q = select("*").from("table").where([{ "!>=a": [5, 10] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a < ? AND a < ?)`);
        q.queryValues().must.eql([5, 10]);
    });

    it("works with not greater than/equal (empty values, impossible query)", function() {
        const q = select("*").from("table").where([{ "!>=a": [] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE 0=2`);
        q.queryValues().must.eql([]);
    });

    it("crashes with not greater than/equal (multiple values, null)", function() {
        const q = select("*").from("table").where([{ "!>=a": [5, null, 10] }]);
        (() => q.pair()).must.throw();
    });

    it("works with not less than", function() {
        const q = select("*").from("table").where([{ "!<a": 5 }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a >= ?`);
        q.queryValues().must.eql([5]);
    });

    it("crashes with not less than NULL", function() {
        const q = select("*").from("table").where([{ "!<a": null }]);
        (() => q.pair()).must.throw();
    });

    it("works with not less than (multiple values)", function() {
        const q = select("*").from("table").where([{ "!<a": [5, 10] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a >= ? AND a >= ?)`);
        q.queryValues().must.eql([5, 10]);
    });

    it("works with not less than (empty values, impossible query)", function() {
        const q = select("*").from("table").where([{ "!<a": [] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE 0=2`);
        q.queryValues().must.eql([]);
    });

    it("crashes with not less than (multiple values, null)", function() {
        const q = select("*").from("table").where([{ "!<a": [5, null, 10] }]);
        (() => q.pair()).must.throw();
    });

    it("works with not less than/equal", function() {
        const q = select("*").from("table").where([{ "!<=a": 5 }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a > ?`);
        q.queryValues().must.eql([5]);
    });

    it("crashes with not less than/equal NULL", function() {
        const q = select("*").from("table").where([{ "!<=a": null }]);
        (() => q.pair()).must.throw();
    });

    it("works with not less than/equal (multiple values)", function() {
        const q = select("*").from("table").where([{ "!<=a": [5, 10] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a > ? AND a > ?)`);
        q.queryValues().must.eql([5, 10]);
    });

    it("works with not less than/equal (empty values, impossible query)", function() {
        const q = select("*").from("table").where([{ "!<=a": [] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE 0=2`);
        q.queryValues().must.eql([]);
    });

    it("crashes with not less than/equal (multiple values, null)", function() {
        const q = select("*").from("table").where([{ "!<=a": [5, null, 10] }]);
        (() => q.pair()).must.throw();
    });

    it("crashes with not between as number", function() {
        const q = select("*").from("table").where([{ "!<>a": 5 }]);
        (() => q.pair()).must.throw();
    });

    it("crashes with not between as empty array", function() {
        const q = select("*").from("table").where([{ "!<>a": [] }]);
        (() => q.pair()).must.throw();
    });

    it("crashes with not between as 1 element array", function() {
        const q = select("*").from("table").where([{ "!<>a": [1] }]);
        (() => q.pair()).must.throw();
    });

    it("crashes with not between as 3 elements array", function() {
        const q = select("*").from("table").where([{ "!<>a": [1, 2, 3] }]);
        (() => q.pair()).must.throw();
    });

    it("works with not between", function() {
        const q = select("*").from("table").where([{ "!<>a": [10, 20] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a < ? OR a > ?)`);
        q.queryValues().must.eql([10, 20]);
    });

    it("works with basic not", function() {
        const q = select("*").from("table").where([{ "!a": "yy" }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a != ?`);
        q.queryValues().must.eql(["yy"]);
    });

    it("works with not null", function() {
        const q = select("*").from("table").where([{ "!a": null }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a IS NOT NULL`);
        q.queryValues().must.eql([]);
    });

    it("works with not IN", function() {
        const q = select("*").from("table").where([{ "!a": ["black", "red"] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a NOT IN (?, ?)`);
        q.queryValues().must.eql(["black", "red"]);
    });

    it("works with not IN with null", function() {
        const q = select("*").from("table").where([{ "!a": ["black", null, "red"] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a IS NOT NULL AND a NOT IN (?, ?))`);
        q.queryValues().must.eql(["black", "red"]);
    });

    it("works with not IN with multiple nulls", function() {
        const q = select("*").from("table").where([{ "!a": [null, "black", null, "red"] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a IS NOT NULL AND a NOT IN (?, ?))`);
        q.queryValues().must.eql(["black", "red"]);
    });

    it("works with empty values with not IN statements (impossible query)", function() {
        const q = select("*").from("table").where([{ "!a": [] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE 1=0`);
        q.queryValues().must.eql([]);
    });

    it("works with not like statements", function() {
        const q = select("*").from("table").where([{ "!%a": "any" }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a NOT LIKE ?`);
        q.queryValues().must.eql(["any"]);
    });

    it("works with not like statements (multiple variants)", function() {
        const q = select("*").from("table").where([{ "!%a": ["any", "thing"] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a NOT LIKE ? AND a NOT LIKE ?)`);
        q.queryValues().must.eql(["any", "thing"]);
    });

    it("works with null with not like statements (single value)", function() {
        const q = select("*").from("table").where([{ "!%a": null }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE a IS NOT NULL`);
        q.queryValues().must.eql([]);
    });

    it("works with null with not like statements (multiple values)", function() {
        const q = select("*").from("table").where([{ "!%a": [null, "s"] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a NOT LIKE ? AND a IS NOT NULL)`);
        q.queryValues().must.eql(["s"]);
    });

    it("works with null with not like statements (multiple values, multiple null)", function() {
        const q = select("*").from("table").where([{ "!%a": [null, "s", null, "a"] }]);
        q.query().must.equal(`SELECT *
FROM table
WHERE (a NOT LIKE ? AND a NOT LIKE ? AND a IS NOT NULL)`);
        q.queryValues().must.eql(["s", "a"]);
    });

    it("works if you mix everything!", function() {
        const q = select("*").from("table").where([
            {
                "title1": "elo",
                "!author": "you",
            },
            "or",
            [[
                {
                    "%me": "cake",
                },
                "and",
                [[[[
                    {
                        "%me": ["big", "small", null],
                    },
                ]]]],
            ]],
            "and",
            [[
                {
                    ">price": 320,
                    "<>size": [10, 20],
                    "!<>length": [50, 100],
                },
                "or",
                [[
                    {
                        something: [null, "a", "b"],
                    },
                    "or",
                    [[
                        {
                            ">=price": 500,
                            "<=price": 500,
                            "!>price": 500,
                            "!<price": 500,
                            "!price": null,
                        },
                    ]],
                ]],
            ]],
        ]);

        q.query().must.equal(`SELECT *
FROM table
WHERE (title1 = ? AND author != ?) OR (
    me LIKE ? AND (
        (
            (me LIKE ? OR me LIKE ? OR me IS NULL)
        )
    )
) AND (
    (price > ? AND (size >= ? AND size <= ?) AND (length < ? OR length > ?)) OR (
        (something IS NULL OR something IN (?, ?)) OR (
            (price >= ? AND price <= ? AND price <= ? AND price >= ? AND price IS NOT NULL)
        )
    )
)`);
        q.queryValues().must.eql(["elo", "you", "cake", "big", "small", 320, 10, 20, 50, 100, "a", "b", 500, 500, 500, 500]);
    });

    it("crashes when even items are not `and` / `or`", function() {
        const q = select("*").from("table").where([{ a: 5 }, { a: 6 }]);
        (() => q.pair()).must.throw();
    });

    it("crashes when arguments ends with `and` / `or`", function() {
        const q = select("*").from("table").where([{ a: 5 }, "and"]);
        (() => q.pair()).must.throw();
    });

    it("crashes when arguments has `and` / `or` as odd argument", function() {
        const q = select("*").from("table").where(["and"]);
        (() => q.pair()).must.throw();
    });

    it("works with order by", function() {
        const q = select("*").from("table").orderBy("a ASC");
        q.query().must.equal(`SELECT *
FROM table
ORDER BY a ASC`);
        q.queryValues().must.eql([]);
    });

    it("works with limit (single value)", function() {
        const q = select("*").from("table").limit(20);
        q.query().must.equal(`SELECT *
FROM table
LIMIT 20`);
        q.queryValues().must.eql([]);
    });

    it("works with limit (multiple values)", function() {
        const q = select("*").from("table").limit(10, 20);
        q.query().must.equal(`SELECT *
FROM table
LIMIT 10, 20`);
        q.queryValues().must.eql([]);
    });

    it("works with all at once", function() {
        const q = select("*").from("table").where([{ a: 1 }]).orderBy("id ASC").limit(10, 20);
        q.query().must.equal(`SELECT *
FROM table
WHERE a = ?
ORDER BY id ASC
LIMIT 10, 20`);
        q.queryValues().must.eql([1]);
    });
});
