#!/usr/bin/env python3
"""Starts each server in turn, checks they return identical JSON, drives them with wrk, samples memory and CPU, and
prints the numbers behind the three charts. Standard library only.   WORK=~/hl-bench REPS=2 python3 bench.py"""
import atexit, json, os, re, resource, shlex, signal, statistics, subprocess, sys, threading, time, urllib.request
from pathlib import Path

WORK = Path(os.environ.get("WORK", Path.home() / "hl-bench"))
REPS = int(os.environ.get("REPS", "2"))
SECONDS, WARMUP = 10, 3
resource.setrlimit(resource.RLIMIT_NOFILE, (10240, 10240))

PATHS = {"ping": "/ping", "hello": "/hello?name=Thomas", "artists": "/artists"}


def magic(version, port):
    return dict(cwd=WORK / f"magic-{version}", cmd=shlex.split(os.environ.get("MAGIC_START", "dotnet backend.dll")), port=port, prefix="/magic/modules/bench",
                env={"ASPNETCORE_URLS": f"http://127.0.0.1:{port}"}, appsettings=WORK / f"magic-{version}/files/config/appsettings.json")


def fastapi(workers, port):
    return dict(cwd=WORK / "fastapi", port=port, prefix="", appsettings=None,
                cmd=[".venv/bin/uvicorn", "app:app", "--host", "127.0.0.1", "--port", str(port), "--workers", str(workers),
                     "--loop", "uvloop", "--http", "httptools", "--no-access-log", "--log-level", "error"],
                env={"BENCH_DB": str(WORK / "fastapi/chinook.db"), "PORT": str(port)})


TARGETS = {"magic-before": magic("before", 5098), "magic-after": magic("after", 5097),
           "fastapi-4": fastapi(4, 5102), "fastapi-1": fastapi(1, 5103), "fastapi-11": fastapi(11, 5104)}

# target, pooled connections?, workloads, connection counts
PLAN = [("magic-before", False, ["ping", "hello"], [128]), ("magic-before", True, ["artists"], [128]),
        ("magic-after", False, ["ping", "hello"], [128]), ("magic-after", True, ["artists"], [64, 128, 256]),
        ("fastapi-4", True, ["artists"], [64, 128, 256]), ("fastapi-1", True, ["artists"], [64, 128, 256]),
        # Context: no pooling anywhere, a trivial endpoint, and FastAPI with one worker per core (this machine has 11).
        ("magic-after", False, ["artists"], [128]), ("fastapi-4", False, ["artists"], [128]), ("fastapi-1", False, ["artists"], [128]),
        ("fastapi-4", True, ["hello"], [128]), ("fastapi-1", True, ["hello"], [128]), ("fastapi-11", True, ["artists"], [64, 128, 256])]


def get(url, timeout=2):
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return r.status, r.read()


def tree(pid):
    rows = [l.split() for l in subprocess.run(["ps", "-A", "-o", "pid=,ppid="], capture_output=True, text=True).stdout.splitlines()]
    kids = {}
    for p, pp in rows:
        kids.setdefault(int(pp), []).append(int(p))
    out, todo = [], [pid]
    while todo:
        out.append(todo[0])
        todo += kids.get(todo.pop(0), [])
    return out


def sample(pid):
    out = subprocess.run(["ps", "-o", "rss=,cputime=", "-p", ",".join(map(str, tree(pid)))], capture_output=True, text=True).stdout
    rss = cpu = 0.0
    for line in out.splitlines():
        r, c = line.split()
        secs = 0.0
        for piece in c.split(":"):
            secs = secs * 60 + float(piece)
        rss, cpu = rss + int(r) / 1024, cpu + secs
    return rss, cpu


class Server:
    def __init__(self, name, spec):
        self.name, self.spec = name, spec
        self.base = f"http://127.0.0.1:{spec['port']}{spec['prefix']}"

    def start(self):
        log = open(WORK / f"{self.name}.log", "w")
        self.proc = subprocess.Popen(self.spec["cmd"], cwd=self.spec["cwd"], env=dict(os.environ, **self.spec["env"]),
                                     stdout=log, stderr=log, start_new_session=True)
        for _ in range(240):
            try:
                if get(self.base + "/ping")[0] == 200:
                    return
            except Exception:
                time.sleep(0.5)
        sys.exit(f"{self.name} did not start, see {WORK}/{self.name}.log")

    def stop(self):
        os.killpg(self.proc.pid, signal.SIGTERM)
        self.proc.wait(timeout=30)
        time.sleep(1)


def wrk(server, path, connections, seconds):
    cmd = ["wrk", f"-t4", f"-c{connections}", f"-d{seconds}s", "--timeout", "10s", "--latency", server.base + path]
    peak, stop = [0.0], threading.Event()

    def sampler():
        while not stop.is_set():
            peak[0] = max(peak[0], sample(server.proc.pid)[0])
            stop.wait(1.0)

    _, cpu0 = sample(server.proc.pid)
    t0 = time.time()
    threading.Thread(target=sampler, daemon=True).start()
    out = subprocess.run(cmd, capture_output=True, text=True).stdout
    elapsed = time.time() - t0
    stop.set()
    _, cpu1 = sample(server.proc.pid)
    num = lambda pattern: float(re.search(pattern, out).group(1))
    p99 = re.search(r"99%\s+([\d.]+)(us|ms|s)", out)
    p99_ms = float(p99.group(1)) * {"us": 0.001, "ms": 1, "s": 1000}[p99.group(2)]
    errors = re.search(r"Non-2xx or 3xx responses: (\d+)", out)
    return dict(rps=num(r"Requests/sec:\s+([\d.]+)"), p99_ms=p99_ms, errors=int(errors.group(1)) if errors else 0,
                rss_mb=peak[0], cpu_percent=100 * (cpu1 - cpu0) / elapsed)


def main():
    reference, results = {}, {}
    for name, pooled, workloads, levels in PLAN:
        if not re.search(os.environ.get("ONLY", ""), f"{name} pooled={pooled} {workloads}"):
            continue   # ONLY is a regular expression, for running part of the plan
        server = Server(name, TARGETS[name])
        cfg = server.spec["appsettings"]
        if cfg:   # Magic reads its connection string from this file, so it is edited for the run and restored afterwards
            original = cfg.read_text()
            atexit.register(lambda c=cfg, o=original: c.write_text(o))
            cfg.write_text(original.replace("Pooling=False", f"Pooling={pooled}"))
        if not cfg:   # FastAPI chooses between one connection per request and a pool through an environment variable
            server.spec["env"]["BENCH_POOLED"] = "1" if pooled else "0"
        server.start()
        for w in workloads:
            body = json.loads(get(server.base + PATHS[w])[1])    # every server must return the same JSON
            if reference.setdefault(w, body) != body:
                sys.exit(f"{name} returned a different payload for {w}")
            for c in levels:
                wrk(server, PATHS[w], c, WARMUP)
                runs = [wrk(server, PATHS[w], c, SECONDS) for _ in range(REPS)]
                cell = {k: round(statistics.mean(r[k] for r in runs), 1) for k in runs[0]}
                results.setdefault(name + (" (pooled)" if pooled else " (unpooled)"), {})[f"{w}@{c}"] = cell
                print(f"{name:13} pooled={pooled!s:5} {w:8} c={c:<4} {cell['rps']:>9,.0f} req/s  p99 {cell['p99_ms']:>6.1f} ms  "
                      f"rss {cell['rss_mb']:>4.0f} MB  cpu {cell['cpu_percent']:>4.0f}%  errors {cell['errors']:.0f}", flush=True)
        server.stop()
        if cfg:
            cfg.write_text(original)
    (WORK / "results.json").write_text(json.dumps(results, indent=2))
    print(f"\nPayloads identical on every server. Raw numbers in {WORK}/results.json")


main()
