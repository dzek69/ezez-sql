// import { createPool as mysqlCreatePool } from "mysql2/promise";
//
// import { del } from "./delete.js";
//
// type OptionalParams = "connectionLimit" | "queueLimit" | "ssl";
//
// type CPConfig = Pick<
// Parameters<typeof mysqlCreatePool>[0],
// "host" | "port" | "user" | "password" | "database" | OptionalParams
// >;
//
// type Config = Omit<CPConfig, OptionalParams> & Partial<Pick<CPConfig, OptionalParams>>;
//
// const cfg: Config = {
//     host: "127.0.0.1",
//     port: 9306,
//     database: "any",
//     user: "any",
//     password: "any",
// };
//
// const connectMySql = (config: Config) => {
//     return mysqlCreatePool({
//         connectionLimit: 10,
//         queueLimit: 0,
//         ...config,
//         waitForConnections: true,
//         namedPlaceholders: true,
//     });
// };
//
// (async () => {
//     const mysql = await connectMySql(cfg);
//     console.info("connected");
//     const [rsh] = await mysql.query(
//         ...del("films")
//             .where([{ id: 1 }])
//             .pair(),
//     );
//     console.log(rsh);
// })().catch(console.error);
//
//
export {};
