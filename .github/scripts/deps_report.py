#!/usr/bin/env python3
"""
Merges the NuGet and npm vulnerability audits into one small JSON report, deps.json.

Usage: deps_report.py <dotnet-vulnerable.json> <npm-audit.json> <Directory.Build.props> <commit-sha> > deps.json

The NuGet audit is the output of `dotnet list package --vulnerable --include-transitive --format json`, which lists
every advisory, also the ones suppressed with NuGetAuditSuppress. The suppressed ones are marked with the reason
written in the comment above them in Directory.Build.props, so a suppression is shown, never hidden.
"""
import json
import re
import sys
from datetime import datetime, timezone


def suppressed_advisories(props_path):
    """Advisory URL -> the text of the XML comment directly above the group of suppressions it belongs to."""
    text = open(props_path, encoding='utf-8').read()
    result = {}
    for comment, block in re.findall(r'<!--(.*?)-->\s*<ItemGroup>(.*?)</ItemGroup>', text, re.S):
        reason = ' '.join(comment.split())
        for url in re.findall(r'<NuGetAuditSuppress\s+Include="([^"]+)"', block):
            result[url] = reason
    return result


def nuget_findings(path, suppressed):
    audit = json.load(open(path, encoding='utf-8'))
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


def npm_findings(path):
    audit = json.load(open(path, encoding='utf-8'))
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
    dotnet_json, npm_json, props, sha = sys.argv[1:5]
    findings = nuget_findings(dotnet_json, suppressed_advisories(props)) + npm_findings(npm_json)
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
