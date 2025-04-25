import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getEmbeddings() {
    const words = ['memory', 'network', 'graph'];
    const res = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: words
    });
  
    res.data.forEach((d, i) => {
      console.log(words[i], '→ embedding uzunluğu:', d.embedding.length);
    });
  }
  
  getEmbeddings().catch(err => console.error(err));

