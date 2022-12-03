WIP.

--

Start database for testing:
```
docker run --name manticore --rm -p 9306:9306 -d manticoresearch/manticore && sleep 3 && docker exec -it manticore mysql && docker stop manticore
```
