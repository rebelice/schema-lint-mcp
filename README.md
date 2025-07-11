# Schema Lint MCP

An MCP server that validates schema files against lint rules using Claude or Gemini AI.

## Installation

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`

## Configure with Claude Code

Add this to your Claude Code settings JSON file:

```json
{
  "mcpServers": {
    "schema-lint": {
      "command": "node",
      "args": ["/path/to/schema-lint-mcp/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "your-anthropic-api-key-here",
        "GEMINI_API_KEY": "your-gemini-api-key-here"
      }
    }
  }
}
```

Or use environment variables:

```json
{
  "mcpServers": {
    "schema-lint": {
      "command": "node",
      "args": ["/path/to/schema-lint-mcp/dist/index.js"],
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

The `examples/` directory contains sample schemas and rule sets:

### Schema Files
- `schema.json` - Example JSON schema
- `schema.sql` - Example SQL schema with tables and relationships

### Rule Sets
- `rules.json` - Basic JSON schema validation rules
- `sql-rules.json` - General SQL best practices
- `schema-rules.json` - Database schema structure and naming conventions (inspired by Bytebase)
- `migration-rules.json` - Database migration safety and compatibility rules (inspired by Bytebase)

### Rule Categories

**Schema Rules** focus on:
- Naming conventions (tables, columns, indexes)
- Table structure requirements (primary keys, constraints)
- Column definitions (types, defaults, nullability)
- Index optimization
- Documentation (comments)

**Migration Rules** focus on:
- Backward compatibility
- DDL safety (avoiding table locks, data loss)
- DML safety (WHERE clauses, row limits)
- Performance considerations
- Migration hygiene (separation of concerns)