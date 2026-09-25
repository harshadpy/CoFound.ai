import re
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse
from utils.logger import logger

def _extract_domain(url: str) -> str:
    """Extracts the base domain from a URL (e.g., 'sub.example.com' -> 'example.com')."""
    if not url:
        return ""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    try:
        parsed = urlparse(url)
        netloc = parsed.netloc.lower()
        parts = netloc.split(".")
        if len(parts) > 2 and parts[0] == "www":
            return ".".join(parts[1:])
        return netloc
    except Exception:
        return ""

def verify_competitor_grounding(
    competitor_data: Dict[str, Any],
    raw_search_context: str
) -> Dict[str, Any]:
    """
    Cross-references extracted competitors and domains against the raw search text
    retrieved by Tavily or DuckDuckGo. Detects and flags ungrounded URLs or hallucinated names.
    """
    if not raw_search_context:
        logger.warning("hallucination_check_skipped", reason="Empty search context")
        return competitor_data

    search_text_lower = raw_search_context.lower()
    
    def evaluate_competitors(comp_list: List[Dict[str, Any]]) -> tuple[int, int, List[Dict[str, str]]]:
        evaluated = 0
        grounded = 0
        flags = []
        for comp in comp_list:
            if not isinstance(comp, dict):
                continue
            evaluated += 1
            name = comp.get("name", "").strip()
            website = comp.get("website", "")
            
            # Check 1: Does the company name appear in the scraped context?
            name_lower = name.lower()
            name_in_context = bool(name and (name_lower in search_text_lower or re.search(rf"\b{re.escape(name_lower)}\b", search_text_lower)))
            
            # Check 2: Does the domain appear in the scraped context?
            domain = _extract_domain(website)
            domain_in_context = bool(domain and domain in search_text_lower)

            comp["is_grounded"] = name_in_context
            comp["website_verified"] = domain_in_context

            if name_in_context:
                grounded += 1

            # If the domain is hallucinated (doesn't exist in search context), flag or sanitize it
            if website and not domain_in_context:
                flags.append({"name": name, "unverified_url": website})
                comp["website_note"] = "Domain inferred by LLM; unverified in search snippets"
            else:
                comp["website_note"] = "Verified in search context"

        return evaluated, grounded, flags

    direct = competitor_data.get("direct_competitors", [])
    indirect = competitor_data.get("indirect_competitors", [])

    d_eval, d_ground, d_flags = evaluate_competitors(direct)
    i_eval, i_ground, i_flags = evaluate_competitors(indirect)

    total_evaluated = d_eval + i_eval
    grounded_count = d_ground + i_ground
    flagged_urls = d_flags + i_flags

    if total_evaluated > 0:
        grounding_score = int((grounded_count * 100) / max(total_evaluated, 1))
    else:
        grounding_score = 100

    competitor_data["grounding_metadata"] = {
        "grounding_score": grounding_score,
        "total_evaluated": total_evaluated,
        "grounded_count": grounded_count,
        "flagged_unverified_urls": flagged_urls
    }

    logger.info(
        "competitor_grounding_verified",
        grounding_score=grounding_score,
        flagged_urls_count=len(flagged_urls)
    )

    return competitor_data
