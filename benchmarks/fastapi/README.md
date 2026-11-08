# Hyperlambda vs FastAPI

The scripts behind the benchmark published at <https://hyperlambda.dev/benchmark> and in
[the article](https://hyperlambda.dev/blog/hyperlambda-vs-fastapi-round-two-3-7x-faster-than-tuned-python-fully-reproducible).
`results.json` holds the numbers from that run.

On a pooled SQLite read of ten rows at 128 connections, Hyperlambda served 64,664 requests per second against 17,686
for FastAPI on four workers (3.7x) and 4,564 on one worker (14x). Per CPU core the gap is 1.8x, because Hyperlambda
used about twice the cores. Measured mostly by Claude, an AI model, under the supervision of Magic's author, on one laptop, and not independently replicated.

## Run it

You need `git`, the .NET 10 SDK, Python 3.13, `sqlite3`, `rsync`, `curl` and `wrk`. It was written and run on macOS,
and takes about 20 minutes, most of it building Magic twice.

```bash
cd benchmarks/fastapi
export WORK=$HOME/hl-bench
./setup.sh                 # builds both Magic commits, installs Chinook through Magic, creates instances, installs FastAPI
REPS=2 python3 bench.py    # one line per measurement, raw numbers in $WORK/results.json
```

`ONLY` is a regular expression over `"<target> pooled=<bool> <workloads>"`, so `ONLY='fastapi-4' python3 bench.py`
runs just those cells. `bench.py` fetches every endpoint from every server and aborts if the JSON differs.

## Files

| File | What it is |
|---|---|
| `setup.sh` | Builds Magic at the two pinned commits, gets Chinook through Magic's `sqlite-chinook` plugin, creates a clean instance of each build with its three endpoints (`ping`, `hello`, `artists`), and the FastAPI virtualenv |
| `app.py` | The FastAPI server: async handlers, aiosqlite, uvloop and httptools. `BENCH_POOLED=1` keeps 8 open connections per worker |
| `bench.py` | Starts each server in turn, verifies identical JSON, drives `wrk`, samples memory and CPU, prints the numbers |
| `requirements.txt` | Pinned Python packages |
| `results.json` | The published numbers, the machine, the commits and the limits |

## Read this before quoting the number

- 3.7x is a whole-machine figure. Per core it is 1.8x.
- It needs SQLite connection pooling. Magic's shipped default is `Pooling=False`, and then the same read does 4,232
  requests per second, which is slower than four-worker FastAPI with per-request connections (6,245).
- On a trivial string-concatenation endpoint FastAPI is more efficient per core.
- Four FastAPI workers was the best Python configuration found, and more was slower (11 workers did 10,778 requests per
  second at 128 connections). Runs with 6, 8 and 10 workers also gave lower throughput but were not recorded, so only
  1, 4 and 11 are published. Why more workers are slower was not investigated.
- One read of ten rows, on localhost, with no authentication, writes or joins, and `wrk` on the same machine.

If your numbers disagree, please publish them and send them to thomas@ainiro.io.
