import dotenv from 'dotenv'
import { createAgent } from 'langchain'
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'

dotenv.config({ path: new URL('../.env.local', import.meta.url) })

// 定义模型
const model = new ChatOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
  configuration: {
    baseURL: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/v1',
  },
})

// 这是单个消息的
// const prompt = ChatPromptTemplate.fromMessages([
//   [
//     'user',
//     [
//       '用户昵称：{nickname}',
//       '当前场景：{scene}',
//       '本轮输入：{input}',
//     ].join('\n'),
//   ],
// ])
// 这是多条消息的 使用 MessagesPlaceholder
const prompt = ChatPromptTemplate.fromMessages([
  new MessagesPlaceholder({
    variableName: 'history',
    optional: true
  }),
  [
    'user',
    [
      '用户昵称：{nickname}',
      '当前场景：{scene}',
      '本轮输入：{input}',
    ].join('\n'),
  ]
])
console.log('prompt is ', prompt);

const messages = await prompt.formatMessages({
  history: [
    {
      role: 'user',
      content: '今天开会又改需求了。',
    },
    {
      role: 'assistant',
      content: '听起来你已经有点烦了，最麻烦的是哪一段？',
    },
  ],
  nickname: '小林',
  scene: '下班路上，还在想白天的事情',
  input: '最烦的是昨天刚定下来，今天又推翻了。',
})
console.log('messages is ', messages);

// 定义 Agent
const agent = createAgent({
  model,
  tools: [],
  systemPrompt: '你是一名面向前端开发者的助手，回答要自然、简短。',
})

// Agent 调用 stream 流式输出，返回的是消息流
const stream = await agent.stream(
  {
    messages: messages,
  },
  {
    //! 设置 streamMode 为 messages，返回的是消息流
    streamMode: 'messages',
  }
)

process.stdout.write('agent stream result:\n')

for await (const [messageChunk] of stream) {
  if (messageChunk.content) {
    process.stdout.write(messageChunk.text)
  }
}

process.stdout.write('\n')