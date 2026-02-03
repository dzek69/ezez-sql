import type { WHERE } from "./where.js";

import { buildWhere } from "./where.js";

class Delete {
    private readonly _table: string;

    private _query: string = "";

    private _queryValues: Array<string | number> = [];

    private _where: WHERE = [];

    /**
     * Starts Delete query.
     * @param table table name - NOT SANITIZED! Do not put user generated content here!
     */
    public constructor(table: string) {
        this._table = table;
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
        this._query = "DELETE FROM " + this._table;
        this._queryValues = [];

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
    public pair(): [string, Array<string | number>] {
        return [this.query(), this.queryValues()];
    }
}

/**
 * Starts Delete query.
 * @param table table name - NOT SANITIZED! Do not put user generated content here!
 */
const del = (table: string) => new Delete(table);

export {
    del,
};
