// 火山引擎图像生成 API 中转服务
// 将 OpenAI 格式的请求转换为火山引擎 Ark API 格式

// 火山引擎 Ark API 地址
const ARK_API_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";

// 从环境变量读取端口，默认 10001
const PORT = parseInt(Deno.env.get("PORT") || "10001");

/**
 * 处理 OpenAI 格式的 chat/completions 请求
 * 将其转换为火山引擎图像生成请求
 */
async function handleChatCompletions(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // 1. 路由校验
  if (url.pathname !== "/v1/chat/completions") {
    return new Response(JSON.stringify({ error: "Not found" }), { 
      status: 404, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  try {
    // 2. 认证校验
    const authHeader = req.headers.get("Authorization");
    const apiKey = authHeader?.replace("Bearer ", "");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Authorization header missing" }), { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const openAIRequest = await req.json();
    const isStream = openAIRequest.stream === true;

    // 3. 提取 Prompt 和 Images (适配 OpenAI 多模态格式)
    let prompt = "";
    let images: string[] = [];
    
    const messages = openAIRequest.messages || [];
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        const userContent = messages[i].content;
        if (typeof userContent === "string") {
          prompt = userContent;
        } else if (Array.isArray(userContent)) {
          // 查找文本内容
          const textItem = userContent.find((item: { type: string; text?: string }) => item.type === "text");
          prompt = textItem?.text || "";
          // 查找图片内容
          images = userContent
            .filter((item: { type: string }) => item.type === "image_url")
            .map((item: { image_url?: { url?: string } }) => item.image_url?.url || "")
            .filter(Boolean);
        }
        break;
      }
    }

    // 4. 构造火山引擎请求参数
    // 注意：Seedream API 要求图片至少 3686400 像素，使用 4096x4096 确保满足要求
    const arkRequest = {
      model: openAIRequest.model || "doubao-seedream-4-0-250828",
      prompt: prompt || "A beautiful scenery", // 兜底 prompt
      image: images,
      response_format: "url",
      size: openAIRequest.size || "4096x4096", // 默认使用 4096x4096 高清尺寸
      seed: -1,
      stream: false,
      watermark: false,
    };

    // 5. 请求火山引擎
    const arkResponse = await fetch(ARK_API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${apiKey}`,
        "Connection": "close" // 减少 TLS 会话复用导致的 MAC 错误
      },
      body: JSON.stringify(arkRequest),
    });

    if (!arkResponse.ok) {
      const errorText = await arkResponse.text();
      console.error("Ark API Error:", errorText);
      return new Response(JSON.stringify({ error: `Ark API returned ${arkResponse.status}: ${errorText}` }), { 
        status: arkResponse.status, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const arkData = await arkResponse.json();
    
    // 6. 构造返回内容：Markdown 格式图片
    const imageContent = arkData.data?.map((img: { url: string }) => `![Generated Image](${img.url})`).join("\n\n") || "图片生成失败";
    const responseId = `chatcmpl-${crypto.randomUUID()}`;
    const modelName = arkRequest.model;

    // 7. 处理流式返回 (SSE)
    if (isStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          // 发送第一个 Chunk (内容)
          const contentChunk = {
            id: responseId,
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1000),
            model: modelName,
            choices: [{
              index: 0,
              delta: { role: "assistant", content: imageContent },
              finish_reason: null
            }]
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(contentChunk)}\n\n`));

          // 发送结束 Chunk
          const endChunk = {
            id: responseId,
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1000),
            model: modelName,
            choices: [{
              index: 0,
              delta: {},
              finish_reason: "stop"
            }]
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(endChunk)}\n\n`));
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }

    // 8. 处理非流式返回 (JSON)
    return new Response(JSON.stringify({
      id: responseId,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: modelName,
      choices: [{
        index: 0,
        message: { role: "assistant", content: imageContent },
        finish_reason: "stop"
      }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
    }), {
      headers: { 
        "Content-Type": "application/json", 
        "Access-Control-Allow-Origin": "*" 
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Proxy Error:", error);
    return new Response(JSON.stringify({ 
      error: { message: errorMessage, type: "server_error" } 
    }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}

// 使用 Deno.serve 启动服务
console.log(`🚀 火山引擎图像生成 API 中转服务启动在端口 ${PORT}`);

Deno.serve({ port: PORT }, async (req: Request) => {
  // 处理 CORS 预检请求
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      }
    });
  }

  // 只允许 POST 请求
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  return handleChatCompletions(req);
});
