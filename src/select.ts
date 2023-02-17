/* eslint-disable max-lines */

type COLUMNS = string | Record<string, string>;

const isSafeName = (name: string) => {
    if (/[^a-z0-9_]/i.exec(name)) {
        return false;
    }
    return true;
};

type SQL_VALUES = string | number | null | undefined | (string | number | null | undefined)[];
type SQL_VALUES_NO_UNDEFINED = string | number | null | (string | number | null)[];
type AND_OR = "OR" | "or" | "AND" | "and";
type WHERE = (Record<string, SQL_VALUES> | [WHERE] | AND_OR)[];
type OPTIONS = {
    accurate_aggregation?: 0 | 1;
    agent_query_timeout?: number;
    boolean_simplify?: 0 | 1;
    comment?: string;
    cutoff?: number;
    expand_keywords?: 0 | 1;
    // field_weights?: Record<string, number>;
    global_idf?: 0 | 1;
    idf?: string; // Quoted, comma-separated list of IDF computation flags: normalized, plain, tfidf_normalized,
    // ^... tfidf_unnormalized
    // index_weights?: Record<string, number>;
    local_df?: 0 | 1;
    low_priority?: 0 | 1;
    max_matches?: number;
    max_matches_increase_threshold?: number;
    max_query_time?: number;
    max_predicted_time?: number;
    morphology?: "none";
    not_terms_only_allowed?: 0 | 1;
    ranker?: "proximity_bm25" | "bm25" | "none" | "wordcount" | "proximity" | "matchany" | "fieldmask" | "sph04"
    | "expr" | "export";
    rand_seed?: number;
    retry_count?: number;
    retry_delay?: number;
    sort_method?: "pq" | "kbuffer";
    threads?: number;
    // token_filter?: Quoted, colon-separated of library name:plugin name:optional string of settings
    // ^...| token_filter='mylib.so:blend:@'
};

const removeLastAndOr = (s: string) => {
    return s.replace(/ (AND|OR) $/i, "");
};

// @TODO match, join, disallow changing anything after query was build / reset cached query
class Select {
    private _from: string = "";

    private readonly _columns: COLUMNS[];

    private _query: string = "";

    private _queryValues: (string | number)[] = [];

    private _where: WHERE = [];

    private _orderBy: string = "";

    private _limit: string = "";

    private _options: OPTIONS = {};

    /**
     * @param columns columns list - NOT SANITIZED! Do not put user generated content here!
     */
    public constructor(...columns: COLUMNS[]) {
        // @TODO check if columns are safe
        this._columns = columns;
    }

    /**
     * Sets table names to select from
     * @param from table name - NOT SANITIZED! Do not put user generated content here!
     */
    public from(from: string) {
        if (!isSafeName(from)) {
            throw new TypeError("FROM can only contain a-z 0-9 _ characters");
        }
        this._from = from;
        return this;
    }

    // eslint-disable-next-line max-lines-per-function
    private _buildWhere(where: WHERE, deep = 1) {
        const values: (string | number)[] = [];
        let sql = "";

        if (!Array.isArray(where)) {
            throw new TypeError("WHERE should be an array");
        }
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (where.length % 2 === 0) {
            throw new TypeError("WHERE should be an array with odd items count");
        }

        // eslint-disable-next-line max-lines-per-function,max-statements
        where.forEach((val, index) => {
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            const shouldBeAndOr = index % 2 === 1;

            if (shouldBeAndOr && typeof val !== "string") {
                throw new TypeError(`Element at index ${index} should be and/or`);
            }
            if (!shouldBeAndOr && typeof val === "string") {
                throw new TypeError(`Element at index ${index} should not be and/or`);
            }

            if (Array.isArray(val)) {
                const subWhere = this._buildWhere(val[0], deep + 1);
                if (subWhere.sql) {
                    sql += "(\n";
                    for (let i = 0; i < deep; i++) {
                        sql += "    ";
                    }
                    sql += subWhere.sql + "\n";
                    values.push(...subWhere.values);
                    for (let i = 0; i < deep - 1; i++) {
                        sql += "    ";
                    }
                    sql += ")";
                }
                else {
                    sql = removeLastAndOr(sql);
                }
            }
            else if (typeof val === "string") {
                if (["AND", "and", "OR", "or"].includes(val)) {
                    sql += " " + val.toUpperCase() + " ";
                }
                else {
                    throw new TypeError("Unknown value found in WHERE: " + val);
                }
            }
            else {
                const entries = Object.entries(val)
                    .filter(([_col, _val]) => _val !== undefined) as [string, SQL_VALUES_NO_UNDEFINED][];
                if (entries.length) {
                    const hasManyElements = entries.length > 1;
                    if (hasManyElements) {
                        sql += "(";
                    }
                    // eslint-disable-next-line max-lines-per-function,max-statements
                    entries.forEach(([_col, _val], idx, array) => {
                        // @TODO add unsafe way to inject a part of query here - some special property keys

                        let NOT = _col.startsWith("!");
                        if (NOT) {
                            if (_col.startsWith("!<=")) {
                                // eslint-disable-next-line no-param-reassign,@typescript-eslint/no-magic-numbers
                                _col = ">" + _col.substring(3);
                            }
                            else if (_col.startsWith("!<>")) {
                                // do nothing if between
                            }
                            else if (_col.startsWith("!<")) {
                                // eslint-disable-next-line no-param-reassign,@typescript-eslint/no-magic-numbers
                                _col = ">=" + _col.substring(2);
                            }
                            else if (_col.startsWith("!>=")) {
                                // eslint-disable-next-line no-param-reassign,@typescript-eslint/no-magic-numbers
                                _col = "<" + _col.substring(3);
                            }
                            else if (_col.startsWith("!>")) {
                                // eslint-disable-next-line no-param-reassign,@typescript-eslint/no-magic-numbers
                                _col = "<=" + _col.substring(2);
                            }
                        }
                        NOT = _col.startsWith("!");
                        if (NOT) {
                            // eslint-disable-next-line no-param-reassign
                            _col = _col.substring(1);
                            const LIKE = _col.startsWith("%");
                            const BETWEEN = _col.startsWith("<>");
                            if (LIKE) {
                                // eslint-disable-next-line no-param-reassign
                                _col = _col.substring(1);
                                if (Array.isArray(_val)) {
                                    if (_val.length === 0) {
                                        sql += "1=2";
                                    }
                                    else {
                                        const nonNullValues = _val.filter(v => v !== null) as (string | number)[];
                                        // ^ TODO remove typecast
                                        sql += "(" + nonNullValues.map(() => `${_col} NOT LIKE ?`).join(" AND ");
                                        values.push(...nonNullValues);

                                        const hadNull = _val.length !== nonNullValues.length;
                                        if (hadNull) {
                                            sql += ` AND ${_col} IS NOT NULL`;
                                        }

                                        sql += ")";
                                    }
                                }
                                else {
                                    if (_val === null) {
                                        sql += `${_col} IS NOT NULL`;
                                    }
                                    else {
                                        sql += `${_col} NOT LIKE ?`;
                                        values.push(_val);
                                    }
                                }
                            }
                            else if (BETWEEN) {
                                // eslint-disable-next-line no-param-reassign,@typescript-eslint/no-magic-numbers
                                _col = _col.substring(2);

                                if (!Array.isArray(_val)) {
                                    throw new TypeError("BETWEEN requires an array");
                                }
                                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                                if (_val.length !== 2) {
                                    throw new TypeError("BETWEEN requires a 2 elements array");
                                }
                                if (_val.includes(null)) {
                                    throw new TypeError(`Cannot check if ${_col} is not between NULL`);
                                }
                                sql += `(${_col} < ? OR ${_col} > ?)`;
                                values.push(..._val as (string | number)[]);
                                // ^ @TODO remove typecast
                            }
                            else if (Array.isArray(_val)) {
                                if (!_val.length) {
                                    sql += "1=0";
                                }
                                else {
                                    const hasNull = _val.includes(null);
                                    const nonNullValues = _val.filter(v => v !== null) as (string | number)[];
                                    // ^ TODO remove typecast
                                    const inn = `${_col} NOT IN (${nonNullValues.map(() => "?").join(", ")})`;
                                    values.push(...nonNullValues);
                                    if (hasNull) {
                                        sql += `(${_col} IS NOT NULL AND ${inn})`;
                                    }
                                    else {
                                        sql += inn;
                                    }
                                }
                            }
                            else {
                                if (_val === null) {
                                    sql += `${_col} IS NOT NULL`;
                                }
                                else {
                                    sql += `${_col} != ?`;
                                    values.push(_val);
                                }
                            }
                        }
                        else {
                            const LIKE = _col.startsWith("%");
                            const LT = _col.startsWith("<");
                            const GT = _col.startsWith(">");
                            if (LIKE) {
                                // eslint-disable-next-line no-param-reassign
                                _col = _col.substring(1);
                                if (Array.isArray(_val)) {
                                    if (_val.length === 0) {
                                        sql += "1=2";
                                    }
                                    else {
                                        const nonNullValues = _val.filter(v => v !== null) as (string | number)[];
                                        // ^ TODO remove typecast
                                        sql += "(" + nonNullValues.map(() => `${_col} LIKE ?`).join(" OR ");
                                        values.push(...nonNullValues);

                                        const hadNull = _val.length !== nonNullValues.length;
                                        if (hadNull) {
                                            sql += ` OR ${_col} IS NULL`;
                                        }

                                        sql += ")";
                                    }
                                }
                                else {
                                    if (_val === null) {
                                        sql += `${_col} IS NULL`;
                                    }
                                    else {
                                        sql += `${_col} LIKE ?`;
                                        values.push(_val);
                                    }
                                }
                            }
                            else if (LT) {
                                // eslint-disable-next-line no-param-reassign
                                _col = _col.substring(1);
                                const BETWEEN = _col.startsWith(">");
                                const OR_EQUAL = _col.startsWith("=");
                                if (BETWEEN) {
                                    // eslint-disable-next-line no-param-reassign
                                    _col = _col.substring(1);

                                    if (!Array.isArray(_val)) {
                                        throw new TypeError("BETWEEN requires an array");
                                    }
                                    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                                    if (_val.length !== 2) {
                                        throw new TypeError("BETWEEN requires a 2 elements array");
                                    }
                                    if (_val.includes(null)) {
                                        throw new TypeError(`Cannot check if ${_col} is between NULL`);
                                    }
                                    sql += `(${_col} >= ? AND ${_col} <= ?)`;
                                    values.push(..._val as (string | number)[]);
                                    // ^ @TODO remove typecast
                                }
                                else {
                                    if (OR_EQUAL) {
                                        // eslint-disable-next-line no-param-reassign
                                        _col = _col.substring(1);
                                    }

                                    const SYMBOL = OR_EQUAL ? "<=" : "<";

                                    if (Array.isArray(_val)) {
                                        // @TODO rewrite to use only one value
                                        if (_val.includes(null)) {
                                            throw new TypeError(`Cannot check if ${_col} is less than NULL`);
                                        }
                                        if (_val.length === 0) {
                                            sql += "0=2";
                                        }
                                        else {
                                            sql += "(" + _val.map(() => `${_col} ${SYMBOL} ?`).join(" AND ") + ")";
                                            values.push(..._val as (string | number)[]);
                                            // ^ @TODO remove typecast
                                        }
                                    }
                                    else {
                                        if (_val === null) {
                                            throw new TypeError(`Cannot check if ${_col} is less than NULL`);
                                        }
                                        sql += `${_col} ${SYMBOL} ?`;
                                        values.push(_val);
                                    }
                                }
                            }
                            else if (GT) {
                                // eslint-disable-next-line no-param-reassign
                                _col = _col.substring(1);
                                const OR_EQUAL = _col.startsWith("=");

                                if (OR_EQUAL) {
                                    // eslint-disable-next-line no-param-reassign
                                    _col = _col.substring(1);
                                }

                                const SYMBOL = OR_EQUAL ? ">=" : ">";

                                if (Array.isArray(_val)) {
                                    // @TODO rewrite to use only one value
                                    if (_val.includes(null)) {
                                        throw new TypeError(`Cannot check if ${_col} is greater than NULL`);
                                    }
                                    if (_val.length === 0) {
                                        sql += "0=2";
                                    }
                                    else {
                                        sql += "(" + _val.map(() => `${_col} ${SYMBOL} ?`).join(" AND ") + ")";
                                        values.push(..._val as (string | number)[]);
                                        // ^ @TODO remove typecast
                                    }
                                }
                                else {
                                    if (_val === null) {
                                        throw new TypeError(`Cannot check if ${_col} is greater than NULL`);
                                    }
                                    sql += `${_col} ${SYMBOL} ?`;
                                    values.push(_val);
                                }
                            }
                            else if (Array.isArray(_val)) {
                                if (!_val.length) {
                                    sql += "1=0";
                                }
                                else {
                                    const hasNull = _val.includes(null);
                                    const nonNullValues = _val.filter(v => v !== null) as (string | number)[];
                                    // ^ TODO remove typecast
                                    const inn = `${_col} IN (${nonNullValues.map(() => "?").join(", ")})`;
                                    values.push(...nonNullValues);
                                    if (hasNull) {
                                        sql += `(${_col} IS NULL OR ${inn})`;
                                    }
                                    else {
                                        sql += inn;
                                    }
                                }
                            }
                            else {
                                if (_val === null) {
                                    sql += `${_col} IS NULL`;
                                }
                                else {
                                    sql += `${_col} = ?`;
                                    values.push(_val);
                                }
                            }
                        }

                        const isLast = idx === array.length - 1;
                        if (!isLast) {
                            sql += " AND ";
                        }
                    });
                    if (hasManyElements) {
                        sql += ")";
                    }
                }
                else {
                    sql = removeLastAndOr(sql);
                }
            }
        });

        return {
            sql, values,
        };
    }

    private _build() {
        this._query = "SELECT ";
        this._queryValues = [];

        this._query += this._columns.map((col) => {
            if (typeof col === "string") {
                return col;
            }
            return Object.entries(col).reduce<string[]>((total, [key, val]) => {
                return [...total, key + " AS " + val];
            }, []);
        }).flat(1).join(", ");

        this._query += "\nFROM " + this._from;

        if (this._where.length) {
            const { sql, values } = this._buildWhere(this._where);
            if (sql) {
                this._query += "\nWHERE " + sql;
                this._queryValues.push(...values);
            }
        }

        if (this._orderBy.length) {
            this._query += "\nORDER BY " + this._orderBy;
        }

        if (this._limit.length) {
            this._query += "\nLIMIT " + this._limit;
        }

        if (Object.keys(this._options).length) {
            this._query += "\nOPTION " + Object.entries(this._options).map(([key, val]) => {
                this._queryValues.push(val); // i know, side effects in map are bad
                return key + "=?";
            }).join(", ");
        }
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

    /**
     * Limits the result set
     * @param offsetOrLimit - limit if only one argument is used, offset if both are used
     * @param limit - limit
     */
    public limit(offsetOrLimit: number, limit?: number) {
        if (typeof offsetOrLimit !== "number") {
            throw new TypeError("LIMIT first argument should be a number");
        }
        if (typeof limit === "number") {
            this._limit = `${offsetOrLimit}, ${limit}`;
        }
        else {
            this._limit = `${offsetOrLimit}`;
        }
        return this;
    }

    public options(options: OPTIONS) {
        const keys = Object.keys(options);
        if (keys.some(k => !isSafeName(k))) {
            throw new TypeError("OPTION names can only contain a-z 0-9 _ characters");
        }
        if (keys.some(k => !isSafeName(k))) {
            throw new TypeError("OPTION names can only contain a-z 0-9 _ characters");
        }

        const values = Object.values(options);
        if (values.some(v => typeof v !== "string" && typeof v !== "number")) {
            throw new TypeError("OPTION values can only be strings or numbers");
        }

        this._options = options;
        return this;
    }

    /**
     * Sets the order of the result
     * @param orderBy - just an order by string
     */
    public orderBy(orderBy: string) {
        this._orderBy = orderBy;
        return this;
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
    public pair(): [string, (string | number)[]] {
        return [this.query(), this.queryValues()];
    }
}

/**
 * Starts Select query.
 * @param columns columns - NOT SANITIZED! Do not put user generated content here!
 */
const select = (...columns: COLUMNS[]) => {
    return new Select(...columns);
};

export { select };
