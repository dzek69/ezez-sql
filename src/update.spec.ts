import { update } from "./update.js";

describe("update", function() {
    it("works with basic set data", function() {
        const q = update("fruits").set({ color: "red", name: "apple" });
        q.query().must.equal(`UPDATE fruits
SET color = ?, name = ?`);
        q.queryValues().must.eql(["red", "apple"]);
    });

    it("works with single column", function() {
        const q = update("fruits").set({ color: "red" });
        q.query().must.equal(`UPDATE fruits
SET color = ?`);
        q.queryValues().must.eql(["red"]);
    });

    it("works with null values in set", function() {
        const q = update("fruits").set({ color: null, name: "apple" });
        q.query().must.equal(`UPDATE fruits
SET color = ?, name = ?`);
        q.queryValues().must.eql([null, "apple"]);
    });

    it("skips undefined values in set", function() {
        const q = update("fruits").set({ color: "red", name: undefined, size: 5 });
        q.query().must.equal(`UPDATE fruits
SET color = ?, size = ?`);
        q.queryValues().must.eql(["red", 5]);
    });

    it("crashes when no data given", function() {
        const q = update("fruits");
        (() => q.query()).must.throw("No data found");
    });

    it("crashes when empty object given", function() {
        const q = update("fruits").set({});
        (() => q.query()).must.throw("No data found");
    });

    it("crashes when all values are undefined", function() {
        const q = update("fruits").set({ color: undefined, name: undefined });
        (() => q.query()).must.throw("No data found");
    });

    it("works with basic where", function() {
        const q = update("fruits").set({ color: "red" }).where([{ id: 5 }]);
        q.query().must.equal(`UPDATE fruits
SET color = ?
WHERE id = ?`);
        q.queryValues().must.eql(["red", 5]);
    });

    it("works with where with OR operator", function() {
        const q = update("fruits").set({ color: "red" }).where([{ id: 5 }, "or", { id: 10 }]);
        q.query().must.equal(`UPDATE fruits
SET color = ?
WHERE id = ? OR id = ?`);
        q.queryValues().must.eql(["red", 5, 10]);
    });

    it("works with where with multiple columns in object", function() {
        const q = update("fruits").set({ color: "red" }).where([{ a: 1, b: 2 }]);
        q.query().must.equal(`UPDATE fruits
SET color = ?
WHERE (a = ? AND b = ?)`);
        q.queryValues().must.eql(["red", 1, 2]);
    });

    it("works with nested where conditions", function() {
        const q = update("fruits").set({ color: "red" }).where([
            { a: 1 }, "or", [[{ b: 2 }, "and", { c: 3 }]],
        ]);
        q.query().must.equal(`UPDATE fruits
SET color = ?
WHERE a = ? OR (
    b = ? AND c = ?
)`);
        q.queryValues().must.eql(["red", 1, 2, 3]);
    });

    it("works with not equal in where", function() {
        const q = update("fruits").set({ color: "red" }).where([{ "!status": "deleted" }]);
        q.query().must.equal(`UPDATE fruits
SET color = ?
WHERE status != ?`);
        q.queryValues().must.eql(["red", "deleted"]);
    });

    it("works with IN in where", function() {
        const q = update("fruits").set({ color: "red" }).where([{ id: [1, 2, 3] }]);
        q.query().must.equal(`UPDATE fruits
SET color = ?
WHERE id IN (?, ?, ?)`);
        q.queryValues().must.eql(["red", 1, 2, 3]);
    });

    it("works with like in where", function() {
        const q = update("fruits").set({ color: "red" }).where([{ "%name": "app%" }]);
        q.query().must.equal(`UPDATE fruits
SET color = ?
WHERE name LIKE ?`);
        q.queryValues().must.eql(["red", "app%"]);
    });

    it("works with less than in where", function() {
        const q = update("fruits").set({ color: "red" }).where([{ "<price": 100 }]);
        q.query().must.equal(`UPDATE fruits
SET color = ?
WHERE price < ?`);
        q.queryValues().must.eql(["red", 100]);
    });

    it("works with between in where", function() {
        const q = update("fruits").set({ color: "red" }).where([{ "<>price": [10, 100] }]);
        q.query().must.equal(`UPDATE fruits
SET color = ?
WHERE (price >= ? AND price <= ?)`);
        q.queryValues().must.eql(["red", 10, 100]);
    });

    it("works with null in where", function() {
        const q = update("fruits").set({ color: "red" }).where([{ deletedat: null }]);
        q.query().must.equal(`UPDATE fruits
SET color = ?
WHERE deletedat IS NULL`);
        q.queryValues().must.eql(["red"]);
    });

    it("skips where when only empty object is given", function() {
        const q = update("fruits").set({ color: "red" }).where([{}]);
        (() => q.pair()).must.not.throw();
        q.query().must.equal(`UPDATE fruits
SET color = ?`);
        q.queryValues().must.eql(["red"]);
    });

    it("skips condition if undefined given as a where value", function() {
        const q = update("fruits").set({ color: "red" }).where([{ a: 5, b: undefined }]);
        q.query().must.equal(`UPDATE fruits
SET color = ?
WHERE a = ?`);
        q.queryValues().must.eql(["red", 5]);
    });

    it("returns correct pair", function() {
        const q = update("fruits").set({ color: "red" }).where([{ id: 5 }]);
        const [query, values] = q.pair();
        query.must.equal(`UPDATE fruits
SET color = ?
WHERE id = ?`);
        values.must.eql(["red", 5]);
    });

    it("set values come before where values in queryValues", function() {
        const q = update("fruits").set({ color: "red", name: "apple" }).where([{ id: 5 }, "and", { active: 1 }]);
        q.queryValues().must.eql(["red", "apple", 5, 1]);
    });

    it("works with numeric values in set", function() {
        const q = update("fruits").set({ price: 100, quantity: 50 });
        q.query().must.equal(`UPDATE fruits
SET price = ?, quantity = ?`);
        q.queryValues().must.eql([100, 50]);
    });

    it("skips WHERE when only empty object is given", function() {
        const q = update("fruits").set({ color: "red" }).where([{ a: undefined }]);
        (() => q.pair()).must.not.throw();
        q.query().must.equal(`UPDATE fruits
SET color = ?`);
        q.queryValues().must.eql(["red"]);
    });
});
