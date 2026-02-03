import { del } from "./delete.js";

describe("delete", function() {
    it("works with basic delete (no where)", function() {
        const q = del("fruits");
        q.query().must.equal("DELETE FROM fruits");
        q.queryValues().must.eql([]);
    });

    it("works with basic where", function() {
        const q = del("fruits").where([{ id: 5 }]);
        q.query().must.equal(`DELETE FROM fruits
WHERE id = ?`);
        q.queryValues().must.eql([5]);
    });

    it("works with where with OR operator", function() {
        const q = del("fruits").where([{ id: 5 }, "or", { id: 10 }]);
        q.query().must.equal(`DELETE FROM fruits
WHERE id = ? OR id = ?`);
        q.queryValues().must.eql([5, 10]);
    });

    it("works with where with multiple columns in object", function() {
        const q = del("fruits").where([{ a: 1, b: 2 }]);
        q.query().must.equal(`DELETE FROM fruits
WHERE (a = ? AND b = ?)`);
        q.queryValues().must.eql([1, 2]);
    });

    it("works with nested where conditions", function() {
        const q = del("fruits").where([
            { a: 1 }, "or", [[{ b: 2 }, "and", { c: 3 }]],
        ]);
        q.query().must.equal(`DELETE FROM fruits
WHERE a = ? OR (
    b = ? AND c = ?
)`);
        q.queryValues().must.eql([1, 2, 3]);
    });

    it("works with not equal in where", function() {
        const q = del("fruits").where([{ "!status": "deleted" }]);
        q.query().must.equal(`DELETE FROM fruits
WHERE status != ?`);
        q.queryValues().must.eql(["deleted"]);
    });

    it("works with IN in where", function() {
        const q = del("fruits").where([{ id: [1, 2, 3] }]);
        q.query().must.equal(`DELETE FROM fruits
WHERE id IN (?, ?, ?)`);
        q.queryValues().must.eql([1, 2, 3]);
    });

    it("works with like in where", function() {
        const q = del("fruits").where([{ "%name": "app%" }]);
        q.query().must.equal(`DELETE FROM fruits
WHERE name LIKE ?`);
        q.queryValues().must.eql(["app%"]);
    });

    it("works with less than in where", function() {
        const q = del("fruits").where([{ "<price": 100 }]);
        q.query().must.equal(`DELETE FROM fruits
WHERE price < ?`);
        q.queryValues().must.eql([100]);
    });

    it("works with between in where", function() {
        const q = del("fruits").where([{ "<>price": [10, 100] }]);
        q.query().must.equal(`DELETE FROM fruits
WHERE (price >= ? AND price <= ?)`);
        q.queryValues().must.eql([10, 100]);
    });

    it("works with null in where", function() {
        const q = del("fruits").where([{ deletedat: null }]);
        q.query().must.equal(`DELETE FROM fruits
WHERE deletedat IS NULL`);
        q.queryValues().must.eql([]);
    });

    it("skips WHERE when only empty object is given", function() {
        const q = del("fruits").where([{}]);
        (() => q.pair()).must.not.throw();
        q.query().must.equal("DELETE FROM fruits");
        q.queryValues().must.eql([]);
    });

    it("skips WHERE when only empty object is given", function() {
        const q = del("fruits").where([{ a: undefined }]);
        (() => q.pair()).must.not.throw();
        q.query().must.equal("DELETE FROM fruits");
        q.queryValues().must.eql([]);
    });

    it("skips condition if undefined given as a where value", function() {
        const q = del("fruits").where([{ a: 5, b: undefined }]);
        q.query().must.equal(`DELETE FROM fruits
WHERE a = ?`);
        q.queryValues().must.eql([5]);
    });

    it("returns correct pair", function() {
        const q = del("fruits").where([{ id: 5 }]);
        const [query, values] = q.pair();
        query.must.equal(`DELETE FROM fruits
WHERE id = ?`);
        values.must.eql([5]);
    });
});
