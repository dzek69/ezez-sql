import type { WHERE } from "./where.js";

import { buildWhere, isSafeName } from "./where.js";

type COLUMNS = string | Record<string, string>;

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

// @TODO match, join, disallow changing anything after query was build / reset cached query
class Select {
    private _from: string = "";

    private readonly _columns: COLUMNS[];

    private _query: string = "";

    private _queryValues: Array<string | number> = [];

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
            const { sql, values } = buildWhere(this._where);
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
    public pair(): [string, Array<string | number>] {
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
