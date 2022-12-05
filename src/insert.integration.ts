import { createPool as mysqlCreatePool, ResultSetHeader } from "mysql2/promise";

import { insert } from "./insert.js";
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
    const [rsh] = await mysql.query(
        ...insert("films")
            .data([{ category_id: 111 }, { category_id: 111 }])
            .pair(),
    );

    if ("insertId" in rsh) {
        console.log(rsh.insertId, typeof rsh.insertId);

        const [rows] = await mysql.query(
            ...select("*, TO_STRING(id) as sid").from("films").where([{ sid: rsh.insertId }]).pair(),
        );

        console.log(rows);
    }
})().catch(console.error);

