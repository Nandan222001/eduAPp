#!/bin/bash

# Script to check the status of recent EAS builds
# Usage: ./check-build-status.sh [limit]

set -e

LIMIT=${1:-10}

echo "================================================"
echo "  EAS Build Status"
echo "================================================"
echo ""

# Check recent builds
echo "📋 Recent builds (last $LIMIT):"
echo ""

eas build:list --limit "$LIMIT" --json | \
  node -e "
    const builds = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
    builds.forEach(build => {
      const status = build.status;
      const emoji = status === 'finished' ? '✅' : 
                    status === 'errored' ? '❌' : 
                    status === 'in-progress' ? '⏳' : '⏸️';
      const platform = build.platform.toUpperCase();
      const profile = build.buildProfile;
      const created = new Date(build.createdAt).toLocaleString();
      
      console.log(\`\${emoji} [\${platform}] \${profile}\`);
      console.log(\`   Status: \${status}\`);
      console.log(\`   Created: \${created}\`);
      console.log(\`   ID: \${build.id}\`);
      console.log('');
    });
  " 2>/dev/null || eas build:list --limit "$LIMIT"

echo ""
echo "================================================"
echo "  Quick Actions"
echo "================================================"
echo ""
echo "View build details:    eas build:view <build-id>"
echo "Cancel a build:        eas build:cancel <build-id>"
echo "Download artifacts:    eas build:download <build-id>"
echo "View build logs:       eas build:view <build-id> --json"
echo ""
