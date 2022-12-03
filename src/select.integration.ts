import { createPool as mysqlCreatePool } from "mysql2/promise";

import { select } from "./select.js";

type OptionalParams = "connectionLimit" | "queueLimit" | "ssl";

type CPConfig = Pick<
Parameters<typeof mysqlCreatePool>[0],
"host" | "port" | "user" | "password" | "database" | OptionalParams
>;

type Config = Omit<CPConfig, OptionalParams> & Partial<Pick<CPConfig, OptionalParams>>;

const cfg: Config = {
    host: "127.0.0.1",
    port: 9306,
    database: "any",
    user: "any",
    password: "any",
};

const connectMySql = (config: Config) => {
    return mysqlCreatePool({
        connectionLimit: 10,
        queueLimit: 0,
        ...config,
        waitForConnections: true,
        namedPlaceholders: true,
    });
};

(async () => {
    const mysql = await connectMySql(cfg);
    console.info("connected");
    const [rows] = await mysql.query(
        ...select({ "max(id)": "maksiu" })
            .where([{ ">rental_rate": 3, "release_year": 2002 }])
            .orderBy("id DESC")
            .from("films")
            .limit(2)
            .pair(),
    );
    if (Array.isArray(rows)) {
        console.log(rows.length, rows[0]);
    }
    else {
        throw new TypeError("Expected arrays as rows");
    }
})().catch(console.error);

