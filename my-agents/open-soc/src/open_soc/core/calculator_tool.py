# SPDX-FileCopyrightText: Copyright (c) 2025, NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0

import typing
from pydantic.fields import Field

from aiq.builder.builder import Builder
from aiq.builder.framework_enum import LLMFrameworkEnum
from aiq.cli.register_workflow import register_function
from aiq.data_models.component_ref import LLMRef
from aiq.data_models.function import FunctionBaseConfig
from aiq.profiler.decorators.function_tracking import track_function


class CalculatorToolConfig(FunctionBaseConfig, name="calculator_tool"):
    """
    Calculator tool for basic mathematical operations.
    Provides add, subtract, multiply, and divide functions for testing tool-calling agents.
    """
    precision: int = Field(default=2, description="Number of decimal places for results")


@register_function(config_type=CalculatorToolConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def calculator_tool_function(config: CalculatorToolConfig, builder: Builder):
    """
    Calculator tool that provides basic mathematical operations for AI agents.
    Returns functions for addition, subtraction, multiplication, and division.
    """
    
    @track_function()
    def calculator_add(a: float, b: float) -> str:
        """
        Add two numbers together.
        
        Args:
            a: First number
            b: Second number
            
        Returns:
            String result of the addition
        """
        result = a + b
        return f"{a} + {b} = {round(result, config.precision)}"
    
    @track_function()
    def calculator_subtract(a: float, b: float) -> str:
        """
        Subtract second number from first number.
        
        Args:
            a: First number (minuend)
            b: Second number (subtrahend)
            
        Returns:
            String result of the subtraction
        """
        result = a - b
        return f"{a} - {b} = {round(result, config.precision)}"
    
    @track_function()
    def calculator_multiply(a: float, b: float) -> str:
        """
        Multiply two numbers together.
        
        Args:
            a: First number
            b: Second number
            
        Returns:
            String result of the multiplication
        """
        result = a * b
        return f"{a} × {b} = {round(result, config.precision)}"
    
    @track_function()
    def calculator_divide(a: float, b: float) -> str:
        """
        Divide first number by second number.
        
        Args:
            a: First number (dividend)
            b: Second number (divisor)
            
        Returns:
            String result of the division
        """
        if b == 0:
            return f"Error: Cannot divide {a} by zero"
        
        result = a / b
        return f"{a} ÷ {b} = {round(result, config.precision)}"
    
    # Return all calculator functions
    yield calculator_add
    yield calculator_subtract
    yield calculator_multiply
    yield calculator_divide