---
title: "PHP2Shell and the Case for a Smaller Attack Surface"
date: "2026-10-22"
image: "/assets/images/blog/php2shell-og.png"
author: "thomas"
description: "Two unauthenticated RCE bugs in the PHP interpreter are being exploited right now. What they are, how to patch, why this bug class cannot exist on a managed runtime, and the one time Magic got breached anyway."
---

*Part of our security series &mdash; the sandbox mechanism is described in [The Only Sandbox Your AI Agent Cannot Break Out Of](/blog/the-only-sandbox-your-ai-agent-cannot-break-out-of), and you can attack the live one at the [Natural Language API](/natural-language-api).*

If you run PHP, stop reading this and patch. The fixed releases are **8.5.12, 8.4.27, 8.3.36 and 8.2.35**, published October 21. CISA's guidance is blunt: a system that cannot be updated, or that still runs 8.1 or earlier, should be taken offline until it is.

That is the useful part. The rest of this article is about the question the patch does not answer, which is why a single bug in one interpreter can hand over an entire website in the first place.

## What PHP2Shell is

Two flaws, both rated CVSS 9.2, both exploitable by an unauthenticated attacker over the network. The name that stuck is *PHP2Shell*.

- **CVE-2026-109618** is an out-of-memory error handled badly. Memory runs out while PHP is still building its internal request data, and the cleanup path then treats the half-built structure as if it were valid.
- **CVE-2026-109619** is a use-after-free. State left behind by one request points at memory that has already been released, and a later request served by the same worker reuses it. The confirmed vulnerable path is session upload progress, and Tenable lists disabling `session.upload_progress.enabled` as a mitigation, with `memory_limit=-1` for the first bug.

It reaches every way of serving PHP: PHP-FPM, Apache mod_php, php-cgi, FrankenPHP, LiteSpeed. PHP rates mod_php as the worst case, because a request can trigger the bug before any application code has run. Amazon's threat intelligence team saw an exploitation attempt on October 17, four days before the public disclosure, and Cloudflare is reporting attack traffic.

I am deliberately not going into exploit mechanics. The vendor write-ups do not give them either, and an article that did would just be a recipe.

## Why this is a pattern, not a one-off

Look at what the two bugs have in common. Neither lives in anybody's application. Neither is something a careful developer could have avoided. They live in the interpreter, which sits in the request path of every site it serves, and they come from two things that are hard to do correctly and easy to get catastrophically wrong: managing memory by hand, and carrying state from one request to the next inside a long-lived worker.

That is why a patch window is the wrong unit of defence. Every site is exactly as safe as the last time somebody remembered to update, and the attacker gets a head start measured in days.

## Why this bug class is not on the menu in Hyperlambda

Hyperlambda runs on .NET. That one fact removes both bugs, and it removes them by construction rather than by care.

**A use-after-free needs a `free`.** Managed code does not have one. The runtime owns object lifetimes, so a reference cannot outlive the memory it points to. There is nothing for the second CVE to attach to.

**Running out of memory is an exception, not a corrupted structure.** In .NET an exhausted allocation throws `OutOfMemoryException` and the request fails. It does not leave a half-initialised object that a cleanup routine then trusts.

**A request does not inherit the last request's state.** Each request is evaluated as its own `Node` tree. There is no per-worker global that the next caller reads before it has been reset.

I also checked the one thing that would undercut all three. Managed code is only memory-safe until it opts out, so I searched every C# source and project file in the Magic repository for `unsafe`, `AllowUnsafeBlocks`, `DllImport` and `LibraryImport`. There are none. Magic's own code never steps outside the managed runtime. (That is a statement about this repository. It says nothing about NuGet packages we do not own.)

I will not call it *impossible*, and the next sections are why.

## What a Magic website is made of

The same property holds for what you build with Magic, and this is where the Web Designer and Chat Ops come in.

A site built with the [Web Designer](/web-designer) is files. The designer edits the real HTML in place, so a retyped heading is a one-line diff, and the result is served from the same cloudlet as your API. There is no PHP interpreter in that path, no plugin directory full of third-party code running with full process access, and no mod_php sitting in front of your application waiting to be hit before your own code runs.

Chat Ops builds on the same foundation. When you describe a backend in a sentence and an agent writes it, the result is a Hyperlambda file that runs under your role, and for any caller who is not root, inside a [`[whitelist]`](/blog/why-secure-ai-code-execution-requires-runtime-whitelisting-not-prompt-filtering) with a fixed vocabulary and a twenty-second timeout. The generated code cannot reach for a capability that is not on the list, however it was written and whatever it was told to do.

Put the two together and the attack surface of a Magic site is small and enumerable: your static files, your Hyperlambda endpoints, and the auth in front of them. That is a surface you can read. The WordPress ecosystem, by contrast, logged 11,334 disclosed vulnerabilities in 2025, 91% of them in plugins that run with no permission boundary at all, which I went through in [Magic vs WordPress](/blog/magic-vs-wordpress-an-honest-feature-matrix).

## What this means for your own apps and sites

None of that makes a Magic site secure automatically. It moves the risk to the places where *you* decide things, which is where it belongs, and it is a short list:

- **Put auth on every endpoint.** `auth.ticket.verify` at the top, and role checks that match what the endpoint does. A folder-level `interceptor.hl` applies to everything beneath it, so an endpoint cannot opt out of the check its parent imposes.
- **Audit what you have exposed.** Magic can list endpoints with their paths, verbs and auth requirements. Read that list once a month and ask of every public row whether it should be.
- **Never evaluate user input.** `hyper2lambda` followed by `eval` on text a caller sent is the same mistake as PHP's `eval()` on a form field, and no runtime will save you from it.
- **Parameterise SQL, validate paths.** Use `@parameters` instead of string concatenation, and never build a file path from a caller-supplied value.
- **Give agents their own user.** Not root. Root is not sandboxed, by design.

## The part where I have to be honest about us

In September, somebody broke my sandbox. I had offered $100 to anyone who could, and written in several articles that nobody had. A researcher sent a `data.create` call with a `database-type` of `auth.ticket`, which made a C# slot compose the name `auth.ticket.create` and dispatch it without the whitelist ever seeing it. The result was a root JWT. I wrote the whole story up in [We Got Breached](/blog/we-got-breached-a-whitelisted-data-create-minted-a-root-jwt).

No customer system was affected. The endpoint that fell was one I had published as a target. But the flaw lived in the dispatch layer, so it shipped in every copy of Magic, and it is fixed everywhere now.

I am telling you this here because it is the reason this article says *bug class* and not *impossible*. A managed runtime removes memory corruption. It does not remove logic errors, and mine was one. The two kinds of bug are not the same size: a logic bug in a layer you can read, fix in one place and verify against a live endpoint is a very different problem from a use-after-free in an interpreter you are waiting on a vendor to patch. But it is not zero, and I would rather say so before somebody else does.

## The honest edges

- **The runtime beneath is not mine.** .NET, Kestrel, the OS and SQLite have had their own CVEs. Keep them updated.
- **Magic loads native code in places.** The SQLite native plugins, a headless Chromium for the browser slots, and Python are outside the managed guarantee.
- **Application bugs are still possible.** Unauthenticated endpoints, string-built SQL, unchecked paths and evaluated user input all work exactly as they do anywhere else.
- **This is not a reason to hurry a migration off PHP.** If you are running it today, patch it today. The argument here is about what you build next.

## A smaller attack surface beats a faster patch cycle

Every site you run has two kinds of risk: the bugs in what you wrote, and the bugs in what you depend on. You can reduce the first by being careful. The second you can only reduce by depending on less, and by depending on something whose failure modes are smaller to begin with.

If you want to see what that looks like in practice, the whole platform is MIT licensed at [github.com/polterguy/magic](https://github.com/polterguy/magic), and you can run it locally in one command:

```bash
curl -fsSL https://hyperlambda.dev/docker-compose.yaml | docker compose -f - up
```

Open `localhost:5555`, point it at `localhost:4444`, log in with `root` / `root`, and then make your agents a user who is not root. If you would rather someone else kept it patched, [that is what a managed cloudlet is](/pricing).

## Frequently asked questions

### What is PHP2Shell?

Two critical remote code execution vulnerabilities in the PHP interpreter, CVE-2026-109618 and CVE-2026-109619, both rated CVSS 9.2. One is an out-of-memory handling flaw that leaves request state half-initialised, and the other is a use-after-free caused by stale state surviving between requests. Both can be exploited by an unauthenticated attacker, and exploitation was observed before disclosure.

### Which PHP versions fix PHP2Shell?

8.5.12, 8.4.27, 8.3.36 and 8.2.35, released October 21, 2026. End-of-life branches receive no official release, and CISA advises taking systems that cannot be updated offline until they are patched.

### Is Hyperlambda affected by PHP2Shell?

No. The bugs are in the PHP interpreter, and Hyperlambda does not use it. The underlying bug classes, use-after-free and out-of-memory corruption, require manual memory management, which a managed .NET runtime does not expose. Magic's own C# code contains no `unsafe` blocks or native interop.

### Can a Magic website be hacked?

Yes. The memory-corruption class is gone, but application-level mistakes are not: unauthenticated endpoints, SQL built by string concatenation, unchecked file paths and evaluated user input all remain possible. Magic's sandbox was also broken once, in September, through a dispatch-layer logic flaw that has since been fixed.

### Should I stop using PHP?

Not because of this. Patch it, and if you cannot patch, take it offline. The article's argument concerns what you choose to build on next, and how large an attack surface you accept when you do.

<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What is PHP2Shell?","acceptedAnswer":{"@type":"Answer","text":"Two critical remote code execution vulnerabilities in the PHP interpreter, CVE-2026-109618 and CVE-2026-109619, both rated CVSS 9.2. One is an out-of-memory handling flaw that leaves request state half-initialised, and the other is a use-after-free caused by stale state surviving between requests. Both can be exploited by an unauthenticated attacker, and exploitation was observed before disclosure."}},{"@type":"Question","name":"Which PHP versions fix PHP2Shell?","acceptedAnswer":{"@type":"Answer","text":"8.5.12, 8.4.27, 8.3.36 and 8.2.35, released October 21, 2026. End-of-life branches receive no official release, and CISA advises taking systems that cannot be updated offline until they are patched."}},{"@type":"Question","name":"Is Hyperlambda affected by PHP2Shell?","acceptedAnswer":{"@type":"Answer","text":"No. The bugs are in the PHP interpreter, and Hyperlambda does not use it. The underlying bug classes, use-after-free and out-of-memory corruption, require manual memory management, which a managed .NET runtime does not expose. Magic's own C# code contains no unsafe blocks or native interop."}},{"@type":"Question","name":"Can a Magic website be hacked?","acceptedAnswer":{"@type":"Answer","text":"Yes. The memory-corruption class is gone, but application-level mistakes are not: unauthenticated endpoints, SQL built by string concatenation, unchecked file paths and evaluated user input all remain possible. Magic's sandbox was also broken once, in September, through a dispatch-layer logic flaw that has since been fixed."}},{"@type":"Question","name":"Should I stop using PHP?","acceptedAnswer":{"@type":"Answer","text":"Not because of this. Patch it, and if you cannot patch, take it offline. The article's argument concerns what you choose to build on next, and how large an attack surface you accept when you do."}}]}
</script>

## Related reading

- [We Got Breached: A Whitelisted data.create Minted a Root JWT](/blog/we-got-breached-a-whitelisted-data-create-minted-a-root-jwt)
- [The Only Sandbox Your AI Agent Cannot Break Out Of](/blog/the-only-sandbox-your-ai-agent-cannot-break-out-of)
- [Four of These Eight CVEs Are Unrepresentable on Magic. One Isn't.](/blog/four-of-these-eight-cves-are-unrepresentable-on-magic-one-isnt)
- [Magic vs WordPress: An Honest Feature Matrix](/blog/magic-vs-wordpress-an-honest-feature-matrix)
- [Why Secure AI Code Execution Requires Runtime Whitelisting, Not Prompt Filtering](/blog/why-secure-ai-code-execution-requires-runtime-whitelisting-not-prompt-filtering)
- [Break My AI Sandbox and Make $100](/blog/break-my-ai-sandbox-and-make-100-psst-nobodys-done-it-yet)
