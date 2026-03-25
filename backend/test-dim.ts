import { env } from "./src/env";
import { embedText } from "./src/services/rag.service";

async function test() {
  console.log("PINECONE_VECTOR_DIM configured as:", env.PINECONE_VECTOR_DIM);
  console.log("Calling OpenAI...");
  try {
    const vector = await embedText("test");
    console.log("Received vector of length:", vector.length);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

test();
