import { insert } from "./insert.js";

describe("insert", function() {
    it("works with object data", function() {
        const q = insert("fruits").data({ color: "red", name: "apple" });
        q.query().must.equal(`INSERT INTO fruits
(color, name)
VALUES
(?, ?)`);
        q.queryValues().must.eql(["red", "apple"]);
    });

    it("works with array of object datas", function() {
        const q = insert("fruits").data(
            { color: "red", name: "apple" },
            { color: "green", name: "mango" },
        );
        q.query().must.equal(`INSERT INTO fruits
(color, name)
VALUES
(?, ?),
(?, ?)`);
        q.queryValues().must.eql(["red", "apple", "green", "mango"]);
    });

    it("crashes if array of object datas is empty", function() {
        const q = insert("fruits").data();
        (() => q.query()).must.throw("No data found");
    });

    it("crashes if object is empty", function() {
        const q = insert("fruits").data({});
        (() => q.query()).must.throw("No data found");
    });

    it("crashes if array of different shape objects is given", function() {
        const q = insert("fruits").data(
            { color: "red" },
            { name: "mango" },
        );
        (() => q.query()).must.throw("Data array should have all objects in the same shape");
    });

    it("works when separately giving columns and values", function() {
        const q = insert("fruits").columns(["color"]).values(["red"]);
        q.query().must.equal(`INSERT INTO fruits
(color)
VALUES
(?)`);
        q.queryValues().must.eql(["red"]);
    });

    it("works when separately giving columns and multiple values", function() {
        const q = insert("fruits").columns(["color", "name"]).values(
            ["red", "apple"],
            ["green", "mango"],
        );
        q.query().must.equal(`INSERT INTO fruits
(color, name)
VALUES
(?, ?),
(?, ?)`);
        q.queryValues().must.eql(["red", "apple", "green", "mango"]);
    });

    it("crashes when not calling any data functions", function() {
        const q = insert("fruits");
        (() => q.query()).must.throw("No data found");
    });

    // @TODO more tests - overwriting data, overwriting just values when data was given earlier, doing stupid/creative
    // things
});

