import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const server = new Server(
  {
    name: 'schema-lint-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

interface LintResult {
  ruleName: string;
  passed: boolean;
  message: string;
  line?: number;
  column?: number;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'validate_schema',
        description: 'Validate a schema file against lint rules',
        inputSchema: {
          type: 'object',
          properties: {
            schemaPath: {
              type: 'string',
              description: 'Path to the schema file to validate',
            },
            rulesPath: {
              type: 'string',
              description: 'Path to the lint rules file',
            },
            provider: {
              type: 'string',
              description: 'AI provider to use: "claude" or "gemini"',
              enum: ['claude', 'gemini'],
              default: 'claude',
            },
          },
          required: ['schemaPath', 'rulesPath'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === 'validate_schema') {
      const { schemaPath, rulesPath, provider = 'claude' } = request.params.arguments as {
        schemaPath: string;
        rulesPath: string;
        provider?: 'claude' | 'gemini';
      };

      const schemaContent = await fs.readFile(schemaPath, 'utf-8');
      const rulesContent = await fs.readFile(rulesPath, 'utf-8');

      const lintResults = provider === 'gemini' 
        ? await validateSchemaWithGemini(schemaContent, rulesContent)
        : await validateSchemaWithClaude(schemaContent, rulesContent);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(lintResults, null, 2),
          },
        ],
      };
    }

    throw new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool: ${request.params.name}`
    );
  } catch (error) {
    if (error instanceof McpError) throw error;
    
    throw new McpError(
      ErrorCode.InternalError,
      `Error executing tool: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

async function validateSchemaWithClaude(schemaContent: string, rulesContent: string): Promise<LintResult[]> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `You are a schema validator. Please validate the following schema against the provided lint rules.

Schema content:
${schemaContent}

Lint rules:
${rulesContent}

For each rule in the lint rules file, check if the schema complies with it. Return your results in the following JSON format:
[
  {
    "ruleName": "rule name",
    "passed": true/false,
    "message": "explanation of the result",
    "line": line number if applicable,
    "column": column number if applicable
  }
]

Only return the JSON array, no other text.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type === 'text') {
    try {
      return JSON.parse(content.text) as LintResult[];
    } catch (error) {
      throw new Error('Failed to parse Claude response as JSON');
    }
  }

  throw new Error('Unexpected response format from Claude');
}

async function validateSchemaWithGemini(schemaContent: string, rulesContent: string): Promise<LintResult[]> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash-exp' });

  const prompt = `You are a schema validator. Please validate the following schema against the provided lint rules.

Schema content:
${schemaContent}

Lint rules:
${rulesContent}

For each rule in the lint rules file, check if the schema complies with it. Return your results in the following JSON format:
[
  {
    "ruleName": "rule name",
    "passed": true/false,
    "message": "explanation of the result",
    "line": line number if applicable,
    "column": column number if applicable
  }
]

Only return the JSON array, no other text.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    return JSON.parse(text) as LintResult[];
  } catch (error) {
    // If parsing fails, return the raw response as a single lint result
    return [{
      ruleName: 'parse-error',
      passed: false,
      message: `Failed to parse Gemini response as JSON. Raw response: ${text}`
    }];
  }
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});