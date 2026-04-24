"""
LLM Cascade — 6-model failover for Gemini API calls.

Iterates through the cheapest Gemini models one by one.
If a model responds successfully, stops immediately and returns.
If all models fail after max_attempts total, raises CascadeExhausted.

Usage:
    from llm_cascade import call_with_cascade
    result = call_with_cascade(prompt, config=GenerateContentConfig(...))
"""

import time
import logging
from google import genai
from google.genai import types
from config import Config
from llm_client import get_gemini_client

logger = logging.getLogger("cropngo.cascade")


class CascadeExhausted(Exception):
    """Raised when all models in the cascade have been tried and none responded."""
    pass


def call_with_cascade(
    prompt: str | list,
    config: types.GenerateContentConfig = None,
    max_attempts: int = 30,
    timeout_per_model: float = 30.0,
) -> str:
    """
    Try generating content through the model cascade.
    
    Iterates through Config.MODEL_CASCADE models one by one.
    Stops at max_attempts total tries across all models.
    If one model responds, immediately returns the response text.
    
    Args:
        prompt: The full prompt to send
        config: GenerateContentConfig (temperature, max_output_tokens, etc.)
        max_attempts: Maximum total attempts across all models (default 5)
        timeout_per_model: Not directly used (Gemini SDK handles timeout), 
                          but controls retry delay
    
    Returns:
        str: The response text from the first successful model
        
    Raises:
        CascadeExhausted: If no model responds after max_attempts
    """
    client = get_gemini_client()
    if not client:
        raise CascadeExhausted("AI Service unavailable — no valid API key configured.")
    
    models = Config.MODEL_CASCADE
    if not models:
        models = [Config.MODEL_NAME]
    
    errors = []
    attempt = 0
    
    while attempt < max_attempts:
        model_name = models[attempt % len(models)]
        attempt += 1
        logger.info(f"[Cascade] Attempt {attempt}/{max_attempts} — trying model: {model_name}")
        
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config,
            )
            
            # Check if we got a valid response
            if response and response.text and response.text.strip():
                logger.info(f"[Cascade] ✅ Model '{model_name}' responded successfully (attempt {attempt})")
                return response.text.strip()
            else:
                error_msg = f"Model '{model_name}' returned empty response"
                logger.warning(f"[Cascade] {error_msg}")
                errors.append(error_msg)
                
        except Exception as e:
            error_msg = f"Model '{model_name}' failed: {str(e)[:120]}"
            logger.warning(f"[Cascade] {error_msg}")
            errors.append(error_msg)
            
            # Brief delay before trying next model (avoid hammering the API)
            if attempt < max_attempts:
                time.sleep(0.5)
    
    # All attempts exhausted
    error_summary = "; ".join(errors[-3:])  # Last 3 errors
    raise CascadeExhausted(
        f"All AI models are busy — please try again. "
        f"Tried {attempt} attempts across {len(models)} models. "
        f"Last errors: {error_summary}"
    )
