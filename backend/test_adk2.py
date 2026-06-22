import asyncio
from agent.agent import root_agent

async def main():
    try:
        # We need an empty context or something? Let's just pass None and see if it fails.
        agen = root_agent.run(node_input="hi")
        async for e in agen:
            print(e)
    except Exception as e:
        print("ERROR:", type(e), e)

if __name__ == "__main__":
    asyncio.run(main())
