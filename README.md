# n8n-nodes-forgiving-cli

Forgiving Execute Command node for n8n - always returns data, never throws errors.

## Features

- **Forgiving Mode**: Toggle between lean array output or detailed object
- **Multiple Shells**: /bin/bash, /bin/sh, /usr/bin/bash, /usr/bin/zsh
- **Configurable Timeout**: Up to 120000ms default
- **Encoding Support**: UTF-8, and many others via iconv-lite
- **AI Agent Ready**: Lean output format minimizes context usage

## Installation

```bash
npm install -g n8n-nodes-forgiving-cli
```

Or via n8n UI: Settings → Community Nodes → Install → `n8n-nodes-forgiving-cli`

## Development

### Requirements

- Node.js >= 18.0.0
- npm >= 9.x
- GitHub account with npm token

### Setup

```bash
# 1. Clone repository
git clone https://github.com/steimbyte/n8n-nodes-forgiving-cli.git
cd n8n-nodes-forgiving-cli

# 2. Install dependencies (optional for development)
npm install
```

### Project Structure

```
n8n-nodes-forgiving-cli/
├── dist/                           # Compiled JavaScript (published to npm)
│   └── nodes/
│       └── ExecuteCommandPlus/
│           └── ExecuteCommandPlus.node.js
├── .github/
│   └── workflows/
│       └── publish.yml             # Auto-publish on push to master
├── package.json                    # npm package configuration
└── index.js                       # Empty file (n8n reads from dist/)
```

### GitHub Setup (One-time)

1. **Create GitHub Repository**
   - Create repo on GitHub: `https://github.com/new`
   - Name: `n8n-nodes-forgiving-cli`
   - Public: Yes

2. **Create npm Token**
   - Go to: https://www.npmjs.com/settings/tokens
   - Click "Generate New Token" → "Granular Access Token"
   - ✅ Enable: "Bypass two-factor authentication for 'npm publish'"
   - Save the token (starts with `npm_`)

3. **Add Token to GitHub**
   - Go to: `https://github.com/steimbyte/n8n-nodes-forgiving-cli/settings/secrets/actions`
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Secret: Your npm token

### GitHub Actions Workflow

The workflow auto-publishes on every push to `master`:

```yaml
name: Publish to npm
on:
  push:
    branches: [master]
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Local Development Workflow

### Option 1: Auto-Publish (Recommended)

```bash
# Make changes to dist/nodes/ExecuteCommandPlus/ExecuteCommandPlus.node.js
# Then commit and push

git add -A
git commit -m "Your message"
git push origin master

# GitHub Actions automatically:
# 1. Detects push to master
# 2. Runs workflow
# 3. Publishes to npm
# Takes ~30 seconds
```

### Option 2: Manual Publish

```bash
# Update version in package.json
npm version patch  # or minor, major

# Publish directly
npm publish --access public
```

### Option 3: Local Testing

```bash
# Test the package locally before publishing
cd /tmp
mkdir test-pkg
cd test-pkg
npm init -y
npm install /path/to/n8n-nodes-forgiving-cli-1.0.0.tgz

# Verify it loads correctly
node -e "
const pkg = require('./node_modules/n8n-nodes-forgiving-cli/dist/nodes/ExecuteCommandPlus/ExecuteCommandPlus.node.js');
const Node = pkg.ExecuteCommandPlus;
const node = new Node();
console.log('✅ Loaded:', node.description.name);
"
```

## Versioning

Use semantic versioning:

| Command | Use Case |
|---------|----------|
| `npm version patch` | Bug fixes (1.0.0 → 1.0.1) |
| `npm version minor` | New features (1.0.0 → 1.1.0) |
| `npm version major` | Breaking changes (1.0.0 → 2.0.0) |

## Package.json Requirements

```json
{
  "name": "n8n-nodes-forgiving-cli",
  "version": "1.0.0",
  "description": "...",
  "keywords": ["n8n-community-node-package"],
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "main": "index.js",
  "files": ["dist", "index.js"],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "nodes": ["dist/nodes/ExecuteCommandPlus/ExecuteCommandPlus.node.js"]
  },
  "peerDependencies": {
    "n8n-workflow": "*"
  },
  "dependencies": {
    "iconv-lite": "^0.6.3"
  }
}
```

### Critical Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | ✅ | Must start with `n8n-nodes-` |
| `keywords` | ✅ | Must include `n8n-community-node-package` |
| `n8n.nodes` | ✅ | Path to compiled .js file in `dist/` |
| `engines.node` | ✅ | Minimum Node.js version |
| `files` | ✅ | Include `dist/` and `index.js` |

## Node Output Formats

### Forgiving Mode: ON (Default)

```javascript
// Full (lean)
{ "output": ["exitCode:0", "stdout:Hello", "stderr:", "error:"] }

// stdout only
{ "output": ["Hello World"] }

// exitCode only
{ "output": ["0"] }
```

### Forgiving Mode: OFF

```javascript
{
  "success": true,
  "error": "",
  "exitCode": 0,
  "stdout": "Hello World",
  "stderr": ""
}
```

## Troubleshooting

### "specified package could not be loaded"

1. Clear n8n cache:
   ```bash
   rm -rf ~/.n8n/nodes/
   ```

2. Uninstall and reinstall:
   ```bash
   npm uninstall -g n8n-nodes-forgiving-cli
   npm install -g n8n-nodes-forgiving-cli
   ```

3. Restart n8n

### "npm publish 404 Not Found"

- Package must exist on npmjs.com first
- For new packages: Create via GitHub Actions workflow
- For updates: Ensure version is higher than existing

### "403 Forbidden - PUT"

- npm token may be expired or missing 2FA bypass
- Generate new token at: https://www.npmjs.com/settings/tokens
- Ensure token has "Bypass two-factor authentication for 'npm publish'" enabled

## Links

- **npm**: https://www.npmjs.com/package/n8n-nodes-forgiving-cli
- **GitHub**: https://github.com/steimbyte/n8n-nodes-forgiving-cli
- **n8n Docs**: https://docs.n8n.io/integrations/creating-nodes/

## License

MIT
