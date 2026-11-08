"""FastAPI on uvicorn: async handlers, aiosqlite, uvloop and httptools. BENCH_POOLED=1 keeps 8 open connections per
worker process; without it, every request opens and closes its own connection."""
import asyncio, contextlib, json, os
import aiosqlite
from fastapi import FastAPI
from fastapi.responses import Response

DB = os.environ["BENCH_DB"]
POOLED = os.environ.get("BENCH_POOLED") == "1"
_pool = None


@contextlib.asynccontextmanager
async def lifespan(_):
    global _pool
    if POOLED:
        _pool = asyncio.Queue()
        for _ in range(8):
            conn = await aiosqlite.connect(DB)
            conn.row_factory = aiosqlite.Row
            _pool.put_nowait(conn)
    yield
    if POOLED:
        while not _pool.empty():
            await _pool.get_nowait().close()


@contextlib.asynccontextmanager
async def connection():
    if POOLED:
        conn = await _pool.get()
        try:
            yield conn
        finally:
            _pool.put_nowait(conn)
    else:
        async with aiosqlite.connect(DB) as conn:
            conn.row_factory = aiosqlite.Row
            yield conn


app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)


def json_response(value):
    return Response(json.dumps(value), media_type="application/json")


@app.get("/ping")
async def ping():
    return json_response({"result": "success"})


@app.get("/hello")
async def hello(name: str):
    return json_response({"result": "Hello there " + name + ", and welcome to the farm"})


@app.get("/artists")
async def artists():
    async with connection() as conn:
        async with conn.execute("select * from Artist order by ArtistId limit 10") as cursor:
            return json_response([dict(r) for r in await cursor.fetchall()])
