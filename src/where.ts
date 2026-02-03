/* eslint-disable max-lines */

type SQL_VALUES = string | number | null | undefined | Array<string | number | null | undefined>;
type SQL_VALUES_NO_UNDEFINED = string | number | null | Array<string | number | null>;
type AND_OR = "OR" | "or" | "AND" | "and";
type WHERE = Array<Record<string, SQL_VALUES> | [WHERE] | AND_OR>;

const isSafeName = (name: string) => {
    return !/[^a-z0-9_]/iu.exec(name);
};

const removeLastAndOr = (s: string) => {
    return s.replace(/ (AND|OR) $/iu, "");
};

// eslint-disable-next-line max-lines-per-function
const buildWhere = (where: WHERE, deep = 1) => {
    const values: Array<string | number> = [];
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
            const subWhere = buildWhere(val[0], deep + 1);
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
                .filter(([_col, _val]) => _val !== undefined) as Array<[string, SQL_VALUES_NO_UNDEFINED]>;
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
                                    const nonNullValues = _val.filter(v => v !== null);
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
                            values.push(..._val as Array<string | number>);
                            // ^ @TODO remove typecast
                        }
                        else if (Array.isArray(_val)) {
                            if (!_val.length) {
                                sql += "1=0";
                            }
                            else {
                                const hasNull = _val.includes(null);
                                const nonNullValues = _val.filter(v => v !== null);
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
                                    const nonNullValues = _val.filter(v => v !== null);
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
                                values.push(..._val as Array<string | number>);
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
                                        values.push(..._val as Array<string | number>);
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
                                    values.push(..._val as Array<string | number>);
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
                                const nonNullValues = _val.filter(v => v !== null);
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
};

export { isSafeName, removeLastAndOr, buildWhere };
export type { SQL_VALUES, SQL_VALUES_NO_UNDEFINED, AND_OR, WHERE };
