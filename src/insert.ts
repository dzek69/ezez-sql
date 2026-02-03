type ValidValue = string | number | null;
type Data = Record<string, ValidValue>;

class Insert {
    private readonly _table: string;

    private _columns: string[][] = [];

    private _values: ValidValue[][] = [];

    private _query: string = "";

    private _queryValues: Array<string | number | null> = [];

    /**
     * Starts Insert query.
     * @param table table name - NOT SANITIZED! Do not put user generated content here!
     */
    public constructor(table: string) {
        this._table = table;
    }

    /**
     * Sets the data to be inserted, accepts n arguments of column->value objects
     * @param data
     */
    public data(...data: Data[]) {
        this._columns = data.map(d => Object.keys(d));
        this._values = data.map(d => Object.values(d));
        return this;
    }

    public columns(columns: string[]) {
        this._columns = [columns];
        return this;
    }

    public values(...values: Array<Array<string | number | null>>) {
        this._values = values;
        return this;
    }

    private _build() {
        if (!this._columns.length && !this._values.length) {
            throw new TypeError("No data found");
        }

        if (!this._columns.length) {
            throw new TypeError("No columns found");
        }

        const keys = this._columns[0]!;
        const keysString = keys.join("```");
        if (!this._columns.every(d => d.join("```") === keysString)) {
            throw new TypeError("Data array should have all objects in the same shape");
        }

        if (!keys.length) { // only empty objects given
            throw new TypeError("No data found");
        }

        if (!this._values.length) {
            throw new TypeError("No values found");
        }

        this._query = "INSERT INTO " + this._table
            + "\n(" + keys.join(", ") + ")"
            + "\nVALUES\n" + this._values.map(
            v => "(" + v.map(() => "?").join(", ") + ")",
        ).join(",\n");

        this._queryValues = this._values.flat(1);
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
 * Starts Insert query.
 * @param table table name - NOT SANITIZED! Do not put user generated content here!
 */
const insert = (table: string) => new Insert(table);

export {
    insert,
};
