#!/usr/bin/env python3
"""
Merges the NuGet and npm vulnerability audits into one small JSON report, deps.json.

Run it from the root of the repository, with the two audits in the files named below, and the commit in the
GITHUB_SHA environment variable. It writes the report to standard output. The files are fixed names and not arguments,
so nothing a caller passes in decides which file is read.

The NuGet audit is the output of `dotnet list package --vulnerable --include-transitive --format json`, which lists
every advisory, also the ones suppressed with NuGetAuditSuppress. The suppressed ones are marked with the reason
written in the comment above them in Directory.Build.props, so a suppression is shown, never hidden.
"""
import json
import os
import re
import sys
from datetime import datetime, timezone


DOTNET_AUDIT = 'dotnet-vulnerable.json'
NPM_AUDIT = 'npm-audit.json'
PROPS = 'Directory.Build.props'


def suppressed_advisories():
    """Advisory URL -> the text of the XML comment directly above the group of suppressions it belongs to."""
    text = open(PROPS, encoding='utf-8').read()
    result = {}
    for match in re.finditer(r'<NuGetAuditSuppress\s+Include="([^"]+)"', text):
        start = text.rfind('<!--', 0, match.start())
        end = text.find('-->', start) if start >= 0 else -1
        # The comment counts only when nothing but the group tag and other suppressions sit between it and this one.
        between = text[end + 3:match.start()] if 0 <= end < match.start() else None
        if between is not None and re.sub(r'<ItemGroup>|<NuGetAuditSuppress[^>]*/>|\s', '', between) == '':
            result[match.group(1)] = ' '.join(text[start + 4:end].split())
        else:
            result[match.group(1)] = None
    return result


def nuget_findings(suppressed):
    audit = json.load(open(DOTNET_AUDIT, encoding='utf-8'))
    found = {}
    for project in audit.get('projects', []):
        for framework in project.get('frameworks', []):
            for kind in ('topLevelPackages', 'transitivePackages'):
                for package in framework.get(kind, []):
                    for vuln in package.get('vulnerabilities', []):
                        key = (package['id'], package['resolvedVersion'], vuln['advisoryurl'])
                        entry = found.setdefault(key, {
                            'ecosystem': 'nuget',
                            'package': package['id'],
                            'version': package['resolvedVersion'],
                            'severity': vuln['severity'].lower(),
                            'advisory': vuln['advisoryurl'],
                            'projects': 0,
                            'suppressed': vuln['advisoryurl'] in suppressed,
                            'reason': suppressed.get(vuln['advisoryurl']),
                        })
                        entry['projects'] += 1
    return list(found.values())


def npm_findings():
    audit = json.load(open(NPM_AUDIT, encoding='utf-8'))
    found = []
    for name, vuln in (audit.get('vulnerabilities') or {}).items():
        fix = vuln.get('fixAvailable')
        found.append({
            'ecosystem': 'npm',
            'package': name,
            'version': vuln.get('range'),
            'severity': vuln.get('severity'),
            'advisory': next((v['url'] for v in vuln.get('via', []) if isinstance(v, dict) and v.get('url')), None),
            'projects': 1,
            'suppressed': False,
            'reason': None,
            'fix': (fix['name'] + '@' + fix['version']) if isinstance(fix, dict) else bool(fix),
        })
    return found


def main():
    sha = os.environ.get('GITHUB_SHA', 'unknown')
    findings = nuget_findings(suppressed_advisories()) + npm_findings()
    counts = {}
    for f in findings:
        if not f['suppressed']:
            counts[f['severity']] = counts.get(f['severity'], 0) + 1
    suppressed = {}
    for f in findings:
        if f['suppressed']:
            suppressed[f['severity']] = suppressed.get(f['severity'], 0) + 1
    report = {
        'generated': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'commit': sha,
        'open': counts,
        'suppressed': suppressed,
        'findings': sorted(findings, key=lambda f: (f['suppressed'], f['ecosystem'], f['package'], f['advisory'] or '')),
    }
    json.dump(report, sys.stdout, indent=1)


main()
