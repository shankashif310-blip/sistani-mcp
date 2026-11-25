
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

function createServer() {
  const server = new McpServer({
    name: "Sistani Fiqh Assistant",
    version: "1.0.0"
  });

  server.registerTool(
    "search_sistani",
    {
      description:
        "Search official Ayatollah Sistani website pages. Returns source text for Urdu answers.",
      inputSchema: {
        url: z.string().url().describe(
          "A page URL from www.sistani.org"
        )
      }
    },
    async ({ url }) => {
      const parsed = new URL(url);

      if (
        parsed.hostname !== "www.sistani.org" &&
        parsed.hostname !== "sistani.org"
      ) {
        throw new Error("Only the official Sistani website is allowed.");
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Could not retrieve the official page.");
      }

      const html = await response.text();
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();

      return {
        content: [{
          type: "text",
          text: `Official source: ${url}\n\n${text.slice(0, 12000)}`
        }]
      };
    }
  );

  return server;
}

const handler = createMcpHandler(createServer);

export default {
  fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    return handler(request, env, ctx);
  }
};
