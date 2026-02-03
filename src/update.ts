import type { WHERE } from "./where.js";

import { buildWhere } from "./where.js";

type ValidValue = string | number | null;
type Data = Record<string, ValidValue | undefined>;

class Update {
    private readonly _table: string;

    private _data: Data = {};

    private _query: string = "";

    private _queryValues: Array<string | number | null> = [];

    private _where: WHERE = [];

    /**
     * Starts Update query.
     * @param table table name - NOT SANITIZED! Do not put user generated content here!
     */
    public constructor(table: string) {
        this._table = table;
    }

    /**
     * Sets the data to be updated
     * @param data column->value object. Undefined values are skipped.
     */
    public set(data: Data) {
        this._data = data;
        return this;
    }

    /**
     * Sets WHERE part of the query
     * @param where structure that describes the conditions. Values will be replaced with `?` and values will be stored
     * into values array. You can put user generated content as values. You SHOULD NOT put user content in column names,
     * etc.
     */
    public where(where: WHERE) {
        this._where = where;
        return this;
    }

    private _build() {
        const entries = Object.entries(this._data)
            .filter(([_col, _val]) => _val !== undefined) as Array<[string, ValidValue]>;

        if (!entries.length) {
            throw new TypeError("No data found");
        }

        this._query = "UPDATE " + this._table;
        this._queryValues = [];

        this._query += "\nSET " + entries.map(([col, val]) => {
            this._queryValues.push(val);
            return col + " = ?";
        }).join(", ");

        if (this._where.length) {
            const { sql, values } = buildWhere(this._where);
            if (sql) {
                this._query += "\nWHERE " + sql;
                this._queryValues.push(...values);
            }
        }
    }

    /**
     * Returns SQL query
     */
    public query() {
        if (!this._query) {
            this._build();
        }
        return this._query;
    }

    /**
     * Returns prepared values
     */
    public queryValues() {
        if (!this._query) {
            this._build();
        }
        return this._queryValues;
    }

    /**
     * Returns query & values tuple, useful when using with `mysql2` `query` call.
     */
    public pair(): [string, Array<string | number | null>] {
        return [this.query(), this.queryValues()];
    }
}

/**
 * Starts Update query.
 * @param table table name - NOT SANITIZED! Do not put user generated content here!
 */
const update = (table: string) => new Update(table);

export {
    update,
};
