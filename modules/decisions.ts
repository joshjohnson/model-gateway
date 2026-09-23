import {
  AIGatewayModelRouting,
  AIGatewayModels,
  ZuploContext,
  ZuploRequest,
} from "@zuplo/runtime";


interface Criteria {
  model: string;
  description: string;
}
interface DecisionsOptions {
  api: {
    key: string;
    url?: string;
  }
  model: {
    name?: string;
    instructions?: string;
    criteria: Criteria[];
  }
  
}

const DEFAULT_DECISIONS_MODEL_NAME = "typesafe/jev-1.13";
const DEFAULT_DECISIONS_MODEL_URL = "https://openrouter.ai/api/alpha/decisions";
const DEFAULT_INSTRUCTIONS = "What model should be used to respond to this request?";
  
export default async function decisionModel(
  request: ZuploRequest,
  context: ZuploContext,
  options: DecisionsOptions,
): Promise<ZuploRequest | Response> {
  const modelName = options.model.name ?? DEFAULT_DECISIONS_MODEL_NAME;
  const instructions = options.model.instructions ?? DEFAULT_INSTRUCTIONS;
  const criteria = options.model.criteria;
  const apiKey = options.api.key;
  const decisionsUrl = options.api.url ?? DEFAULT_DECISIONS_MODEL_URL;


  const decisionRequestBody = {model: modelName,
    questions: {
      model: {
        type: "choice",
        instructions: instructions,
        criteria: criteria,
      }
    }
  }

  context.log.debug("Decision request body:", decisionRequestBody);

  let decisionResult = await fetch(decisionsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(decisionRequestBody),
  });
  

  
  const decisionData = await decisionResult.json();

  context.log.debug("Decision data received:", decisionData);

  const answerModel = decisionData.answer.model;

  await AIGatewayModelRouting.set(context, {
    completions: `${answerModel.choice}`,
  });
  return request;
}