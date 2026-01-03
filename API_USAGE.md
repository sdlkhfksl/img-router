# ImgRouter API 使用说明书

## 目录

- [API 概述](#api-概述)
- [认证方式](#认证方式)
- [请求格式](#请求格式)
- [请求参数](#请求参数)
- [支持的模型](#支持的模型)
- [请求示例](#请求示例)
- [响应格式](#响应格式)
- [错误处理](#错误处理)
- [高级功能](#高级功能)

---

## API 概述

ImgRouter 提供兼容 OpenAI 的图像生成 API，支持多平台 AI 绘图服务。通过不同的 API Key 格式自动路由到对应的 AI 服务提供商。

**基础信息：**
- **接口地址**: `https://你的服务地址/v1/chat/completions`
- **请求方法**: `POST`
- **内容类型**: `application/json`

---

## 认证方式

### 1. 服务访问控制（可选）

如果服务器启用了访问控制，需要在请求头中提供访问密钥：

```http
X-Access-Key: your-access-key
```

### 2. AI 服务 API Key

通过 `Authorization` header 提供各平台的 API Key，系统会自动识别并路由：

| 平台 | API Key 格式 | 示例 |
|------|-------------|------|
| Gitee (模力方舟) | 30-60位字母数字 | `abc123def456xyz789...` |
| ModelScope (魔搭) | `ms-` 开头 | `ms-xxxxxxxxxxxxxxxx` |
| 火山引擎 (豆包) | UUID 格式 | `123e4567-e89b-12d3-a456-426614174000` |
| Hugging Face | `hf_` 开头 | `hf_xxxxxxxxxxxxxxxxxxxxxx` |

```http
Authorization: Bearer your-api-key
```

---

## 请求格式

### 基础请求结构

```json
{
  "model": "模型名称",
  "messages": [
    {
      "role": "user",
      "content": "图片描述文字"
    }
  ],
  "size": "尺寸",
  "stream": false
}
```

---

## 请求参数

### 核心参数

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| `model` | string | 是 | 指定使用的模型 | `"z-image-turbo"` |
| `messages` | array | 是 | 对话消息列表 | 见下方说明 |
| `size` | string | 否 | 图片尺寸 | `"1024x1024"` |
| `stream` | boolean | 否 | 是否流式输出 | `false` |

### messages 参数说明

`messages` 是一个消息对象数组，支持以下结构：

#### 方式一：纯文本（文生图）

```json
{
  "messages": [
    {
      "role": "user",
      "content": "一只可爱的猫咪，坐在窗台上，阳光洒在它的毛发上"
    }
  ]
}
```

#### 方式二：包含图片（图生图/图片编辑）

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "将这张图片变成动漫风格"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/image.jpg"
          }
        }
      ]
    }
  ]
}
```

#### 方式三：多图融合

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "图1是背景，图2是人物，将它们融合在一起"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/background.jpg"
          }
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/person.png"
          }
        }
      ]
    }
  ]
}
```

#### 方式四：Base64 图片

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "给图片添加滤镜效果"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
          }
        }
      ]
    }
  ]
}
```

### size 参数说明

不同平台支持的尺寸格式不同：

#### Gitee (模力方舟)
- 文生图: `"2048x2048"` (默认), `"1024x1024"`, `"512x512"`
- 图片编辑: `"1024x1024"` (默认, 同步), `"2048x2048"` (默认, 异步)

#### ModelScope (魔搭)
- 文生图: `"1024x1024"` (默认), `"768x768"`, `"512x512"`
- 图生图: `"1328x1328"` (默认)

#### 火山引擎 (豆包)
- 文生图/图生图: `"2K"` (默认), `"1080p"`, `"720p"`, `"512"`

#### Hugging Face
- 文生图/图生图: `"1024x1024"` (默认, 免费版限制)

### response_format 参数（可选）

指定返回格式：
- `"url"` - 返回图片 URL（默认）
- `"b64_json"` - 返回 Base64 编码的图片

**注意**：无论指定哪种格式，系统最终都会将图片转换为 Base64 嵌入返回，确保永久有效。

---

## 支持的模型

### Gitee (模力方舟)

#### 文生图模型
| 模型名称 | 说明 |
|----------|------|
| `z-image-turbo` | 默认模型，快速生成 |

#### 图片编辑模型（同步）
| 模型名称 | 说明 |
|----------|------|
| `Qwen-Image-Edit` | 默认，通义千问图片编辑 |
| `HiDream-E1-Full` | HiDream 图片编辑 |
| `FLUX.1-dev` | FLUX 系列 |
| `FLUX.2-dev` | FLUX 系列 |
| `FLUX.1-Kontext-dev` | FLUX Kontext |
| `HelloMeme` | Meme 生成 |
| `Kolors` | 上色模型 |
| `OmniConsistency` | 一致性编辑 |
| `InstantCharacter` | 角色生成 |
| `DreamO` | DreamO 模型 |
| `LongCat-Image-Edit` | LongCat 编辑 |
| `AnimeSharp` | 动漫风格 |

#### 图片编辑模型（异步）
| 模型名称 | 说明 |
|----------|------|
| `Qwen-Image-Edit-2511` | 默认，通义千问最新版 |
| `LongCat-Image-Edit` | LongCat 编辑 |
| `FLUX.1-Kontext-dev` | FLUX Kontext |

### ModelScope (魔搭)

| 模型名称 | 类型 | 说明 |
|----------|------|------|
| `Tongyi-MAI/Z-Image-Turbo` | 文生图 | 默认模型 |
| `Qwen/Qwen-Image-Edit-2511` | 图生图 | 图片编辑模型 |

### 火山引擎（豆包）

| 模型名称 | 说明 |
|----------|------|
| `doubao-seedream-4-5-251128` | 默认模型，最新版本 |
| `doubao-seedream-4-0-250828` | 旧版本 |

### Hugging Face

| 模型名称 | 类型 | 说明 |
|----------|------|------|
| `z-image-turbo` | 文生图 | 默认模型 |
| `Qwen-Image-Edit-2511` | 图生图 | 图片编辑模型 |

---

## 请求示例

### 示例 1：基础文生图（Gitee）

```bash
curl -X POST https://your-service.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-gitee-api-key" \
  -H "X-Access-Key: your-access-key" \
  -d '{
    "model": "z-image-turbo",
    "messages": [
      {
        "role": "user",
        "content": "一只可爱的橘猫，坐在窗台上，阳光洒在它的毛发上，背景是蓝天白云"
      }
    ],
    "size": "2048x2048"
  }'
```

### 示例 2：文生图（ModelScope）

```bash
curl -X POST https://your-service.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ms-your-modelscope-api-key" \
  -H "X-Access-Key: your-access-key" \
  -d '{
    "model": "Tongyi-MAI/Z-Image-Turbo",
    "messages": [
      {
        "role": "user",
        "content": "赛博朋克风格的未来城市，霓虹灯闪烁，雨夜"
      }
    ],
    "size": "1024x1024"
  }'
```

### 示例 3：图片编辑（Gitee 同步）

```bash
curl -X POST https://your-service.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-gitee-api-key" \
  -H "X-Access-Key: your-access-key" \
  -d '{
    "model": "Qwen-Image-Edit",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "将这张图片变成动漫风格"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "https://example.com/photo.jpg"
            }
          }
        ]
      }
    ],
    "size": "1024x1024"
  }'
```

### 示例 4：图片编辑（Gitee 异步）

```bash
curl -X POST https://your-service.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-gitee-api-key" \
  -H "X-Access-Key: your-access-key" \
  -d '{
    "model": "Qwen-Image-Edit-2511",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "给图片添加油画效果"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,iVBORw0KGgo..."
            }
          }
        ]
      }
    ],
    "size": "2048x2048"
  }'
```

### 示例 5：多图融合（火山引擎）

```bash
curl -X POST https://your-service.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 123e4567-e89b-12d3-a456-426614174000" \
  -H "X-Access-Key: your-access-key" \
  -d '{
    "model": "doubao-seedream-4-5-251128",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "图1是风景背景，图2是人物，将它们自然融合"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "https://example.com/landscape.jpg"
            }
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "https://example.com/person.png"
            }
          }
        ]
      }
    ],
    "size": "2K"
  }'
```

### 示例 6：使用 Hugging Face

```bash
curl -X POST https://your-service.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer hf_your-hf-api-key" \
  -H "X-Access-Key: your-access-key" \
  -d '{
    "model": "z-image-turbo",
    "messages": [
      {
        "role": "user",
        "content": "一只戴着墨镜的狗，在海滩上玩耍"
      }
    ],
    "size": "1024x1024"
  }'
```

---

## 响应格式

### 成功响应

```json
{
  "id": "chatcmpl-1234567890",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "z-image-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "![Generated Image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...)"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 0,
    "total_tokens": 50
  }
}
```

### 响应字段说明

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | string | 请求 ID |
| `object` | string | 对象类型 |
| `created` | number | 创建时间戳 |
| `model` | string | 使用的模型 |
| `choices` | array | 响应结果列表 |
| `choices[].message.content` | string | 生成的图片（Base64 嵌入 Markdown 格式） |
| `usage` | object | Token 使用情况 |

### 图片格式

返回的图片以 Base64 格式嵌入在 Markdown 语法中：

```
![Generated Image](data:image/png;base64,iVBORw0KGgo...)
```

这种格式可以直接在支持 Markdown 的环境中显示，也可以通过解析获取 Base64 数据。

---

## 错误处理

### 错误响应格式

```json
{
  "error": {
    "message": "错误描述信息",
    "type": "error_type",
    "param": null,
    "code": null
  }
}
```

### 常见错误码

| HTTP 状态码 | 错误类型 | 说明 |
|------------|----------|------|
| `401` | `authentication_error` | API Key 缺失或格式无效 |
| `403` | `permission_error` | 访问密钥无效（启用访问控制时） |
| `404` | `not_found_error` | 请求路径不存在 |
| `400` | `invalid_request_error` | 请求参数错误 |
| `500` | `server_error` | 服务器内部错误 |
| `502` | `provider_error` | AI 服务提供商错误 |
| `504` | `timeout_error` | 请求超时 |

### 错误示例

#### 1. API Key 缺失
```json
{
  "error": {
    "message": "Authorization header missing",
    "type": "authentication_error"
  }
}
```

#### 2. API Key 格式无效
```json
{
  "error": {
    "message": "Invalid API Key format. Could not detect provider.",
    "type": "authentication_error"
  }
}
```

#### 3. 访问密钥无效
```json
{
  "error": {
    "message": "Access denied. Invalid or missing X-Access-Key header.",
    "type": "permission_error"
  }
}
```

#### 4. 模型不存在
```json
{
  "error": {
    "message": "Model 'invalid-model' not found",
    "type": "invalid_request_error"
  }
}
```

#### 5. AI 服务提供商错误
```json
{
  "error": {
    "message": "VolcEngine API Error (401): Invalid API key",
    "type": "provider_error",
    "provider": "VolcEngine"
  }
}
```

---

## 高级功能

### 1. 流式响应（SSE）

目前所有请求都是同步的，流式响应参数 `stream` 保留用于未来扩展。

### 2. 图片格式转换

系统会自动处理以下图片格式：
- WebP 自动转换为 PNG
- 自动检测 MIME 类型
- 统一转换为 Base64 返回

### 3. 安全限制

为防止 SSRF 攻击，系统会验证图片 URL 的安全性：
- 仅允许访问 HTTP/HTTPS 协议
- 禁止访问本地和私有网络地址
- 仅允许访问已配置的图床域名

### 4. 超时控制

默认超时时间：300 秒（5 分钟）

### 5. 故障转移

Hugging Face 渠道支持多 URL 故障转移，当一个 URL 失败时自动切换到下一个。

---

## 健康检查

### 端点

```
GET /health
```

### 响应

```json
{
  "status": "ok",
  "service": "img-router"
}
```

---

## 最佳实践

### 1. Prompt 编写建议

- **明确描述**：详细描述你想要的画面
- **风格指定**：明确指定艺术风格（如"油画风格"、"动漫风格"）
- **质量词**：使用高质量词汇（如"高清"、"细节丰富"、"4K"）
- **负面描述**：避免使用否定词，直接描述你想要的

**好的 Prompt 示例：**
```
一只优雅的白色波斯猫，坐在古典欧式窗台上，阳光透过蕾丝窗帘洒在它的毛发上，背景是蓝天白云，高清细节，电影级光影
```

### 2. 图片编辑建议

- **清晰指令**：明确说明要做什么修改
- **参考图片**：提供高质量的参考图片
- **合理尺寸**：选择合适的输出尺寸

### 3. 性能优化

- **选择合适尺寸**：小尺寸生成更快，大尺寸质量更高
- **使用同步/异步**：简单任务用同步，复杂任务用异步
- **缓存结果**：客户端可以缓存 Base64 结果

### 4. 错误处理

- **重试机制**：对于网络错误实现自动重试
- **超时设置**：客户端设置合理的超时时间
- **日志记录**：记录请求和响应以便调试

---

## SDK 和集成

### JavaScript/TypeScript

```typescript
async function generateImage(prompt: string, apiKey: string, accessKey: string) {
  const response = await fetch('https://your-service.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-Access-Key': accessKey,
    },
    body: JSON.stringify({
      model: 'z-image-turbo',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      size: '2048x2048',
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

### Python

```python
import requests

def generate_image(prompt, api_key, access_key):
    url = "https://your-service.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "X-Access-Key": access_key,
    }
    payload = {
        "model": "z-image-turbo",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "size": "2048x2048"
    }

    response = requests.post(url, json=payload, headers=headers)
    data = response.json()
    return data["choices"][0]["message"]["content"]
```

---

## 常见问题（FAQ）

### Q1: 如何获取各平台的 API Key？

- **Gitee**: 访问 https://ai.gitee.com/
- **ModelScope**: 访问 https://modelscope.cn/
- **火山引擎**: 访问 https://console.volcengine.com/ark
- **Hugging Face**: 访问 https://huggingface.co/settings/tokens

### Q2: 生成的图片会过期吗？

不会。所有图片都会转换为 Base64 格式返回，永久有效。

### Q3: 支持批量生成吗？

目前每次请求生成一张图片。如需批量生成，可以发送多个请求。

### Q4: 图片生成需要多长时间？

- 快速模型：10-30 秒
- 复杂模型：30-120 秒
- 异步任务：可能需要 1-5 分钟

### Q5: 如何处理 WebP 格式的图片？

系统会自动将 WebP 转换为 PNG，无需手动处理。

### Q6: 可以同时使用多个平台的 API Key 吗？

可以，每次请求使用不同的 API Key 即可，系统会自动识别并路由。

---

## 更新日志

### v1.0.0
- 初始版本
- 支持 Gitee、ModelScope、火山引擎、Hugging Face
- 支持文生图、图生图、多图融合
- 添加访问控制功能

---

## 技术支持

如有问题，请提交 Issue 或联系项目维护者。

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-03