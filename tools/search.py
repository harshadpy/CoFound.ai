from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.tools import Tool

def get_search_tool():
    search = DuckDuckGoSearchRun()
    return Tool(
        name="internet_search",
        func=search.run,
        description="Search the internet for current market data, competitors, and trends. Input should be a specific search query."
    )

# Singleton instance
search_tool = get_search_tool()
