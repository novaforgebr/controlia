{
  "nodes": [
    {
      "parameters": {
        "agent": "conversationalAgent",
        "promptType": "define",
        "text": "={{ $json.message?.text || $json.text || $('Telegram Trigger').first()?.json?.message?.text || '' }}",
        "options": {
          "systemMessage": "={{ $json.prompt_text }}"
        }
      },
      "id": "41174c8a-6ac8-42bd-900e-ca15196600c5",
      "name": "Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 1.7,
      "position": [
        1552,
        48
      ]
    },
    {
      "parameters": {
        "model": {
          "__rl": true,
          "value": "gpt-4.1-nano-2025-04-14",
          "mode": "list",
          "cachedResultName": "gpt-4.1-nano-2025-04-14"
        },
        "builtInTools": {},
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1.3,
      "position": [
        1568,
        272
      ],
      "id": "6f532485-1ef2-4c65-99c7-af44f772d837",
      "name": "OpenAI Chat Model",
      "credentials": {
        "openAiApi": {
          "id": "KKcz58kOwzIUk1WI",
          "name": "OpenAi account"
        }
      }
    },
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "/webhook/7ab5d664-349d-4ad2-84f1-23da3b2df1a7/webhook",
        "authentication": "headerAuth",
        "responseMode": "lastNode",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.1,
      "position": [
        1152,
        48
      ],
      "id": "94d8922a-d802-42f6-9fd2-9e492fc6f9d9",
      "name": "Webhook",
      "webhookId": "202e25de-310d-4001-bdbd-2520da68de5c",
      "credentials": {
        "httpHeaderAuth": {
          "id": "3rBaJq0jL2hLih4A",
          "name": "Header Auth account"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Obter dados do Agent\nconst agentOutput = $input.item.json.output;\n\n// Obter dados do Controlia (se vier do webhook)\nconst controlia = $input.item.json.controlia || {};\n\n// Obter dados do Telegram Trigger\nconst telegramTrigger = $('Telegram Trigger').first();\nconst telegramMessage = telegramTrigger?.json?.message || $input.item.json.message || {};\n\n// Preparar objeto final\nconst responseData = {\n  output: agentOutput,\n  controlia: {\n    company_id: controlia.company_id || null,\n    contact_id: controlia.contact_id || null,\n    conversation_id: controlia.conversation_id || null,\n    message_id: controlia.message_id || null,\n    channel: controlia.channel || 'telegram',\n    channel_id: telegramMessage.chat?.id || controlia.channel_id || null\n  },\n  message: {\n    from: telegramMessage.from || null,\n    chat: telegramMessage.chat || null\n  }\n};\n\nreturn responseData;"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        1840,
        48
      ],
      "id": "a107288c-8f49-4d67-b5e6-6b701d8372d3",
      "name": "Prepare Response Data"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "={{ $json.controlia?.callback_url || 'https://controliaa.vercel.app/api/webhooks/n8n/channel-response' }}",
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ $json }}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.3,
      "position": [
        2048,
        48
      ],
      "id": "0aa3f1c7-6795-465d-8b18-1aa2505b9b93",
      "name": "HTTP Request"
    },
    {
      "parameters": {
        "sessionIdType": "customKey",
        "sessionKey": "={{ $('Telegram Trigger').item.json.message.chat.id }}"
      },
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.3,
      "position": [
        1696,
        272
      ],
      "id": "c647164c-52a3-4500-bc52-375b1914290b",
      "name": "Simple Memory"
    },
    {
      "parameters": {
        "operation": "get",
        "tableId": "ai_prompts",
        "filters": {
          "conditions": [
            {
              "keyName": "id",
              "keyValue": "fe5c1cb7-bc87-4922-9736-8ca6b83ae613"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [
        1360,
        48
      ],
      "id": "ce4b547b-4700-45da-8870-a69a8d636c23",
      "name": "Get a row",
      "credentials": {
        "supabaseApi": {
          "id": "MJeuWnGfcHw2J9Ll",
          "name": "Supabase account"
        }
      }
    }
  ],
  "connections": {
    "Agent": {
      "main": [
        [
          {
            "node": "Prepare Response Data",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "OpenAI Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "Agent",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Webhook": {
      "main": [
        [
          {
            "node": "Get a row",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Prepare Response Data": {
      "main": [
        [
          {
            "node": "HTTP Request",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "HTTP Request": {
      "main": [
        []
      ]
    },
    "Simple Memory": {
      "ai_memory": [
        [
          {
            "node": "Agent",
            "type": "ai_memory",
            "index": 0
          }
        ]
      ]
    },
    "Get a row": {
      "main": [
        [
          {
            "node": "Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "meta": {
    "templateId": "self-building-ai-agent",
    "templateCredsSetupCompleted": true,
    "instanceId": "4a22749bbc8ec20e8bba632ac1dd5cfc3d01dc0f58c987349b16ee15b7554ab1"
  }
}