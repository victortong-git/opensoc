# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

from pydantic.fields import Field
from aiq.builder.framework_enum import LLMFrameworkEnum
from aiq.cli.register_workflow import register_function
from aiq.data_models.component_ref import LLMRef
from aiq.data_models.function import FunctionBaseConfig
from .prompts import SecurityEventClassifierPrompts


class SecurityEventClassifierConfig(FunctionBaseConfig, name="security_event_classifier"):
    """Configuration for the Security Event Classifier tool that categorizes security incidents by type and severity."""
    llm_name: LLMRef


@register_function(config_type=SecurityEventClassifierConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def security_event_classifier_function(config: SecurityEventClassifierConfig, builder):
    """
    Classifies security events based on analysis results, providing threat type and severity assessment.
    """
    
    from langchain_core.language_models.chat_models import BaseChatModel
    
    # Get the LLM for classification
    llm: BaseChatModel = await builder.get_llm(config.llm_name, wrapper_type=LLMFrameworkEnum.LANGCHAIN)

    async def classify_security_event(analysis_report: str) -> str:
        """
        Analyze a security report and classify the event type and severity.
        
        Args:
            analysis_report: The security analysis report to classify
            
        Returns:
            Classification result with event type, severity, and reasoning
        """
        
        # Create the classification prompt
        classification_prompt = SecurityEventClassifierPrompts.PROMPT
        
        # Format the prompt with the analysis report
        formatted_prompt = f"{classification_prompt}\n\nSecurity Analysis Report:\n{analysis_report}"
        
        # Get classification from LLM
        response = await llm.ainvoke(formatted_prompt)
        
        # Format the classification result
        classification_result = f"\n\n### Security Event Classification\n{response.content}"
        
        return classification_result

    # Return the tool function
    yield classify_security_event