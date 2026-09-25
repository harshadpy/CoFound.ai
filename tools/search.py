import os
from typing import List, Dict, Any, Optional
from langchain_core.tools import Tool
from langchain_community.tools import DuckDuckGoSearchRun
from config.config import settings
from utils.logger import logger

class RealtimeSearchService:
    def __init__(self):
        self._tavily_client = None
        self._ddg_search = None
        self._init_tavily()

    def _get_ddg(self):
        if self._ddg_search is None:
            try:
                from langchain_community.tools import DuckDuckGoSearchRun
                self._ddg_search = DuckDuckGoSearchRun()
            except Exception as e:
                logger.warning("ddg_init_failed", error=str(e))
                return None
        return self._ddg_search

    def _init_tavily(self):
        api_key = settings.tavily_api_key or os.getenv("TAVILY_API_KEY")
        if api_key:
            try:
                from tavily import TavilyClient
                self._tavily_client = TavilyClient(api_key=api_key)
                logger.info("tavily_search_initialized")
            except Exception as e:
                logger.warning("tavily_init_failed", error=str(e), fallback="DuckDuckGo")
                self._tavily_client = None
        else:
            logger.info("tavily_api_key_not_set", fallback="DuckDuckGo")

    @property
    def is_tavily_active(self) -> bool:
        return self._tavily_client is not None

    def search(
        self,
        query: str,
        max_results: int = 5,
        search_depth: str = "basic",
        include_domains: Optional[List[str]] = None,
        exclude_domains: Optional[List[str]] = None
    ) -> str:
        """
        Executes a real-time web search.
        Checks SQLite cache first; executes Tavily/DDG on cache miss and caches result for 24h.
        """
        from data.cache import get_cached, set_cached

        cache_key = f"str:{query}:{max_results}:{search_depth}:{include_domains}:{exclude_domains}"
        cached_val = get_cached("search", cache_key)
        if cached_val is not None:
            return cached_val

        output = ""
        # Try Tavily first
        if self._tavily_client:
            try:
                kwargs: Dict[str, Any] = {
                    "query": query,
                    "max_results": max_results,
                    "search_depth": search_depth,
                }
                if include_domains:
                    kwargs["include_domains"] = include_domains
                if exclude_domains:
                    kwargs["exclude_domains"] = exclude_domains

                response = self._tavily_client.search(**kwargs)
                results = response.get("results", [])

                if results:
                    formatted_snippets = []
                    for i, r in enumerate(results, 1):
                        title = r.get("title", "Untitled")
                        url = r.get("url", "")
                        content = r.get("content", "").strip()
                        formatted_snippets.append(
                            f"[{i}] {title}\nURL: {url}\nRelevance Content: {content}"
                        )
                    output = "\n\n".join(formatted_snippets)
            except Exception as e:
                logger.warning("tavily_search_error", query=query, error=str(e), action="falling_back_to_ddg")

        # Fallback to DuckDuckGo if no Tavily output
        if not output:
            try:
                ddg = self._get_ddg()
                if ddg:
                    output = ddg.run(query)
                else:
                    output = f"No search provider available for query: {query}"
            except Exception as e:
                logger.error("ddg_search_error", query=query, error=str(e))
                output = f"Search failed for query '{query}': {str(e)}"

        # Cache successful search results (24h TTL)
        if output and not output.startswith("Search failed"):
            set_cached("search", cache_key, output, ttl_seconds=86400, query_preview=query)

        return output

    def search_structured(
        self,
        query: str,
        max_results: int = 5,
        search_depth: str = "basic"
    ) -> List[Dict[str, str]]:
        """
        Returns structured results: list of {'title', 'url', 'content'}.
        Checks SQLite cache first; caches results on miss for 24h.
        """
        from data.cache import get_cached, set_cached

        cache_key = f"struct:{query}:{max_results}:{search_depth}"
        cached_val = get_cached("search", cache_key)
        if cached_val is not None and isinstance(cached_val, list):
            return cached_val

        results_list = []
        if self._tavily_client:
            try:
                res = self._tavily_client.search(query=query, max_results=max_results, search_depth=search_depth)
                results_list = [
                    {
                        "title": r.get("title", ""),
                        "url": r.get("url", ""),
                        "content": r.get("content", "")
                    }
                    for r in res.get("results", [])
                ]
            except Exception as e:
                logger.warning("tavily_structured_search_error", error=str(e))

        if not results_list:
            ddg_res = self.search(query, max_results=max_results)
            results_list = [{"title": query, "url": "", "content": ddg_res}]

        if results_list:
            set_cached("search", cache_key, results_list, ttl_seconds=86400, query_preview=query)

        return results_list

# Global singleton service
search_service = RealtimeSearchService()

def get_search_tool() -> Tool:
    return Tool(
        name="realtime_search",
        func=search_service.search,
        description=(
            "Real-time internet search powered by Tavily (with DuckDuckGo fallback). "
            "Use to fetch current market data, competitor websites, pricing, trends, and user pain points. "
            "Input should be a clear, specific search query."
        )
    )

# Backward-compatible singleton tool for existing agents
search_tool = get_search_tool()
