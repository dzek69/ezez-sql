Not your usual SQL builder!

Designed for Manticore Search first, should work with MySQL.

Very much WIP. Undocumented.

--

Start database for testing:
```
docker run --name manticore --rm -p 9306:9306 -d manticoresearch/manticore && sleep 3 && docker exec -it manticore mysql && docker stop manticore
```
