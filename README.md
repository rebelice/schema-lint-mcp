# Schema Lint MCP

An MCP server that validates schema files against lint rules using Claude or Gemini AI.

## Installation

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Set up your API keys:
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY and/or GEMINI_API_KEY
   ```

## Configure with Claude Code

Add this to your Claude Code settings JSON file:

```json
{
  "mcpServers": {
    "schema-lint": {
      "command": "node",
      "args": ["/Users/rebeliceyang/Github/schema-lint-mcp/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "your-anthropic-api-key-here",
        "GEMINI_API_KEY": "your-gemini-api-key-here"
      }
    }
  }
}
```

Or if you want to use the .env file:

```json
{
  "mcpServers": {
    "schema-lint": {
      "command": "node",
      "args": ["/Users/rebeliceyang/Github/schema-lint-mcp/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "${env:ANTHROPIC_API_KEY}",
        "GEMINI_API_KEY": "${env:GEMINI_API_KEY}"
      }
    }
  }
}
```

## Usage

Once configured, you can use the `validate_schema` tool in Claude Code:

```
// Using Claude (default)
validate_schema(schemaPath: "/path/to/schema.json", rulesPath: "/path/to/rules.json")

// Using Gemini
validate_schema(schemaPath: "/path/to/schema.json", rulesPath: "/path/to/rules.json", provider: "gemini")
```

## Example Files

See the `examples/` directory for sample schema and rules files.