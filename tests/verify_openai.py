from dotenv import load_dotenv
import os
from langchain_openai import ChatOpenAI

load_dotenv()

key = os.getenv("OPENAI_API_KEY")
print(f"Key loaded: {key[:10]}...{key[-5:] if key else 'None'}")

try:
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    print("Attempting to connect to OpenAI...")
    response = llm.invoke("Hello, are you working?")
    print(f"Success! Response: {response.content}")
except Exception as e:
    print(f"Error: {e}")
