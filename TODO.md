- modifying the data must clear the query cache
- never allow unsanitized input
- do something with disappearing WHEREs, either treat undefined as null or throw, never silently reject anything that goes to where
- allow updates like SET col = col + 1

- REPLACE — Manticore Search supports REPLACE INTO (same syntax as INSERT but overwrites existing rows by ID). It would
  be nearly identical to the Insert builder.
- TRUNCATE — Simple TRUNCATE TABLE name with no clauses. Trivial but keeps the API complete.
- CREATE TABLE / DROP TABLE — DDL support if you want schema management through the builder.
- SHOW — Manticore-specific queries like SHOW TABLES, SHOW CREATE TABLE, SHOW META etc.
- CALL — Manticore uses CALL SUGGEST, CALL KEYWORDS, etc. for text analysis features.
